import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { GachaEntry, Hero } from '../types/game';
import { BANNERS } from '../data/gameContent';
import { INITIAL_HEROES } from '../data/heroesData';
import { sound } from '../services/soundService';
import { launchConfetti } from '../utils/confetti';
import { Sparkles, Star, ChevronLeft, ChevronRight, HelpCircle, X, Sword, Gem } from 'lucide-react';

/** Arte grande que se coloca sobre el estandarte (estilo Grand Cross). */
const BANNER_ART: Record<string, string[]> = {
  banner_latentes: [
    '/assets/heropage/arte_ragnavaldr.png',
    '/assets/heropage/arte_prometeo.png',
    '/assets/heropage/arte_kairon.png',
  ],
};

const RARITY_TEXT: Record<string, string> = {
  UR: 'text-orange-300',
  SSR: 'text-amber-300',
  SR: 'text-sky-300',
  R: 'text-stone-300',
};

const RARITY_FRAME: Record<string, string> = {
  UR: 'border-orange-400 shadow-[0_0_18px_rgba(251,146,60,0.55)]',
  SSR: 'border-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.45)]',
  SR: 'border-sky-400/80 shadow-[0_0_14px_rgba(56,189,248,0.35)]',
  R: 'border-stone-500',
};

const RARITY_CARD: Record<string, string> = {
  UR: 'from-orange-950/90 to-stone-950',
  SSR: 'from-amber-900/80 to-stone-950',
  SR: 'from-sky-950/80 to-stone-950',
  R: 'from-stone-800/80 to-stone-950',
};

interface PullResult {
  entries: GachaEntry[];
  duplicates: number;
  bonusCoins: number;
}

export const GachaView: React.FC = () => {
  const { astralShards, summon, addAstralShards } = useGame();

  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const currentBanner = BANNERS[activeBannerIndex] ?? BANNERS[0];

  const [isSummoning, setIsSummoning] = useState(false);
  const [pullResults, setPullResults] = useState<PullResult | null>(null);
  const [inspectingHero, setInspectingHero] = useState<Hero | null>(null);
  const [showRatesModal, setShowRatesModal] = useState(false);

  const featuredHeroes = currentBanner.featuredHeroIds
    .map((id) => INITIAL_HEROES.find((h) => h.id === id))
    .filter(Boolean) as Hero[];

  const bannerArt = BANNER_ART[currentBanner.id] ?? [];

  const handleSummon = (count: number) => {
    const cost = count === 1 ? currentBanner.costSingle : currentBanner.costMulti;
    if (astralShards < cost) {
      sound.playSFX('hurt');
      return;
    }

    setIsSummoning(true);
    sound.playSFX('gacha_pull');

    setTimeout(() => {
      const result = summon(currentBanner.id, count);
      setIsSummoning(false);

      if (result.entries.length > 0) {
        setPullResults({
          entries: result.entries,
          duplicates: result.duplicates,
          bonusCoins: result.bonusCoins,
        });

        const hasLegendary = result.pulled.some((h) => h.rarity === 'UR' || h.rarity === 'SSR');
        if (hasLegendary) {
          sound.playSFX('baron');
          launchConfetti({ particleCount: 120, spread: 80 });
        } else {
          sound.playSFX('victory');
        }
      }
    }, 1200);
  };

  const renderScrollTab = (index: number, label: string) => (
    <button
      key={`banner_tab_${index}`}
      onClick={() => {
        sound.playSFX('click');
        setActiveBannerIndex(index);
      }}
      className={`px-3 py-1 rounded-full text-[11px] font-serif font-bold whitespace-nowrap border transition-all cursor-pointer ${
        activeBannerIndex === index
          ? 'bg-amber-500 text-stone-950 border-amber-200 shadow-md shadow-amber-900/60'
          : 'bg-stone-900/80 text-stone-300 border-stone-700 hover:text-amber-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="relative w-full h-full flex-1 overflow-y-auto no-scrollbar text-stone-100 pb-28 sm:pb-32 select-none">
      {/* Fondo ambiental */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 blur-sm pointer-events-none"
        style={{ backgroundImage: `url('${currentBanner.bannerImage}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-950/92 to-stone-950 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto p-3 sm:p-4 space-y-4">
        {/* Moneda + selector de estandartes */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-cyan-700/60 bg-cyan-950/50 px-3 py-1">
            <img src="/assets/items/gema_del_recuerdo.png" alt="" className="w-4 h-4 object-contain" />
            <span className="font-mono text-xs font-bold text-cyan-200">{astralShards.toLocaleString()}</span>
          </div>
          {astralShards < 100 && (
            <button
              onClick={() => {
                addAstralShards(500);
                sound.playSFX('coin');
              }}
              className="text-[10px] px-2 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 cursor-pointer"
            >
              + Recargar muestra
            </button>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => {
                sound.playSFX('click');
                setActiveBannerIndex((prev) => (prev > 0 ? prev - 1 : BANNERS.length - 1));
              }}
              className="p-1 rounded-md bg-stone-900/80 border border-stone-700 text-stone-300 hover:text-amber-200 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                sound.playSFX('click');
                setActiveBannerIndex((prev) => (prev < BANNERS.length - 1 ? prev + 1 : 0));
              }}
              className="p-1 rounded-md bg-stone-900/80 border border-stone-700 text-stone-300 hover:text-amber-200 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {BANNERS.map((banner, idx) => renderScrollTab(idx, banner.name.replace('Banner de ', '')))}
        </div>

        {/* Estandarte principal: arte a sangre, logo metálico y botones superpuestos */}
        <section className="relative rounded-xl overflow-hidden border-2 border-amber-800/70 shadow-2xl bg-stone-950">
          <div className="relative h-[calc(100vh-435px)] min-h-[360px] max-h-[540px] w-full overflow-hidden">
            {bannerArt.length === 0 ? (
              <img src={currentBanner.bannerImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-[#3a1d0c] via-[#24120a] to-stone-950">
                {/* Fondo ambiental de taberna/market */}
                <img
                  src="/assets/backgrounds/fondo_baron.png"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-luminosity"
                />
                {bannerArt.map((art, idx) => {
                  const placement =
                    idx === 0
                      ? 'left-[-22%] h-[112%] z-0'
                      : idx === 1
                      ? 'left-1/2 -translate-x-1/2 h-[124%] z-10'
                      : 'right-[-20%] h-[112%] z-0';
                  return (
                    <img
                      key={art}
                      src={art}
                      alt=""
                      className={`absolute bottom-0 object-contain object-bottom drop-shadow-[0_10px_24px_rgba(0,0,0,0.9)] ${placement}`}
                    />
                  );
                })}
              </div>
            )}

            {/* Viñeta superior e inferior */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-stone-950/85 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent" />

            {/* Contador de garantía + probabilidades */}
            <div className="absolute inset-x-2.5 top-2.5 z-20 flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border-2 border-amber-400/80 bg-stone-950/85 px-1.5 py-0.5 shadow-lg">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-b from-amber-200 to-amber-600 text-[10px] font-black text-stone-950">
                  10
                </span>
                <span className="pr-1 text-[8.5px] font-bold uppercase tracking-[0.12em] text-amber-200">
                  Héroe asegurado
                </span>
              </div>
              <button
                onClick={() => {
                  sound.playSFX('click');
                  setShowRatesModal(true);
                }}
                className="ml-auto flex items-center gap-1.5 rounded-full border-2 border-amber-500/70 bg-stone-950/80 px-3 py-1 text-[11px] font-serif font-bold text-amber-200 hover:text-amber-100 hover:border-amber-300 cursor-pointer backdrop-blur-sm"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Probabilidades</span>
              </button>
            </div>

            {/* Logo metálico centrado */}
            <div className="pointer-events-none absolute inset-x-0 bottom-[72px] z-20 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent pb-3 pt-8">
              <div className="flex items-center justify-center gap-2 px-3 sm:gap-3">
                <div className="flex h-9 w-9 rotate-45 items-center justify-center rounded-md border-2 border-stone-300/60 bg-gradient-to-br from-stone-300/25 to-stone-800/60 shadow-[0_4px_14px_rgba(0,0,0,0.75)] sm:h-12 sm:w-12">
                  <Sword className="h-4 w-4 -rotate-45 text-stone-100 sm:h-6 sm:w-6" />
                </div>
                <div className="text-left">
                  <p className="bg-gradient-to-b from-white via-stone-200 to-stone-500 bg-clip-text font-serif text-[24px] font-black uppercase leading-none tracking-tight text-transparent drop-shadow-[0_3px_2px_rgba(0,0,0,0.95)] sm:text-[40px]">
                    {currentBanner.name}
                  </p>
                  <p className="mt-2 text-[8px] font-bold uppercase leading-none tracking-[0.28em] text-amber-300/90 sm:text-[10px]">
                    {currentBanner.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de tirada (100 / 900) */}
            <div className="absolute inset-x-2.5 bottom-2.5 z-20 grid grid-cols-2 gap-2 sm:gap-3">
              <button
                disabled={isSummoning || astralShards < currentBanner.costSingle}
                onClick={() => handleSummon(1)}
                className={`flex flex-col items-center gap-0.5 rounded-lg border-2 px-2 py-1.5 transition-all cursor-pointer ${
                  astralShards >= currentBanner.costSingle && !isSummoning
                    ? 'border-cyan-500/70 bg-gradient-to-b from-[#12303f]/95 to-[#06131b]/95 hover:border-cyan-300 hover:brightness-110 active:scale-95'
                    : 'border-stone-700 bg-stone-900/90 text-stone-600 cursor-not-allowed'
                }`}
              >
                <span className="flex items-center gap-1 font-mono text-[13px] font-bold text-cyan-200">
                  <img src="/assets/items/gema_del_recuerdo.png" alt="" className="h-3.5 w-3.5 object-contain" />
                  {currentBanner.costSingle}
                </span>
                <span className="font-serif text-[10px] font-bold uppercase tracking-wide text-stone-200">Tirada x1</span>
              </button>

              <button
                disabled={isSummoning || astralShards < currentBanner.costMulti}
                onClick={() => handleSummon(10)}
                className={`flex flex-col items-center gap-0.5 rounded-lg border-2 px-2 py-1.5 transition-all cursor-pointer ${
                  astralShards >= currentBanner.costMulti && !isSummoning
                    ? 'border-amber-400/80 bg-gradient-to-b from-[#3a2408]/95 to-[#150c04]/95 hover:border-amber-200 hover:brightness-110 active:scale-95'
                    : 'border-stone-700 bg-stone-900/90 text-stone-600 cursor-not-allowed'
                }`}
              >
                <span className="flex items-center gap-1 font-mono text-[13px] font-bold text-amber-200">
                  <img src="/assets/items/gema_del_recuerdo.png" alt="" className="h-3.5 w-3.5 object-contain" />
                  {currentBanner.costMulti}
                </span>
                <span className="font-serif text-[10px] font-bold uppercase tracking-wide text-stone-200">Tirada x10</span>
              </button>
            </div>
          </div>
        </section>

        {/* Elenco destacado */}
        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
              Héroes con probabilidad aumentada
            </h3>
            <span className="text-[10px] text-stone-500">{featuredHeroes.length} latentes</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {featuredHeroes.map((hero) => (
              <button
                key={hero.id}
                onClick={() => {
                  sound.playSFX('click');
                  setInspectingHero(hero);
                }}
                className={`relative rounded-lg overflow-hidden border bg-gradient-to-b ${RARITY_CARD[hero.rarity]} ${RARITY_FRAME[hero.rarity]} cursor-pointer transition-transform hover:scale-[1.03] active:scale-95`}
              >
                <div className="aspect-[3/4] w-full overflow-hidden">
                  <img src={hero.portrait} alt={hero.name} className="w-full h-full object-cover object-top" />
                </div>
                <div className="px-1 py-0.5 bg-black/70">
                  <p className="text-[8px] font-serif font-bold text-amber-100 truncate leading-tight">{hero.name}</p>
                  <p className={`text-[8px] font-black ${RARITY_TEXT[hero.rarity]}`}>{hero.rarity}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-stone-400 leading-snug">
            {currentBanner.description}
          </p>
          <p className="text-[10px] text-stone-500 leading-snug">
            Las tiradas x10 pueden rellenarse con armas raras, pero la última siempre es un héroe.
          </p>
        </section>
      </div>

      {/* Animación de invocación */}
      {isSummoning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="text-center space-y-4">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-cyan-400 border-b-transparent animate-spin duration-700" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-900 to-black flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-amber-300 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-serif font-black text-amber-200 tracking-wider animate-pulse">
              Abriendo la Puerta Astral...
            </h3>
            <p className="text-xs text-stone-400">Resonancia mágica de Icespear en curso</p>
          </div>
        </div>
      )}

      {/* Resultados */}
      {pullResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-md p-3 overflow-y-auto">
          <div className="bg-stone-950 border-2 border-amber-600/80 rounded-2xl max-w-3xl w-full p-4 space-y-3 shadow-2xl relative my-6">
            <div className="text-center space-y-0.5">
              <span className="text-[10px] uppercase tracking-[0.25em] text-amber-400 font-bold">Resultado de la tirada</span>
              <h3 className="text-xl sm:text-2xl font-serif font-black text-amber-100">¡Ecos de los latentes!</h3>
              {pullResults.duplicates > 0 && (
                <p className="text-[11px] text-stone-400">
                  {pullResults.duplicates} duplicados convertidos en estrellas (+{pullResults.bonusCoins} Fragmentos Astrales).
                </p>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 max-h-[58vh] overflow-y-auto no-scrollbar p-1">
              {pullResults.entries.map((entry, idx) => {
                const isLast = idx === pullResults.entries.length - 1;
                const rarity = entry.kind === 'hero' ? entry.hero.rarity : entry.weapon.rarity;
                return (
                  <div
                    key={`pull_${idx}`}
                    className={`relative rounded-lg overflow-hidden border bg-gradient-to-b ${RARITY_CARD[rarity]} ${RARITY_FRAME[rarity]} ${
                      entry.kind === 'hero' ? 'cursor-pointer hover:scale-[1.04]' : ''
                    } transition-transform`}
                    onClick={() => {
                      if (entry.kind === 'hero') {
                        sound.playSFX('click');
                        setInspectingHero(entry.hero);
                      }
                    }}
                  >
                    <div className="aspect-[3/4] w-full overflow-hidden flex items-center justify-center bg-black/40">
                      <img
                        src={entry.kind === 'hero' ? entry.hero.portrait : entry.weapon.icon}
                        alt={entry.kind === 'hero' ? entry.hero.name : entry.weapon.name}
                        className={entry.kind === 'hero' ? 'w-full h-full object-cover object-top' : 'w-[82%] h-[82%] object-contain'}
                      />
                    </div>
                    {entry.kind === 'weapon' && (
                      <span className="absolute top-1 left-1 flex items-center gap-0.5 rounded bg-stone-950/85 px-1 py-0.5 text-[8px] font-bold text-amber-200 border border-amber-700/60">
                        <Sword className="w-2.5 h-2.5" /> ARMA
                      </span>
                    )}
                    {entry.kind === 'hero' && isLast && pullResults.entries.length > 1 && (
                      <span className="absolute top-0 left-0 right-0 bg-amber-500 text-stone-950 text-[8px] font-black uppercase tracking-wider text-center py-0.5">
                        Garantizado
                      </span>
                    )}
                    <div className="px-1 py-0.5 bg-black/75">
                      <p className="text-[8.5px] font-serif font-bold text-amber-100 truncate">
                        {entry.kind === 'hero' ? entry.hero.name : entry.weapon.name}
                      </p>
                      <p className={`text-[8px] font-black ${RARITY_TEXT[rarity]}`}>{rarity}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setPullResults(null)}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif font-bold text-sm cursor-pointer transition-colors shadow-lg"
            >
              Aceptar y continuar
            </button>
          </div>
        </div>
      )}

      {/* Ficha del héroe */}
      {inspectingHero && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-stone-900 border border-amber-600/70 rounded-2xl max-w-md w-full p-5 space-y-3 shadow-2xl relative">
            <button
              onClick={() => setInspectingHero(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-lg bg-stone-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-xl overflow-hidden border-2 bg-black shrink-0 ${RARITY_FRAME[inspectingHero.rarity]}`}>
                <img src={inspectingHero.portrait} alt={inspectingHero.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded border border-stone-600 bg-stone-800 ${RARITY_TEXT[inspectingHero.rarity]}`}>
                  {inspectingHero.rarity}
                </span>
                <h3 className="font-serif font-black text-xl text-amber-200 mt-1">{inspectingHero.name}</h3>
                <p className="text-xs text-stone-400">{inspectingHero.title}</p>
                <p className="text-xs text-amber-400 mt-0.5 font-medium">
                  {inspectingHero.heroClass} &bull; {inspectingHero.attribute}
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-300 italic border-l-2 border-amber-600 pl-3 py-1 bg-stone-950/40 rounded-r">
              "{inspectingHero.quote}"
            </p>

            <div className="grid grid-cols-3 gap-2 bg-stone-950/80 p-3 rounded-xl border border-stone-800 text-center text-xs font-mono">
              <div>
                <div className="text-stone-500 text-[10px]">HP</div>
                <div className="text-red-400 font-bold">{inspectingHero.stats.hp}</div>
              </div>
              <div>
                <div className="text-stone-500 text-[10px]">ATK</div>
                <div className="text-amber-400 font-bold">{inspectingHero.stats.attack}</div>
              </div>
              <div>
                <div className="text-stone-500 text-[10px]">DEF</div>
                <div className="text-blue-400 font-bold">{inspectingHero.stats.defense}</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider">Habilidades</h4>
              {inspectingHero.skills.map((skill) => (
                <div key={skill.id} className="bg-stone-950/60 p-2.5 rounded-lg border border-stone-800/80 text-xs">
                  <div className="flex items-center justify-between text-amber-300 font-bold">
                    <span>{skill.name}</span>
                    <span className="text-[10px] text-stone-500 font-normal">
                      {skill.cooldown === 0 ? 'Básica' : `Recarga: ${skill.cooldown}T`}
                    </span>
                  </div>
                  <p className="text-stone-400 text-[11px] mt-0.5">{skill.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Probabilidades */}
      {showRatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowRatesModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-lg bg-stone-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif font-bold text-lg text-amber-200 flex items-center gap-2">
              <Gem className="w-4 h-4 text-cyan-300" /> Tasas de aparición
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-orange-950/40 border border-orange-900 text-orange-200">
                <span className="font-bold">UR (Ultra Raro)</span>
                <span className="font-mono font-bold">{(currentBanner.dropRates.UR * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-amber-950/40 border border-amber-900 text-amber-200">
                <span className="font-bold">SSR (Súper Raro)</span>
                <span className="font-mono font-bold">{(currentBanner.dropRates.SSR * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-sky-950/40 border border-sky-900 text-sky-200">
                <span className="font-bold">SR (Superraro)</span>
                <span className="font-mono font-bold">{(currentBanner.dropRates.SR * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-stone-800/60 border border-stone-700 text-stone-200">
                <span className="font-bold">R (Raro)</span>
                <span className="font-mono font-bold">{(currentBanner.dropRates.R * 100).toFixed(1)}%</span>
              </div>
            </div>

            {currentBanner.id === 'banner_latentes' && (
              <p className="text-[11px] text-stone-400 leading-snug">
                En este estandarte cada hueco puede resolverse en un arma rara, salvo el último de una tirada x10, que
                siempre entrega un héroe.
              </p>
            )}
            <p className="text-[11px] text-stone-400 leading-snug">
              Los héroes duplicados suben de estrellas y otorgan Fragmentos Astrales. Los destacados tienen mayor
              probabilidad dentro de su rango.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
