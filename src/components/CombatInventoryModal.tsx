import React, { useState } from 'react';
import { useGame, ShelfItem } from '../context/GameContext';
import { sound } from '../services/soundService';
import {
  X,
  Sparkles,
  Utensils,
} from 'lucide-react';
import {
  ActiveCombatFoodBuff,
  CombatConsumableDefinition,
  getCombatConsumableDefinition,
} from '../types/combatConsumables';

interface CombatInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFoodBuff: ActiveCombatFoodBuff | null;
  onApplyFoodBuff: (item: ShelfItem, def: CombatConsumableDefinition) => { stolenByBoss?: boolean; bossName?: string } | void;
}

export const CombatInventoryModal: React.FC<CombatInventoryModalProps> = ({
  isOpen,
  onClose,
  activeFoodBuff,
  onApplyFoodBuff,
}) => {
  const { shelfInventory, inventory, consumeShelfItem, addShelfItem } = useGame();
  const [selectedItem, setSelectedItem] = useState<ShelfItem | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter ONLY consumable items (Food, Potions, Elixirs, etc.)
  // Consolidating items from shelfInventory + inventory
  // Exclude all XP potions/items and any estofado
  const isConsumable = (it: { category?: string; name: string; id: string; type?: string }) => {
    const l = `${it.id} ${it.name}`.toLowerCase();
    if (
      l.includes('xp') ||
      l.includes('exp') ||
      l.includes('experiencia') ||
      l.includes('estofado') ||
      Boolean((it as any).effect?.xpAmount)
    ) {
      return false;
    }
    if (it.category === 'food') return true;
    if (it.type === 'consumable') return true;
    return (
      l.includes('ramen') ||
      l.includes('pizza') ||
      l.includes('hamburguesa') ||
      l.includes('pan') ||
      l.includes('quesarito') ||
      l.includes('kebab') ||
      l.includes('tortilla') ||
      l.includes('arepa') ||
      l.includes('mcbites') ||
      l.includes('tortita') ||
      l.includes('sushi') ||
      l.includes('dorito') ||
      l.includes('pocion') ||
      l.includes('poción') ||
      l.includes('elixir') ||
      l.includes('comida')
    );
  };

  const shelfConsumables = shelfInventory.filter(isConsumable);

  // If there are consumables in normal inventory not in shelfInventory, adapt them
  const extraConsumables: ShelfItem[] = inventory
    .filter(isConsumable)
    .filter((inv) => !shelfConsumables.some((sh) => sh.id === inv.id || sh.name === inv.name))
    .map((inv) => ({
      id: inv.id,
      name: inv.name,
      category: 'food',
      count: inv.count,
      icon: inv.icon,
      rarity: inv.rarity || 'SR',
      description: inv.description,
      priceGold: 150,
    }));

  const allConsumables = [...shelfConsumables, ...extraConsumables];

  // 4 Shelves matching standard Inventory layout
  const SHELF_ROWS = [0, 1, 2, 3];
  const SLOTS_PER_ROW = 5;

  const handleUseFoodInBattle = (item: ShelfItem) => {
    const def = getCombatConsumableDefinition(item.id, item.name);
    sound.playSFX('powerup');
    sound.playSFX('coin');

    // Apply the buff & effects in combat
    const result = onApplyFoodBuff(item, def);

    // Consume 1 unit from inventory
    consumeShelfItem(item.id);

    if (result && result.stolenByBoss) {
      setActionNotice(`¡${item.name} consumido... pero ${result.bossName || 'el Jefe'} se lo zampó de un bocado! 🍖`);
    } else {
      setActionNotice(`¡${item.name} consumido! Efecto [${def.foodEffectBadge}] activado.`);
    }
    setSelectedItem(null);
    setTimeout(() => {
      setActionNotice(null);
      onClose();
    }, 1100);
  };

  const handleGrantEmergencyRations = () => {
    sound.playSFX('coin');
    addShelfItem({
      id: 'food_hamburguesa',
      name: 'Hamburguesa Artesanal',
      category: 'food',
      count: 3,
      icon: '/assets/items/hamburguesa.png',
      rarity: 'SR',
      description: 'Hamburguesa de las colinas de Icespear. Otorga +25% Ataque Total en combate.',
    });
    addShelfItem({
      id: 'food_pizza',
      name: 'Pizza Fundida',
      category: 'food',
      count: 3,
      icon: '/assets/items/pizza.png',
      rarity: 'SR',
      description: 'Queso fundido al horno de leña. Otorga +30% Defensa y Escudo Protector de 30 PV.',
    });
    addShelfItem({
      id: 'food_ramen',
      name: 'Ramen Humeante',
      category: 'food',
      count: 3,
      icon: '/assets/items/ramen.png',
      rarity: 'SR',
      description: 'Caldo caliente y reconfortante. Restaura 40 PV y regenera +8 PV por turno.',
    });
    addShelfItem({
      id: 'food_pan_ajo',
      name: 'Panes de Ajo Dorados',
      category: 'food',
      count: 4,
      icon: '/assets/items/panes_de_ajo.png',
      rarity: 'R',
      description: 'Crujientes con ajo y mantequilla. Otorga +2 Cargas Definitivas al instante.',
    });
    setActionNotice('¡Raciones de combate añadidas a tus estanterías!');
    setTimeout(() => setActionNotice(null), 2000);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-start select-none bg-[#1d0b04] overflow-hidden animate-fade-in">
      {/* Background: Exact same vertical wood planks as main inventory */}
      <img
        src="/assets/backgrounds/fondo inventario app.png"
        alt="Fondo Estanterías"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0 brightness-90 contrast-105"
      />

      {/* Subtle vignette darkening towards bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/80 pointer-events-none z-0" />

      {/* Floating Action Notice Banner */}
      {actionNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gradient-to-r from-amber-900/95 via-yellow-700/95 to-amber-900/95 border-2 border-yellow-400 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.6)] text-white text-xs sm:text-sm font-black flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Header: Single Wood Hanging Sign for Consumables */}
      <div className="relative z-20 w-full pt-1 px-3 flex items-start justify-between pointer-events-auto">
        {/* Left Spacer for symmetry */}
        <div className="w-9" />

        {/* Center: Single hanging wooden sign (identical to InventoryView) */}
        <div className="flex flex-col items-center">
          <div className="relative w-[68px] h-[86px] sm:w-[74px] sm:h-[94px] flex items-center justify-center">
            {/* Hanging sign asset with chains */}
            <img
              src="/assets/items/cartel shop.png"
              alt="Consumibles"
              className="w-full h-full object-contain pointer-events-none filter drop-shadow-[0_6px_8px_rgba(0,0,0,0.85)] brightness-105"
            />
            {/* Category Emblem inside lower square carved box */}
            <div className="absolute bottom-3 sm:bottom-3.5 inset-x-0 flex items-center justify-center pointer-events-none">
              <img
                src="/assets/items/hamburguesa.png"
                alt="Comida"
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] brightness-110"
              />
            </div>
          </div>
          <span className="mt-1 font-serif font-black text-[11px] sm:text-[12px] text-amber-200 tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,1)] bg-[#240b04]/85 px-3 py-0.5 rounded-full border border-amber-500/60">
            Consumibles
          </span>
        </div>

        {/* Top-Right Close Button: Returns directly to combat */}
        <button
          onClick={() => {
            sound.playSFX('click');
            onClose();
          }}
          className="mt-2 w-9 h-9 rounded-full bg-gradient-to-b from-[#7f1d1d] to-[#450a0a] hover:from-[#991b1b] hover:to-[#570a0a] border-2 border-amber-500/80 text-amber-200 flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer z-30"
          title="Volver al combate"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Active Food Buff Banner */}
      <div className="relative z-20 w-full px-3 mt-1.5 flex justify-center">
        {activeFoodBuff ? (
          <div className="w-full max-w-[370px] bg-gradient-to-r from-amber-950/95 via-[#451a03]/95 to-amber-950/95 border-2 border-amber-400/90 rounded-xl px-3 py-1.5 flex items-center justify-between shadow-[0_0_15px_rgba(245,158,11,0.45)] backdrop-blur-xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-7 h-7 shrink-0 rounded-full bg-black/60 border border-amber-300 p-0.5 flex items-center justify-center">
                <img
                  src={activeFoodBuff.icon}
                  alt={activeFoodBuff.name}
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-300 leading-none flex items-center gap-1">
                  <span>Plato Activo</span>
                  <span className="text-[9px] px-1 py-0.2 bg-amber-500 text-stone-950 font-black rounded">
                    {activeFoodBuff.foodEffectBadge}
                  </span>
                </span>
                <span className="text-[11px] font-bold text-stone-200 truncate leading-tight">
                  {activeFoodBuff.name}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0 pl-2">
              <span className="text-[9px] text-amber-400 font-mono font-bold block">
                {activeFoodBuff.shieldHp ? `Escudo: ${activeFoodBuff.shieldHp} PV` : 'Activo todo el combate'}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[370px] bg-[#220c04]/80 border border-amber-700/50 rounded-xl px-3 py-1 flex items-center justify-center gap-2 text-center text-[10px] text-amber-200/90">
            <Utensils className="w-3.5 h-3.5 text-amber-400" />
            <span>Sin ración activa: ¡Elige una provisión para potenciar al equipo en combate!</span>
          </div>
        )}
      </div>

      {/* 4 Wooden Shelves: Matching InventoryView geometry */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-start pt-6 sm:pt-8 overflow-hidden pointer-events-auto">
        {SHELF_ROWS.map((rowIndex) => {
          const shelfStartIndex = rowIndex * SLOTS_PER_ROW;
          const shelfItems = allConsumables.slice(shelfStartIndex, shelfStartIndex + SLOTS_PER_ROW);
          const hasItemsOnShelf = shelfItems.length > 0;

          return (
            <div
              key={rowIndex}
              className="relative w-full mb-8 sm:mb-9 flex flex-col items-center overflow-visible"
            >
              {/* If items exist on this shelf, render their wooden plates and item sprites */}
              {hasItemsOnShelf ? (
                <div className="absolute bottom-[58px] sm:bottom-[64px] inset-x-0 w-full px-2 sm:px-3 flex items-end justify-between z-10 pointer-events-auto">
                  {Array.from({ length: SLOTS_PER_ROW }).map((_, slotIdx) => {
                    const item = shelfItems[slotIdx];
                    if (!item) {
                      return <div key={slotIdx} className="flex-1 max-w-[70px] h-[56px]" />;
                    }

                    const isCurrentlyActive = activeFoodBuff?.id === item.id;

                    return (
                      <div
                        key={slotIdx}
                        className="relative flex-1 flex flex-col items-center justify-end max-w-[72px]"
                      >
                        {/* Round wooden plate resting directly on the top surface plane */}
                        <div className="relative w-[62px] sm:w-[68px] aspect-[1/0.46] flex items-center justify-center">
                          <img
                            src="/assets/items/base item app.png"
                            alt=""
                            className="w-full h-full object-contain pointer-events-none filter drop-shadow-[0_3px_4px_rgba(0,0,0,0.85)]"
                          />
                        </div>

                        {/* Active Food Aura Glow */}
                        {isCurrentlyActive && (
                          <div className="absolute -bottom-1 inset-x-0 mx-auto w-12 h-6 rounded-full bg-amber-400/40 blur-xs animate-pulse pointer-events-none" />
                        )}

                        {/* Item seated upright on the plate */}
                        <button
                          onClick={() => {
                            sound.playSFX('click');
                            setSelectedItem(item);
                          }}
                          className={`absolute bottom-2.5 sm:bottom-3 inset-x-0 mx-auto w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center group cursor-pointer transition-transform hover:scale-115 active:scale-95 z-10 ${
                            isCurrentlyActive ? 'brightness-110 drop-shadow-[0_0_10px_#f59e0b]' : ''
                          }`}
                          title={`${item.name} (${item.count})`}
                        >
                          <img
                            src={item.icon}
                            alt={item.name}
                            className="w-full h-full object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] group-hover:brightness-110"
                          />
                        </button>

                        {/* Active Badge on top */}
                        {isCurrentlyActive && (
                          <span className="absolute -top-2 inset-x-0 mx-auto w-max px-1 py-0.2 bg-amber-500 text-stone-950 text-[7px] font-black uppercase tracking-tight rounded shadow z-30 animate-bounce">
                            ACTIVO
                          </span>
                        )}

                        {/* Quantity Number positioned at bottom right of plate */}
                        <span className="absolute bottom-0 right-0 sm:right-0.5 text-xs sm:text-[13px] font-black font-sans text-white leading-none tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,1)] pointer-events-none select-none z-20">
                          {item.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Wooden Shelf Plank: adjusted 15% to the left (-40% translate) matching InventoryView */}
              <div className="relative z-0 w-[126%] left-1/2 -translate-x-[40%] max-w-none h-[103px] sm:h-[113px]">
                <img
                  src="/assets/items/baldas.png"
                  alt="Estantería"
                  className="w-full h-full object-fill pointer-events-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.95)]"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State Banner if player has 0 consumables */}
      {allConsumables.length === 0 && (
        <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center text-center px-4 py-3 bg-[#240c04]/95 border-2 border-amber-600/80 rounded-2xl shadow-2xl max-w-[280px] pointer-events-auto backdrop-blur-xs">
          <Utensils className="w-7 h-7 text-amber-400 mb-1 drop-shadow" />
          <span className="font-serif font-black text-amber-200 text-sm">Sin Comida de Combate</span>
          <p className="text-[11px] text-stone-300 mt-1 leading-snug">
            No tienes platos en la mochila. Puedes solicitar una cesta de provisiones para tus héroes en combate.
          </p>
          <button
            onClick={handleGrantEmergencyRations}
            className="mt-3 px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-lg border border-amber-300 cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-stone-950" />
            <span>Recibir Raciones de Combate</span>
          </button>
        </div>
      )}

      {/* Bottom Bar: Back to Combat */}
      <div className="relative z-20 w-full p-2.5 bg-[#140602]/90 border-t border-amber-900/60 flex items-center justify-between">
        <span className="text-[10px] text-stone-400">
          En mochila: <strong className="text-amber-300">{allConsumables.length}</strong> tipos de consumibles
        </span>
        <button
          onClick={() => {
            sound.playSFX('click');
            onClose();
          }}
          className="px-4 py-1.5 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-stone-100 font-bold text-xs rounded-lg border border-amber-500/60 cursor-pointer active:scale-95 transition-all shadow"
        >
          Volver al Combate
        </button>
      </div>

      {/* Item Detail & Action Inspector Modal */}
      {selectedItem && (() => {
        const def = getCombatConsumableDefinition(selectedItem.id, selectedItem.name);
        const isCurrentlyActive = activeFoodBuff?.id === selectedItem.id;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 select-none animate-fade-in">
            <div className="wood-frame max-w-sm w-full p-5 rounded-2xl space-y-3.5 border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)] relative bg-[#180703]">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-2 border-b border-amber-900/60">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-950 border border-amber-600 text-amber-300 text-[10px] font-black rounded uppercase">
                    {selectedItem.rarity || 'SR'}
                  </span>
                  <span className="font-serif font-black text-amber-200 text-sm truncate max-w-[200px]">
                    {selectedItem.name}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Item Showcase Card */}
              <div className="bg-[#100502] border border-amber-800/40 rounded-xl p-3.5 flex flex-col items-center space-y-2.5">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <img
                    src="/assets/items/base item app.png"
                    alt=""
                    className="absolute bottom-0 w-22 object-contain pointer-events-none"
                  />
                  <img
                    src={selectedItem.icon}
                    alt={selectedItem.name}
                    className="w-16 h-16 object-contain relative z-10 filter drop-shadow-xl"
                  />
                </div>

                <div className="text-center space-y-1">
                  <div className="text-xs text-amber-400 font-bold">
                    Disponibles: <span className="text-white font-mono">{selectedItem.count}</span> unidades
                  </div>
                </div>

                {/* Effect Banner Card */}
                <div className="w-full p-2.5 rounded-xl bg-gradient-to-b from-[#2d1204] to-[#1a0802] border-2 border-amber-500/80 shadow-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>Efecto de Banquete</span>
                    </span>
                    <span className="px-2 py-0.5 bg-amber-500 text-stone-950 text-[10px] font-black rounded uppercase">
                      {def.foodEffectBadge}
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-xs text-amber-100 mb-1">
                    {def.foodEffectTitle}
                  </h4>
                  <p className="text-[11px] text-stone-300 leading-snug">
                    {def.detailedEffect}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => handleUseFoodInBattle(selectedItem)}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-xs sm:text-sm rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.5)] border border-amber-200 cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-wider"
                >
                  <Utensils className="w-4 h-4 text-stone-950" />
                  <span>
                    {isCurrentlyActive ? 'Renovar Banquete (1)' : 'Comer / Usar en Combate (1)'}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-full py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
