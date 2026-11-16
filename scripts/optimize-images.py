"""Convierte los PNG/JPG de public/assets a WebP y reescribe las referencias.

Uso:
  python scripts/optimize-images.py convert   # genera los .webp (no borra nada)
  python scripts/optimize-images.py rewrite   # cambia .png -> .webp en src/ e index.html
  python scripts/optimize-images.py prune     # borra los originales ya convertidos
"""
from __future__ import annotations

import json
import os
import re
import sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
MAP_FILE = ROOT / "scripts" / "webp-map.json"
EXTS = {".png", ".jpg", ".jpeg"}
BIG = 1_000_000
MAX_SIDE = 4096


def target(path: Path) -> Path:
    return path.with_suffix(".webp")


def convert_one(path_str: str) -> tuple[str, str, int, int]:
    from PIL import Image

    Image.MAX_IMAGE_PIXELS = None
    path = Path(path_str)
    out = target(path)
    before = path.stat().st_size
    try:
        with Image.open(path) as im:
            width, height = im.size
            oversized = max(width, height) > MAX_SIDE
            if out.exists() and not oversized:
                return ("skipped", str(path), before, out.stat().st_size)
            im.load()
            mode = im.mode
            if mode == "P" or mode == "LA":
                im = im.convert("RGBA")
            elif mode not in ("RGB", "RGBA"):
                im = im.convert("RGBA" if "transparency" in im.info else "RGB")
            if oversized:
                im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
            quality = 82 if before > BIG else 88
            im.save(
                out,
                "WEBP",
                quality=quality,
                method=5,
                alpha_quality=92,
                exact=False,
            )
    except Exception as exc:  # noqa: BLE001
        return ("error", str(path), before, repr(exc))  # type: ignore[return-value]
    after = out.stat().st_size
    if after >= before:
        out.unlink(missing_ok=True)
        return ("kept", str(path), before, after)
    return ("ok", str(path), before, after)


def do_convert() -> None:
    files = [
        str(p)
        for p in PUBLIC.rglob("*")
        if p.is_file() and p.suffix.lower() in EXTS and not p.name.startswith(".")
    ]
    files.sort()
    print(f"convirtiendo {len(files)} archivos", flush=True)
    mapping: dict[str, str] = {}
    total_before = total_after = 0
    done = 0
    errors: list[str] = []
    with ProcessPoolExecutor(max_workers=2) as pool:
        for status, src, before, after in pool.map(convert_one, files, chunksize=4):
            done += 1
            if status == "ok":
                mapping[src] = str(target(Path(src)))
                total_before += before
                total_after += after
            elif status == "skipped" and target(Path(src)).exists():
                mapping[src] = str(target(Path(src)))
            elif status == "error":
                errors.append(f"{src}: {after}")
            if done % 200 == 0:
                print(f"  {done}/{len(files)}  ahorro {total_before - total_after:,} B", flush=True)
    MAP_FILE.write_text(json.dumps(mapping, indent=0), encoding="utf-8")
    print(
        f"listo: {len(mapping)} convertidos, {len(errors)} errores\n"
        f"antes {total_before / 1048576:.1f} MB -> despues {total_after / 1048576:.1f} MB "
        f"({100 - total_after * 100 / max(total_before, 1):.1f}% menos)",
        flush=True,
    )
    for e in errors[:20]:
        print("  ERROR", e, flush=True)


PATH_RE = re.compile(r"[A-Za-z0-9_.%()\- /]+?\.(?:png|jpg|jpeg)", re.IGNORECASE)
SRC_DIRS = ("src",)
EXTRA_SOURCES = ("index.html", "server.ts")


def source_files() -> list[Path]:
    files: list[Path] = []
    for d in SRC_DIRS:
        files += [p for p in (ROOT / d).rglob("*") if p.suffix in {".ts", ".tsx", ".js", ".jsx", ".css", ".json"}]
    files += [ROOT / name for name in EXTRA_SOURCES if (ROOT / name).exists()]
    return files


def load_sets() -> tuple[set[str], set[str]]:
    mapping = json.loads(MAP_FILE.read_text(encoding="utf-8"))
    rels = {Path(k).relative_to(PUBLIC).as_posix().lower() for k in mapping}
    names = {Path(r).name.lower() for r in rels}
    return rels, names


def do_rewrite() -> None:
    rels, names = load_sets()
    changed = 0
    changed_files = 0
    for src in source_files():
        try:
            text = src.read_text(encoding="utf-8")
        except (UnicodeDecodeError, FileNotFoundError):
            continue
        hits = [0]

        def repl(m: re.Match[str]) -> str:
            raw = m.group(0)
            core = raw.strip()
            lead = raw[: raw.index(core)] if core else ""
            key = core.lstrip("/").lower()
            hit = key in rels if key.startswith("assets/") else Path(key).name in names
            if hit:
                hits[0] += 1
                return lead + core[: core.rindex(".")] + ".webp"
            return raw

        new_text = PATH_RE.sub(repl, text)
        if new_text != text:
            src.write_text(new_text, encoding="utf-8")
            changed_files += 1
            changed += hits[0]
    print(f"referencias reescritas: {changed} en {changed_files} archivos")


def do_prune() -> None:
    mapping = json.loads(MAP_FILE.read_text(encoding="utf-8"))
    blob = ""
    for src in source_files():
        try:
            blob += src.read_text(encoding="utf-8").lower()
        except (UnicodeDecodeError, FileNotFoundError):
            pass
    freed = removed = kept = 0
    for original in mapping:
        p = Path(original)
        if not (p.exists() and target(p).exists()):
            continue
        name = p.name.lower()
        rel = "/" + p.relative_to(PUBLIC).as_posix().lower()
        if name in blob or rel in blob:
            kept += 1
            continue
        freed += p.stat().st_size
        p.unlink()
        removed += 1
    print(f"borrados {removed} originales ({freed / 1048576:.1f} MB); {kept} conservados por seguir referenciados")


LITERAL_RE = re.compile(r"(?<=['\"`])([^'\"`\n]*?\.(?:png|jpg|jpeg))(?=['\"`])", re.IGNORECASE)


def do_rewrite2() -> None:
    """Segunda pasada: literales de cadena completos (acentos, espacios, @, %20)."""
    from urllib.parse import unquote

    rels, names = load_sets()
    changed = 0
    changed_files = 0
    for src in source_files():
        try:
            text = src.read_text(encoding="utf-8")
        except (UnicodeDecodeError, FileNotFoundError):
            continue
        hits = [0]

        def repl(m: re.Match[str]) -> str:
            raw = m.group(1)
            plain = unquote(raw).lstrip("/").lower()
            hit = plain in rels if plain.startswith("assets/") else Path(plain).name in names
            if hit:
                hits[0] += 1
                return raw[: raw.rindex(".")] + ".webp"
            return raw

        new_text = LITERAL_RE.sub(repl, text)
        if new_text != text:
            src.write_text(new_text, encoding="utf-8")
            changed_files += 1
            changed += hits[0]
    print(f"pasada 2: {changed} referencias en {changed_files} archivos")


def do_map() -> None:
    mapping = {}
    for p in PUBLIC.rglob("*"):
        if p.is_file() and p.suffix.lower() in EXTS and target(p).exists():
            mapping[str(p)] = str(target(p))
    MAP_FILE.write_text(json.dumps(mapping, indent=0), encoding="utf-8")
    print(f"mapa: {len(mapping)} archivos con webp")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "convert"
    {
        "convert": do_convert,
        "rewrite": do_rewrite,
        "rewrite2": do_rewrite2,
        "prune": do_prune,
        "map": do_map,
    }[cmd]()