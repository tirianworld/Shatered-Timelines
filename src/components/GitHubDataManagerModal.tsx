import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { githubService, GitHubRepoStatus, GITHUB_CONFIG } from '../services/githubService';
import { Hero, SummonBanner } from '../types/game';
import {
  X,
  GitBranch,
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertCircle,
  Database,
  ExternalLink,
  Shield,
  Sparkles,
  Layers,
  Save,
  Image as ImageIcon,
  Flame,
  FileCode,
  Check
} from 'lucide-react';
import { sound } from '../services/soundService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubDataManagerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { heroes, setHeroes, banners, setBanners, inventory, equipment } = useGame();

  const [activeTab, setActiveTab] = useState<'status' | 'heroes' | 'banners' | 'upload'>('status');
  const [repoStatus, setRepoStatus] = useState<GitHubRepoStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Heroes tab state
  const [selectedHeroId, setSelectedHeroId] = useState<string>(heroes[0]?.id || 'kairon');
  const selectedHero = heroes.find((h) => h.id === selectedHeroId) || heroes[0];
  const [editingHero, setEditingHero] = useState<Hero | null>(null);

  // Banners tab state
  const [selectedBannerId, setSelectedBannerId] = useState<string>(banners[0]?.id || 'banner_icespear');
  const selectedBanner = banners.find((b) => b.id === selectedBannerId) || banners[0];
  const [editingBanner, setEditingBanner] = useState<SummonBanner | null>(null);

  // Upload tab state
  const [uploadCategory, setUploadCategory] = useState<'portraits' | 'skills' | 'items' | 'backgrounds' | 'ui'>('portraits');
  const [uploadFilename, setUploadFilename] = useState('');
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadBase64, setUploadBase64] = useState<string | null>(null);
  const [copiedPath, setCopiedPath] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch status on open
  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedHero) {
      setEditingHero(JSON.parse(JSON.stringify(selectedHero)));
    }
  }, [selectedHeroId, heroes]);

  useEffect(() => {
    if (selectedBanner) {
      setEditingBanner(JSON.parse(JSON.stringify(selectedBanner)));
    }
  }, [selectedBannerId, banners]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const status = await githubService.getStatus();
      setRepoStatus(status);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFromGitHub = async () => {
    setLoading(true);
    setStatusMessage({ type: 'info', text: 'Sincronizando datos y assets con GitHub...' });
    sound.playSFX('click');
    try {
      const liveData = await githubService.fetchLiveGameData();
      if (liveData) {
        if (liveData.heroes && liveData.heroes.length > 0) {
          setHeroes(liveData.heroes);
        }
        if (liveData.banners && liveData.banners.length > 0) {
          setBanners(liveData.banners);
        }
        setStatusMessage({ type: 'success', text: '¡Datos y configuración sincronizados correctamente desde GitHub!' });
      } else {
        setStatusMessage({ type: 'info', text: 'Repositorio conectado. Los datos locales ya están al día con GitHub.' });
      }
      await loadStatus();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al sincronizar con GitHub' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHero = async () => {
    if (!editingHero) return;
    setLoading(true);
    setStatusMessage({ type: 'info', text: `Guardando héroe "${editingHero.name}" en GitHub...` });
    sound.playSFX('click');

    try {
      const updatedHeroes = heroes.map((h) => (h.id === editingHero.id ? editingHero : h));
      setHeroes(updatedHeroes);

      const res = await githubService.saveData(
        'heroes',
        updatedHeroes,
        `feat(heroes): actualizar estadisticas y datos de ${editingHero.name} (${editingHero.rarity})`
      );

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `¡Héroe "${editingHero.name}" guardado y comiteado con éxito en GitHub!`,
        });
        await loadStatus();
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Error al comitear héroe en GitHub (guardado localmente)',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Fallo de guardado' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBanner = async () => {
    if (!editingBanner) return;
    setLoading(true);
    setStatusMessage({ type: 'info', text: `Guardando banner "${editingBanner.name}" en GitHub...` });
    sound.playSFX('click');

    try {
      const updatedBanners = banners.map((b) => (b.id === editingBanner.id ? editingBanner : b));
      setBanners(updatedBanners);

      const res = await githubService.saveData(
        'banners',
        updatedBanners,
        `feat(banners): actualizar probabilidades y costo de ${editingBanner.name}`
      );

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `¡Banner "${editingBanner.name}" guardado y actualizado en GitHub!`,
        });
        await loadStatus();
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Error al guardar banner en GitHub',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Fallo de guardado' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const safeName = file.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '');
    setUploadFilename(safeName);

    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setUploadPreview(res);
      const base64Data = res.split(',')[1] || '';
      setUploadBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAsset = async () => {
    if (!uploadBase64 || !uploadFilename) {
      setStatusMessage({ type: 'error', text: 'Selecciona una imagen y un nombre de archivo válido.' });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: 'info', text: `Subiendo ${uploadFilename} a ${uploadCategory} en GitHub...` });
    sound.playSFX('click');

    try {
      const result = await githubService.uploadAsset(
        uploadCategory,
        uploadFilename,
        uploadBase64,
        `feat(assets): agregar nuevo recurso grafico ${uploadFilename} en ${uploadCategory}`
      );

      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: `¡Asset subido exitosamente a GitHub! Ruta local: ${result.localPath}`,
        });
        setUploadPreview(null);
        setUploadBase64(null);
        setUploadFilename('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        await loadStatus();
      } else {
        setStatusMessage({
          type: 'error',
          text: result.message || 'Error al subir asset a GitHub',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Fallo al procesar imagen' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 select-none animate-fade-in font-sans">
      <div className="wood-frame max-w-xl w-full max-h-[92vh] flex flex-col p-4 sm:p-5 rounded-2xl border-2 border-amber-600 shadow-2xl bg-[#140703] text-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-800/60 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-900/60 border border-amber-600 flex items-center justify-center text-amber-300">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-amber-200 text-sm sm:text-base tracking-wide">
                  Gestor de Datos y Assets
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-700/80 px-1.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <GitBranch className="w-2.5 h-2.5" />
                  main
                </span>
              </div>
              <p className="text-[10px] text-amber-400/80 font-mono truncate max-w-[280px]">
                {GITHUB_CONFIG.owner}/{GITHUB_CONFIG.repo}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playSFX('click');
              onClose();
            }}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 py-2 border-b border-amber-900/40 text-xs shrink-0 overflow-x-auto">
          <button
            onClick={() => {
              sound.playSFX('click');
              setActiveTab('status');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'status'
                ? 'bg-amber-700/90 text-amber-100 shadow border border-amber-500/80'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            Repositorio & Sync
          </button>

          <button
            onClick={() => {
              sound.playSFX('click');
              setActiveTab('heroes');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'heroes'
                ? 'bg-amber-700/90 text-amber-100 shadow border border-amber-500/80'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Héroes ({heroes.length})
          </button>

          <button
            onClick={() => {
              sound.playSFX('click');
              setActiveTab('banners');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'banners'
                ? 'bg-amber-700/90 text-amber-100 shadow border border-amber-500/80'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Banners Gacha ({banners.length})
          </button>

          <button
            onClick={() => {
              sound.playSFX('click');
              setActiveTab('upload');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'upload'
                ? 'bg-amber-700/90 text-amber-100 shadow border border-amber-500/80'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Subir Asset
          </button>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            className={`my-2 p-2.5 rounded-lg text-xs flex items-center justify-between shrink-0 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-red-950/80 border border-red-600 text-red-200'
                : 'bg-amber-950/80 border border-amber-600 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              ) : (
                <RefreshCw className="w-4 h-4 shrink-0 text-amber-400 animate-spin" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-stone-400 hover:text-white text-xs ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 py-2 text-xs">
          
          {/* TAB 1: REPO STATUS & SYNC */}
          {activeTab === 'status' && (
            <div className="space-y-3">
              {/* Connected Banner */}
              <div className="bg-[#1c0c05] border border-amber-800/80 rounded-xl p-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-amber-200 text-sm">
                      GitHub Repositorio Activo
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Todos los datos JSON y más de 1,140 assets gráficos están respaldados y sincronizados en la nube.
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-stone-400">
                    <span className="font-mono bg-black/40 px-2 py-0.5 rounded border border-amber-900/50">
                      Rama: {repoStatus?.branch || 'main'}
                    </span>
                    <a
                      href={GITHUB_CONFIG.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      Ver en GitHub <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <button
                  onClick={handleSyncFromGitHub}
                  disabled={loading}
                  className="px-3 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-lg flex items-center gap-1.5 shadow active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Sincronizar
                </button>
              </div>

              {/* Data Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-[#1b0903] border border-amber-900/60 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] text-stone-400 block font-bold">Héroes Registrados</span>
                  <span className="text-lg font-black text-amber-300 font-mono">{heroes.length}</span>
                </div>
                <div className="bg-[#1b0903] border border-amber-900/60 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] text-stone-400 block font-bold">Banners Invocación</span>
                  <span className="text-lg font-black text-amber-300 font-mono">{banners.length}</span>
                </div>
                <div className="bg-[#1b0903] border border-amber-900/60 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] text-stone-400 block font-bold">Objetos & Materiales</span>
                  <span className="text-lg font-black text-amber-300 font-mono">{inventory.length + equipment.length}</span>
                </div>
                <div className="bg-[#1b0903] border border-amber-900/60 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] text-stone-400 block font-bold">Assets en Repositorio</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">1,140+</span>
                </div>
              </div>

              {/* Repository Endpoints & Raw CDN */}
              <div className="bg-[#120502] border border-[#3e1406] rounded-xl p-3 space-y-2">
                <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5" />
                  Estructura y Enlaces Raw CDN
                </span>
                <p className="text-[10px] text-stone-400 leading-relaxed">
                  Puedes consumir directamente cualquier recurso o JSON usando el CDN de jsDelivr o GitHub Raw:
                </p>
                <div className="space-y-1 font-mono text-[9px]">
                  <div className="bg-black/50 p-1.5 rounded border border-stone-800 text-amber-200/90 truncate">
                    raw.githubusercontent.com/theworldoftirian/Cdd-Gacha-Datos/main/data/heroes.json
                  </div>
                  <div className="bg-black/50 p-1.5 rounded border border-stone-800 text-amber-200/90 truncate">
                    raw.githubusercontent.com/theworldoftirian/Cdd-Gacha-Datos/main/assets/portraits/...
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HEROES EDITOR */}
          {activeTab === 'heroes' && editingHero && (
            <div className="space-y-3">
              {/* Hero Selector */}
              <div className="flex items-center gap-2">
                <label className="font-bold text-amber-300 shrink-0">Héroe:</label>
                <select
                  value={selectedHeroId}
                  onChange={(e) => setSelectedHeroId(e.target.value)}
                  className="w-full bg-[#1e0a04] border border-amber-700/80 rounded-lg px-2.5 py-1.5 text-amber-100 font-bold outline-none"
                >
                  {heroes.map((h) => (
                    <option key={h.id} value={h.id}>
                      [{h.rarity}] {h.name} - {h.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hero Details Form */}
              <div className="bg-[#1a0803] border border-amber-800/60 rounded-xl p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-amber-600 bg-black/60 shrink-0">
                    <img
                      src={editingHero.portrait}
                      alt={editingHero.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-stone-400 block">Nombre</label>
                        <input
                          type="text"
                          value={editingHero.name}
                          onChange={(e) => setEditingHero({ ...editingHero, name: e.target.value })}
                          className="w-full bg-[#110401] border border-amber-900 rounded px-2 py-1 text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-400 block">Rareza</label>
                        <select
                          value={editingHero.rarity}
                          onChange={(e) => setEditingHero({ ...editingHero, rarity: e.target.value as any })}
                          className="w-full bg-[#110401] border border-amber-900 rounded px-2 py-1 text-amber-300 font-bold"
                        >
                          <option value="UR">UR (Ultra Rara)</option>
                          <option value="SSR">SSR (Super Rara)</option>
                          <option value="SR">SR (Rara Superior)</option>
                          <option value="R">R (Común / Rara)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Estadísticas Base
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] text-stone-400 block">Vida (HP)</label>
                      <input
                        type="number"
                        value={editingHero.stats.hp}
                        onChange={(e) =>
                          setEditingHero({
                            ...editingHero,
                            stats: { ...editingHero.stats, hp: Number(e.target.value), maxHp: Number(e.target.value) },
                          })
                        }
                        className="w-full bg-[#110401] border border-amber-900 rounded px-2 py-1 text-emerald-400 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-stone-400 block">Ataque</label>
                      <input
                        type="number"
                        value={editingHero.stats.attack}
                        onChange={(e) =>
                          setEditingHero({
                            ...editingHero,
                            stats: { ...editingHero.stats, attack: Number(e.target.value) },
                          })
                        }
                        className="w-full bg-[#110401] border border-amber-900 rounded px-2 py-1 text-red-400 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-stone-400 block">Defensa</label>
                      <input
                        type="number"
                        value={editingHero.stats.defense}
                        onChange={(e) =>
                          setEditingHero({
                            ...editingHero,
                            stats: { ...editingHero.stats, defense: Number(e.target.value) },
                          })
                        }
                        className="w-full bg-[#110401] border border-amber-900 rounded px-2 py-1 text-sky-400 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio / Quote */}
                <div>
                  <label className="text-[10px] text-stone-400 block">Historia / Lore</label>
                  <textarea
                    rows={2}
                    value={editingHero.bio || ''}
                    onChange={(e) => setEditingHero({ ...editingHero, bio: e.target.value })}
                    className="w-full bg-[#110401] border border-amber-900 rounded px-2 py-1 text-stone-200 text-[11px]"
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveHero}
                  disabled={loading}
                  className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Guardar Héroe en GitHub y Actualizar Juego
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: BANNERS EDITOR */}
          {activeTab === 'banners' && editingBanner && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="font-bold text-amber-300 shrink-0">Banner:</label>
                <select
                  value={selectedBannerId}
                  onChange={(e) => setSelectedBannerId(e.target.value)}
                  className="w-full bg-[#1e0a04] border border-amber-700/80 rounded-lg px-2.5 py-1.5 text-amber-100 font-bold outline-none"
                >
                  {banners.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-[#1a0803] border border-amber-800/60 rounded-xl p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-400 block">Nombre del Banner</label>
                    <input
                      type="text"
                      value={editingBanner.name}
                      onChange={(e) => setEditingBanner({ ...editingBanner, name: e.target.value })}
                      className="w-full bg-[#110401] border border-amber-900 rounded px-2 py-1 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 block">Subtítulo</label>
                    <input
                      type="text"
                      value={editingBanner.subtitle || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                      className="w-full bg-[#110401] border border-amber-900 rounded px-2 py-1 text-stone-300"
                    />
                  </div>
                </div>

                {/* Summon Costs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-400 block">Costo Simple (Cristales)</label>
                    <input
                      type="number"
                      value={editingBanner.costSingle}
                      onChange={(e) => setEditingBanner({ ...editingBanner, costSingle: Number(e.target.value) })}
                      className="w-full bg-[#110401] border border-amber-900 rounded px-2 py-1 text-emerald-400 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 block">Costo x10 (Multi)</label>
                    <input
                      type="number"
                      value={editingBanner.costMulti}
                      onChange={(e) => setEditingBanner({ ...editingBanner, costMulti: Number(e.target.value) })}
                      className="w-full bg-[#110401] border border-amber-900 rounded px-2 py-1 text-emerald-400 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Probabilidades */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Probabilidades de Invocación (0.01 = 1%)
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-[9px] text-amber-400 block font-bold">UR %</label>
                      <input
                        type="number"
                        step="0.005"
                        value={editingBanner.dropRates.UR}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            dropRates: { ...editingBanner.dropRates, UR: Number(e.target.value) },
                          })
                        }
                        className="w-full bg-[#110401] border border-amber-900 rounded px-1.5 py-1 text-amber-300 font-mono text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-purple-400 block font-bold">SSR %</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingBanner.dropRates.SSR}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            dropRates: { ...editingBanner.dropRates, SSR: Number(e.target.value) },
                          })
                        }
                        className="w-full bg-[#110401] border border-amber-900 rounded px-1.5 py-1 text-purple-300 font-mono text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-sky-400 block font-bold">SR %</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingBanner.dropRates.SR}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            dropRates: { ...editingBanner.dropRates, SR: Number(e.target.value) },
                          })
                        }
                        className="w-full bg-[#110401] border border-amber-900 rounded px-1.5 py-1 text-sky-300 font-mono text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-stone-400 block font-bold">R %</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingBanner.dropRates.R}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            dropRates: { ...editingBanner.dropRates, R: Number(e.target.value) },
                          })
                        }
                        className="w-full bg-[#110401] border border-amber-900 rounded px-1.5 py-1 text-stone-300 font-mono text-center font-bold"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveBanner}
                  disabled={loading}
                  className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Guardar Banners en GitHub
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: UPLOAD ASSET */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div className="bg-[#1a0803] border border-amber-800/60 rounded-xl p-3 space-y-3">
                <span className="font-bold text-amber-200 text-xs flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-amber-400" />
                  Subir Nueva Imagen / Recurso a GitHub
                </span>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Sube cualquier imagen PNG o JPG. Se guardará automáticamente en el repositorio oficial de GitHub y estará disponible de inmediato en el juego.
                </p>

                {/* Category & Filename */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-stone-400 block font-bold">Categoría de Asset</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value as any)}
                      className="w-full bg-[#110401] border border-amber-900 rounded-lg px-2.5 py-1.5 text-amber-200 font-bold outline-none"
                    >
                      <option value="portraits">Retratos / Héroes (portraits)</option>
                      <option value="skills">Habilidades (skills)</option>
                      <option value="items">Objetos / Iconos (items)</option>
                      <option value="backgrounds">Fondos (backgrounds)</option>
                      <option value="ui">Interfaz / UI (ui)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-400 block font-bold">Nombre del Archivo</label>
                    <input
                      type="text"
                      placeholder="ej: nuevo_heroe.png"
                      value={uploadFilename}
                      onChange={(e) => setUploadFilename(e.target.value)}
                      className="w-full bg-[#110401] border border-amber-900 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* File picker */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full text-xs text-stone-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-800 file:text-amber-100 hover:file:bg-amber-700 cursor-pointer"
                  />
                </div>

                {/* Preview */}
                {uploadPreview && (
                  <div className="flex items-center gap-3 p-2 bg-black/40 rounded-lg border border-amber-900/60">
                    <img
                      src={uploadPreview}
                      alt="Preview"
                      className="w-16 h-16 object-contain rounded border border-amber-700 bg-black/60"
                    />
                    <div className="text-[11px] space-y-0.5">
                      <span className="font-bold text-amber-200 block truncate max-w-[240px]">
                        {uploadFilename || 'asset'}
                      </span>
                      <span className="text-stone-400 text-[10px] font-mono block">
                        Ruta: /assets/{uploadCategory}/{uploadFilename}
                      </span>
                    </div>
                  </div>
                )}

                {/* Upload Action */}
                <button
                  onClick={handleUploadAsset}
                  disabled={loading || !uploadBase64 || !uploadFilename}
                  className="w-full py-2 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Subir a GitHub y Guardar en el Juego
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-amber-900/40 flex items-center justify-between text-[11px] text-stone-400 shrink-0">
          <span className="font-mono text-[10px]">
            theworldoftirian / Cdd-Gacha-Datos
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded font-bold cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
