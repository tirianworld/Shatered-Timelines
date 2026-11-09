import React from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { Swords, Sparkles, Compass, Shield, Coins, Flame, ChevronRight, Trophy, FlaskConical } from 'lucide-react';

export const CampView: React.FC = () => {
  const {
    gold,
    summonCrystals,
    heroes,
    team,
    setCurrentTab,
    idleEarningsAvailable,
    claimIdleEarnings,
  } = useGame();

  const activeHeroes = team
    .map((id) => heroes.find((h) => h.id === id))
    .filter(Boolean);

  const totalTeamPower = activeHeroes.reduce(
    (acc, h) => acc + (h ? h.stats.attack + h.stats.defense + Math.round(h.stats.hp / 5) : 0),
    0
  );

  return (
    <div className="relative min-h-[calc(100vh-100px)] text-stone-100">
      {/* Background Graphic */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity filter blur-[1px] pointer-events-none"
        style={{ backgroundImage: `url('/assets/backgrounds/taverna_fondo.png')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Banner / Welcome Header */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-900/50 bg-gradient-to-r from-stone-900/90 via-stone-900/80 to-red-950/60 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Bastión de la Guardia Helada</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-amber-100 tracking-tight">
              Campamento de Icespear
            </h2>
            <p className="text-sm text-stone-300 leading-relaxed">
              Los vientos aulladores del norte golpean las almenas. Reúne a los campeones de las casas nobles,
              despierta los cristales de invocación astral y defiende la frontera de las monstruosidades que acechan en la nieve.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={() => {
                  sound.playSFX('click');
                  setCurrentTab('combat');
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-red-950/60 border border-red-500/40 cursor-pointer transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Swords className="w-4 h-4" />
                <span>Entrar en Combate</span>
              </button>

              <button
                onClick={() => {
                  sound.playSFX('click');
                  setCurrentTab('gacha');
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-stone-800 to-stone-700 hover:bg-stone-700 text-amber-200 font-semibold text-sm border border-amber-500/30 cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Invocar Héroes</span>
              </button>
            </div>
          </div>

          {/* Quick Idle Chest widget */}
          <div className="mt-6 sm:mt-0 sm:absolute sm:right-6 sm:top-1/2 sm:-translate-y-1/2 bg-stone-950/80 border border-amber-700/40 rounded-xl p-4 text-center max-w-xs w-full shadow-xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2">
              <Coins className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Tributo de la Ciudad</h4>
            <div className="text-xl font-mono font-bold text-amber-300 my-1">
              +{idleEarningsAvailable} <span className="text-xs text-stone-400">Oro</span>
            </div>
            <button
              disabled={idleEarningsAvailable <= 0}
              onClick={() => claimIdleEarnings()}
              className={`w-full py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                idleEarningsAvailable > 0
                  ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow-md shadow-amber-900/40 cursor-pointer'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              {idleEarningsAvailable > 0 ? '¡Reclamar Oro!' : 'Acumulando...'}
            </button>
          </div>
        </div>

        {/* Current Active Team Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <h3 className="text-xl font-serif font-bold text-stone-200">Escuadrón de Vanguardia</h3>
              <span className="text-xs text-stone-400 font-mono">
                (Poder Total: <span className="text-amber-300 font-bold">{totalTeamPower}</span>)
              </span>
            </div>

            <button
              onClick={() => {
                sound.playSFX('click');
                setCurrentTab('heroes');
              }}
              className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 cursor-pointer transition-all"
            >
              <span>Gestionar Formación</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((slotIdx) => {
              const heroId = team[slotIdx];
              const hero = heroes.find((h) => h.id === heroId);
              const posTitles = ['Posición 1: Vanguardia', 'Posición 2: Asalto', 'Posición 3: Apoyo', 'Posición 4: Retaguardia'];

              return (
                <div
                  key={slotIdx}
                  onClick={() => {
                    sound.playSFX('click');
                    setCurrentTab('heroes');
                  }}
                  className={`group relative overflow-hidden rounded-xl border p-4 transition-all cursor-pointer ${
                    hero
                      ? 'bg-stone-900/90 border-amber-900/60 hover:border-amber-500/60 hover:bg-stone-850 shadow-lg'
                      : 'bg-stone-950/60 border-stone-800/80 border-dashed hover:border-stone-700'
                  }`}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2">
                    {posTitles[slotIdx]}
                  </div>

                  {hero ? (
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-amber-600/60 bg-stone-950 shrink-0">
                        <img
                          src={hero.portrait}
                          alt={hero.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/portraits/aeliana.png';
                          }}
                        />
                        <span
                          className={`absolute bottom-0 right-0 px-1 text-[9px] font-black rounded-tl ${
                            hero.rarity === 'UR'
                              ? 'bg-red-600 text-white'
                              : hero.rarity === 'SSR'
                              ? 'bg-amber-500 text-black'
                              : 'bg-purple-600 text-white'
                          }`}
                        >
                          {hero.rarity}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-serif font-bold text-sm text-amber-200 truncate">{hero.name}</h4>
                        <p className="text-[11px] text-stone-400 truncate">{hero.heroClass} &bull; {hero.attribute}</p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-stone-300">
                          <span>Nvl. {hero.level}</span>
                          <span className="text-red-400 font-semibold">{hero.stats.hp} HP</span>
                          <span className="text-amber-400 font-semibold">{hero.stats.attack} ATK</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-xs text-stone-500">Ranura vacía</p>
                      <span className="text-[11px] text-amber-400/80 group-hover:underline">+ Asignar Héroe</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Nav Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            onClick={() => {
              sound.playSFX('click');
              setCurrentTab('patrol');
            }}
            className="group relative overflow-hidden rounded-xl border border-stone-800 bg-stone-900/80 p-5 hover:border-amber-600/50 hover:bg-stone-850 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-stone-200 group-hover:text-amber-300 transition-colors">
                  Expediciones & Patrullas
                </h4>
                <p className="text-xs text-stone-400">Envía héroes a patrullar por botín pasivo y minerales.</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => {
              sound.playSFX('click');
              setCurrentTab('tavern');
            }}
            className="group relative overflow-hidden rounded-xl border border-stone-800 bg-stone-900/80 p-5 hover:border-amber-600/50 hover:bg-stone-850 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-950/60 border border-amber-700/50 flex items-center justify-center text-amber-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-stone-200 group-hover:text-amber-300 transition-colors">
                  Taberna & Ganzúas
                </h4>
                <p className="text-xs text-stone-400">Charla con aventureros, bebe hidromiel y fuerza cerraduras.</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => {
              sound.playSFX('click');
              setCurrentTab('forge');
            }}
            className="group relative overflow-hidden rounded-xl border border-stone-800 bg-stone-900/80 p-5 hover:border-amber-600/50 hover:bg-stone-850 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-950/60 border border-red-700/50 flex items-center justify-center text-red-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-stone-200 group-hover:text-amber-300 transition-colors">
                  Herrería de Acero Gélido
                </h4>
                <p className="text-xs text-stone-400">Forja espadas, corazas y anillos legendarios.</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => {
              sound.playSFX('skill');
              setCurrentTab('potions');
            }}
            className="group relative overflow-hidden rounded-xl border border-stone-800 bg-stone-900/80 p-5 hover:border-emerald-600/50 hover:bg-stone-850 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-stone-200 group-hover:text-emerald-300 transition-colors">
                  Botica & Laboratorio de Pociones
                </h4>
                <p className="text-xs text-stone-400">Destila elixires de vida, frascos de éter y brebajes de Raxxar.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
