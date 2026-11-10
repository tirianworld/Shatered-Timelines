import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { Volume2, VolumeX, RotateCcw, User, Info, X, Smartphone, Download, Package, Gamepad2, Trophy, Cloud, CheckCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { playGames } from '../services/playGamesService';

export const OptionsModal: React.FC = () => {
  const {
    isOptionsOpen,
    setIsOptionsOpen,
    playerName,
    setPlayerName,
    resetAllData,
    navigateTo,
    setIsGitHubManagerOpen,
    openPlayGames,
    questProgress,
    completeAllMissions,
  } = useGame();

  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());
  const [tempName, setTempName] = useState(playerName);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAndroidInfo, setShowAndroidInfo] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [allMissionsDoneFeedback, setAllMissionsDoneFeedback] = useState(false);

  if (!isOptionsOpen) return null;

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      sound.playBGM();
    }
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      setPlayerName(tempName.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 select-none animate-fade-in">
      <div className="wood-frame max-w-sm w-full p-5 rounded-2xl space-y-4 border-2 border-amber-700 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-amber-900/60">
          <span className="font-serif font-black text-amber-200 text-base">
            Opciones & Configuración
          </span>
          <button
            onClick={() => setIsOptionsOpen(false)}
            className="text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Name Edit Form */}
        <div className="bg-[#1b0a04] border border-[#521c08] rounded-xl p-3 space-y-1.5 text-left">
          <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>Nombre del Comandante:</span>
          </label>
          <form onSubmit={handleSaveName} className="flex items-center gap-2">
            <input
              type="text"
              value={tempName}
              maxLength={14}
              onChange={(e) => setTempName(e.target.value)}
              className="flex-1 bg-[#0b1b22] border border-[#1b4e5a] rounded-lg px-2.5 py-1 text-xs text-cyan-200 font-bold outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs rounded-lg cursor-pointer"
            >
              Guardar
            </button>
          </form>
        </div>

        {/* Audio Toggle */}
        <div className="bg-[#1b0a04] border border-[#521c08] rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-200">
            {isMuted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            <span>Música y Efectos de Sonido</span>
          </div>
          <button
            onClick={handleToggleSound}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isMuted
                ? 'bg-stone-800 text-stone-400 border border-stone-700'
                : 'bg-emerald-700 text-white border border-emerald-500'
            }`}
          >
            {isMuted ? 'Silenciado' : 'Activado'}
          </button>
        </div>

        {/* Google Play Games Services */}
        <div className="bg-[#0b2416] border border-emerald-600/80 rounded-xl p-3 text-left space-y-2.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-emerald-400" />
              <span>Google Play Games</span>
            </span>
            <span className={`text-[9px] px-2 py-0.5 rounded font-bold border ${
              playGames.getProfile().isSignedIn
                ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                : 'bg-stone-900 text-stone-400 border-stone-700'
            }`}>
              {playGames.getProfile().isSignedIn ? 'Conectado' : 'Sin vincular'}
            </span>
          </div>

          <p className="text-[11px] text-stone-300 leading-snug">
            {playGames.getProfile().isSignedIn
              ? `Sesión de Play Games verificada: ${playGames.getProfile().gamerTag} (${playGames.getProfile().playerId}), ${playGames.getProfile().unlockedAchievementsCount} logros.`
              : 'Inicia sesión con tu cuenta de Google Play para sincronizar en la nube, registrar tus logros y competir en marcadores.'}
          </p>

          <button
            onClick={() => {
              sound.playSFX('click');
              setIsOptionsOpen(false);
              openPlayGames();
            }}
            className="w-full py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs rounded-lg shadow active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Abrir Google Play Games</span>
          </button>
        </div>

        {/* GitHub Data & Assets Manager */}
        <div className="bg-[#190a03] border border-amber-600/70 rounded-xl p-3 text-left space-y-2 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Gestor de Datos y Assets (GitHub)</span>
            </span>
            <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded font-mono">
              Online
            </span>
          </div>
          <p className="text-[11px] text-stone-300 leading-snug">
            Edita héroes, banners y probabilidades de gacha, o sube imágenes directamente a <span className="text-amber-300 font-mono text-[10px]">theworldoftirian/Cdd-Gacha-Datos</span>.
          </p>
          <button
            onClick={() => {
              sound.playSFX('click');
              setIsOptionsOpen(false);
              setIsGitHubManagerOpen(true);
            }}
            className="w-full py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs rounded-lg shadow active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Abrir Gestor de Datos & Assets</span>
          </button>
        </div>

        {/* Inventory Section */}
        <div className="bg-[#1b0a04] border border-[#521c08] rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
            <Package className="w-4 h-4 text-amber-400" />
            <span>Mochila & Inventario</span>
          </div>
          <button
            onClick={() => {
              sound.playSFX('click');
              setIsOptionsOpen(false);
              navigateTo('inventory');
            }}
            className="w-28 h-8 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            title="Abrir Inventario"
          >
            <img
              src="/assets/items/Inventary_Button.png"
              alt="Inventario"
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </button>
        </div>

        {/* Android / APK Section */}
        <div className="bg-[#140803] border border-amber-600/40 rounded-xl p-3 text-left space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Instalar en Android / APK</span>
            </span>
            {isInstalled ? (
              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-600 text-emerald-300 text-[10px] font-bold rounded">
                App Instalada
              </span>
            ) : isInstallable ? (
              <button
                onClick={install}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-lg cursor-pointer flex items-center gap-1 shadow-md active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Instalar Ahora
              </button>
            ) : (
              <button
                onClick={() => setShowAndroidInfo(!showAndroidInfo)}
                className="px-2.5 py-0.5 bg-amber-900/50 hover:bg-amber-800 text-amber-200 text-[11px] font-bold rounded border border-amber-700/60 cursor-pointer"
              >
                {showAndroidInfo ? 'Ocultar' : 'Ver Guía APK'}
              </button>
            )}
          </div>

          <p className="text-[11px] text-stone-300 leading-relaxed">
            Optimizado al 100% para la pantalla y rendimiento de tu <strong>Xiaomi Redmi Note 14 Pro</strong>.
          </p>

          {showAndroidInfo && (
            <div className="p-2.5 bg-[#0a0402] border border-amber-900/60 rounded-lg space-y-2 text-[11px] text-stone-300">
              <div className="space-y-1">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <span>Opción 1: Instalar directo en Xiaomi (Recomendado)</span>
                </span>
                <p className="text-stone-400 text-[10.5px]">
                  Abre la URL compartida en <strong>Chrome</strong> o <strong>Mi Navegador</strong> en tu móvil, toca el menú (⋮) y selecciona <strong>"Añadir a pantalla de inicio"</strong> o <strong>"Instalar aplicación"</strong>. Tendrás el icono en tu cajón de apps, pantalla completa sin bordes y modo offline.
                </p>
              </div>

              <div className="space-y-1 border-t border-amber-950/80 pt-1.5">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <span>Opción 2: Generar archivo .APK empaquetado</span>
                </span>
                <p className="text-stone-400 text-[10.5px]">
                  Convierte el enlace en un paquete .APK instalable con PWABuilder de Microsoft:
                </p>
                <a
                  href={`https://www.pwabuilder.com/?url=${encodeURIComponent(window.location.origin)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded text-[11px] font-bold shadow transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar APK en PWABuilder
                </a>
              </div>

              <div className="border-t border-amber-950/80 pt-1.5 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={window.location.origin}
                  className="flex-1 bg-stone-900 border border-stone-800 rounded px-2 py-1 text-[10px] text-stone-300 outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 rounded text-[10px] font-bold cursor-pointer"
                >
                  {copiedLink ? '¡Copiado!' : 'Copiar URL'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Completar Todas las Misiones Section */}
        <div className="bg-[#1b0a04] border border-[#521c08] rounded-xl p-3 text-left space-y-2 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span>Progreso de Misiones</span>
            </span>
            <span className="text-[10px] text-amber-200/90 font-bold bg-[#2e1207] px-2 py-0.5 rounded border border-[#6d280d]">
              {questProgress.completedMissions.length >= 9
                ? '⭐ 9/9 Todas Completas'
                : `${questProgress.completedMissions.length}/9 Superadas`}
            </span>
          </div>
          <p className="text-[11px] text-stone-300 leading-snug">
            Desbloquea instantáneamente todos los capítulos y marca todas las misiones como superadas con 3 estrellas.
          </p>
          <button
            onClick={() => {
              completeAllMissions();
              setAllMissionsDoneFeedback(true);
              setTimeout(() => setAllMissionsDoneFeedback(false), 2600);
            }}
            className="w-full py-1.5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:brightness-110 active:scale-95 text-white font-bold text-xs rounded-lg shadow cursor-pointer flex items-center justify-center gap-1.5 transition-all border border-amber-500/50"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>
              {allMissionsDoneFeedback
                ? '¡Todas las Misiones Completadas (3⭐)!'
                : 'Completar Todas las Misiones'}
            </span>
          </button>
        </div>

        {/* Reset Game Section */}
        <div className="bg-[#1b0a04] border border-[#521c08] rounded-xl p-3 text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar Partida</span>
            </span>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 text-xs font-bold rounded-lg border border-red-700 cursor-pointer"
            >
              Reiniciar
            </button>
          </div>
        </div>

        {/* Reset Confirmation Prompt */}
        {showResetConfirm && (
          <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl space-y-2 text-center">
            <p className="text-[11px] text-red-200">
              ¿Seguro? Esto restablecerá todos tus héroes, niveles y oro.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  resetAllData();
                  setShowResetConfirm(false);
                  setIsOptionsOpen(false);
                }}
                className="flex-1 py-1 bg-red-700 hover:bg-red-600 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Sí, Reiniciar Todo
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lore / Credits */}
        <div className="text-[10px] text-stone-500 text-center space-y-0.5 pt-1">
          <p>CDD Gacha 2 &bull; Crónicas de Icespear &bull; Dark Fantasy RPG</p>
          <p>UI adaptada fielmente al diseño móvil de Icespear.</p>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setIsOptionsOpen(false)}
          className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
