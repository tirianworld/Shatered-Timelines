import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import { clanService } from '../services/clanService';
import { realtime } from '../services/realtimeService';
import { playGames } from '../services/playGamesService';
import { ClanData, ClanPerk, GitHubSyncStatus } from '../types/clan';
import { sound } from '../services/soundService';
import { launchConfetti } from '../utils/confetti';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Cloud,
  CloudOff,
  Coins,
  Compass,
  Crown,
  Flame,
  Loader2,
  LogOut,
  Palette,
  PlusCircle,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { ForgeMaskedSlider } from './ForgeMaskedSlider';
import { OrderEmblem } from './OrderEmblem';
import { DEFAULT_EMBLEM, decodeEmblem, encodeEmblem, PALETTES, SHAPES, SYMBOLS } from '../utils/orderEmblems';
import type { EmblemSelection } from '../utils/orderEmblems';

const ORDER_COST = 10000;
const MAX_MEMBERS = 30;

const ROLE_STYLES: Record<string, string> = {
  'Gran Maestre': 'bg-amber-500 text-stone-950 border-amber-300/70',
  Comandante: 'bg-fuchsia-600/90 text-white border-fuchsia-300/50',
  Paladín: 'bg-sky-500/90 text-stone-950 border-sky-200/60',
  Iniciado: 'bg-stone-700 text-stone-200 border-stone-500/50',
};

const renderPerkIcon = (perkId: string) => {
  switch (perkId) {
    case 'perk_gold':
      return <Coins className="w-5 h-5 text-amber-400" />;
    case 'perk_xp':
      return <Sparkles className="w-5 h-5 text-cyan-400" />;
    case 'perk_attack':
      return <Swords className="w-5 h-5 text-red-400" />;
    case 'perk_defense':
      return <Shield className="w-5 h-5 text-emerald-400" />;
    case 'perk_astral':
      return <Flame className="w-5 h-5 text-purple-400" />;
    default:
      return <Award className="w-5 h-5 text-amber-400" />;
  }
};

const renderActivityIcon = (type: string) => {
  switch (type) {
    case 'achievement':
      return <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
    case 'donation':
      return <Coins className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />;
    case 'join':
      return <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
    default:
      return <Shield className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />;
  }
};

type TabKey = 'members' | 'perks' | 'leaderboard' | 'explore';

export const OrderClanView: React.FC = () => {
  const { gold, addGold } = useGame();

  const [clan, setClan] = useState<ClanData | null>(clanService.getCurrentClan());
  const [allClans, setAllClans] = useState<ClanData[]>(clanService.getAllClans());
  const [syncState, setSyncState] = useState<GitHubSyncStatus>(clanService.getSyncStatus());
  const [activeTab, setActiveTab] = useState<TabKey>('members');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const [playProfile, setPlayProfile] = useState(playGames.getProfile());

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClanName, setNewClanName] = useState('');
  const [newClanTag, setNewClanTag] = useState('');
  const [newClanMotto, setNewClanMotto] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [pendingJoinId, setPendingJoinId] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showEmblemPicker, setShowEmblemPicker] = useState(false);
  const [emblemTarget, setEmblemTarget] = useState<'clan' | 'new'>('clan');
  const [draftEmblem, setDraftEmblem] = useState<EmblemSelection>(DEFAULT_EMBLEM);
  const [newClanEmblem, setNewClanEmblem] = useState<EmblemSelection>(DEFAULT_EMBLEM);

  useEffect(() => {
    const unsubscribeClan = clanService.subscribe((updated) => {
      setClan(updated);
      setAllClans(clanService.getAllClans());
    });
    const unsubscribeProfile = playGames.subscribeToProfile((profile) => setPlayProfile(profile));
    const unsubscribeSync = clanService.subscribeSync((status) => setSyncState(status));

    return () => {
      unsubscribeClan();
      unsubscribeProfile();
      unsubscribeSync();
    };
  }, []);

  // La sede se recarga sola: al abrirla y cada vez que se vuelve a la pestaña.
  useEffect(() => {
    const refresh = () => {
      void clanService.refreshFromCloud();
    };
    refresh();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Los cambios de otros jugadores llegan por el canal en tiempo real, sin recargar.
  useEffect(() => realtime.subscribe('orders', () => {
    void clanService.refreshFromCloud();
  }), []);

  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(null), 6000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  const rankedOrders = useMemo(
    () =>
      [...allClans].sort(
        (a, b) => b.trophies - a.trophies || b.totalPower - a.totalPower || a.name.localeCompare(b.name)
      ),
    [allClans]
  );

  const syncStatus = syncState.lastSyncStatus;
  const syncTone =
    syncStatus === 'error'
      ? 'text-rose-300'
      : syncStatus === 'local'
      ? 'text-amber-300'
      : syncStatus === 'syncing'
      ? 'text-sky-300'
      : 'text-emerald-300';
  const openEmblemPicker = (target: 'clan' | 'new') => {
    sound.playSFX('click');
    setEmblemTarget(target);
    setDraftEmblem(target === 'new' ? newClanEmblem : decodeEmblem(clan?.emblem));
    setShowEmblemPicker(true);
  };

  const handleApplyEmblem = () => {
    if (emblemTarget === 'new') {
      setNewClanEmblem(draftEmblem);
      setShowEmblemPicker(false);
      sound.playSFX('click');
      return;
    }
    if (!clan) return;
    clanService.updateEmblem(encodeEmblem(draftEmblem));
    sound.playSFX('upgrade');
    setShowEmblemPicker(false);
    setStatusMessage({ type: 'success', text: 'Emblema actualizado. Se está guardando en la sede.' });
  };

  const handleDonate = (amount: number) => {
    if (gold < amount) {
      sound.playSFX('hurt');
      setStatusMessage({
        type: 'error',
        text: `Oro insuficiente. Necesitas ${amount.toLocaleString()} Oro para donar.`,
      });
      return;
    }

    addGold(-amount);
    const res = clanService.donateGold(amount);
    if (res.success) {
      launchConfetti();
      playGames.updateProgress('ach_wealthy', gold);
      setStatusMessage({
        type: 'success',
        text: `Donación completada: +${res.earnedClanXp} XP para la Orden y +${res.earnedPlayGamesXp} XP de Play Games.`,
      });
    }
  };

  const handleUpgradePerk = (perk: ClanPerk) => {
    if (gold < perk.upgradeCostGold) {
      sound.playSFX('hurt');
      setStatusMessage({
        type: 'error',
        text: `Oro insuficiente. Se requieren ${perk.upgradeCostGold.toLocaleString()} Oro para elevar esta bendición.`,
      });
      return;
    }

    addGold(-perk.upgradeCostGold);
    const ok = clanService.upgradePerk(perk.id);
    if (ok) {
      launchConfetti();
      setStatusMessage({
        type: 'success',
        text: `Bendición mejorada a nivel ${perk.level + 1}. Toda la Orden recibe ${perk.bonusText}.`,
      });
    }
  };

  const validateCreateForm = (): string | null => {
    const name = newClanName.trim();
    const tag = newClanTag.trim().toUpperCase();

    if (name.length < 3) return 'El nombre de la Orden debe tener al menos 3 caracteres.';
    if (name.length > 24) return 'El nombre de la Orden no puede superar los 24 caracteres.';
    if (!/^[A-Z0-9]{3,5}$/.test(tag)) return 'La etiqueta debe tener entre 3 y 5 letras o números.';
    if (allClans.some((c) => c.tag.toUpperCase() === tag)) {
      return `La etiqueta [${tag}] ya está registrada por otra Orden.`;
    }
    return null;
  };

  const openCreateModal = () => {
    sound.playSFX('click');
    setCreateError(null);
    setShowCreateModal(true);
  };

  const handleCreateClanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateCreateForm();
    if (validationError) {
      sound.playSFX('hurt');
      setCreateError(validationError);
      return;
    }
    if (gold < ORDER_COST) {
      sound.playSFX('hurt');
      setCreateError(`Fundar una Orden requiere ${ORDER_COST.toLocaleString()} Oro.`);
      return;
    }

    setIsCreating(true);
    addGold(-ORDER_COST);
    const created = clanService.createClan(
      newClanName.trim(),
      newClanTag.trim().toUpperCase(),
      newClanMotto.trim(),
      encodeEmblem(newClanEmblem)
    );
    setIsCreating(false);
    setShowCreateModal(false);
    setNewClanName('');
    setNewClanTag('');
    setNewClanMotto('');
    setActiveTab('members');
    launchConfetti();
    setStatusMessage({
      type: 'success',
      text: `La Orden "${created.name}" [${created.tag}] ha sido fundada en la Sede de las Cumbres y se está guardando en GitHub.`,
    });
  };

  const handleJoinOrder = async (order: ClanData) => {
    if (pendingJoinId) return;
    setPendingJoinId(order.id);
    sound.playSFX('click');
    const ok = await clanService.joinClan(order.id);
    setPendingJoinId(null);
    if (ok) {
      setActiveTab('members');
      setStatusMessage({
        type: 'success',
        text: `Te has unido a ${order.name} [${order.tag}]. Tu plaza queda registrada en la sede.`,
      });
    } else {
      setStatusMessage({ type: 'error', text: 'No se pudo unir a la Orden seleccionada.' });
    }
  };

  const handleLeaveOrder = async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    const leftName = clan?.name;
    await clanService.leaveClan();
    setIsLeaving(false);
    setShowLeaveConfirm(false);
    setActiveTab('explore');
    setStatusMessage({ type: 'info', text: `Has abandonado ${leftName || 'la Orden'}.` });
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#120502] select-none text-stone-100">
      {/* 1. CABECERA DE LA SEDE */}
      <div className="relative w-full h-[168px] shrink-0 overflow-hidden border-b-2 border-[#451f10] shadow-2xl">
        <img
          src={clan?.buildingImage || '/assets/aistudio/image_6578a593.png'}
          alt="Sede de la Orden de Icespear"
          className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#120502] via-[#120502]/55 to-black/25" />

        <div className="absolute top-2 inset-x-2 z-10 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 border border-amber-700/50 text-[9px] font-mono font-bold tracking-wider text-amber-200">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            SEDE DE LA ORDEN
          </span>

          {clan && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/90 border border-amber-600/70 shadow-lg">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-mono font-black text-amber-200">
                {clan.trophies.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="absolute bottom-2 inset-x-3 z-10 flex items-end gap-2.5">
          <button
            type="button"
            onClick={() => openEmblemPicker('clan')}
            disabled={!clan}
            title={clan ? 'Personalizar el emblema de la Orden' : 'Funda una Orden para elegir su emblema'}
            className="relative w-12 h-12 rounded-xl bg-black/75 border-2 border-amber-500/70 p-1.5 shrink-0 shadow-[0_0_18px_rgba(245,158,11,0.25)] cursor-pointer hover:border-amber-300 transition-colors active:scale-95 disabled:cursor-default disabled:hover:border-amber-500/70 disabled:active:scale-100"
          >
            {clan ? (
              <OrderEmblem emblem={clan.emblem} className="w-full h-full" />
            ) : (
              <Shield className="w-full h-full text-amber-400" />
            )}
            {clan && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border border-amber-200 flex items-center justify-center shadow">
                <Palette className="w-2.5 h-2.5 text-stone-950" />
              </span>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-amber-600 text-stone-950 font-black text-[9px] font-mono">
                {clan?.tag || 'ORDEN'}
              </span>
              <h2 className="font-serif font-black text-sm text-[#fae59a] truncate drop-shadow-md">
                {clan?.name || 'Sede de la Orden de Icespear'}
              </h2>
            </div>
            <p className="text-[10px] text-stone-300 italic truncate">
              "{clan?.motto || 'Unidos bajo el manto helado de las cumbres'}"
            </p>
          </div>

          {clan && (
            <div className="text-right shrink-0 w-[86px]">
              <div className="text-[9px] font-bold text-amber-300 font-mono flex items-center justify-end gap-1">
                <Crown className="w-3 h-3" />
                Nv. {clan.level}
              </div>
              <div className="w-full h-1.5 bg-black/80 rounded-full border border-amber-900/60 overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (clan.xp / Math.max(1, clan.xpToNextLevel)) * 100)}%` }}
                />
              </div>
              <div className="text-[8px] font-mono text-stone-400 mt-0.5">
                {clan.xp}/{clan.xpToNextLevel} XP · {clan.members.length}/{MAX_MEMBERS}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. NAVEGACIÓN */}
      <div className="px-2.5 pt-2 pb-1.5 bg-[#1b0a04] border-b border-[#3d1a0b] flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar">
        {(
          [
            { key: 'members' as TabKey, label: 'Hermandad', icon: Users, badge: clan?.members.length },
            { key: 'perks' as TabKey, label: 'Bendiciones', icon: Sparkles, badge: clan?.perks.length },
            { key: 'leaderboard' as TabKey, label: 'Ranking', icon: Trophy, badge: allClans.length },
            { key: 'explore' as TabKey, label: 'Órdenes', icon: Compass },
          ]
        ).map(({ key, label, icon: Icon, badge }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => {
                sound.playSFX('click');
                setActiveTab(key);
              }}
              className={`flex-1 min-w-[68px] h-[34px] rounded-lg flex items-center justify-center gap-1 px-1.5 cursor-pointer transition-all active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-b from-[#f59f42] to-[#db7c1e] border border-[#f8b465] shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                  : 'bg-[#251007] border border-[#4a2211] text-[#a89b91] hover:text-stone-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#1c0800]' : 'text-stone-400'}`} />
              <span className={`text-[10.5px] font-serif whitespace-nowrap ${isActive ? 'font-black text-[#1c0800]' : 'font-bold'}`}>
                {label}
              </span>
              {badge !== undefined && (
                <span
                  className={`text-[8px] px-1 rounded-full font-mono font-bold ${
                    isActive ? 'bg-[#1c0800] text-amber-400' : 'bg-black/60 text-stone-300'
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. MENSAJES DE ESTADO */}
      {statusMessage && (
        <div
          className={`mx-2.5 mt-2 px-3 py-1.5 text-xs flex items-start justify-between gap-2 rounded-lg border shrink-0 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/60'
              : statusMessage.type === 'info'
              ? 'bg-sky-950/90 text-sky-200 border-sky-700/60'
              : 'bg-rose-950/90 text-rose-200 border-rose-700/60'
          }`}
        >
          <div className="flex items-start gap-1.5 min-w-0">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            ) : statusMessage.type === 'info' ? (
              <Shield className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span className="leading-tight text-[11px]">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-stone-400 hover:text-white cursor-pointer p-0.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 5. CONTENIDO */}
      <div className="flex-1 min-h-0 w-full relative overflow-hidden bg-[#120502]">
        <ForgeMaskedSlider className="w-full h-full" contentClassName="p-2.5 space-y-3">
          {!clan && (activeTab === 'members' || activeTab === 'perks') && (
            <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-[#522510] bg-black/40 space-y-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-b from-amber-600/30 to-amber-950/60 border-2 border-amber-500/60 flex items-center justify-center mx-auto text-amber-300">
                <Shield className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-black text-sm text-[#fae59a]">No perteneces a ninguna Orden</h3>
                <p className="text-xs text-stone-300 max-w-xs mx-auto leading-relaxed">
                  Funda tu propia hermandad en la Sede de Icespear o únete a una de las Órdenes registradas en la red.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                <button
                  onClick={openCreateModal}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-stone-950 font-serif font-black text-xs shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                >
                  Fundar Orden ({ORDER_COST.toLocaleString()} Oro)
                </button>
                <button
                  onClick={() => {
                    sound.playSFX('click');
                    setActiveTab('explore');
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#240e06] border border-[#5a2e16] text-[#fae59a] font-serif font-bold text-xs hover:border-amber-400 active:scale-95 transition-transform cursor-pointer"
                >
                  Explorar Órdenes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'members' && clan && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#240e06] to-[#1a0803] border border-[#5a2e16] shadow-lg space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-serif font-black text-[#fae59a]">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>Donación a la Hermandad</span>
                    </div>
                    <p className="text-[10px] text-stone-300">
                      Aporta oro para subir el nivel de la Orden y ganar XP de Play Games.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleDonate(1000)}
                      className="px-2.5 py-1.5 rounded-lg bg-gradient-to-b from-amber-600 to-amber-800 border border-amber-500 font-serif font-black text-xs text-stone-950 shadow hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    >
                      1,000
                    </button>
                    <button
                      onClick={() => handleDonate(5000)}
                      className="px-2.5 py-1.5 rounded-lg bg-gradient-to-b from-amber-500 to-amber-700 border border-amber-400 font-serif font-black text-xs text-stone-950 shadow hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    >
                      5,000
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-amber-900/40 text-[9px] font-mono text-stone-400">
                  <span className="truncate">
                    {playProfile.gamerTag} ·{' '}
                    {playProfile.isGuest ? 'Invitado local (sin Play Games)' : playProfile.title || 'Google Play Games'}
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Jugador identificado
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-serif font-black text-[#fae59a]">
                  Miembros de la Orden ({clan.members.length}/{MAX_MEMBERS})
                </span>
                <span
                  className={`text-[9px] font-mono flex items-center gap-1 ${syncTone}`}
                  title={syncState.errorMessage || undefined}
                >
                  {syncStatus === 'success' ? <Cloud className="w-3 h-3" /> : syncStatus === 'error' ? <CloudOff className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
                  {syncStatus === 'success'
                    ? syncState.source === 'local'
                      ? 'Guardado en el servidor'
                      : 'Guardado en GitHub'
                    : syncStatus === 'local'
                    ? 'Guardado en el servidor'
                    : syncStatus === 'error'
                    ? 'Sin conexión'
                    : syncStatus === 'syncing'
                    ? 'Guardando…'
                    : 'Sin sincronizar'}
                </span>
              </div>

              <div className="space-y-2">
                {clan.members.map((member) => {
                  const roleStyle = ROLE_STYLES[member.role] || ROLE_STYLES.Iniciado;
                  return (
                    <div
                      key={member.playerId}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 shadow-md transition-all ${
                        member.isPlayer
                          ? 'bg-[#2b1307] border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : 'bg-[#190a04] border-[#441f0f]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`relative w-10 h-10 rounded-full border overflow-hidden bg-black/60 shrink-0 ${
                            member.role === 'Gran Maestre' ? 'border-amber-400' : 'border-amber-600/50'
                          }`}
                        >
                          <img
                            src={member.avatarUrl}
                            alt={member.gamerTag}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/assets/portraits/edacorn icono.png';
                            }}
                          />
                          {member.role === 'Gran Maestre' && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                              <Crown className="w-2.5 h-2.5 text-stone-950" />
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-xs text-stone-100 truncate">{member.gamerTag}</span>
                            {member.isPlayer && (
                              <span className="px-1 rounded bg-amber-500 text-stone-950 font-black text-[8px]">TÚ</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] font-mono text-stone-400">
                            <span className={`px-1 rounded border ${roleStyle} font-bold`}>{member.role}</span>
                            <span>Nv.{member.playGamesLevel}</span>
                            <span>•</span>
                            <span className="truncate">{member.lastActive}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono space-y-0.5">
                        <div className="text-[11px] font-black text-amber-200">
                          {member.squadPower.toLocaleString()} <span className="text-[9px] text-amber-500">PDR</span>
                        </div>
                        <div className="text-[9px] text-stone-400">+{member.contributionXp.toLocaleString()} XP</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-1 space-y-1.5">
                <span className="text-xs font-serif font-black text-[#fae59a]">Registro de Hazañas</span>
                <div className="p-2.5 rounded-xl bg-black/40 border border-[#3b190a] space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                  {clan.activities.length === 0 && (
                    <p className="text-[10px] text-stone-500 italic">La Orden aún no tiene hazañas registradas.</p>
                  )}
                  {clan.activities.map((act) => (
                    <div key={act.id} className="flex items-start gap-2 text-[10px] text-stone-300">
                      {renderActivityIcon(act.type)}
                      <div className="flex-1 leading-tight">
                        <span>{act.text}</span>
                        <span className="text-[8px] text-stone-500 block">{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playSFX('click');
                  setShowLeaveConfirm(true);
                }}
                className="w-full mt-1 py-2 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 font-serif font-bold text-[11px] flex items-center justify-center gap-1.5 hover:bg-rose-950 active:scale-[0.99] transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Abandonar la Orden
              </button>
            </div>
          )}

          {activeTab === 'perks' && clan && (
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-[#240e06] border border-amber-800/80 space-y-0.5">
                <h3 className="font-serif font-black text-[#fae59a] text-xs">Bendiciones de la Sede de Icespear</h3>
                <p className="text-[10px] text-stone-400">
                  Las mejoras activas refuerzan a todos los miembros de la hermandad.
                </p>
              </div>

              <div className="space-y-2">
                {clan.perks.map((perk) => {
                  const canAfford = gold >= perk.upgradeCostGold;
                  const isMax = perk.level >= perk.maxLevel;

                  return (
                    <div key={perk.id} className="p-3 rounded-xl bg-[#1a0a04] border border-[#4a2211] shadow-lg space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-black/60 border border-amber-600/60 flex items-center justify-center shrink-0">
                          {renderPerkIcon(perk.id)}
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-black text-xs text-[#fae59a] truncate">{perk.name}</span>
                            <span className="text-[9px] font-mono px-1.5 rounded bg-amber-950 border border-amber-600/50 text-amber-300 font-bold">
                              Nv.{perk.level}/{perk.maxLevel}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-emerald-400">{perk.bonusText}</p>
                          <p className="text-[9px] text-stone-400 leading-snug">{perk.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-amber-900/40">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: perk.maxLevel }).map((_, idx) => (
                            <span
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full ${
                                idx < perk.level ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.7)]' : 'bg-stone-700'
                              }`}
                            />
                          ))}
                        </div>

                        {isMax ? (
                          <span className="text-[10px] font-bold text-amber-400 px-2.5 py-1 rounded bg-black/60 border border-amber-500/40">
                            Nivel máximo
                          </span>
                        ) : (
                          <button
                            onClick={() => handleUpgradePerk(perk)}
                            disabled={!canAfford}
                            className={`px-3 py-1.5 rounded-lg font-serif font-black text-[10px] shadow transition-transform active:scale-95 flex items-center gap-1.5 ${
                              canAfford
                                ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-stone-950 hover:scale-105 cursor-pointer'
                                : 'bg-stone-900 text-stone-500 border border-stone-800 opacity-60 cursor-not-allowed'
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            Mejorar · {perk.upgradeCostGold.toLocaleString()} Oro
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-[#200c05] border border-[#522510]">
                <h3 className="font-serif font-black text-xs text-[#fae59a]">Clasificación de Órdenes</h3>
                <p className="text-[10px] text-stone-400">
                  Trofeos y poder combinado de los jugadores registrados en la red.
                </p>
              </div>

              {rankedOrders.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-xl border border-dashed border-[#441f0f] bg-black/40 space-y-2">
                  <Trophy className="w-8 h-8 text-amber-600/60 mx-auto" />
                  <p className="text-xs text-amber-200 font-bold">Todavía no hay Órdenes en los marcadores.</p>
                  <p className="text-[11px] text-stone-400">
                    Funda la primera Orden de Icespear para liderar la clasificación global.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rankedOrders.map((order, idx) => {
                    const rank = idx + 1;
                    const isUserClan = clan?.id === order.id;

                    return (
                      <div
                        key={order.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 shadow-md ${
                          isUserClan
                            ? 'bg-[#2d1205] border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                            : 'bg-[#180903] border-[#3f1c0d]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-serif font-black text-xs shrink-0 ${
                              rank === 1
                                ? 'bg-yellow-500 text-stone-950'
                                : rank === 2
                                ? 'bg-slate-300 text-stone-950'
                                : rank === 3
                                ? 'bg-amber-700 text-stone-100'
                                : 'bg-black/60 text-stone-400'
                            }`}
                          >
                            {rank}
                          </div>

                          <div className="w-9 h-9 rounded-lg bg-black/60 border border-amber-600/40 p-1 shrink-0 flex items-center justify-center">
                            <OrderEmblem emblem={order.emblem} className="w-full h-full" />
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-serif font-black text-xs text-[#fae59a] truncate">{order.name}</span>
                              <span className="px-1 rounded bg-amber-600/40 text-amber-300 font-mono text-[8px] font-bold">
                                [{order.tag}]
                              </span>
                              {isUserClan && (
                                <span className="px-1 rounded bg-amber-500 text-stone-950 font-black text-[8px]">TU ORDEN</span>
                              )}
                            </div>
                            <p className="text-[9px] text-stone-400 font-mono truncate">
                              <strong className="text-stone-300">{order.leaderGamerTag}</strong> · Nv. {order.level} ·{' '}
                              {order.members.length} miembros
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 font-mono space-y-0.5">
                          <div className="text-xs font-black text-amber-300 flex items-center justify-end gap-1">
                            <Trophy className="w-3 h-3 text-amber-400" />
                            <span>{order.trophies.toLocaleString()}</span>
                          </div>
                          <div className="text-[9px] text-stone-400">{order.totalPower.toLocaleString()} PDR</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'explore' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#200c05] border border-[#522510] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-serif font-black text-xs text-[#fae59a]">Explorador de Órdenes</h3>
                  <p className="text-[10px] text-stone-400">Únete a una hermandad existente o funda la tuya.</p>
                </div>
                <button
                  onClick={openCreateModal}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-b from-amber-500 to-amber-700 text-stone-950 font-serif font-black text-xs flex items-center gap-1 hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Fundar
                </button>
              </div>

              {rankedOrders.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-xl border border-dashed border-[#441f0f] bg-black/40 space-y-3">
                  <Shield className="w-8 h-8 text-amber-600/60 mx-auto" />
                  <p className="text-xs text-amber-200 font-bold">No hay Órdenes creadas en este momento.</p>
                  <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                    Sé el primer Gran Maestre de Icespear y funda la primera hermandad de héroes.
                  </p>
                  <button
                    onClick={openCreateModal}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-stone-950 font-serif font-black text-xs shadow hover:scale-105 active:scale-95 transition-transform cursor-pointer mx-auto"
                  >
                    Fundar Primera Orden
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {rankedOrders.map((order) => {
                    const isCurrent = clan?.id === order.id;
                    const isJoining = pendingJoinId === order.id;

                    return (
                      <div key={order.id} className="p-3 rounded-xl bg-[#190a04] border border-[#441f0f] shadow-md space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-black/60 border border-amber-600/40 p-1 flex items-center justify-center shrink-0">
                              <OrderEmblem emblem={order.emblem} className="w-full h-full" />
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-serif font-black text-xs text-[#fae59a] truncate">{order.name}</span>
                                <span className="px-1 rounded bg-amber-600/40 text-amber-300 font-mono text-[8px] font-bold">
                                  [{order.tag}]
                                </span>
                              </div>
                              <p className="text-[10px] text-stone-400 italic line-clamp-1">"{order.motto}"</p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isCurrent ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-serif font-black text-[10px] flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                Actual
                              </span>
                            ) : (
                              <button
                                onClick={() => handleJoinOrder(order)}
                                disabled={Boolean(pendingJoinId) || order.members.length >= MAX_MEMBERS}
                                className="px-3 py-1.5 rounded-lg bg-gradient-to-b from-amber-600 to-amber-800 text-stone-950 font-serif font-black text-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                              >
                                {isJoining ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
                                {order.members.length >= MAX_MEMBERS ? 'Llena' : isJoining ? 'Uniendo…' : 'Unirse'}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-1.5 border-t border-amber-900/40 text-[9px] font-mono text-stone-400">
                          <span className="text-amber-300 flex items-center gap-1">
                            <Trophy className="w-2.5 h-2.5" />
                            {order.trophies.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" />
                            {order.members.length}/{MAX_MEMBERS}
                          </span>
                          <span>{order.totalPower.toLocaleString()} PDR</span>
                          <span className="ml-auto">Nv. {order.level}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </ForgeMaskedSlider>
      </div>

      {/* MODAL: FUNDAR ORDEN */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
          <div className="wood-frame max-w-sm w-full p-4 rounded-2xl space-y-3 border-2 border-amber-600 shadow-2xl bg-[#1e0c05]">
            <div className="flex items-center justify-between pb-2 border-b border-amber-900/60">
              <div className="flex items-center gap-2 text-amber-200 font-serif font-black text-sm">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Fundar Nueva Orden</span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/50 border border-[#4a2211]">
              <button
                type="button"
                onClick={() => openEmblemPicker('new')}
                title="Elegir el emblema de la Orden"
                className="relative w-11 h-11 rounded-xl bg-black/70 border border-amber-500/70 p-1.5 shrink-0 cursor-pointer hover:border-amber-300 transition-colors active:scale-95"
              >
                <OrderEmblem emblem={encodeEmblem(newClanEmblem)} className="w-full h-full" />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border border-amber-200 flex items-center justify-center shadow">
                  <Palette className="w-2.5 h-2.5 text-stone-950" />
                </span>
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="px-1 rounded bg-amber-600 text-stone-950 font-black text-[9px] font-mono">
                    {newClanTag.trim().toUpperCase() || 'TAG'}
                  </span>
                  <span className="font-serif font-black text-xs text-[#fae59a] truncate">
                    {newClanName.trim() || 'Nombre de tu Orden'}
                  </span>
                </div>
                <p className="text-[9px] text-stone-400 italic truncate">
                  "{newClanMotto.trim() || 'Lema de la hermandad'}"
                </p>
                <p className="text-[8px] font-mono text-stone-500 mt-0.5">
                  Gran Maestre: {playProfile.gamerTag}
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateClanSubmit} className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-amber-200">Nombre de la Orden</label>
                <input
                  type="text"
                  maxLength={24}
                  value={newClanName}
                  onChange={(e) => {
                    setNewClanName(e.target.value);
                    setCreateError(null);
                  }}
                  placeholder="Ej: Orden del Fénix Helado"
                  required
                  className="w-full px-2.5 py-1.5 bg-black/80 border border-amber-600/70 rounded-lg text-xs text-amber-100 placeholder:text-stone-600 outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-amber-200">Etiqueta (3-5 caracteres)</label>
                <input
                  type="text"
                  maxLength={5}
                  value={newClanTag}
                  onChange={(e) => {
                    setNewClanTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                    setCreateError(null);
                  }}
                  placeholder="FENIX"
                  required
                  className="w-full px-2.5 py-1.5 bg-black/80 border border-amber-600/70 rounded-lg text-xs font-mono font-bold text-amber-100 placeholder:text-stone-600 outline-none focus:border-amber-400 uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-amber-200">Lema de la Orden</label>
                <input
                  type="text"
                  maxLength={60}
                  value={newClanMotto}
                  onChange={(e) => setNewClanMotto(e.target.value)}
                  placeholder="Ej: Del fuego y el hielo renace nuestro honor"
                  className="w-full px-2.5 py-1.5 bg-black/80 border border-amber-600/70 rounded-lg text-xs text-amber-100 placeholder:text-stone-600 outline-none focus:border-amber-400"
                />
              </div>

              {createError && (
                <p className="text-[10px] text-rose-300 flex items-start gap-1 leading-tight">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  {createError}
                </p>
              )}

              <div className="p-2.5 rounded-xl bg-black/60 border border-amber-900/60 flex items-center justify-between text-xs">
                <span className="text-stone-400">Coste de fundación</span>
                <span className="font-mono font-black text-amber-300">{ORDER_COST.toLocaleString()} Oro</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={gold < ORDER_COST || isCreating}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 text-stone-950 font-serif font-black text-xs shadow hover:scale-[1.02] active:scale-95 transition-transform cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                  {isCreating ? 'Fundando…' : 'Fundar en Icespear'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ICONOS DE LA ORDEN */}
      {showEmblemPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3">
          <div className="max-w-[340px] w-full max-h-[86vh] overflow-y-auto p-3.5 rounded-2xl space-y-3 border-2 border-amber-700/70 bg-[#1c0805] shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-amber-900/60">
              <div className="flex items-center gap-2 text-amber-200 font-serif font-black text-sm">
                <Palette className="w-4 h-4 text-amber-400" />
                <span>Iconos de la Orden</span>
              </div>
              <button
                onClick={() => setShowEmblemPicker(false)}
                aria-label="Cerrar"
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/50 border border-[#4a2211]">
              <OrderEmblem emblem={encodeEmblem(draftEmblem)} className="w-14 h-14 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="px-1 rounded bg-amber-600 text-stone-950 font-black text-[9px] font-mono">
                    {emblemTarget === 'new' ? newClanTag.trim().toUpperCase() || 'TAG' : clan?.tag || 'ORDEN'}
                  </span>
                  <span className="font-serif font-black text-xs text-[#fae59a] truncate">
                    {emblemTarget === 'new' ? newClanName.trim() || 'Nombre de tu Orden' : clan?.name || 'Tu Orden'}
                  </span>
                </div>
                <p className="text-[9px] text-stone-400 italic truncate">
                  {emblemTarget === 'new'
                    ? 'Así lucirá el estandarte de tu nueva Orden'
                    : 'Personaliza el estandarte de tu Orden'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-amber-200">Forma</p>
              <div className="grid grid-cols-5 gap-1.5">
                {SHAPES.map((shape) => {
                  const active = draftEmblem.shape === shape.id;
                  return (
                    <button
                      key={shape.id}
                      type="button"
                      title={shape.label}
                      onClick={() => {
                        sound.playSFX('click');
                        setDraftEmblem((prev) => ({ ...prev, shape: shape.id }));
                      }}
                      className={`h-[52px] rounded-lg flex flex-col items-center justify-center gap-0.5 border cursor-pointer transition-all active:scale-95 ${
                        active
                          ? 'bg-amber-600/25 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                          : 'bg-black/50 border-[#4a2211] hover:border-amber-600'
                      }`}
                    >
                      <OrderEmblem
                        emblem={encodeEmblem({ ...draftEmblem, shape: shape.id, palette: 'obsidian' })}
                        className="w-6 h-6"
                      />
                      <span className="text-[7.5px] font-mono text-stone-300 leading-none">{shape.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-amber-200">Color</p>
              <div className="grid grid-cols-8 gap-1.5">
                {PALETTES.map((palette) => {
                  const active = draftEmblem.palette === palette.id;
                  return (
                    <button
                      key={palette.id}
                      type="button"
                      title={palette.label}
                      onClick={() => {
                        sound.playSFX('click');
                        setDraftEmblem((prev) => ({ ...prev, palette: palette.id }));
                      }}
                      className={`h-7 rounded-full border cursor-pointer transition-all active:scale-90 ${
                        active ? 'border-amber-200 ring-2 ring-amber-400/70' : 'border-black/60 hover:border-amber-400'
                      }`}
                      style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-amber-200">Símbolo</p>
              <div className="grid grid-cols-5 gap-1.5 max-h-[38vh] overflow-y-auto pr-0.5">
                {SYMBOLS.map((symbol) => {
                  const Icon = symbol.icon;
                  const active = draftEmblem.symbol === symbol.id;
                  return (
                    <button
                      key={symbol.id}
                      type="button"
                      title={symbol.label}
                      onClick={() => {
                        sound.playSFX('click');
                        setDraftEmblem((prev) => ({ ...prev, symbol: symbol.id }));
                      }}
                      className={`h-9 rounded-lg flex items-center justify-center border cursor-pointer transition-all active:scale-95 ${
                        active
                          ? 'bg-amber-600/30 border-amber-400 text-amber-100'
                          : 'bg-black/50 border-[#4a2211] text-stone-400 hover:border-amber-600 hover:text-amber-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleApplyEmblem}
                className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 text-stone-950 font-serif font-black text-xs shadow hover:scale-[1.02] active:scale-95 transition-transform cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {emblemTarget === 'new' ? 'Usar este emblema' : 'Aplicar emblema'}
              </button>
              <button
                onClick={() => setShowEmblemPicker(false)}
                className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ABANDONO */}
      {showLeaveConfirm && clan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
          <div className="max-w-xs w-full p-4 rounded-2xl space-y-3 border-2 border-rose-700/70 bg-[#1c0805] shadow-2xl">
            <div className="flex items-center gap-2 text-rose-200 font-serif font-black text-sm">
              <LogOut className="w-4 h-4 text-rose-400" />
              Abandonar la Orden
            </div>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              Vas a salir de <strong className="text-amber-200">{clan.name}</strong> [{clan.tag}]. Tu plaza de{' '}
              <strong className="text-amber-200">{clan.members.find((m) => m.isPlayer)?.gamerTag || 'jugador'}</strong>{' '}
              se eliminará de la base de órdenes en GitHub.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleLeaveOrder}
                disabled={isLeaving}
                className="flex-1 py-2 rounded-lg bg-gradient-to-b from-rose-700 to-rose-900 border border-rose-500/60 text-rose-50 font-serif font-black text-xs hover:scale-[1.02] active:scale-95 transition-transform cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isLeaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                {isLeaving ? 'Saliendo…' : 'Confirmar salida'}
              </button>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
