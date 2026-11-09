import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { clanService } from '../services/clanService';
import { playGames } from '../services/playGamesService';
import { ClanData, ClanPerk } from '../types/clan';
import { sound } from '../services/soundService';
import { launchConfetti } from '../utils/confetti';
import {
  Users,
  Swords,
  Sparkles,
  Trophy,
  Shield,
  PlusCircle,
  Coins,
  Flame,
  Award,
  CheckCircle2,
  AlertCircle,
  LogOut,
  X,
} from 'lucide-react';
import { ForgeMaskedSlider } from './ForgeMaskedSlider';

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

export const OrderClanView: React.FC = () => {
  const {
    gold,
    addGold,
    playerName,
  } = useGame();

  const [clan, setClan] = useState<ClanData | null>(clanService.getCurrentClan());
  const [allClans, setAllClans] = useState<ClanData[]>(clanService.getAllClans());
  const [activeTab, setActiveTab] = useState<'members' | 'perks' | 'leaderboard' | 'explore'>('members');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Play Games Profile
  const [playProfile, setPlayProfile] = useState(playGames.getProfile());

  // Creation form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClanName, setNewClanName] = useState('');
  const [newClanTag, setNewClanTag] = useState('');
  const [newClanMotto, setNewClanMotto] = useState('');

  useEffect(() => {
    const unsubClan = clanService.subscribe((updated) => {
      setClan(updated);
      setAllClans(clanService.getAllClans());
    });
    const unsubProfile = playGames.subscribeToProfile((prof) => {
      setPlayProfile(prof);
    });

    return () => {
      unsubClan();
      unsubProfile();
    };
  }, []);

  // Donation handler
  const handleDonate = (amount: number) => {
    if (gold < amount) {
      sound.playSFX('hurt');
      setStatusMessage({ type: 'error', text: `Oro insuficiente. Necesitas ${amount.toLocaleString()} Oro para donar.` });
      return;
    }

    addGold(-amount);
    const res = clanService.donateGold(amount);
    if (res.success) {
      launchConfetti();
      playGames.updateProgress('ach_wealthy', gold);
      setStatusMessage({
        type: 'success',
        text: `Donacion completada. +${res.earnedClanXp} XP para la Orden y +${res.earnedPlayGamesXp} XP de Play Games.`,
      });
    }
  };

  // Upgrade Clan Perk
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
        text: `Bendicion mejorada a Nivel ${perk.level + 1}. Toda la orden recibe ${perk.bonusText}.`,
      });
    }
  };

  // Create clan
  const handleCreateClanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClanName.trim() || !newClanTag.trim()) {
      setStatusMessage({ type: 'error', text: 'Por favor ingresa un nombre y etiqueta validos.' });
      return;
    }

    const cost = 10000;
    if (gold < cost) {
      sound.playSFX('hurt');
      setStatusMessage({ type: 'error', text: `Fundar una Orden requiere ${cost.toLocaleString()} Oro.` });
      return;
    }

    addGold(-cost);
    const created = clanService.createClan(newClanName.trim(), newClanTag.trim(), newClanMotto.trim(), '/assets/items/Recurso 287@4x.png');
    setShowCreateModal(false);
    launchConfetti();
    setStatusMessage({
      type: 'success',
      text: `La Orden "${created.name}" [${created.tag}] ha sido fundada exitosamente en la Sede de las Cumbres.`,
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#120502] select-none text-stone-100">
      {/* 1. HERO HEADER: THE LODGE BUILDING ARTWORK */}
      <div className="relative w-full h-[150px] shrink-0 overflow-hidden border-b-2 border-[#451f10] shadow-2xl">
        <img
          src="/assets/aistudio/image_6578a593.png"
          alt="Sede de la Orden de Icespear"
          className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
        />
        {/* Warm Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#120502] via-[#120502]/60 to-transparent" />

        {/* Top Status: Trophies */}
        {clan && (
          <div className="absolute top-2 right-3 z-10">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/90 border border-amber-600/70 shadow-lg">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-mono font-black text-amber-200">
                {clan.trophies.toLocaleString()} Trofeos
              </span>
            </div>
          </div>
        )}

        {/* Clan Name and Motto Info */}
        <div className="absolute bottom-2 left-3 right-3 z-10 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-amber-600 text-stone-950 font-black text-[9px] font-mono">
                {clan?.tag || 'ORDEN'}
              </span>
              <h2 className="font-serif font-black text-sm sm:text-base text-[#fae59a] truncate drop-shadow-md">
                {clan?.name || 'Sede de la Orden de Icespear'}
              </h2>
            </div>
            <p className="text-[10px] text-stone-300 italic truncate max-w-[280px]">
              "{clan?.motto || 'Unidos bajo el manto helado de las cumbres'}"
            </p>
          </div>

          {clan && (
            <div className="text-right shrink-0">
              <div className="text-[10px] font-bold text-amber-300 font-mono">
                Nivel de Orden {clan.level}
              </div>
              <div className="w-20 h-1.5 bg-black/80 rounded-full border border-amber-900/60 overflow-hidden mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full"
                  style={{ width: `${Math.min(100, (clan.xp / clan.xpToNextLevel) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="px-3 pt-2 pb-1.5 bg-[#180904] border-b border-[#3d1a0b] flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
        {[
          { key: 'members', label: 'Hermandad', badge: clan?.members.length },
          { key: 'perks', label: 'Bendiciones' },
          { key: 'leaderboard', label: 'Ranking' },
          { key: 'explore', label: 'Órdenes' },
        ].map(({ key, label, badge }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => {
                sound.playSFX('click');
                setActiveTab(key as any);
              }}
              className={`flex-1 min-w-[70px] h-[34px] rounded-lg relative flex items-center justify-center gap-1.5 px-2 cursor-pointer transition-all active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-b from-[#f59f42] to-[#db7c1e] border border-[#f8b465] shadow-[0_0_12px_rgba(245,158,11,0.5)] z-10'
                  : 'bg-[#251007] border border-[#4a2211] text-[#a89b91] hover:text-stone-200'
              }`}
            >
              <span className={`text-[11px] sm:text-[12px] font-serif whitespace-nowrap ${isActive ? 'font-black text-[#1c0800]' : 'font-bold'}`}>
                {label}
              </span>
              {badge !== undefined && (
                <span className={`text-[8px] px-1.5 rounded-full font-mono font-bold ${isActive ? 'bg-[#1c0800] text-amber-400' : 'bg-black/60 text-stone-300'}`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. STATUS MESSAGE TOAST */}
      {statusMessage && (
        <div
          className={`mx-3 mt-2 px-3 py-1.5 text-xs flex items-center justify-between gap-2 rounded-lg border shrink-0 animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/60'
              : statusMessage.type === 'info'
              ? 'bg-sky-950/90 text-sky-200 border-sky-700/60'
              : 'bg-rose-950/90 text-rose-200 border-rose-700/60'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : statusMessage.type === 'info' ? (
              <Shield className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            )}
            <span className="leading-tight text-[11px] truncate">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-stone-400 hover:text-white cursor-pointer p-0.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. MAIN CONTENT TABS */}
      <div className="flex-1 min-h-0 w-full relative overflow-hidden bg-[#120502]">
        <ForgeMaskedSlider className="w-full h-full" contentClassName="p-3 space-y-3">
          {/* NO CLAN PROMPT FOR GUILD TABS */}
          {!clan && (activeTab === 'members' || activeTab === 'perks') && (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-[#522510] bg-black/40 space-y-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-b from-amber-600/30 to-amber-950/60 border-2 border-amber-500/60 flex items-center justify-center mx-auto text-amber-300">
                <Shield className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-black text-sm text-[#fae59a]">
                  No Perteneces a Ninguna Orden
                </h3>
                <p className="text-xs text-stone-300 max-w-xs mx-auto leading-relaxed">
                  Funda tu propia hermandad en la sede de Icespear o explora órdenes disponibles vinculadas a Google Play Games.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-stone-950 font-serif font-black text-xs shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                >
                  Fundar Nueva Orden (10,000 Oro)
                </button>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#240e06] border border-[#5a2e16] text-[#fae59a] font-serif font-bold text-xs hover:border-amber-400 active:scale-95 transition-transform cursor-pointer"
                >
                  Explorar Órdenes
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: HERMANDAD Y MIEMBROS */}
          {activeTab === 'members' && clan && (
            <div className="space-y-3">
              {/* Daily Donation Banner */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#240e06] to-[#1a0803] border border-[#5a2e16] shadow-lg flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-serif font-black text-[#fae59a]">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Donación a la Hermandad</span>
                  </div>
                  <p className="text-[10px] text-stone-300">
                    Aporta oro para ganar XP de Clan y Google Play Games XP.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleDonate(1000)}
                    className="relative px-2.5 py-1.5 rounded-lg bg-gradient-to-b from-amber-600 to-amber-800 border border-amber-500 font-serif font-black text-xs text-stone-950 shadow hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  >
                    1,000 Oro
                  </button>
                  <button
                    onClick={() => handleDonate(5000)}
                    className="relative px-2.5 py-1.5 rounded-lg bg-gradient-to-b from-amber-500 to-amber-700 border border-amber-400 font-serif font-black text-xs text-stone-950 shadow hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  >
                    5,000 Oro
                  </button>
                </div>
              </div>

              {/* Members List Header */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-serif font-black text-[#fae59a]">
                  Miembros de la Orden ({clan.members.length}/30)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Sincronizado con Play Games
                </span>
              </div>

              {/* Members Grid/List */}
              <div className="space-y-2">
                {clan.members.map((member) => (
                  <div
                    key={member.playerId}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 shadow-md transition-all ${
                      member.isPlayer
                        ? 'bg-[#2b1307] border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'bg-[#190a04] border-[#441f0f]'
                    }`}
                  >
                    {/* Avatar & Member Tag */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-10 h-10 rounded-full border border-amber-500/60 overflow-hidden bg-black/60 shrink-0">
                        <img
                          src={member.avatarUrl}
                          alt={member.gamerTag}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/assets/portraits/edacorn icono.png';
                          }}
                        />
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs text-stone-100 truncate">
                            {member.gamerTag}
                          </span>
                          {member.isPlayer && (
                            <span className="px-1 py-0.2 rounded bg-amber-500 text-stone-950 font-black text-[8px]">
                              TU
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[9px] text-stone-400 font-mono">
                          <span className="text-amber-300 font-bold">{member.role}</span>
                          <span>•</span>
                          <span className="text-stone-300 font-bold">
                            Nv.{member.playGamesLevel}
                          </span>
                          <span>•</span>
                          <span>{member.lastActive}</span>
                        </div>
                      </div>
                    </div>

                    {/* Member Stats */}
                    <div className="text-right shrink-0 font-mono space-y-0.5">
                      <div className="text-[11px] font-black text-amber-200">
                        {member.squadPower.toLocaleString()} <span className="text-[9px] text-amber-500">PDR</span>
                      </div>
                      <div className="text-[9px] text-stone-400">
                        +{member.contributionXp.toLocaleString()} XP Clan
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clan Activity Feed */}
              <div className="pt-2 space-y-1.5">
                <span className="text-xs font-serif font-black text-[#fae59a]">
                  Registro de Hazañas de la Orden
                </span>
                <div className="p-2.5 rounded-xl bg-black/40 border border-[#3b190a] space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
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
            </div>
          )}

          {/* TAB 2: BENDICIONES Y VENTAJAS DE LA ORDEN */}
          {activeTab === 'perks' && clan && (
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-[#240e06] border border-amber-800/80 space-y-0.5">
                <h3 className="font-serif font-black text-[#fae59a] text-xs">
                  Bendiciones de la Sede de Icespear
                </h3>
                <p className="text-[10px] text-stone-400">
                  Las mejoras activas aumentan las estadísticas de todos los miembros de la hermandad.
                </p>
              </div>

              <div className="space-y-2">
                {clan.perks.map((perk) => {
                  const canAfford = gold >= perk.upgradeCostGold;
                  const isMax = perk.level >= perk.maxLevel;

                  return (
                    <div
                      key={perk.id}
                      className="p-3 rounded-xl bg-[#1a0a04] border border-[#4a2211] flex items-center justify-between gap-3 shadow-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-black/60 border border-amber-600/60 flex items-center justify-center shrink-0">
                          {renderPerkIcon(perk.id)}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-black text-xs text-[#fae59a] truncate">
                              {perk.name}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 border border-amber-600/50 text-amber-300 font-bold">
                              Nv.{perk.level}/{perk.maxLevel}
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-300 font-bold text-emerald-400">
                            {perk.bonusText}
                          </p>
                          <p className="text-[9px] text-stone-400 line-clamp-1">
                            {perk.description}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isMax ? (
                          <span className="text-[10px] font-bold text-amber-400 px-2.5 py-1 rounded bg-black/60 border border-amber-500/40">
                            Máximo
                          </span>
                        ) : (
                          <button
                            onClick={() => handleUpgradePerk(perk)}
                            disabled={!canAfford}
                            className={`px-3 py-1.5 rounded-lg font-serif font-black text-[10px] shadow transition-transform active:scale-95 cursor-pointer flex flex-col items-center ${
                              canAfford
                                ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-stone-950 hover:scale-105'
                                : 'bg-stone-900 text-stone-500 border border-stone-800 opacity-60 cursor-not-allowed'
                            }`}
                          >
                            <span>Mejorar</span>
                            <span className="font-mono text-[9px]">{perk.upgradeCostGold.toLocaleString()} Oro</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: RANKING DE CLANES */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-3">
              {/* Leaderboard Table */}
              {allClans.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-xl border border-dashed border-[#441f0f] bg-black/40 space-y-2">
                  <Trophy className="w-8 h-8 text-amber-600/60 mx-auto" />
                  <p className="text-xs text-amber-200 font-bold">No hay órdenes registradas en los marcadores todavía.</p>
                  <p className="text-[11px] text-stone-400">
                    Funda la primera orden de Icespear para liderar la clasificación global.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allClans.map((cl, idx) => {
                    const rank = idx + 1;
                    const isUserClan = clan?.id === cl.id;

                    return (
                      <div
                        key={cl.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 shadow-md ${
                          isUserClan
                            ? 'bg-[#2d1205] border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                            : 'bg-[#180903] border-[#3f1c0d]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Rank Badge */}
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-serif font-black text-xs shrink-0 ${
                              rank === 1
                                ? 'bg-yellow-500 text-stone-950 shadow-[0_0_8px_gold]'
                                : rank === 2
                                ? 'bg-slate-300 text-stone-950'
                                : rank === 3
                                ? 'bg-amber-700 text-stone-100'
                                : 'bg-black/60 text-stone-400'
                            }`}
                          >
                            {rank}
                          </div>

                          {/* Emblem */}
                          <div className="w-9 h-9 rounded-lg bg-black/60 border border-amber-600/40 p-1 shrink-0 flex items-center justify-center">
                            <img
                              src={cl.emblem}
                              alt=""
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/assets/items/Recurso 287@4x.png';
                              }}
                            />
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-serif font-black text-xs text-[#fae59a] truncate">
                                {cl.name}
                              </span>
                              <span className="px-1 py-0.2 rounded bg-amber-600/40 text-amber-300 font-mono text-[8px] font-bold">
                                [{cl.tag}]
                              </span>
                              {isUserClan && (
                                <span className="px-1 py-0.2 rounded bg-amber-500 text-stone-950 font-black text-[8px]">
                                  TU ORDEN
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] text-stone-400 font-mono">
                              Líder: <strong className="text-stone-300">{cl.leaderGamerTag}</strong> • Nivel {cl.level}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 font-mono space-y-0.5">
                          <div className="text-xs font-black text-amber-300 flex items-center justify-end gap-1">
                            <Trophy className="w-3 h-3 text-amber-400" />
                            <span>{cl.trophies.toLocaleString()}</span>
                          </div>
                          <div className="text-[9px] text-stone-400">
                            {cl.totalPower.toLocaleString()} PDR
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EXPLORAR / FUNDAR ORDEN */}
          {activeTab === 'explore' && (
            <div className="space-y-3">
              {/* Actions Header */}
              <div className="p-3 rounded-xl bg-[#200c05] border border-[#522510] flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-black text-xs text-[#fae59a]">
                    Explorador de Órdenes y Hermandades
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    Únete a un clan existente o funda el tuyo en la sede.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-b from-amber-500 to-amber-700 text-stone-950 font-serif font-black text-xs flex items-center gap-1 hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Fundar Orden</span>
                </button>
              </div>

              {/* All Clans list */}
              {allClans.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-xl border border-dashed border-[#441f0f] bg-black/40 space-y-3">
                  <Shield className="w-8 h-8 text-amber-600/60 mx-auto" />
                  <p className="text-xs text-amber-200 font-bold">No hay órdenes creadas en este momento.</p>
                  <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                    Sé el primer Gran Maestre de Icespear y funda la primera hermandad de héroes.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-stone-950 font-serif font-black text-xs shadow hover:scale-105 active:scale-95 transition-transform cursor-pointer mx-auto"
                  >
                    Fundar Primera Orden
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {allClans.map((c) => {
                    const isCurrent = clan?.id === c.id;

                    return (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl bg-[#190a04] border border-[#441f0f] flex items-center justify-between gap-3 shadow-md"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-black/60 border border-amber-600/40 p-1 flex items-center justify-center shrink-0">
                            <img
                              src={c.emblem}
                              alt=""
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/assets/items/Recurso 287@4x.png';
                              }}
                            />
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-serif font-black text-xs text-[#fae59a] truncate">
                                {c.name}
                              </span>
                              <span className="px-1 py-0.2 rounded bg-amber-600/40 text-amber-300 font-mono text-[8px] font-bold">
                                [{c.tag}]
                              </span>
                            </div>
                            <p className="text-[10px] text-stone-400 italic line-clamp-1">
                              "{c.motto}"
                            </p>
                            <div className="text-[9px] text-stone-400 font-mono flex items-center gap-2">
                              <span>Nivel {c.level}</span>
                              <span>•</span>
                              <span className="text-amber-300">{c.totalPower.toLocaleString()} Poder</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isCurrent ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-serif font-black text-[10px]">
                                Orden Actual
                              </span>
                              <button
                                onClick={() => {
                                  if (confirm('¿Estás seguro de abandonar tu orden actual?')) {
                                    clanService.leaveClan();
                                    setStatusMessage({ type: 'info', text: 'Has abandonado la Orden.' });
                                  }
                                }}
                                className="text-[9px] text-rose-400 hover:text-rose-300 cursor-pointer flex items-center gap-0.5"
                              >
                                <LogOut className="w-2.5 h-2.5" />
                                <span>Salir</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                const ok = clanService.joinClan(c.id);
                                if (ok) {
                                  setStatusMessage({
                                    type: 'success',
                                    text: `Te has unido a ${c.name} [${c.tag}] con tu perfil de Google Play Games.`,
                                  });
                                  setActiveTab('members');
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-b from-amber-600 to-amber-800 text-stone-950 font-serif font-black text-xs hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow"
                            >
                              Unirse
                            </button>
                          )}
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

      {/* CREATE CLAN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
          <div className="wood-frame max-w-sm w-full p-4.5 rounded-2xl space-y-4 border-2 border-amber-600 shadow-2xl bg-[#1e0c05]">
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

            <form onSubmit={handleCreateClanSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-amber-200">Nombre de la Orden:</label>
                <input
                  type="text"
                  maxLength={24}
                  value={newClanName}
                  onChange={(e) => setNewClanName(e.target.value)}
                  placeholder="Ej: Orden del Fénix Helado"
                  required
                  className="w-full px-2.5 py-1.5 bg-black/80 border border-amber-600/70 rounded-lg text-xs text-amber-100 placeholder:text-stone-600 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-amber-200">Etiqueta (3-5 Letras):</label>
                <input
                  type="text"
                  maxLength={5}
                  value={newClanTag}
                  onChange={(e) => setNewClanTag(e.target.value.toUpperCase())}
                  placeholder="Ej: FENIX"
                  required
                  className="w-full px-2.5 py-1.5 bg-black/80 border border-amber-600/70 rounded-lg text-xs font-mono font-bold text-amber-100 placeholder:text-stone-600 outline-none uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-amber-200">Lema de la Orden:</label>
                <input
                  type="text"
                  maxLength={60}
                  value={newClanMotto}
                  onChange={(e) => setNewClanMotto(e.target.value)}
                  placeholder="Ej: Del fuego y el hielo renace nuestro honor"
                  className="w-full px-2.5 py-1.5 bg-black/80 border border-amber-600/70 rounded-lg text-xs text-amber-100 placeholder:text-stone-600 outline-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-black/60 border border-amber-900/60 flex items-center justify-between text-xs">
                <span className="text-stone-400">Coste de Fundación:</span>
                <span className="font-mono font-black text-amber-300">10,000 Oro</span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={gold < 10000}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 text-stone-950 font-serif font-black text-xs shadow hover:scale-102 active:scale-95 transition-transform cursor-pointer disabled:opacity-50"
                >
                  Fundar en Icespear
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
    </div>
  );
};
