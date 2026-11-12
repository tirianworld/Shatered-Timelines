import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { PatrolMission, Hero } from '../types/game';
import { PATROLS } from '../data/gameContent';
import { sound } from '../services/soundService';
import { Compass, Clock, CheckCircle, ShieldAlert, Award, X, ChevronRight } from 'lucide-react';

export const PatrolView: React.FC = () => {
  const { heroes, activePatrols, startPatrol, claimPatrol } = useGame();

  const [selectedPatrolForDispatch, setSelectedPatrolForDispatch] = useState<PatrolMission | null>(null);
  const [selectedHeroesForDispatch, setSelectedHeroesForDispatch] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleHeroSelection = (heroId: string) => {
    sound.playSFX('click');
    setSelectedHeroesForDispatch((prev) => {
      if (prev.includes(heroId)) {
        return prev.filter((id) => id !== heroId);
      }
      if (prev.length >= 3) return prev; // max 3 heroes per patrol
      return [...prev, heroId];
    });
  };

  const handleConfirmDispatch = () => {
    if (!selectedPatrolForDispatch || selectedHeroesForDispatch.length === 0) return;
    startPatrol(selectedPatrolForDispatch.id, selectedHeroesForDispatch);
    setSelectedPatrolForDispatch(null);
    setSelectedHeroesForDispatch([]);
  };

  return (
    <div className="relative w-full h-full flex-1 overflow-y-auto no-scrollbar text-stone-100 p-3 sm:p-5 space-y-5 pb-28 sm:pb-32 select-none">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity filter blur-sm pointer-events-none"
        style={{ backgroundImage: `url('/assets/backgrounds/fondo_quest.png')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-950/90 to-stone-950 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-semibold uppercase tracking-widest">
            Tablón de Expediciones
          </span>
          <h2 className="text-3xl font-serif font-black text-amber-100">Patrullas de Icespear</h2>
          <p className="text-xs sm:text-sm text-stone-400">
            Envía grupos de exploración a patrullar las tierras gélidas. Mientras cumplen sus misiones, recolectarán
            oro, cristales arcanos y materiales de herrería en tiempo real.
          </p>
        </div>

        {/* Patrols Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PATROLS.map((patrol) => {
            const active = activePatrols.find((p) => p.patrolId === patrol.id);
            const isCompleted = active && currentTime >= active.endTime;
            const remainingSeconds = active ? Math.max(0, Math.floor((active.endTime - currentTime) / 1000)) : 0;

            return (
              <div
                key={patrol.id}
                className={`relative rounded-2xl overflow-hidden border p-5 flex flex-col justify-between transition-all ${
                  active
                    ? 'bg-stone-900/95 border-amber-600/60 shadow-xl'
                    : 'bg-stone-900/80 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800">
                      {patrol.region}
                    </span>
                    <span className="text-xs font-mono text-stone-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-500" />
                      {patrol.durationSeconds}s
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-lg text-amber-200">{patrol.name}</h3>
                  <p className="text-xs text-stone-400 leading-relaxed">{patrol.description}</p>

                  {/* Rewards preview */}
                  <div className="flex items-center gap-4 py-2 border-y border-stone-800/80 text-xs font-mono">
                    <span className="text-amber-400 font-bold">+{patrol.rewards.gold} Oro</span>
                    <span className="text-cyan-400 font-bold flex items-center gap-1">
                      <img src="/assets/items/gema_del_recuerdo.png" alt="" className="w-3.5 h-3.5 object-contain inline" />
                      +{patrol.rewards.crystals} Cristales del Recuerdo
                    </span>
                    <span className="text-stone-300 font-bold">+{patrol.rewards.xp} XP</span>
                  </div>
                </div>

                {/* Status / Action Footer */}
                <div className="mt-4 pt-3">
                  {active ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-400 font-medium">
                          {isCompleted ? '¡Patrulla Completada!' : 'En Progreso...'}
                        </span>
                        <span className="font-mono font-bold text-amber-300">
                          {isCompleted ? 'Listo para reclamar' : `${remainingSeconds}s restantes`}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 rounded-full bg-stone-950 border border-stone-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-600 to-emerald-500 transition-all duration-1000"
                          style={{
                            width: `${
                              isCompleted
                                ? 100
                                : Math.min(
                                    100,
                                    ((patrol.durationSeconds - remainingSeconds) / patrol.durationSeconds) * 100
                                  )
                            }%`,
                          }}
                        />
                      </div>

                      {isCompleted && (
                        <button
                          onClick={() => claimPatrol(patrol.id)}
                          className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-stone-950 font-serif font-black text-xs shadow-lg cursor-pointer transition-all animate-bounce"
                        >
                          ¡Reclamar Recompensas!
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        sound.playSFX('click');
                        setSelectedPatrolForDispatch(patrol);
                        setSelectedHeroesForDispatch([]);
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-stone-800 to-stone-700 hover:from-stone-700 hover:to-stone-600 text-amber-200 border border-amber-600/40 font-serif font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <Compass className="w-4 h-4 text-emerald-400" />
                      <span>Despachar Exploradores</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dispatch Heroes Modal */}
      {selectedPatrolForDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedPatrolForDispatch(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-lg bg-stone-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif font-bold text-lg text-amber-200">
              Asignar Héroes para: {selectedPatrolForDispatch.name}
            </h3>
            <p className="text-xs text-stone-400">
              Selecciona hasta 3 héroes disponibles para esta misión ({selectedHeroesForDispatch.length}/3 elegidos).
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1">
              {heroes.map((hero) => {
                const isSelected = selectedHeroesForDispatch.includes(hero.id);
                const isBusy = hero.inPatrol;

                return (
                  <div
                    key={hero.id}
                    onClick={() => {
                      if (!isBusy) handleToggleHeroSelection(hero.id);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-950/70 border-amber-500 ring-2 ring-amber-500/40'
                        : isBusy
                        ? 'bg-stone-950/40 border-stone-800 opacity-40 cursor-not-allowed'
                        : 'bg-stone-950/70 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-stone-700 shrink-0 bg-black">
                      <img src={hero.portrait} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-serif font-bold text-xs text-amber-200 truncate">{hero.name}</div>
                      <div className="text-[10px] text-stone-400">Nvl. {hero.level}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-stone-800 flex justify-end gap-3">
              <button
                disabled={selectedHeroesForDispatch.length === 0}
                onClick={handleConfirmDispatch}
                className={`w-full py-2.5 rounded-xl font-serif font-bold text-xs shadow-lg transition-all ${
                  selectedHeroesForDispatch.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 cursor-pointer'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                }`}
              >
                Confirmar Despacho ({selectedHeroesForDispatch.length} Héroes)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
