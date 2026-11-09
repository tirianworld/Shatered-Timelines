import React, { useState } from 'react';
import { useGame, ShelfItem } from '../context/GameContext';
import { sound } from '../services/soundService';
import { Sparkles, Coins, X, Check, RotateCcw, ShoppingBag } from 'lucide-react';

export type { ShelfItem };

type CategoryId = 'materials' | 'food' | 'tools' | 'cards' | 'equipment';

interface CategoryConfig {
  id: CategoryId;
  name: string;
  iconSrc: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'materials',
    name: 'Materiales & Piedras',
    iconSrc: '/assets/items/escamas_de_cryovain.png',
  },
  {
    id: 'food',
    name: 'Comida & Consumibles',
    iconSrc: '/assets/items/hamburguesa.png',
  },
  {
    id: 'tools',
    name: 'Herramientas & Forja',
    iconSrc: '/assets/items/kit de herreria app.png',
  },
  {
    id: 'cards',
    name: 'Cartas & Grimorios',
    iconSrc: '/assets/items/Cartas Tribunal app.png',
  },
  {
    id: 'equipment',
    name: 'Equipo & Anillos',
    iconSrc: '/assets/items/anillo del incrustado.png',
  },
];

export const InventoryView: React.FC = () => {
  const { shelfInventory, consumeShelfItem, sellShelfItem, resetInventory, navigateTo } = useGame();
  const [activeCategory, setActiveCategory] = useState<CategoryId>('materials');
  const [selectedItem, setSelectedItem] = useState<ShelfItem | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filter items for the active category directly from persistent shelfInventory
  const categoryItems = shelfInventory.filter((it) => it.category === activeCategory);

  // 4 Shelves exactly positioned
  const SHELF_ROWS = [0, 1, 2, 3];
  const SLOTS_PER_ROW = 5;

  const handleUseItem = (item: ShelfItem) => {
    const success = consumeShelfItem(item.id);
    if (success) {
      setActionNotice(`¡Has consumido 1x ${item.name}! (+${item.effectValue || 150} EXP al equipo)`);
      setTimeout(() => setActionNotice(null), 2500);
      setSelectedItem(null);
    }
  };

  const handleSellItem = (item: ShelfItem) => {
    const success = sellShelfItem(item.id);
    if (success) {
      setActionNotice(`¡Has vendido 1x ${item.name} por +${item.priceGold} Oro!`);
      setTimeout(() => setActionNotice(null), 2500);
      setSelectedItem(null);
    }
  };

  const handleResetInventory = () => {
    resetInventory();
    setSelectedItem(null);
    setActionNotice('¡Inventario reiniciado a 0!');
    setTimeout(() => setActionNotice(null), 2500);
  };

  return (
    <div className="relative w-full h-full flex-1 flex flex-col justify-start overflow-hidden select-none bg-[#1d0b04]">
      {/* Background: Vertical Wood Planks covering the entire screen */}
      <img
        src="/assets/backgrounds/fondo inventario app.png"
        alt="Fondo Inventario"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none z-0"
      />

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#341206]/95 border-2 border-amber-400 text-amber-200 px-4 py-1.5 rounded-xl text-xs font-bold shadow-2xl animate-fade-in pointer-events-none flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Header Row: 5 Hanging Signs hanging straight down from the ceiling border */}
      <div className="relative z-20 w-full px-2 sm:px-3 -mt-3.5 sm:-mt-4 flex items-start justify-around">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                sound.playSFX('click');
                setActiveCategory(cat.id);
              }}
              className={`group relative flex flex-col items-center cursor-pointer transition-all duration-150 ${
                isActive
                  ? 'translate-y-2 scale-105 drop-shadow-[0_6px_10px_rgba(251,191,36,0.65)]'
                  : 'opacity-90 hover:opacity-100 hover:translate-y-0.5 drop-shadow-[0_3px_5px_rgba(0,0,0,0.8)]'
              }`}
              title={cat.name}
            >
              {/* Hanging Wood Sign Sprite - 2x wider and tucked into top border */}
              <div className="relative w-[68px] h-[86px] sm:w-[74px] sm:h-[94px] flex items-center justify-center">
                <img
                  src="/assets/items/cartel shop.png"
                  alt={cat.name}
                  className="w-full h-full object-contain"
                />
                {/* Category Emblem inside the lower square carved box */}
                <div className="absolute bottom-3 sm:bottom-3.5 inset-x-0 flex items-center justify-center pointer-events-none">
                  <img
                    src={cat.iconSrc}
                    alt={cat.name}
                    className={`w-9 h-9 sm:w-10 sm:h-10 object-contain filter ${
                      isActive
                        ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] brightness-110'
                        : 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]'
                    }`}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 4 Shelves Section - 25% larger, symmetrical legs visible, corners hidden, plates resting on top */}
      <div className="relative z-10 w-full flex-1 flex flex-col justify-start pt-10 sm:pt-12 overflow-hidden pointer-events-auto">
        {SHELF_ROWS.map((rowIndex) => {
          // 5 items per shelf
          const shelfStartIndex = rowIndex * SLOTS_PER_ROW;
          const shelfItems = categoryItems.slice(shelfStartIndex, shelfStartIndex + SLOTS_PER_ROW);
          const hasItemsOnShelf = shelfItems.length > 0;

          return (
            <div
              key={rowIndex}
              className="relative w-full mb-8 sm:mb-9 flex flex-col items-center overflow-visible"
            >
              {/* If items exist on this shelf, render their plates resting on the top plane, item sprites, and counts */}
              {hasItemsOnShelf ? (
                <div className="absolute bottom-[58px] sm:bottom-[64px] inset-x-0 w-full px-2 sm:px-3 flex items-end justify-between z-10 pointer-events-auto">
                  {Array.from({ length: SLOTS_PER_ROW }).map((_, slotIdx) => {
                    const item = shelfItems[slotIdx];
                    if (!item) {
                      return <div key={slotIdx} className="flex-1 max-w-[70px] h-[56px]" />;
                    }

                    return (
                      <div
                        key={slotIdx}
                        className="relative flex-1 flex flex-col items-center justify-end max-w-[72px]"
                      >
                        {/* Round wooden plate resting directly on the top surface plane of the shelf */}
                        <div className="relative w-[62px] sm:w-[68px] aspect-[1/0.46] flex items-center justify-center">
                          <img
                            src="/assets/items/base item app.png"
                            alt=""
                            className="w-full h-full object-contain pointer-events-none filter drop-shadow-[0_3px_4px_rgba(0,0,0,0.85)]"
                          />
                        </div>

                        {/* Item seated upright on the plate */}
                        <button
                          onClick={() => {
                            sound.playSFX('click');
                            setSelectedItem(item);
                          }}
                          className="absolute bottom-2.5 sm:bottom-3 inset-x-0 mx-auto w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center group cursor-pointer transition-transform hover:scale-115 active:scale-95 z-10"
                          title={`${item.name} (${item.count})`}
                        >
                          <img
                            src={item.icon}
                            alt={item.name}
                            className="w-full h-full object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] group-hover:brightness-110"
                          />
                        </button>

                        {/* Quantity Number positioned at bottom right of plate */}
                        <span className="absolute bottom-0 right-0 sm:right-0.5 text-xs sm:text-[13px] font-black font-sans text-white leading-none tracking-tight drop-shadow-[0_2px_2px_rgba(0,0,0,1)] pointer-events-none select-none z-20">
                          {item.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Wooden Shelf Plank: adjusted 15% to the left (-40% translate) */}
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

      {/* Empty State Banner when whole inventory is empty */}
      {shelfInventory.length === 0 && (
        <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center text-center px-4 py-3 bg-[#240c04]/95 border-2 border-amber-600/80 rounded-2xl shadow-2xl max-w-[280px] pointer-events-auto backdrop-blur-xs">
          <ShoppingBag className="w-7 h-7 text-amber-400 mb-1 drop-shadow" />
          <span className="font-serif font-black text-amber-200 text-sm">Estanterías Vacías</span>
          <p className="text-[11px] text-stone-300 mt-1 leading-snug">
            Los artículos y lotes que compres en la Tienda se colocarán automáticamente aquí.
          </p>
          <button
            onClick={() => {
              sound.playSFX('click');
              navigateTo('shop');
            }}
            className="mt-3 px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-lg border border-amber-300 cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Ir a la Tienda</span>
          </button>
        </div>
      )}

      {/* Empty State Banner when category is empty but items exist in other tabs */}
      {shelfInventory.length > 0 && categoryItems.length === 0 && (
        <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center text-center px-4 py-2.5 bg-[#240c04]/90 border border-amber-700/70 rounded-xl shadow-xl max-w-[250px] pointer-events-auto">
          <span className="font-serif font-bold text-amber-200 text-xs">Sin artículos en esta sección</span>
          <button
            onClick={() => {
              sound.playSFX('click');
              navigateTo('shop');
            }}
            className="mt-2 px-3 py-1 bg-amber-700/70 hover:bg-amber-600 text-amber-100 text-[10px] font-bold rounded-lg border border-amber-500/50 cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
          >
            <ShoppingBag className="w-3 h-3 text-amber-300" />
            <span>Comprar en Tienda</span>
          </button>
        </div>
      )}

      {/* Manual Reset button at bottom right corner */}
      <div className="absolute bottom-2 right-2 z-20 pointer-events-auto">
        <button
          onClick={() => {
            sound.playSFX('click');
            handleResetInventory();
          }}
          title="Reiniciar Inventario"
          className="px-2.5 py-1 bg-[#240d05]/90 hover:bg-[#3d1608] border border-amber-700/60 rounded-lg text-amber-300 text-[10px] font-bold flex items-center gap-1 shadow-md cursor-pointer active:scale-95 transition-all"
        >
          <RotateCcw className="w-3 h-3 text-amber-400" />
          <span>Resetear</span>
        </button>
      </div>

      {/* Item Detail & Action Inspector Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 select-none animate-fade-in">
          <div className="wood-frame max-w-sm w-full p-5 rounded-2xl space-y-4 border-2 border-amber-700 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-amber-900/60">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-950 border border-amber-600 text-amber-300 text-[10px] font-black rounded uppercase">
                  {selectedItem.rarity}
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
            <div className="bg-[#120602] border border-amber-800/40 rounded-xl p-4 flex flex-col items-center space-y-3">
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
                  En Mochila: <span className="text-white font-mono">{selectedItem.count}</span> unidades
                </div>
                <p className="text-[11px] text-stone-300 leading-relaxed px-2">
                  {selectedItem.description}
                </p>
              </div>

              {selectedItem.effectValue && (
                <div className="px-3 py-1 bg-emerald-950/70 border border-emerald-600/50 rounded text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Efecto: +{selectedItem.effectValue} EXP al Héroe</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              {selectedItem.category === 'food' && (
                <button
                  onClick={() => handleUseItem(selectedItem)}
                  className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-black font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Consumir (1)</span>
                </button>
              )}

              <button
                onClick={() => handleSellItem(selectedItem)}
                className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-md border border-amber-300 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Coins className="w-4 h-4 text-stone-900" />
                <span>Vender x1 (+{selectedItem.priceGold} Oro)</span>
              </button>
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="w-full py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
