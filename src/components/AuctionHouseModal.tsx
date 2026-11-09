import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { launchConfetti } from '../utils/confetti';
import {
  RefreshCw,
  Search,
  ShoppingBag,
  PackagePlus,
  History,
  CheckCircle2,
  AlertCircle,
  Tag,
  X,
} from 'lucide-react';
import { ForgeMaskedSlider } from './ForgeMaskedSlider';

export interface AuctionListing {
  id: string;
  sellerId: string;
  sellerName: string;
  item: {
    id: string;
    name: string;
    icon: string;
    category: 'materials' | 'food' | 'tools' | 'cards' | 'equipment';
    rarity: 'R' | 'SR' | 'SSR' | 'UR';
    count: number;
    description: string;
    stats?: Record<string, number>;
  };
  price: number;
  mode: 'buyout' | 'auction';
  status: 'active' | 'sold' | 'cancelled';
  buyerName?: string | null;
  buyerId?: string | null;
  claimedBySeller?: boolean;
  createdAt: number;
  soldAt?: number;
}

interface AuctionHouseModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const AuctionHouseModal: React.FC<AuctionHouseModalProps> = ({ isOpen, onClose }) => {
  const {
    gold,
    addGold,
    playerName,
    shelfInventory,
    addShelfItem,
    removeShelfItem,
    goBack,
  } = useGame();

  const [activeTab, setActiveTab] = useState<'browse' | 'sell' | 'my_listings'>('browse');
  const [auctions, setAuctions] = useState<AuctionListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selling state
  const [selectedItemToSell, setSelectedItemToSell] = useState<any | null>(null);
  const [sellCount, setSellCount] = useState<number>(1);
  const [sellPrice, setSellPrice] = useState<number>(250);

  // Fetch live auctions from server / GitHub
  const fetchAuctions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auctions');
      const data = await res.json();
      if (data.success && Array.isArray(data.auctions)) {
        setAuctions(data.auctions);
      }
    } catch (err: any) {
      console.error('Error al cargar subastas:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Real-time synchronization
  useEffect(() => {
    if (!isOpen) return;

    fetchAuctions();
    setStatusMessage(null);

    const pollInterval = setInterval(() => {
      fetch('/api/auctions')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && Array.isArray(data.auctions)) {
            setAuctions(data.auctions);
          }
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isOpen, fetchAuctions]);

  if (!isOpen) return null;

  // Handle buying an auction item (one-time purchase per unit)
  const handleBuy = async (auction: AuctionListing) => {
    if (auction.status !== 'active') {
      setStatusMessage({ type: 'error', text: '¡Este lote ya ha sido adquirido por otro jugador!' });
      return;
    }

    if (auction.sellerName.toLowerCase() === playerName.toLowerCase()) {
      setStatusMessage({ type: 'error', text: 'No puedes comprar tu propio lote.' });
      return;
    }

    if (gold < auction.price) {
      sound.playSFX('hurt');
      setStatusMessage({ type: 'error', text: `¡Oro insuficiente! Necesitas ${auction.price.toLocaleString()} Oro.` });
      return;
    }

    setIsSubmitting(true);
    sound.playSFX('click');

    try {
      const res = await fetch('/api/auctions/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionId: auction.id,
          buyerId: playerName,
          buyerName: playerName,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        sound.playSFX('hurt');
        setStatusMessage({
          type: 'error',
          text: data.error || 'Error al procesar la compra en la casa de subastas.',
        });
        await fetchAuctions();
        return;
      }

      // Deduct gold
      addGold(-auction.price);

      // Add item to player inventory
      addShelfItem({
        id: data.item.id,
        name: data.item.name,
        category: data.item.category,
        count: data.item.count || 1,
        icon: data.item.icon,
        rarity: data.item.rarity,
        description: data.item.description,
        priceGold: Math.round(auction.price * 0.7),
      });

      sound.playSFX('coin');
      launchConfetti();

      setStatusMessage({
        type: 'success',
        text: `¡Comprado con éxito! Has adquirido ${data.item.name} (${data.item.count || 1}x) por ${auction.price.toLocaleString()} Oro.`,
      });

      await fetchAuctions();
    } catch (err: any) {
      sound.playSFX('hurt');
      setStatusMessage({ type: 'error', text: err.message || 'Error de conexión con el servidor.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle putting an item up for sale
  const handleCreateListing = async () => {
    if (!selectedItemToSell) {
      setStatusMessage({ type: 'error', text: 'Selecciona un objeto de tu inventario para vender.' });
      return;
    }

    if (sellPrice < 1) {
      setStatusMessage({ type: 'error', text: 'El precio debe ser al menos 1 Oro.' });
      return;
    }

    if (sellCount < 1 || sellCount > selectedItemToSell.count) {
      setStatusMessage({ type: 'error', text: 'Cantidad inválida para poner en subasta.' });
      return;
    }

    setIsSubmitting(true);
    sound.playSFX('click');

    const removed = removeShelfItem(selectedItemToSell.id, sellCount);
    if (!removed) {
      setIsSubmitting(false);
      setStatusMessage({ type: 'error', text: 'No dispones de suficientes unidades en tu inventario.' });
      return;
    }

    try {
      const res = await fetch('/api/auctions/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: playerName,
          sellerName: playerName,
          item: {
            id: selectedItemToSell.id,
            name: selectedItemToSell.name,
            icon: selectedItemToSell.icon,
            category: selectedItemToSell.category,
            rarity: selectedItemToSell.rarity,
            count: sellCount,
            description: selectedItemToSell.description,
          },
          price: sellPrice,
          mode: 'buyout',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        addShelfItem({
          id: selectedItemToSell.id,
          name: selectedItemToSell.name,
          category: selectedItemToSell.category,
          count: sellCount,
          icon: selectedItemToSell.icon,
          rarity: selectedItemToSell.rarity,
          description: selectedItemToSell.description,
        });

        sound.playSFX('hurt');
        setStatusMessage({ type: 'error', text: data.error || 'Error al guardar en la casa de subastas.' });
        return;
      }

      sound.playSFX('coin');
      launchConfetti();
      setStatusMessage({
        type: 'success',
        text: `¡Lote publicado! "${selectedItemToSell.name}" (${sellCount}x) está ahora disponible en la Casa de Subastas.`,
      });

      setSelectedItemToSell(null);
      setSellCount(1);
      setSellPrice(250);
      await fetchAuctions();
      setActiveTab('my_listings');
    } catch (err: any) {
      addShelfItem({
        id: selectedItemToSell.id,
        name: selectedItemToSell.name,
        category: selectedItemToSell.category,
        count: sellCount,
        icon: selectedItemToSell.icon,
        rarity: selectedItemToSell.rarity,
        description: selectedItemToSell.description,
      });

      sound.playSFX('hurt');
      setStatusMessage({ type: 'error', text: err.message || 'Error de conexión.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle canceling an active listing
  const handleCancelListing = async (auction: AuctionListing) => {
    setIsSubmitting(true);
    sound.playSFX('click');

    try {
      const res = await fetch('/api/auctions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionId: auction.id,
          sellerId: playerName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage({ type: 'error', text: data.error || 'No se pudo retirar el lote.' });
        return;
      }

      addShelfItem({
        id: data.item.id,
        name: data.item.name,
        category: data.item.category,
        count: data.item.count || 1,
        icon: data.item.icon,
        rarity: data.item.rarity,
        description: data.item.description,
      });

      sound.playSFX('sparkle');
      setStatusMessage({
        type: 'success',
        text: `Has recuperado ${data.item.name} (${data.item.count || 1}x) de vuelta a tu inventario.`,
      });

      await fetchAuctions();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al conectar con el servidor.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle claiming gold from a sold listing
  const handleClaimProceeds = async (auction: AuctionListing) => {
    setIsSubmitting(true);
    sound.playSFX('click');

    try {
      const res = await fetch('/api/auctions/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionId: auction.id,
          sellerId: playerName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusMessage({ type: 'error', text: data.error || 'No se pudieron cobrar las ganancias.' });
        return;
      }

      addGold(data.gold);
      sound.playSFX('coin');
      launchConfetti();

      setStatusMessage({
        type: 'success',
        text: `¡Cobrado! +${data.gold.toLocaleString()} Oro añadido a tu tesoro.`,
      });

      await fetchAuctions();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al cobrar.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered browse list
  const filteredAuctions = auctions.filter((a) => {
    if (a.status !== 'active') return false;
    if (selectedCategory !== 'all' && a.item.category !== selectedCategory) return false;
    if (
      searchQuery.trim() &&
      !a.item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !a.sellerName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const myListings = auctions.filter(
    (a) => a.sellerName.toLowerCase() === playerName.toLowerCase() || a.sellerId === playerName
  );

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'UR':
        return 'text-rose-400 border-rose-500/60 bg-rose-950/60';
      case 'SSR':
        return 'text-amber-400 border-amber-500/60 bg-amber-950/60';
      case 'SR':
        return 'text-purple-400 border-purple-500/60 bg-purple-950/60';
      default:
        return 'text-stone-300 border-stone-600/60 bg-stone-900/60';
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#120502] select-none">
      {/* 1. TOP HANGING SIGN: CASA DE SUBASTAS WITH AUTHENTIC CARTEL METAL ASSET */}
      <div className="relative w-full px-3 pt-1 pb-1 shrink-0 flex items-center justify-center">
        <div className="relative w-[94%] max-w-[390px] h-[58px] sm:h-[62px] flex items-center justify-center">
          <img
            src="/assets/items/cartel_metal.png"
            alt="Casa de Subastas"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none drop-shadow-lg"
          />
          <span className="relative z-10 font-serif font-black text-[#fae59a] text-[13px] sm:text-[14px] tracking-[0.14em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] pt-1.5 text-center">
            CASA DE SUBASTAS
          </span>
        </div>
      </div>

      {/* 2. THREE NAVIGATION TABS (MATCHING REFERENCE IMAGE_DB9C6375) */}
      <div className="px-3 flex items-center gap-2 w-full shrink-0">
        {/* Tab 1: Explorar (count) */}
        <button
          onClick={() => {
            sound.playSFX('click');
            setActiveTab('browse');
          }}
          className={`flex-1 h-[38px] rounded-lg relative flex items-center justify-center gap-1.5 px-2 cursor-pointer transition-all active:scale-95 ${
            activeTab === 'browse'
              ? 'bg-gradient-to-b from-[#f59f42] to-[#db7c1e] border border-[#f8b465] shadow-[0_0_15px_rgba(245,158,11,0.55),inset_0_1px_1px_rgba(255,255,255,0.35)] z-10'
              : 'bg-gradient-to-b from-[#875130] to-[#64371e] border border-[#3d1c0b] shadow-[inset_0_1px_1px_rgba(255,200,150,0.15),0_2px_4px_rgba(0,0,0,0.5)] opacity-85 hover:opacity-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-[#1a0800] shrink-0" strokeWidth={2.4} />
          <span className={`font-serif text-[#1a0800] text-[12px] sm:text-[13px] tracking-tight whitespace-nowrap ${activeTab === 'browse' ? 'font-black' : 'font-bold'}`}>
            Explorar ({filteredAuctions.length})
          </span>
        </button>

        {/* Tab 2: Poner en Subasta (two-line text stacked beside package icon) */}
        <button
          onClick={() => {
            sound.playSFX('click');
            setActiveTab('sell');
          }}
          className={`flex-1 h-[38px] rounded-lg relative flex items-center justify-center gap-1.5 px-2 cursor-pointer transition-all active:scale-95 ${
            activeTab === 'sell'
              ? 'bg-gradient-to-b from-[#f59f42] to-[#db7c1e] border border-[#f8b465] shadow-[0_0_15px_rgba(245,158,11,0.55),inset_0_1px_1px_rgba(255,255,255,0.35)] z-10'
              : 'bg-gradient-to-b from-[#875130] to-[#64371e] border border-[#3d1c0b] shadow-[inset_0_1px_1px_rgba(255,200,150,0.15),0_2px_4px_rgba(0,0,0,0.5)] opacity-85 hover:opacity-100'
          }`}
        >
          <PackagePlus className="w-4 h-4 text-[#1a0800] shrink-0" strokeWidth={2.2} />
          <div className="flex flex-col text-left leading-[1.05]">
            <span className={`font-serif text-[#1a0800] text-[10px] sm:text-[11px] ${activeTab === 'sell' ? 'font-black' : 'font-bold'}`}>
              Poner en
            </span>
            <span className={`font-serif text-[#1a0800] text-[10px] sm:text-[11px] ${activeTab === 'sell' ? 'font-black' : 'font-bold'}`}>
              Subasta
            </span>
          </div>
        </button>

        {/* Tab 3: Mis Lotes (count) */}
        <button
          onClick={() => {
            sound.playSFX('click');
            setActiveTab('my_listings');
          }}
          className={`flex-1 h-[38px] rounded-lg relative flex items-center justify-center gap-1.5 px-2 cursor-pointer transition-all active:scale-95 ${
            activeTab === 'my_listings'
              ? 'bg-gradient-to-b from-[#f59f42] to-[#db7c1e] border border-[#f8b465] shadow-[0_0_15px_rgba(245,158,11,0.55),inset_0_1px_1px_rgba(255,255,255,0.35)] z-10'
              : 'bg-gradient-to-b from-[#875130] to-[#64371e] border border-[#3d1c0b] shadow-[inset_0_1px_1px_rgba(255,200,150,0.15),0_2px_4px_rgba(0,0,0,0.5)] opacity-85 hover:opacity-100'
          }`}
        >
          <History className="w-4 h-4 text-[#1a0800] shrink-0" strokeWidth={2.2} />
          <span className={`font-serif text-[#1a0800] text-[11px] sm:text-[12px] tracking-tight whitespace-nowrap ${activeTab === 'my_listings' ? 'font-black' : 'font-bold'}`}>
            Mis Lotes ({myListings.length})
          </span>
        </button>
      </div>

      {/* 3. SEARCH BAR (MATCHING REFERENCE IMAGE_DB9C6375) */}
      <div className="px-3 mt-3 mb-2.5 w-full shrink-0">
        <div className="relative w-full h-[36px] bg-[#000000] border border-[#522510] rounded-lg flex items-center px-3 shadow-inner">
          <Search className="w-4 h-4 text-[#756a60] shrink-0 mr-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar lote o vendedor..."
            className="w-full bg-transparent text-xs text-stone-200 placeholder:text-[#756a60] focus:outline-none"
          />
        </div>
      </div>

      {/* 4. CATEGORY CHIPS ROW (5 BUTTONS MATCHING REFERENCE IMAGE_DB9C6375) */}
      <div className="px-3 mb-2.5 flex gap-1.5 items-center w-full shrink-0">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'materials', label: 'Materiales' },
          { key: 'equipment', label: 'Equipo' },
          { key: 'food', label: 'Consumi...' },
          { key: 'tools', label: 'Herramie...' },
        ].map(({ key, label }) => {
          const isSelected = selectedCategory === key;
          return (
            <button
              key={key}
              onClick={() => {
                sound.playSFX('click');
                setSelectedCategory(key);
              }}
              className={`h-[30px] flex-1 flex items-center justify-center rounded-md font-bold text-xs cursor-pointer transition-transform active:scale-95 truncate px-0.5 ${
                isSelected
                  ? 'bg-[#e0750a] text-black shadow-md'
                  : 'bg-[#16100d] border border-[#38281e] text-[#a3988e] hover:text-stone-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Global Status Message Toast */}
      {statusMessage && (
        <div
          className={`mx-3 mb-2 px-3 py-1.5 text-xs flex items-center justify-between gap-2 rounded-lg border shrink-0 animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/60'
              : 'bg-rose-950/90 text-rose-200 border-rose-700/60'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
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

      {/* 5. MAIN CONTENT SCROLL AREA */}
      <div className="flex-1 min-h-0 w-full relative overflow-hidden bg-[#120502]">
        <ForgeMaskedSlider className="w-full h-full" contentClassName="px-3 pb-4 space-y-2.5">
          {/* ------------------------------------------------------------- */}
          {/* TAB 1: EXPLORAR SUBASTAS (COMPRAR) */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'browse' && (
            <div className="space-y-2.5">
              {isLoading && auctions.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                  <p className="text-xs text-[#fae59a] font-serif">Consultando el registro de subastas...</p>
                </div>
              ) : filteredAuctions.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-xl border border-dashed border-[#441f0f] bg-black/40 space-y-2">
                  <Tag className="w-8 h-8 text-amber-600/60 mx-auto" />
                  <p className="text-xs text-amber-200 font-bold">No hay lotes disponibles con estos filtros.</p>
                  <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                    Sé el primero en poner a la venta objetos de tu inventario en la pestaña "Poner en Subasta".
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {filteredAuctions.map((auction) => {
                    const isOwner = auction.sellerName.toLowerCase() === playerName.toLowerCase();
                    const canAfford = gold >= auction.price;

                    return (
                      <div
                        key={auction.id}
                        className="relative bg-[#1a0a04] border border-[#4a2211] rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2.5 shadow-lg hover:border-[#8f4b1e] transition-all"
                      >
                        {/* Item Info Left with Boton Tienda 2 Frame */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative w-13 h-13 sm:w-14 sm:h-14 p-1.5 flex items-center justify-center shrink-0">
                            <img
                              src="/assets/items/boton_tienda_2.png"
                              alt=""
                              className="absolute inset-0 w-full h-full object-fill pointer-events-none drop-shadow"
                            />
                            <img
                              src={auction.item.icon}
                              alt={auction.item.name}
                              className="relative z-10 w-9 h-9 object-contain filter drop-shadow"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/assets/items/base item app.png';
                              }}
                            />
                            {auction.item.count > 1 && (
                              <span className="absolute bottom-1 right-1 z-20 bg-black/90 text-amber-300 text-[9px] font-mono font-bold px-1 rounded border border-amber-600/50">
                                x{auction.item.count}
                              </span>
                            )}
                          </div>

                          {/* Details */}
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-serif font-black text-xs sm:text-sm text-[#fae59a] truncate">
                                {auction.item.name}
                              </span>
                              <span
                                className={`text-[8px] font-black px-1.5 py-0.2 rounded border ${getRarityBadgeColor(
                                  auction.item.rarity
                                )}`}
                              >
                                {auction.item.rarity}
                              </span>
                            </div>

                            <p className="text-[10px] text-stone-400 line-clamp-1">
                              {auction.item.description || 'Lote de la Casa de Subastas'}
                            </p>

                            <div className="flex items-center gap-2 text-[9px] text-stone-400">
                              <span>
                                Vendedor:{' '}
                                <strong className="text-amber-300 font-mono">
                                  {isOwner ? 'Tú (Mismo)' : auction.sellerName}
                                </strong>
                              </span>
                              <span>•</span>
                              <span className="text-emerald-400">Disponible</span>
                            </div>
                          </div>
                        </div>

                        {/* Price Tag & Buy Button */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/70 border border-amber-500/50 text-amber-300 font-mono font-black text-xs">
                            <img
                              src="/assets/items/moneda_de_moonhaven.png"
                              alt="Oro"
                              className="w-3.5 h-3.5 object-contain filter drop-shadow shrink-0"
                            />
                            <span>{auction.price.toLocaleString()}</span>
                          </div>

                          {isOwner ? (
                            <div className="px-2.5 py-1 rounded bg-stone-900 border border-stone-700 text-stone-400 text-[10px] font-bold">
                              Tu Lote
                            </div>
                          ) : (
                            <button
                              onClick={() => handleBuy(auction)}
                              disabled={!canAfford || isSubmitting}
                              className={`relative h-8 px-3.5 flex items-center justify-center cursor-pointer transition-transform active:scale-95 ${
                                !canAfford ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                              }`}
                            >
                              <img
                                src="/assets/items/boton_boton_tienda.png"
                                alt=""
                                className="absolute inset-0 w-full h-full object-fill pointer-events-none drop-shadow"
                              />
                              <span className="relative z-10 font-serif font-black text-stone-950 text-xs drop-shadow-xs">
                                {canAfford ? 'Comprar' : 'Falta Oro'}
                              </span>
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

          {/* ------------------------------------------------------------- */}
          {/* TAB 2: PONER EN SUBASTA */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'sell' && (
            <div className="space-y-3">
              <div className="bg-[#1a0a04] p-2.5 rounded-xl border border-[#4a2211] space-y-1">
                <h3 className="font-serif font-black text-[#fae59a] text-xs">
                  Selecciona un objeto de tu inventario:
                </h3>
                <p className="text-[10px] text-stone-400 leading-tight">
                  Al publicarlo, saldrá de tu inventario y quedará a la venta en la Casa de Subastas.
                </p>
              </div>

              {/* Inventory Picker Grid */}
              <div className="bg-black/50 p-2.5 rounded-xl border border-[#4a2211] max-h-44 overflow-y-auto space-y-1 custom-scrollbar">
                {shelfInventory.length === 0 ? (
                  <p className="text-xs text-stone-500 text-center py-6">Tu inventario está vacío.</p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {shelfInventory.map((item) => {
                      const isSelected = selectedItemToSell?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            sound.playSFX('click');
                            setSelectedItemToSell(item);
                            setSellCount(1);
                            setSellPrice(Math.max(100, (item.priceGold || 100) * 2));
                          }}
                          className={`relative p-1.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer aspect-square ${
                            isSelected
                              ? 'scale-105 drop-shadow-[0_0_12px_#f59e0b]'
                              : 'hover:scale-102 opacity-85 hover:opacity-100'
                          }`}
                        >
                          <img
                            src="/assets/items/boton_tienda_2.png"
                            alt=""
                            className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                          />
                          <img
                            src={item.icon}
                            alt={item.name}
                            className="relative z-10 w-8 h-8 object-contain filter drop-shadow mb-1"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/assets/items/base item app.png';
                            }}
                          />
                          <span className="relative z-10 text-[8px] text-stone-200 text-center font-black line-clamp-1 w-full px-1">
                            {item.name}
                          </span>
                          <span className="absolute top-1 right-1 z-20 bg-black/90 border border-amber-500/60 text-amber-300 text-[8px] font-mono px-1 rounded">
                            x{item.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Listing Form */}
              {selectedItemToSell && (
                <div className="relative p-4 sm:p-5 rounded-2xl shadow-2xl overflow-hidden min-h-[340px] flex flex-col justify-between border border-amber-500/40 bg-[#1e0c05] animate-in fade-in">
                  <img
                    src="/assets/items/BOTON TIENDA.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none drop-shadow-xl opacity-90"
                  />

                  <div className="relative z-10 space-y-3.5">
                    {/* Selected Item Preview */}
                    <div className="flex items-center gap-3 pb-2.5 border-b border-amber-500/30">
                      <div className="relative w-14 h-14 p-1.5 flex items-center justify-center shrink-0">
                        <img
                          src="/assets/items/boton_tienda_2.png"
                          alt=""
                          className="absolute inset-0 w-full h-full object-fill pointer-events-none drop-shadow"
                        />
                        <img
                          src={selectedItemToSell.icon}
                          alt={selectedItemToSell.name}
                          className="relative z-10 w-9 h-9 object-contain filter drop-shadow"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-serif font-black text-[#fae59a] text-sm drop-shadow">
                          {selectedItemToSell.name}
                        </h4>
                        <p className="text-[10px] text-amber-100/80">
                          Disponibles en inventario: <strong className="text-amber-300 font-mono">{selectedItemToSell.count}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Quantity to sell */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-amber-200 flex items-center justify-between">
                        <span>Cantidad a Poner en Venta:</span>
                        <span className="font-mono text-xs text-amber-300 font-bold">{sellCount} unidad(es)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="1"
                          max={selectedItemToSell.count}
                          value={sellCount}
                          onChange={(e) => setSellCount(parseInt(e.target.value, 10))}
                          className="flex-1 accent-amber-500 cursor-pointer"
                        />
                        <input
                          type="number"
                          min="1"
                          max={selectedItemToSell.count}
                          value={sellCount}
                          onChange={(e) =>
                            setSellCount(Math.min(selectedItemToSell.count, Math.max(1, parseInt(e.target.value, 10) || 1)))
                          }
                          className="w-16 px-2 py-1 bg-black/80 border border-amber-600/70 rounded text-center text-xs font-mono text-amber-200"
                        />
                      </div>
                    </div>

                    {/* Price Setting */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-amber-200 flex items-center justify-between">
                        <span>Precio Total en Oro:</span>
                        <span className="font-mono text-xs text-amber-300 font-bold flex items-center gap-1">
                          <img
                            src="/assets/items/moneda_de_moonhaven.png"
                            alt="Oro"
                            className="w-4 h-4 object-contain"
                          />
                          <span>{sellPrice.toLocaleString()} Oro</span>
                        </span>
                      </label>
                      <div className="relative">
                        <img
                          src="/assets/items/moneda_de_moonhaven.png"
                          alt="Oro"
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 object-contain filter drop-shadow pointer-events-none"
                        />
                        <input
                          type="number"
                          min="1"
                          step="50"
                          value={sellPrice}
                          onChange={(e) => setSellPrice(Math.max(1, parseInt(e.target.value, 10) || 0))}
                          className="w-full pl-9 pr-3 py-1.5 bg-black/80 border border-amber-500/70 rounded-lg text-sm font-mono font-bold text-amber-200 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {/* Quick increments */}
                      <div className="flex items-center gap-1.5 pt-1">
                        {[100, 500, 1000, 2500].map((amt) => (
                          <button
                            key={amt}
                            onClick={() => setSellPrice((prev) => prev + amt)}
                            className="flex-1 py-1 rounded bg-[#2a1309] border border-[#5a2e16] text-[#fae59a] font-mono font-bold text-[10px] hover:border-amber-400 cursor-pointer active:scale-95 transition-transform"
                          >
                            +{amt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Publish Button */}
                  <div className="relative z-10 pt-3">
                    <button
                      onClick={handleCreateListing}
                      disabled={isSubmitting}
                      className="relative w-full h-11 flex items-center justify-center cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
                    >
                      <img
                        src="/assets/items/boton_boton_tienda.png"
                        alt=""
                        className="absolute inset-0 w-full h-full object-fill pointer-events-none drop-shadow-md"
                      />
                      <span className="relative z-10 font-serif font-black text-stone-950 text-xs sm:text-sm flex items-center gap-1.5 drop-shadow-xs">
                        <img
                          src="/assets/items/moneda_de_moonhaven.png"
                          alt="Oro"
                          className="w-4 h-4 object-contain"
                        />
                        <span>
                          {isSubmitting ? 'Publicando...' : `Publicar Lote (${sellPrice.toLocaleString()} Oro)`}
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 3: MIS LOTES (GESTIONAR Y COBRAR) */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'my_listings' && (
            <div className="space-y-3">
              <div className="bg-[#1a0a04] p-2.5 rounded-xl border border-[#4a2211] flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-black text-[#fae59a] text-xs">Tus Lotes en Subasta</h3>
                  <p className="text-[10px] text-stone-400">
                    Retira objetos no vendidos o cobra el oro de los lotes vendidos.
                  </p>
                </div>
                <button
                  onClick={fetchAuctions}
                  className="px-2.5 py-1 rounded-md bg-[#2b1308] border border-[#5c2b14] text-[#fae59a] flex items-center gap-1 font-serif font-bold text-[10px] hover:border-amber-400 cursor-pointer active:scale-95 transition-transform"
                  title="Actualizar registro"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Actualizar</span>
                </button>
              </div>

              {myListings.length === 0 ? (
                <div className="text-center py-16 px-4 rounded-xl border border-dashed border-[#441f0f] bg-black/40 space-y-2">
                  <PackagePlus className="w-8 h-8 text-amber-600/60 mx-auto" />
                  <p className="text-xs text-amber-200 font-bold">No has publicado ningún lote todavía.</p>
                  <p className="text-[11px] text-stone-400">
                    Ve a la pestaña "Poner en Subasta" para listar objetos de tu inventario.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {myListings.map((auction) => {
                    const isSold = auction.status === 'sold';
                    const isCancelled = auction.status === 'cancelled';
                    const isClaimed = !!auction.claimedBySeller;

                    return (
                      <div
                        key={auction.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 shadow-lg ${
                          isSold
                            ? 'bg-emerald-950/40 border-emerald-700/80'
                            : isCancelled
                            ? 'bg-stone-900/40 border-stone-800 opacity-60'
                            : 'bg-[#1a0a04] border-[#4a2211]'
                        }`}
                      >
                        {/* Item Info */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative w-12 h-12 p-1.5 flex items-center justify-center shrink-0">
                            <img
                              src="/assets/items/boton_tienda_2.png"
                              alt=""
                              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                            />
                            <img
                              src={auction.item.icon}
                              alt={auction.item.name}
                              className="relative z-10 w-8 h-8 object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/assets/items/base item app.png';
                              }}
                            />
                            {auction.item.count > 1 && (
                              <span className="absolute bottom-1 right-1 z-20 bg-black/90 text-amber-300 text-[8px] font-mono px-1 rounded border border-amber-600/40">
                                x{auction.item.count}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <span className="font-serif font-black text-xs text-[#fae59a] truncate block">
                              {auction.item.name}
                            </span>
                            <div className="flex items-center gap-1.5 text-[9px]">
                              {isSold ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  ¡Vendido a {auction.buyerName || 'Otro jugador'}!
                                </span>
                              ) : isCancelled ? (
                                <span className="text-stone-400">Lote Cancelado</span>
                              ) : (
                                <span className="text-amber-400 font-bold">En Venta Global</span>
                              )}
                            </div>
                            <span className="text-[10px] text-amber-300 font-mono flex items-center gap-1">
                              <img
                                src="/assets/items/moneda_de_moonhaven.png"
                                alt="Oro"
                                className="w-3 h-3 object-contain"
                              />
                              <span>{auction.price.toLocaleString()} Oro</span>
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="shrink-0 flex items-center gap-2">
                          {isSold && !isClaimed && (
                            <button
                              onClick={() => handleClaimProceeds(auction)}
                              disabled={isSubmitting}
                              className="relative h-8 px-3 flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                            >
                              <img
                                src="/assets/items/boton_boton_tienda.png"
                                alt=""
                                className="absolute inset-0 w-full h-full object-fill pointer-events-none drop-shadow"
                              />
                              <span className="relative z-10 font-serif font-black text-stone-950 text-xs flex items-center gap-1">
                                <img
                                  src="/assets/items/moneda_de_moonhaven.png"
                                  alt="Oro"
                                  className="w-3.5 h-3.5 object-contain"
                                />
                                <span>Cobrar</span>
                              </span>
                            </button>
                          )}

                          {isSold && isClaimed && (
                            <span className="text-[9px] text-emerald-400 font-bold px-2 py-1 rounded bg-black/50 border border-emerald-600/40">
                              Oro Cobrado
                            </span>
                          )}

                          {auction.status === 'active' && (
                            <button
                              onClick={() => handleCancelListing(auction)}
                              disabled={isSubmitting}
                              className="px-2.5 py-1 rounded-md bg-[#2a1309] border border-[#522510] text-[#fae59a] font-serif font-bold text-xs hover:border-amber-400 cursor-pointer active:scale-95 transition-transform disabled:opacity-50"
                              title="Retirar lote y devolver al inventario"
                            >
                              Retirar
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
    </div>
  );
};
