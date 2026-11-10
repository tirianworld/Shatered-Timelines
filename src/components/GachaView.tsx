import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Hero, SummonBanner } from '../types/game';
import { BANNERS } from '../data/gameContent';
import { INITIAL_HEROES } from '../data/heroesData';
import { sound } from '../services/soundService';
import { launchConfetti } from '../utils/confetti';
import { Sparkles, Star, ChevronLeft, ChevronRight, HelpCircle, X, Shield, Swords } from 'lucide-react';

export const GachaView: React.FC = () => {
  const { astralShards, summon, addAstralShards } = useGame();

  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const currentBanner = BANNERS[activeBannerIndex];

  const [isSummoning, setIsSummoning] = useState(false);
  const [pullResults, setPullResults] = useState<{
    heroes: Hero[];
    duplicates: number;
    bonusCoins: number;
  } | null>(null);

  const [inspectingHero, setInspectingHero] = useState<Hero | null>(null);
  const [showRatesModal, setShowRatesModal] = useState(false);

  const featuredHeroes = currentBanner.featuredHeroIds
    .map((id) => INITIAL_HEROES.find((h) => h.id === id))
    .filter(Boolean) as Hero[];

  const handleSummon = (count: number) => {
    const cost = count === 1 ? currentBanner.costSingle : currentBanner.costMulti;
    if (astralShards < cost) {
      sound.playSFX('hurt');
      return;
    }

    setIsSummoning(true);
    sound.playSFX('gacha_pull');

    // Simulate cinematic tension
    setTimeout(() => {
      const result = summon(currentBanner.id, count);
      setIsSummoning(false);

      if (result.pulled.length > 0) {
        setPullResults({
          heroes: result.pulled,
          duplicates: result.duplicates,
          bonusCoins: result.bonusCoins,
        });

        // Check if any UR or SSR pulled
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

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'UR':
        return 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white border-amber-300 animate-pulse';
      case 'SSR':
        return 'bg-gradient-to-r from-amber-500 to-yellow-300 text-stone-950 font-black border-amber-200';
      case 'SR':
        return 'bg-purple-600 text-white border-purple-400';
      default:
        return 'bg-blue-600 text-white border-blue-400';
    }
  };

  return (
    <div className="relative w-full h-full flex-1 overflow-y-auto no-scrollbar text-stone-100 p-3 sm:p-5 space-y-5 pb-28 sm:pb-32 select-none">
      {/* Background Ambience */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity filter blur-sm pointer-events-none"
        style={{ backgroundImage: `url('${currentBanner.bannerImage}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/70 via-stone-950/90 to-stone-950 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        {/* Banner Navigation Switcher */}
        <div className="flex items-center justify-between bg-stone-900/90 border border-stone-800 rounded-xl p-2 backdrop-blur-md">
          <button
            onClick={() => {
              sound.playSFX('click');
              setActiveBannerIndex((prev) => (prev > 0 ? prev - 1 : BANNERS.length - 1));
            }}
            className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {BANNERS.map((banner, idx) => (
              <button
                key={banner.id}
                onClick={() => {
                  sound.playSFX('click');
                  setActiveBannerIndex(idx);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-serif font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeBannerIndex === idx
                    ? 'bg-amber-600 text-stone-950 shadow-md shadow-amber-900/50'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                {banner.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              sound.playSFX('click');
              setActiveBannerIndex((prev) => (prev < BANNERS.length - 1 ? prev + 1 : 0));
            }}
            className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 cursor-pointer transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Active Banner Showcase Card */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-amber-700/60 shadow-2xl bg-gradient-to-b from-stone-900/95 to-black">
          {/* Banner Hero Art Background */}
          <div
            className="h-64 sm:h-80 w-full bg-cover bg-center relative"
            style={{ backgroundImage: `url('${currentBanner.bannerImage}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

            <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold uppercase tracking-widest">
                  Estandarte Activo
                </span>
                <h2 className="text-2xl sm:text-4xl font-serif font-black text-amber-100 drop-shadow-md">
                  {currentBanner.name}
                </h2>
                <p className="text-xs sm:text-sm text-stone-300 max-w-lg mt-1 drop-shadow">
                  {currentBanner.description}
                </p>
              </div>

              <button
                onClick={() => setShowRatesModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-stone-900/80 border border-stone-700 text-stone-300 hover:text-amber-300 text-xs cursor-pointer backdrop-blur-sm"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Probabilidades</span>
              </button>
            </div>
          </div>

          {/* Featured Heroes Showcase Grid */}
          <div className="p-4 sm:p-6 bg-stone-950/90 border-t border-stone-800 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Personajes Destacados con Probabilidad Aumentada
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {featuredHeroes.map((hero) => (
                <div
                  key={hero.id}
                  onClick={() => {
                    sound.playSFX('click');
                    setInspectingHero(hero);
                  }}
                  className="group relative bg-stone-900/80 rounded-xl border border-stone-800 hover:border-amber-500/60 p-3 flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-amber-600/50 shrink-0 bg-black">
                    <img
                      src={hero.portrait}
                      alt={hero.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/portraits/Aeliana.png';
                      }}
                    />
                    <span
                      className={`absolute top-0 left-0 px-1 text-[9px] font-black rounded-br border ${getRarityBadgeColor(
                        hero.rarity
                      )}`}
                    >
                      {hero.rarity}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="font-serif font-bold text-xs text-amber-200 truncate">{hero.name}</h4>
                    <p className="text-[10px] text-stone-400 truncate">{hero.title}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-400">
                      {Array.from({ length: hero.stars }).map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pull Buttons Area */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-800/80">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400">Cristales del Recuerdo:</span>
                <span className="font-mono font-bold text-cyan-300 text-sm flex items-center gap-1.5">
                  <img src="/assets/items/gema_del_recuerdo.png" alt="Cristal del Recuerdo" className="w-4 h-4 object-contain inline" />
                  {astralShards.toLocaleString()}
                </span>
                {astralShards < 100 && (
                  <button
                    onClick={() => {
                      addAstralShards(500);
                      sound.playSFX('coin');
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 cursor-pointer"
                  >
                    + Recargar Muestra
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* 1x Summon */}
                <button
                  disabled={isSummoning || astralShards < currentBanner.costSingle}
                  onClick={() => handleSummon(1)}
                  className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-serif font-bold text-sm border flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                    astralShards >= currentBanner.costSingle && !isSummoning
                      ? 'bg-gradient-to-r from-stone-800 to-stone-700 hover:from-stone-700 hover:to-stone-600 text-amber-200 border-amber-600/50 hover:scale-105 active:scale-95'
                      : 'bg-stone-900 border-stone-800 text-stone-600 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Invocar x1</span>
                  <span className="text-xs font-mono text-cyan-300 flex items-center gap-1">
                    <img src="/assets/items/gema_del_recuerdo.png" alt="" className="w-3.5 h-3.5 object-contain inline" />
                    ({currentBanner.costSingle})
                  </span>
                </button>

                {/* 10x Summon */}
                <button
                  disabled={isSummoning || astralShards < currentBanner.costMulti}
                  onClick={() => handleSummon(10)}
                  className={`flex-1 sm:flex-none px-8 py-3 rounded-xl font-serif font-black text-sm border flex items-center justify-center gap-2 shadow-xl shadow-amber-950/60 transition-all cursor-pointer ${
                    astralShards >= currentBanner.costMulti && !isSummoning
                      ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 border-amber-300 hover:scale-105 active:scale-95 animate-pulse'
                      : 'bg-stone-900 border-stone-800 text-stone-600 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-stone-950 fill-stone-950" />
                  <span>Invocación x10</span>
                  <span className="text-xs font-mono font-bold flex items-center gap-1">
                    <img src="/assets/items/gema_del_recuerdo.png" alt="" className="w-3.5 h-3.5 object-contain inline" />
                    ({currentBanner.costMulti})
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summoning Cinematic Animation Overlay */}
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

      {/* Pull Results Modal */}
      {pullResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-stone-900 border-2 border-amber-600/80 rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative my-8">
            <div className="text-center space-y-1">
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">Resultado del Rito</span>
              <h3 className="text-2xl sm:text-3xl font-serif font-black text-amber-100">
                ¡Nuevos Aliados Despiertos!
              </h3>
              {pullResults.duplicates > 0 && (
                <p className="text-xs text-stone-400">
                  {pullResults.duplicates} duplicados convertidos en fragmentos estelares (+{pullResults.bonusCoins} Fragmentos Astrales).
                </p>
              )}
            </div>

            {/* Grid of pulled heroes */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-h-[55vh] overflow-y-auto p-1">
              {pullResults.heroes.map((hero, idx) => (
                <div
                  key={`${hero.id}_${idx}`}
                  onClick={() => {
                    sound.playSFX('click');
                    setInspectingHero(hero);
                  }}
                  className={`relative rounded-xl overflow-hidden border p-2 flex flex-col items-center text-center cursor-pointer transition-all hover:scale-105 ${
                    hero.rarity === 'UR'
                      ? 'bg-gradient-to-b from-red-950 to-stone-900 border-red-500 shadow-lg shadow-red-950/60'
                      : hero.rarity === 'SSR'
                      ? 'bg-gradient-to-b from-amber-950 to-stone-900 border-amber-500 shadow-md shadow-amber-950/50'
                      : 'bg-stone-850 border-stone-700'
                  }`}
                >
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded border mb-1.5 ${getRarityBadgeColor(
                      hero.rarity
                    )}`}
                  >
                    {hero.rarity}
                  </span>

                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-stone-700 mb-2 bg-black">
                    <img
                      src={hero.portrait}
                      alt={hero.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/portraits/Aeliana.png';
                      }}
                    />
                  </div>

                  <h5 className="font-serif font-bold text-xs text-amber-200 truncate w-full">{hero.name}</h5>
                  <span className="text-[10px] text-stone-400 truncate">{hero.heroClass}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
              <button
                onClick={() => setPullResults(null)}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-serif font-bold text-sm cursor-pointer transition-colors shadow-lg"
              >
                Aceptar y Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Hero Detail Modal */}
      {inspectingHero && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-stone-900 border border-amber-600/70 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setInspectingHero(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-lg bg-stone-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-amber-500 shadow-md bg-black shrink-0">
                <img
                  src={inspectingHero.portrait}
                  alt={inspectingHero.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/portraits/Aeliana.png';
                  }}
                />
              </div>

              <div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${getRarityBadgeColor(inspectingHero.rarity)}`}>
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

      {/* Probabilities / Rates Modal */}
      {showRatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowRatesModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-lg bg-stone-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif font-bold text-lg text-amber-200">Tasas de Aparición (Gacha)</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-red-950/40 border border-red-900 text-red-200">
                <span className="font-bold">UR (Ultra Raro)</span>
                <span className="font-mono font-bold">{(currentBanner.dropRates.UR * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-amber-950/40 border border-amber-900 text-amber-200">
                <span className="font-bold">SSR (Súper Raro)</span>
                <span className="font-mono font-bold">{(currentBanner.dropRates.SSR * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-purple-950/40 border border-purple-900 text-purple-200">
                <span className="font-bold">SR (Raro Épico)</span>
                <span className="font-mono font-bold">{(currentBanner.dropRates.SR * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-blue-950/40 border border-blue-900 text-blue-200">
                <span className="font-bold">R (Común)</span>
                <span className="font-mono font-bold">{(currentBanner.dropRates.R * 100).toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-[11px] text-stone-400">
              Al obtener un héroe duplicado, se promueve su nivel de estrellas y se otorgan Fragmentos Astrales para la tienda.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
