import React, { useEffect, useState } from 'react';
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
  KeyRound,
  ChevronRight,
  Shield,
  Coins,
  Swords,
  Crown,
  Star,
  Flame,
  Hammer,
  Gem,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

const PLAY_GAMES_DOCS = 'https://developer.android.com/games/pgs/android/server-access';

const renderAchievementIcon = (ach: PlayGamesAchievement) => {
  if (!ach.unlocked) return <Lock className="w-4 h-4 text-stone-500" />;
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

const syncBadge = (ach: PlayGamesAchievement) => {
  switch (ach.syncState) {
    case 'synced':
      return { label: 'En Google Play', className: 'bg-emerald-900/90 text-emerald-300 border-emerald-700' };
    case 'pending':
      return { label: 'Enviando…', className: 'bg-sky-900/80 text-sky-200 border-sky-700' };
    case 'error':
      return { label: 'No sincronizado', className: 'bg-rose-950/80 text-rose-200 border-rose-700' };
    default:
      return { label: 'Solo local', className: 'bg-stone-900 text-stone-400 border-stone-700' };
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

  const [activeTab, setActiveTab] = useState<'account' | 'achievements' | 'leaderboards' | 'backup'>('account');
  const [profile, setProfile] = useState<PlayGamesProfile>(playGames.getProfile());
  const [achievements, setAchievements] = useState<PlayGamesAchievement[]>(playGames.getAchievements());
  const [authCode, setAuthCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [selectedLeaderboardId, setSelectedLeaderboardId] = useState<string>('lb_power');
  const [leaderboard, setLeaderboard] = useState<PlayGamesLeaderboard | null>(null);
  const [isLoadingLb, setIsLoadingLb] = useState(false);
  const [filterAchievement, setFilterAchievement] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [lastBackup, setLastBackup] = useState<PlayGamesCloudSave | null>(null);
  const [isBackupBusy, setIsBackupBusy] = useState(false);

  useEffect(() => {
    const unsubProfile = playGames.subscribeToProfile((updated) => setProfile(updated));
    const unsubAch = playGames.subscribeToAchievements(() => {
      setAchievements(playGames.getAchievements());
      setProfile(playGames.getProfile());
    });
    return () => {
      unsubProfile();
      unsubAch();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void playGames.refreshStatus();
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === 'leaderboards') void loadLeaderboard(selectedLeaderboardId);
    if (activeTab === 'backup') playGames.loadLocalBackup().then((save) => setLastBackup(save));
  }, [activeTab, selectedLeaderboardId]);

  if (!isOpen) return null;

  const squadPower = (): number =>
    team.reduce((acc, heroId) => {
      if (!heroId) return acc;
      const hero = heroes.find((h) => h.id === heroId);
      if (!hero) return acc;
      const atk = hero.stats?.attack || 0;
      const hp = hero.stats?.hp || 0;
      const def = hero.stats?.defense || 0;
      return acc + atk * 2 + Math.round(hp * 0.5) + def;
    }, 0);

  const loadLeaderboard = async (id: string) => {
    setIsLoadingLb(true);
    setLeaderboard(await playGames.getLeaderboard(id));
    setIsLoadingLb(false);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setMessage(null);
    const result = await playGames.connect(authCode);
    setAuthCode('');
    setIsConnecting(false);
    setProfile(playGames.getProfile());
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    if (result.success) {
      void loadLeaderboard(selectedLeaderboardId);
    }
  };

  const handleSignOut = async () => {
    await playGames.signOut();
    setProfile(playGames.getProfile());
    setLeaderboard(null);
    setMessage({ type: 'info', text: 'Sesión de Play Games cerrada. Vuelves a la identidad local.' });
  };

  const handleSubmitScore = async () => {
    sound.playSFX('click');
    const score =
      selectedLeaderboardId === 'lb_power'
        ? squadPower()
        : selectedLeaderboardId === 'lb_wealth'
        ? gold
        : achievements.filter((a) => a.unlocked).length;
    const result = await playGames.submitScore(selectedLeaderboardId, score);
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    if (result.success) await loadLeaderboard(selectedLeaderboardId);
  };

  const handleSaveBackup = async () => {
    setIsBackupBusy(true);
    const snapshot = JSON.stringify({
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
    const backup: PlayGamesCloudSave = {
      slotId: 'slot_primary_cdd',
      title: `Bastión de ${playerName} (Capítulo ${questProgress.chapter})`,
      timestamp: Date.now(),
      playerName,
      heroCount: heroes.length,
      gold,
      crystals: summonCrystals,
      astralShards,
      chapter: questProgress.chapter,
      squadPower: squadPower(),
      data: snapshot,
    };
    const ok = await playGames.saveLocalBackup(backup);
    setLastBackup(ok ? backup : null);
    setIsBackupBusy(false);
    setMessage({
      type: ok ? 'success' : 'error',
      text: ok
        ? 'Copia guardada en este navegador. No se ha enviado a Google Play.'
        : 'No se pudo guardar la copia local.',
    });
  };

  const handleRestoreBackup = async () => {
    if (!lastBackup) return;
    setIsBackupBusy(true);
    try {
      const parsed = JSON.parse(lastBackup.data);
      const ok = restoreGameState(parsed);
      setMessage({
        type: ok ? 'success' : 'error',
        text: ok ? 'Partida restaurada desde la copia local del navegador.' : 'La copia no tiene un formato válido.',
      });
      if (ok) sound.playSFX('victory');
    } catch {
      setMessage({ type: 'error', text: 'La copia no tiene un formato válido.' });
    } finally {
      setIsBackupBusy(false);
    }
  };

  const filteredAchievements = achievements.filter((a) => {
    if (filterAchievement === 'unlocked') return a.unlocked;
    if (filterAchievement === 'locked') return !a.unlocked;
    return true;
  });

  const syncedCount = achievements.filter((a) => a.syncState === 'synced').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#091b13] border-2 border-[#16a34a] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.95)] flex flex-col max-h-[92vh] overflow-hidden text-stone-100">
        <div className="bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#065f46] p-3.5 flex items-center justify-between border-b border-emerald-500/40 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-400 flex items-center justify-center shadow">
              <Gamepad2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-wide text-white font-serif">Google Play Games</span>
                {profile.isSignedIn && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Sesión verificada" />}
              </div>
              <div className="text-[10px] text-emerald-200 font-mono">
                {profile.isSignedIn ? profile.gamerTag : 'API oficial · sin conectar'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/30 hover:bg-black/60 text-emerald-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-4 bg-[#05160e] border-b border-emerald-900/80 p-1 text-center text-xs font-bold">
          {(
            [
              { key: 'account' as const, label: 'Cuenta', icon: User },
              { key: 'achievements' as const, label: 'Logros', icon: Trophy },
              { key: 'leaderboards' as const, label: 'Marcador', icon: Award },
              { key: 'backup' as const, label: 'Respaldo', icon: Cloud },
            ]
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                sound.playSFX('click');
                setActiveTab(key);
              }}
              className={`py-1.5 rounded-lg flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                activeTab === key
                  ? 'bg-emerald-700/80 text-white shadow'
                  : 'text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-950/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[10px]">{label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 no-scrollbar text-left text-xs">
          {message && (
            <div
              className={`p-2.5 rounded-xl border text-[11px] font-bold ${
                message.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                  : message.type === 'error'
                  ? 'bg-red-950/80 border-red-500 text-red-200'
                  : 'bg-amber-950/80 border-amber-500 text-amber-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-3">
              {profile.isSignedIn ? (
                <>
                  <div className="bg-[#0e2a1d] border border-emerald-600/70 rounded-xl p-3 shadow-inner space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={profile.avatarUrl}
                        alt="Avatar de Play Games"
                        className="w-13 h-13 rounded-xl border-2 border-emerald-400 object-cover shadow bg-stone-900"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-white truncate">{profile.gamerTag}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        </div>
                        <div className="text-[10px] text-emerald-300/80 font-mono truncate">ID: {profile.playerId}</div>
                        {profile.title && <div className="text-[10.5px] text-stone-300 truncate">{profile.title}</div>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-[#0c2419] border border-emerald-800/80 rounded-xl p-2">
                        <div className="text-amber-400 flex items-center justify-center gap-1 font-bold text-xs">
                          <Trophy className="w-3.5 h-3.5" />
                          {syncedCount}/{achievements.length}
                        </div>
                        <span className="text-[9.5px] text-stone-400">Logros en Play</span>
                      </div>
                      <div className="bg-[#0c2419] border border-emerald-800/80 rounded-xl p-2">
                        <div className="text-emerald-400 font-bold text-xs">{squadPower().toLocaleString()}</div>
                        <span className="text-[9.5px] text-stone-400">Poder de escuadrón</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="w-full py-2 bg-stone-900/80 hover:bg-red-950/60 border border-stone-700 hover:border-red-600/70 text-stone-300 hover:text-red-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Cerrar sesión de Play Games
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-[#0d271b] border border-emerald-600/60 rounded-xl p-3.5 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center shadow-md border border-emerald-300">
                      <Gamepad2 className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-serif font-bold text-sm text-white">Conectar con Play Games Services</h3>
                    <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                      La sesión usa la API oficial (<span className="font-mono text-[10px]">games.googleapis.com/games/v1</span>).
                      Google no ofrece SDK web: el código de servidor lo genera tu app Android/nativa con
                      <span className="font-mono text-[10px]"> GamesSignInClient</span>.
                    </p>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border text-[11px] leading-snug flex items-start gap-2 ${
                      profile.isConfigured
                        ? 'bg-emerald-950/60 border-emerald-600/70 text-emerald-200'
                        : 'bg-amber-950/60 border-amber-600/70 text-amber-100'
                    }`}
                  >
                    {profile.isConfigured ? (
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    )}
                    <span>
                      {profile.isConfigured
                        ? 'El servidor tiene las credenciales de Play Games configuradas.'
                        : 'El servidor aún no tiene PLAY_GAMES_CLIENT_ID y PLAY_GAMES_CLIENT_SECRET. Sin ellas no se puede canjear ningún código.'}
                    </span>
                  </div>

                  <form onSubmit={handleConnect} className="bg-[#081a12] border border-emerald-800/80 rounded-xl p-3 space-y-2.5">
                    <label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      Server auth code de Play Games
                    </label>
                    <input
                      type="text"
                      value={authCode}
                      onChange={(e) => setAuthCode(e.target.value)}
                      placeholder="4/0Axxxxxxxx..."
                      autoComplete="off"
                      className="w-full bg-[#040e0a] border border-emerald-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-400 font-mono"
                    />
                    <button
                      type="submit"
                      disabled={isConnecting || !authCode.trim() || !profile.isConfigured}
                      className="w-full py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl shadow flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                    >
                      {isConnecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                      {isConnecting ? 'Validando con Google…' : 'Validar código y conectar'}
                    </button>
                    <a
                      href={PLAY_GAMES_DOCS}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-emerald-300/80 hover:text-emerald-200 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Cómo obtener el server auth code
                    </a>
                  </form>

                  <p className="text-[10px] text-stone-500 leading-relaxed">
                    Mientras no conectes, tu identidad es local (Invitado) y los logros se guardan solo en este
                    dispositivo; no se envían a Google Play.
                  </p>
                </>
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-3">
              <div className="bg-[#0b2417] border border-emerald-600/70 rounded-xl p-2.5 space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-white flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    {achievements.filter((a) => a.unlocked).length} de {achievements.length} desbloqueados
                  </span>
                  <span className="text-emerald-300 font-mono text-[10px]">{syncedCount} en Play</span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-emerald-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-green-300 transition-all duration-500"
                    style={{ width: `${(achievements.filter((a) => a.unlocked).length / achievements.length) * 100}%` }}
                  />
                </div>
              </div>

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

              <div className="space-y-2">
                {filteredAchievements.map((ach) => {
                  const badge = syncBadge(ach);
                  return (
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
                        {renderAchievementIcon(ach)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`font-bold text-xs truncate ${ach.unlocked ? 'text-white' : 'text-stone-300'}`}>
                            {ach.title}
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-stone-400 mt-0.5 leading-snug">{ach.description}</p>
                        {ach.maxProgress && (
                          <p className="text-[9px] font-mono text-stone-500 mt-1">
                            Progreso: {Math.min(ach.progress || 0, ach.maxProgress)}/{ach.maxProgress}
                          </p>
                        )}
                        {ach.unlocked && ach.unlockedAt && (
                          <div className="text-[9px] text-emerald-400/80 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Desbloqueado el {new Date(ach.unlockedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'leaderboards' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'lb_power', label: 'Poder', icon: Swords },
                  { id: 'lb_wealth', label: 'Riqueza', icon: Coins },
                  { id: 'lb_play_xp', label: 'Logros', icon: Trophy },
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

              {!profile.isSignedIn ? (
                <div className="p-3 rounded-xl bg-[#081a12] border border-emerald-900 text-[11px] text-stone-300 leading-relaxed">
                  Los marcadores son los oficiales de Play Games. Conecta una sesión para leerlos y enviar tu
                  puntuación; sin sesión no se muestran datos inventados.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10.5px] text-stone-400">
                      Datos de <span className="font-mono">games.googleapis.com</span>
                    </span>
                    <button
                      onClick={handleSubmitScore}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded flex items-center gap-1 shadow cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Enviar puntuación
                    </button>
                  </div>

                  {isLoadingLb ? (
                    <div className="py-8 text-center text-emerald-300/80 font-mono text-xs flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Consultando Play Games…</span>
                    </div>
                  ) : leaderboard && leaderboard.entries.length > 0 ? (
                    <div className="space-y-1.5">
                      {leaderboard.entries.map((entry) => (
                        <div
                          key={`${entry.rank}-${entry.playerId}-${entry.score}`}
                          className={`p-2 rounded-xl border flex items-center gap-2.5 ${
                            entry.isCurrentPlayer
                              ? 'bg-[#123824] border-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.25)]'
                              : 'bg-[#06150e] border-emerald-950'
                          }`}
                        >
                          <div className="w-6 text-center font-mono text-xs text-stone-400">#{entry.rank}</div>
                          <img
                            src={entry.avatarUrl}
                            alt=""
                            className="w-7 h-7 rounded-lg object-cover border border-emerald-700 bg-stone-900 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs truncate text-stone-200">{entry.gamerTag}</span>
                              {entry.isCurrentPlayer && (
                                <span className="bg-emerald-500 text-black text-[9px] font-black px-1 rounded uppercase">Tú</span>
                              )}
                            </div>
                            {entry.date && <div className="text-[9.5px] text-stone-400">{entry.date}</div>}
                          </div>
                          <span className="font-mono font-bold text-xs text-amber-300 shrink-0">{entry.formattedScore}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-[#081a12] border border-emerald-900 text-[11px] text-amber-200 leading-relaxed">
                      Play Games no devolvió entradas para este marcador. Revisa que el ID exista en Play Console y
                      tenga puntuaciones públicas.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-3">
              <div className="bg-[#0b2417] border border-emerald-600/70 rounded-xl p-3 space-y-2 shadow-inner">
                <div className="flex items-center gap-2 text-white">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs">Respaldo local del navegador</span>
                </div>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  Esta copia se guarda en el almacenamiento de este dispositivo. No es Google Play Games: los
                  Snapshots de Play requieren el SDK nativo de la app Android.
                </p>
              </div>

              <div className="bg-[#081a12] border border-emerald-800 rounded-xl p-3 space-y-2">
                {lastBackup ? (
                  <>
                    <div className="flex items-center justify-between border-b border-emerald-950 pb-1.5">
                      <span className="text-[11px] text-stone-400">Última copia:</span>
                      <span className="font-mono text-emerald-300 text-[10.5px]">
                        {new Date(lastBackup.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-emerald-950 pb-1.5">
                      <span className="text-[11px] text-stone-400">Héroes:</span>
                      <span className="font-bold text-white text-[11px]">{lastBackup.heroCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-stone-400">Oro:</span>
                      <span className="font-mono text-amber-300 text-[11px]">{lastBackup.gold.toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-[10.5px] text-stone-400 italic">Todavía no hay copia local guardada.</p>
                )}
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleSaveBackup}
                  disabled={isBackupBusy}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CloudUpload className="w-4 h-4" />
                  Guardar copia local
                </button>

                {lastBackup && (
                  <button
                    onClick={handleRestoreBackup}
                    disabled={isBackupBusy}
                    className="w-full py-2 bg-[#091e14] hover:bg-[#0f2e20] border border-emerald-700 text-emerald-200 hover:text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CloudDownload className="w-4 h-4 text-emerald-400" />
                    Restaurar copia local
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#05140d] p-2.5 border-t border-emerald-900/60 flex items-center justify-between text-[10px] text-stone-400">
          <span className="flex items-center gap-1 text-emerald-300">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Play Games Services API v1</span>
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
