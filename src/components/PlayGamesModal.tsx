import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { playGames } from '../services/playGamesService';
import {
  PlayGamesProfile,
  PlayGamesAchievement,
  PlayGamesLeaderboard,
  PlayGamesCloudSave,
} from '../types/playGames';
import { sound } from '../services/soundService';
import {
  Trophy,
  Award,
  Cloud,
  CloudUpload,
  CloudDownload,
  User,
  X,
  CheckCircle2,
  Lock,
  Sparkles,
  Gamepad2,
  RefreshCw,
  LogOut,
  LogIn,
  ChevronRight,
  Shield,
  Coins,
  Swords,
  Crown,
  Star,
  Flame,
  Hammer,
  Gem,
} from 'lucide-react';

const renderPlayGamesAchievementIcon = (ach: PlayGamesAchievement) => {
  if (!ach.unlocked) {
    return <Lock className="w-4 h-4 text-stone-500" />;
  }
  switch (ach.icon) {
    case 'sparkles':
      return <Sparkles className="w-4 h-4 text-amber-200" />;
    case 'shield':
      return <Shield className="w-4 h-4 text-emerald-200" />;
    case 'crown':
      return <Crown className="w-4 h-4 text-yellow-200" />;
    case 'star':
      return <Star className="w-4 h-4 text-amber-300" />;
    case 'swords':
      return <Swords className="w-4 h-4 text-rose-200" />;
    case 'flame':
      return <Flame className="w-4 h-4 text-orange-300" />;
    case 'hammer':
      return <Hammer className="w-4 h-4 text-stone-200" />;
    case 'trophy':
      return <Trophy className="w-4 h-4 text-amber-300" />;
    case 'coins':
      return <Coins className="w-4 h-4 text-yellow-300" />;
    case 'gem':
      return <Gem className="w-4 h-4 text-cyan-200" />;
    case 'cloud':
      return <Cloud className="w-4 h-4 text-sky-200" />;
    default:
      return <Award className="w-4 h-4 text-emerald-200" />;
  }
};

interface PlayGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayGamesModal: React.FC<PlayGamesModalProps> = ({ isOpen, onClose }) => {
  const {
    gold,
    summonCrystals,
    astralShards,
    playerName,
    heroes,
    team,
    inventory,
    shelfInventory,
    equipment,
    questProgress,
    activePatrols,
    restoreGameState,
  } = useGame();

  const [activeTab, setActiveTab] = useState<'profile' | 'achievements' | 'leaderboards' | 'cloud'>('profile');
  const [profile, setProfile] = useState<PlayGamesProfile>(playGames.getProfile());
  const [achievements, setAchievements] = useState<PlayGamesAchievement[]>(playGames.getAchievements());
  const [selectedLeaderboardId, setSelectedLeaderboardId] = useState<string>('lb_power');
  const [leaderboard, setLeaderboard] = useState<PlayGamesLeaderboard | null>(null);
  const [isLoadingLb, setIsLoadingLb] = useState<boolean>(false);
  const [filterAchievement, setFilterAchievement] = useState<'all' | 'unlocked' | 'locked'>('all');

  // Input states
  const [inputGamerTag, setInputGamerTag] = useState<string>(playerName || '');
  const [inputEmail, setInputEmail] = useState<string>('');
  const [cloudMessage, setCloudMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isCloudSaving, setIsCloudSaving] = useState(false);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [lastCloudSave, setLastCloudSave] = useState<PlayGamesCloudSave | null>(null);

  // Subscribe to changes
  useEffect(() => {
    const unsubProfile = playGames.subscribeToProfile((updated) => {
      setProfile(updated);
      setAchievements(playGames.getAchievements());
    });

    const unsubAch = playGames.subscribeToAchievements(() => {
      setAchievements(playGames.getAchievements());
      setProfile(playGames.getProfile());
    });

    return () => {
      unsubProfile();
      unsubAch();
    };
  }, []);

  // Fetch leaderboard when switching tab
  useEffect(() => {
    if (activeTab === 'leaderboards') {
      loadCurrentLeaderboard(selectedLeaderboardId);
    } else if (activeTab === 'cloud') {
      playGames.loadCloudSave().then((save) => {
        if (save) setLastCloudSave(save);
      });
    }
  }, [activeTab, selectedLeaderboardId]);

  if (!isOpen) return null;

  const calculateSquadPower = (): number => {
    return team.reduce((acc, heroId) => {
      if (!heroId) return acc;
      const h = heroes.find((hero) => hero.id === heroId);
      if (!h) return acc;
      const atk = h.stats?.attack || 0;
      const hp = h.stats?.hp || 0;
      const def = h.stats?.defense || 0;
      return acc + atk * 2 + Math.round(hp * 0.5) + def;
    }, 0);
  };

  const loadCurrentLeaderboard = async (id: string) => {
    setIsLoadingLb(true);
    try {
      const data = await playGames.getLeaderboard(id);
      setLeaderboard(data);
    } catch {
      // Ignored
    } finally {
      setIsLoadingLb(false);
    }
  };

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sound.playSFX('click');
    const updated = await playGames.signIn(inputGamerTag, inputEmail);
    setProfile(updated);

    // Auto sync squad power to leaderboard
    const power = calculateSquadPower();
    playGames.submitScore('lb_power', power, `${power.toLocaleString()} Poder`);
    playGames.submitScore('lb_wealth', gold, `${gold.toLocaleString()} Oro`);
  };

  const handleSignOut = async () => {
    sound.playSFX('click');
    await playGames.signOut();
    setProfile(playGames.getProfile());
  };

  const handleSaveToCloud = async () => {
    setIsCloudSaving(true);
    setCloudMessage(null);
    try {
      const power = calculateSquadPower();
      const stateSnapshot = JSON.stringify({
        gold,
        summonCrystals,
        astralShards,
        playerName,
        heroes,
        team,
        inventory,
        shelfInventory,
        equipment,
        questProgress,
        activePatrols,
      });

      const cloudSave: PlayGamesCloudSave = {
        slotId: 'slot_primary_cdd',
        title: `Bastión de ${playerName} (Capítulo ${questProgress.chapter})`,
        timestamp: Date.now(),
        playerName,
        heroCount: heroes.length,
        gold,
        crystals: summonCrystals,
        astralShards,
        chapter: questProgress.chapter,
        squadPower: power,
        data: stateSnapshot,
      };

      const success = await playGames.saveCloudSave(cloudSave);
      if (success) {
        setLastCloudSave(cloudSave);
        setCloudMessage({
          text: '¡Partida guardada exitosamente en la nube de Google Play Games!',
          type: 'success',
        });
      } else {
        setCloudMessage({
          text: 'Error al comunicarse con la nube. Guardado en caché local.',
          type: 'info',
        });
      }
    } catch (err: any) {
      setCloudMessage({
        text: 'Error al guardar: ' + err.message,
        type: 'error',
      });
    } finally {
      setIsCloudSaving(false);
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!lastCloudSave) return;
    const confirmRestore = window.confirm(
      `¿Deseas restaurar la partida de la nube del ${new Date(lastCloudSave.timestamp).toLocaleString()}?\n\n` +
      `Comandante: ${lastCloudSave.playerName}\nHéroes: ${lastCloudSave.heroCount}\nOro: ${lastCloudSave.gold.toLocaleString()}`
    );

    if (!confirmRestore) return;

    setIsCloudLoading(true);
    try {
      const parsedData = JSON.parse(lastCloudSave.data);
      const success = restoreGameState(parsedData);
      if (!success) throw new Error('Los datos guardados en la nube no tienen un formato válido.');

      sound.playSFX('victory');
      setCloudMessage({
        text: '¡Partida restaurada exitosamente desde la nube de Google Play!',
        type: 'success',
      });
    } catch (err: any) {
      setCloudMessage({
        text: 'Error al restaurar partida: ' + err.message,
        type: 'error',
      });
    } finally {
      setIsCloudLoading(false);
    }
  };

  const handleUpdateScore = async () => {
    sound.playSFX('click');
    if (selectedLeaderboardId === 'lb_power') {
      const power = calculateSquadPower();
      await playGames.submitScore('lb_power', power, `${power.toLocaleString()} Poder`);
    } else if (selectedLeaderboardId === 'lb_wealth') {
      await playGames.submitScore('lb_wealth', gold, `${gold.toLocaleString()} Oro`);
    } else {
      await playGames.submitScore('lb_play_xp', profile.totalPlayGamesXp, `${profile.totalPlayGamesXp.toLocaleString()} XP`);
    }
    loadCurrentLeaderboard(selectedLeaderboardId);
  };

  const filteredAchievements = achievements.filter((a) => {
    if (filterAchievement === 'unlocked') return a.unlocked;
    if (filterAchievement === 'locked') return !a.unlocked;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#091b13] border-2 border-[#16a34a] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.95)] flex flex-col max-h-[92vh] overflow-hidden text-stone-100">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#065f46] p-3.5 flex items-center justify-between border-b border-emerald-500/40 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-400 flex items-center justify-center shadow">
              <Gamepad2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-wide text-white font-serif">
                  Google Play Games
                </span>
                {profile.isSignedIn && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Conectado" />
                )}
              </div>
              <div className="text-[10px] text-emerald-200 font-mono">
                {profile.isSignedIn ? profile.gamerTag : 'Servicios de Juegos y Nube'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/30 hover:bg-black/60 text-emerald-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 bg-[#05160e] border-b border-emerald-900/80 p-1 text-center text-xs font-bold">
          <button
            onClick={() => {
              sound.playSFX('click');
              setActiveTab('profile');
            }}
            className={`py-1.5 rounded-lg flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-emerald-700/80 text-white shadow'
                : 'text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-950/50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="text-[10px]">Perfil</span>
          </button>

          <button
            onClick={() => {
              sound.playSFX('click');
              setActiveTab('achievements');
            }}
            className={`py-1.5 rounded-lg flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
              activeTab === 'achievements'
                ? 'bg-emerald-700/80 text-white shadow'
                : 'text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-950/50'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-[10px]">Logros</span>
          </button>

          <button
            onClick={() => {
              sound.playSFX('click');
              setActiveTab('leaderboards');
            }}
            className={`py-1.5 rounded-lg flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
              activeTab === 'leaderboards'
                ? 'bg-emerald-700/80 text-white shadow'
                : 'text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-950/50'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span className="text-[10px]">Marcador</span>
          </button>

          <button
            onClick={() => {
              sound.playSFX('click');
              setActiveTab('cloud');
            }}
            className={`py-1.5 rounded-lg flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
              activeTab === 'cloud'
                ? 'bg-emerald-700/80 text-white shadow'
                : 'text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-950/50'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="text-[10px]">Nube</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 no-scrollbar text-left text-xs">
          {/* TAB 1: PERFIL */}
          {activeTab === 'profile' && (
            <div className="space-y-3">
              {profile.isSignedIn ? (
                /* Profile Card */
                <div className="space-y-3">
                  <div className="bg-[#0e2a1d] border border-emerald-600/70 rounded-xl p-3 shadow-inner space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={profile.avatarUrl}
                          alt="Avatar"
                          className="w-13 h-13 rounded-xl border-2 border-emerald-400 object-cover shadow bg-stone-900"
                        />
                        <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-[10px] font-black px-1 rounded-md border border-emerald-300 text-white shadow">
                          Nv.{profile.level}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-white truncate">
                            {profile.gamerTag}
                          </span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        </div>
                        <div className="text-[10px] text-emerald-300/80 font-mono">
                          ID: {profile.playerId}
                        </div>
                        <div className="text-[10.5px] text-stone-300 truncate">
                          {profile.email}
                        </div>
                      </div>
                    </div>

                    {/* XP Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-emerald-300">
                        <span>Nivel de Google Play: {profile.level}</span>
                        <span>
                          {profile.currentXp} / {profile.xpToNextLevel} XP
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-emerald-800">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (profile.currentXp / profile.xpToNextLevel) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Stats Row */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#0c2419] border border-emerald-800/80 rounded-xl p-2">
                      <div className="text-amber-400 flex items-center justify-center gap-1">
                        <Trophy className="w-3.5 h-3.5" />
                        <span className="font-bold text-xs">{profile.unlockedAchievementsCount}/{profile.totalAchievementsCount}</span>
                      </div>
                      <span className="text-[9.5px] text-stone-400">Logros</span>
                    </div>

                    <div className="bg-[#0c2419] border border-emerald-800/80 rounded-xl p-2">
                      <div className="text-emerald-400 flex items-center justify-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="font-bold text-xs font-mono">{profile.totalPlayGamesXp.toLocaleString()}</span>
                      </div>
                      <span className="text-[9.5px] text-stone-400">XP Total</span>
                    </div>

                    <div className="bg-[#0c2419] border border-emerald-800/80 rounded-xl p-2">
                      <div className="text-cyan-400 flex items-center justify-center gap-1">
                        <Cloud className="w-3.5 h-3.5" />
                        <span className="font-bold text-xs">Activa</span>
                      </div>
                      <span className="text-[9.5px] text-stone-400">Nube Play</span>
                    </div>
                  </div>

                  {/* Gamer Info Details */}
                  <div className="bg-[#081a12] border border-emerald-900 rounded-xl p-3 space-y-2 text-[11px] text-stone-300">
                    <div className="flex items-center justify-between border-b border-emerald-950 pb-1.5">
                      <span className="text-stone-400">Poder de Escuadrón Actual:</span>
                      <span className="font-bold text-emerald-300">{calculateSquadPower().toLocaleString()} pts</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-emerald-950 pb-1.5">
                      <span className="text-stone-400">Héroes en Plantilla:</span>
                      <span className="font-bold text-white">{heroes.length} aventureros</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Estado de Vinculación:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Google Play Games Activo
                      </span>
                    </div>
                  </div>

                  {/* Sign Out Button */}
                  <button
                    onClick={handleSignOut}
                    className="w-full py-2 bg-stone-900/80 hover:bg-red-950/60 border border-stone-700 hover:border-red-600/70 text-stone-300 hover:text-red-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión de Google Play</span>
                  </button>
                </div>
              ) : (
                /* Not Signed In Card */
                <div className="space-y-3">
                  <div className="bg-[#0d271b] border border-emerald-600/60 rounded-xl p-3.5 text-center space-y-2.5 shadow-lg">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center mx-auto shadow-md border border-emerald-300">
                      <Gamepad2 className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-serif font-bold text-base text-white">
                      Inicia Sesión con Google Play Games
                    </h3>
                    <p className="text-[11px] text-emerald-200/90 leading-relaxed max-w-xs mx-auto">
                      Conecta tu cuenta para sincronizar tus partidas en la nube, registrar tus logros de Google Play y competir en las tablas de clasificación.
                    </p>
                  </div>

                  {/* Sign In Form */}
                  <form onSubmit={handleSignIn} className="bg-[#081a12] border border-emerald-800/80 rounded-xl p-3.5 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-emerald-300">
                        GamerTag de Google Play:
                      </label>
                      <input
                        type="text"
                        value={inputGamerTag}
                        onChange={(e) => setInputGamerTag(e.target.value)}
                        placeholder="Ej. DarkLord#1234"
                        className="w-full bg-[#040e0a] border border-emerald-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-emerald-300">
                        Correo de Google:
                      </label>
                      <input
                        type="email"
                        value={inputEmail}
                        onChange={(e) => setInputEmail(e.target.value)}
                        placeholder="tu-correo@gmail.com"
                        className="w-full bg-[#040e0a] border border-emerald-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-400"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Conectar con Google Play Games</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LOGROS */}
          {activeTab === 'achievements' && (
            <div className="space-y-3">
              {/* Progress Summary Header */}
              <div className="bg-[#0b2417] border border-emerald-600/70 rounded-xl p-2.5 space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-white flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>{achievements.filter((a) => a.unlocked).length} de {achievements.length} Desbloqueados</span>
                  </span>
                  <span className="text-emerald-300 font-mono">
                    +{profile.totalPlayGamesXp.toLocaleString()} XP
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-emerald-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-green-300 transition-all duration-500"
                    style={{
                      width: `${(achievements.filter((a) => a.unlocked).length / achievements.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-1.5">
                {(['all', 'unlocked', 'locked'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      sound.playSFX('click');
                      setFilterAchievement(mode);
                    }}
                    className={`flex-1 py-1 text-[10.5px] font-bold rounded-lg border transition-all cursor-pointer ${
                      filterAchievement === mode
                        ? 'bg-emerald-700 border-emerald-400 text-white shadow'
                        : 'bg-[#091e14] border-emerald-900/60 text-emerald-300/70 hover:text-white'
                    }`}
                  >
                    {mode === 'all' ? 'Todos' : mode === 'unlocked' ? 'Conseguidos' : 'Bloqueados'}
                  </button>
                ))}
              </div>

              {/* Achievement List */}
              <div className="space-y-2">
                {filteredAchievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={`rounded-xl p-2.5 border transition-all flex items-start gap-2.5 ${
                      ach.unlocked
                        ? 'bg-[#0d2b1b] border-emerald-500/80 shadow-[0_2px_8px_rgba(22,163,74,0.15)]'
                        : 'bg-[#07160f] border-emerald-950 opacity-70'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border shadow ${
                        ach.unlocked
                          ? 'bg-gradient-to-br from-emerald-600 to-green-800 border-emerald-400 text-white'
                          : 'bg-stone-900 border-stone-700 text-stone-500'
                      }`}
                    >
                      {renderPlayGamesAchievementIcon(ach)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-bold text-xs truncate ${ach.unlocked ? 'text-white' : 'text-stone-300'}`}>
                          {ach.title}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          ach.unlocked
                            ? 'bg-emerald-900/90 text-emerald-300 border border-emerald-700'
                            : 'bg-stone-900 text-stone-500 border border-stone-800'
                        }`}>
                          +{ach.xpReward} XP
                        </span>
                      </div>
                      <p className="text-[10.5px] text-stone-400 mt-0.5 leading-snug">
                        {ach.description}
                      </p>
                      {ach.unlocked && ach.unlockedAt && (
                        <div className="text-[9px] text-emerald-400/80 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Desbloqueado el {new Date(ach.unlockedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MARCADORES */}
          {activeTab === 'leaderboards' && (
            <div className="space-y-3">
              {/* Leaderboard selector buttons */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'lb_power', label: 'Poder', icon: Swords },
                  { id: 'lb_wealth', label: 'Riqueza', icon: Coins },
                  { id: 'lb_play_xp', label: 'XP Play', icon: Trophy },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        sound.playSFX('click');
                        setSelectedLeaderboardId(item.id);
                      }}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        selectedLeaderboardId === item.id
                          ? 'bg-emerald-700 border-emerald-400 text-white shadow'
                          : 'bg-[#091e14] border-emerald-900/70 text-emerald-300/80 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Current Leaderboard Description */}
              {leaderboard && (
                <div className="bg-[#0b2417] border border-emerald-800 rounded-xl p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span>{leaderboard.icon}</span>
                      <span>{leaderboard.name}</span>
                    </span>
                    <button
                      onClick={handleUpdateScore}
                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded flex items-center gap-1 shadow cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Subir Mi Puntuación</span>
                    </button>
                  </div>
                  <p className="text-[10.5px] text-stone-300 leading-snug">
                    {leaderboard.description}
                  </p>
                </div>
              )}

              {/* Leaderboard Entries List */}
              {isLoadingLb ? (
                <div className="py-8 text-center text-emerald-300/80 font-mono text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Sincronizando clasificación de Google Play...</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {leaderboard?.entries.map((entry) => (
                    <div
                      key={`${entry.rank}-${entry.gamerTag}`}
                      className={`p-2 rounded-xl border flex items-center gap-2.5 transition-all ${
                        entry.isCurrentPlayer
                          ? 'bg-[#123824] border-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.25)]'
                          : entry.rank <= 3
                          ? 'bg-[#0a2015] border-amber-600/50'
                          : 'bg-[#06150e] border-emerald-950'
                      }`}
                    >
                      {/* Rank Badge */}
                      <div className="w-6 flex items-center justify-center font-black">
                        {entry.rank === 1 ? (
                          <div className="w-5 h-5 rounded-full bg-yellow-500/20 border border-yellow-400 flex items-center justify-center" title="Top 1">
                            <Trophy className="w-3 h-3 text-amber-300" />
                          </div>
                        ) : entry.rank === 2 ? (
                          <div className="w-5 h-5 rounded-full bg-slate-300/20 border border-slate-300 flex items-center justify-center" title="Top 2">
                            <Award className="w-3 h-3 text-slate-200" />
                          </div>
                        ) : entry.rank === 3 ? (
                          <div className="w-5 h-5 rounded-full bg-amber-700/20 border border-amber-600 flex items-center justify-center" title="Top 3">
                            <Award className="w-3 h-3 text-amber-500" />
                          </div>
                        ) : (
                          <span className="text-stone-400 text-xs font-mono">#{entry.rank}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <img
                        src={entry.avatarUrl}
                        alt=""
                        className="w-7 h-7 rounded-lg object-cover border border-emerald-700 bg-stone-900 shrink-0"
                      />

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold text-xs truncate ${entry.isCurrentPlayer ? 'text-emerald-200' : 'text-stone-200'}`}>
                            {entry.gamerTag}
                          </span>
                          {entry.isCurrentPlayer && (
                            <span className="bg-emerald-500 text-black text-[9px] font-black px-1 rounded uppercase">
                              Tú
                            </span>
                          )}
                        </div>
                        <div className="text-[9.5px] text-stone-400">
                          {entry.date}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-xs text-amber-300">
                          {entry.formattedScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: NUBE */}
          {activeTab === 'cloud' && (
            <div className="space-y-3">
              {/* Cloud Hero Overview */}
              <div className="bg-[#0b2417] border border-emerald-600/70 rounded-xl p-3 space-y-2 shadow-inner">
                <div className="flex items-center gap-2 text-white">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs">Guardado en Nube de Google Play</span>
                </div>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  Protege tus héroes, oro, armas forjadas y progreso de campaña. Puedes jugar en tu móvil Xiaomi y restaurar tus datos en cualquier momento.
                </p>
              </div>

              {/* Status Message */}
              {cloudMessage && (
                <div className={`p-2.5 rounded-xl border text-[11px] font-bold ${
                  cloudMessage.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                    : cloudMessage.type === 'error'
                    ? 'bg-red-950/80 border-red-500 text-red-200'
                    : 'bg-amber-950/80 border-amber-500 text-amber-200'
                }`}>
                  {cloudMessage.text}
                </div>
              )}

              {/* Cloud Slot Info */}
              <div className="bg-[#081a12] border border-emerald-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-950 pb-1.5">
                  <span className="text-[11px] text-stone-400">Ranura de Nube:</span>
                  <span className="font-bold text-white text-[11px]">Bastión Primario</span>
                </div>
                {lastCloudSave ? (
                  <>
                    <div className="flex items-center justify-between border-b border-emerald-950 pb-1.5">
                      <span className="text-[11px] text-stone-400">Última Sincronización:</span>
                      <span className="font-mono text-emerald-300 text-[10.5px]">
                        {new Date(lastCloudSave.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-emerald-950 pb-1.5">
                      <span className="text-[11px] text-stone-400">Héroes Resguardados:</span>
                      <span className="font-bold text-white text-[11px]">{lastCloudSave.heroCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-stone-400">Oro Resguardado:</span>
                      <span className="font-mono text-amber-300 text-[11px]">{lastCloudSave.gold.toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-[10.5px] text-stone-400 italic">
                    Aún no has guardado una copia en la nube. Pulsa el botón de abajo para respaldar.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleSaveToCloud}
                  disabled={isCloudSaving}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>{isCloudSaving ? 'Subiendo a la nube...' : 'Guardar Partida en la Nube'}</span>
                </button>

                {lastCloudSave && (
                  <button
                    onClick={handleRestoreFromCloud}
                    disabled={isCloudLoading}
                    className="w-full py-2 bg-[#091e14] hover:bg-[#0f2e20] border border-emerald-700 text-emerald-200 hover:text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CloudDownload className="w-4 h-4 text-emerald-400" />
                    <span>{isCloudLoading ? 'Restaurando...' : 'Cargar Partida desde la Nube'}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#05140d] p-2.5 border-t border-emerald-900/60 flex items-center justify-between text-[10px] text-stone-400">
          <span className="flex items-center gap-1 text-emerald-300">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Play Games API v2 &bull; Icespear Services</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 rounded-lg text-xs font-bold cursor-pointer"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
