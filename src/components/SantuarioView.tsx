import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { Heart, Sparkles, X, Shield, Swords, FlaskConical, Castle } from 'lucide-react';
import { AuctionHouseModal } from './AuctionHouseModal';
import { safeStorage } from '../utils/storage';
import { MINES_TUTORIAL_DONE_KEY } from '../data/minesIntroData';

export const SantuarioView: React.FC = () => {
  const {
    navigateTo,
    idleEarningsAvailable,
    claimIdleEarnings,
    activeSanctuary,
    setActiveSanctuary,
  } = useGame();

  const [showBondModal, setShowBondModal] = useState(false);
  const [showBlessingModal, setShowBlessingModal] = useState(false);
  const [showAuctionHouseModal, setShowAuctionHouseModal] = useState(false);
  const [claimedNotice, setClaimedNotice] = useState<string | null>(null);
  const [undergroundNotice, setUndergroundNotice] = useState<{
    title: string;
    subtitle: string;
    desc: string;
    iconType: 'swords' | 'potion' | 'castle';
  } | null>(null);

  // Mientras el tutorial de patrullas siga pendiente, las galerías avisan:
  // Boran y Thora esperan abajo, en el tablón, no en la entrada.
  const minesTutorialPending =
    activeSanctuary === 'silverpeack' &&
    safeStorage.getItem(MINES_TUTORIAL_DONE_KEY) !== 'done';

  const handleClaimTribute = () => {
    if (idleEarningsAvailable > 0) {
      const amt = claimIdleEarnings();
      setClaimedNotice(`¡Has reclamado +${amt.toLocaleString()} Oro de tributo!`);
      setTimeout(() => setClaimedNotice(null), 3000);
    }
  };

  const handleUndergroundElementClick = (type: 'pozos' | 'subastas' | 'pociones' | 'baron') => {
    sound.playSFX('click');
    switch (type) {
      case 'pozos':
        sound.playSFX('attack');
        setUndergroundNotice({
          title: 'Pozos de Pelea',
          subtitle: 'Arena Clandestina de Gladiadores',
          desc: 'Los combates a muerte y apuestas clandestinas se forjan en esta arena de piedra circular. Los mejores guerreros del Mercado Negro se miden en combates sin piedad.',
          iconType: 'swords',
        });
        break;
      case 'subastas':
        sound.playSFX('coin');
        navigateTo('auction');
        break;
      case 'pociones':
        sound.playSFX('skill');
        navigateTo('potions');
        break;
      case 'baron':
        sound.playSFX('baron');
        setUndergroundNotice({
          title: 'Mazmorra de la Mansión del Barón',
          subtitle: 'Fortaleza Cavernosa del Tirano',
          desc: 'En lo más alto de la caverna subterránea se erige la opulenta mansión del Barón. En sus calabozos húmedos y criptas secretas se custodian los secretos de su linaje.',
          iconType: 'castle',
        });
        break;
    }
  };

  // ----------------------------------------------------------------------
  // UNDERGROUND SANCTUARY (MERCADO NEGRO) VIEW
  // ----------------------------------------------------------------------
  if (activeSanctuary === 'mercado_negro') {
    return (
      <div className="relative w-full h-full min-h-[580px] flex-1 flex flex-col justify-between overflow-hidden select-none">
        {/* Full Cavern Black Market Sanctuary Illustrated Artwork */}
        <img
          src="/assets/aistudio/image_159218c1.png"
          alt="Santuario Subterráneo del Mercado Negro"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        />

        {/* Top Header - Badges only, without any top switcher cartel */}
        <div className="relative z-10 p-2.5 sm:p-3 flex items-center justify-between gap-2">
          {/* Top Left Floating Badges */}
          <div className="flex items-center gap-2">
            {/* Vínculos / Bonds */}
            <button
              onClick={() => {
                sound.playSFX('click');
                setShowBondModal(true);
              }}
              className="w-10 h-10 rounded-full bg-gradient-to-b from-[#8f280a] to-[#3a0d02] border-2 border-[#d97706] shadow-xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              title="Vínculos y Afecto de Héroes"
            >
              <div className="w-7 h-7 rounded-full bg-[#f8fafc] border border-[#cbd5e1] flex items-center justify-center p-0.5 shadow-inner">
                <svg viewBox="0 0 24 24" className="w-full h-full text-purple-900 fill-current">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 4.41 2.87 8.19 6.84 9.5.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10.02 10.02 0 0 0 22 12c0-5.52-4.48-10-10-10z" />
                </svg>
              </div>
            </button>

            {/* Hexagon Crest Badge (Tribute) */}
            <button
              onClick={() => {
                sound.playSFX('click');
                setShowBlessingModal(true);
              }}
              className="relative w-10 h-10 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              title="Tributo Subterráneo"
            >
              <img
                src="/assets/items/Insignia Mercado Negro app.png"
                alt="Insignia"
                className="w-full h-full object-contain filter drop-shadow-xl"
              />
              {idleEarningsAvailable > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 border border-white text-[7px] font-black text-black flex items-center justify-center animate-bounce shadow">
                  !
                </span>
              )}
            </button>

            {/* Inventory Button */}
            <button
              onClick={() => {
                sound.playSFX('click');
                navigateTo('inventory');
              }}
              className="h-8 w-22 cursor-pointer hover:scale-106 active:scale-95 transition-transform"
              title="Inventario"
            >
              <img
                src="/assets/items/Inventary_Button.png"
                alt="Inventario"
                className="w-full h-full object-contain filter drop-shadow-xl"
              />
            </button>
          </div>
        </div>

        {/* Floating Notice Banner for tribute claim */}
        {claimedNotice && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-[#3b170c] border-2 border-amber-400 text-amber-200 px-4 py-1.5 rounded-lg text-xs font-bold shadow-2xl animate-fade-in pointer-events-none">
            {claimedNotice}
          </div>
        )}

        {/* Interactive Invisible Hotspots over the Buildings & Elements - No visual indicators or overlays */}
        <div className="relative z-10 flex-1 w-full pointer-events-auto">
          {/* 1. Mazmorra de la mansión del Barón (arriba del todo) */}
          <button
            onClick={() => handleUndergroundElementClick('baron')}
            className="absolute top-[2%] left-[44%] w-[52%] h-[24%] cursor-pointer focus:outline-none"
            title="Mansión del Barón"
            aria-label="Mazmorra de la Mansión del Barón"
          />

          {/* 2. Casa de subastas con mazo en el techo (arriba izquierda) */}
          <button
            onClick={() => handleUndergroundElementClick('subastas')}
            className="absolute top-[22%] left-[0%] w-[42%] h-[26%] cursor-pointer focus:outline-none"
            title="Casa de Subastas"
            aria-label="Casa de Subastas"
          />

          {/* 3. Pozos de pelea (centro) */}
          <button
            onClick={() => handleUndergroundElementClick('pozos')}
            className="absolute top-[50%] left-[18%] w-[64%] h-[21%] rounded-full cursor-pointer focus:outline-none"
            title="Pozos de Pelea"
            aria-label="Pozos de Pelea"
          />

          {/* 4. Tienda de pociones y encantamientos con sello arcano (abajo derecha) */}
          <button
            onClick={() => handleUndergroundElementClick('pociones')}
            className="absolute top-[58%] right-[0%] w-[50%] h-[32%] cursor-pointer focus:outline-none"
            title="Tienda de Pociones y Encantamientos"
            aria-label="Tienda de Pociones y Encantamientos"
          />
        </div>

        {/* Bottom Right: Button to return to Santuario (using the Santuario button from WorldMapView instead of World button) */}
        <div className="relative z-20 self-end mb-20 mr-2 sm:mb-22 sm:mr-3 pointer-events-auto">
          <button
            onClick={() => {
              sound.playSFX('click');
              setActiveSanctuary('icespear');
            }}
            className="group relative flex flex-col items-center cursor-pointer hover:scale-106 active:scale-95 transition-transform"
            title="Volver al Santuario de Icespear"
          >
            <img
              src="/assets/backgrounds/icespear SANTUARIO BUTTON.png"
              alt="Volver al Santuario"
              className="w-16 h-16 sm:w-18 sm:h-18 object-contain filter drop-shadow-2xl"
            />
          </button>
        </div>

        {/* Underground Feature Detail Modal (No logic yet) */}
        {undergroundNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-fade-in">
            <div className="wood-frame max-w-sm w-full p-5 rounded-2xl space-y-4 text-center border-2 border-amber-600 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-amber-900/60">
                <div className="flex items-center gap-2 text-amber-200 font-serif font-black text-sm">
                  {undergroundNotice.iconType === 'swords' && <Swords className="w-5 h-5 text-red-400" />}
                  {undergroundNotice.iconType === 'potion' && <FlaskConical className="w-5 h-5 text-purple-400" />}
                  {undergroundNotice.iconType === 'castle' && <Castle className="w-5 h-5 text-amber-400" />}
                  <span>{undergroundNotice.title}</span>
                </div>
                <button
                  onClick={() => setUndergroundNotice(null)}
                  className="text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                {undergroundNotice.subtitle}
              </div>

              <p className="text-xs text-stone-300 leading-relaxed text-left bg-[#1b0a04] p-3 rounded-xl border border-[#521c08]">
                {undergroundNotice.desc}
              </p>

              <div className="text-[10px] text-amber-400/80 font-mono tracking-wider uppercase">
                ✦ En construcción ✦
              </div>

              <button
                onClick={() => setUndergroundNotice(null)}
                className="w-full py-2 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* Common Sanctuary Modals */}
        {showBondModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
            <div className="wood-frame max-w-sm w-full p-5 rounded-2xl space-y-4 text-center border-2 border-amber-700 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-amber-900/60">
                <div className="flex items-center gap-2 text-amber-200 font-serif font-black text-sm">
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                  <span>Vínculos de Compañerismo</span>
                </div>
                <button onClick={() => setShowBondModal(false)} className="text-stone-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Pasa tiempo con tus héroes en la taberna y completa misiones conjuntas para desbloquear estadísticas pasivas.
              </p>
              <div className="bg-[#1b0a04] border border-[#521c08] rounded-xl p-3 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-300">
                  <span>Magordito (Afecto Lv.4)</span>
                  <span className="text-cyan-400 font-bold">+8% Daño Necrótico</span>
                </div>
                <div className="flex items-center justify-between text-stone-300">
                  <span>Pepe Loux (Afecto Lv.3)</span>
                  <span className="text-amber-400 font-bold">+8% Defensa</span>
                </div>
                <div className="flex items-center justify-between text-stone-300">
                  <span>Kairon (Afecto Lv.5)</span>
                  <span className="text-amber-400 font-bold">+10% Daño Sagrado</span>
                </div>
              </div>
              <button
                onClick={() => setShowBondModal(false)}
                className="w-full py-2 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {showBlessingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
            <div className="wood-frame max-w-sm w-full p-5 rounded-2xl space-y-4 text-center border-2 border-amber-700 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-amber-900/60">
                <div className="flex items-center gap-2 text-amber-200 font-serif font-black text-sm">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Tributo del Santuario</span>
                </div>
                <button onClick={() => setShowBlessingModal(false)} className="text-stone-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                El Santuario acumula tributo de oro de manera pasiva mientras exploras o descansas.
              </p>
              <div className="bg-[#1b0a04] border border-[#521c08] rounded-xl p-4 text-center space-y-2">
                <span className="text-xs text-stone-400 uppercase tracking-widest">Tributo Acumulado</span>
                <div className="text-2xl font-mono font-black text-amber-300">
                  +{idleEarningsAvailable.toLocaleString()} Oro
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleClaimTribute();
                    setShowBlessingModal(false);
                  }}
                  disabled={idleEarningsAvailable <= 0}
                  className={`flex-1 py-2 font-bold text-xs rounded-lg shadow-md transition-all ${
                    idleEarningsAvailable > 0
                      ? 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black cursor-pointer'
                      : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  Reclamar Tributo
                </button>
                <button
                  onClick={() => setShowBlessingModal(false)}
                  className="py-2 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auction House Modal */}
        <AuctionHouseModal
          isOpen={showAuctionHouseModal}
          onClose={() => setShowAuctionHouseModal(false)}
        />
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // SILVERPEACK SANCTUARY VIEW (Pico de Plata, colonia minera)
  // ----------------------------------------------------------------------
  if (activeSanctuary === 'silverpeack') {
    return (
      <div className="relative w-full h-full min-h-[580px] flex-1 flex flex-col justify-between overflow-hidden select-none bg-[#0b0710]">
        <img
          src="/assets/backgrounds/silverpeack.png"
          alt="Santuario de Silverpeack, la antigua colonia minera de Glimmerstone"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        />

        {/* Placa con el nombre del santuario + inventario */}
        <div className="relative z-10 p-2.5 sm:p-3 flex items-start justify-between gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-[#160d22]/85 border border-violet-500/60 shadow-2xl">
            <div className="font-serif font-black text-sm text-violet-100 tracking-wide">Silverpeack</div>
            <div className="text-[9px] uppercase tracking-wider text-violet-300/90">
              Pico de Plata · Colonia Minera de Glimmerstone
            </div>
          </div>

          <button
            onClick={() => {
              sound.playSFX('click');
              navigateTo('inventory');
            }}
            className="h-8 w-22 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            title="Inventario"
          >
            <img
              src="/assets/items/Inventary_Button.png"
              alt="Inventario"
              className="w-full h-full object-contain filter drop-shadow-xl"
            />
          </button>
        </div>

        {/* Puntos interactivos sobre el arte del santuario */}
        <div className="relative z-10 flex-1 w-full pointer-events-auto">
          {/* Puerta sellada de los cristales (arriba, centro) */}
          <button
            onClick={() => {
              sound.playSFX('click');
              navigateTo('labyrinth');
            }}
            className="absolute top-[7%] left-[30%] w-[44%] h-[32%] cursor-pointer focus:outline-none"
            title="Laberinto de Lloth · Puerta Sellada de los Cristales"
            aria-label="Laberinto de Lloth"
          />

          {/* Taberna del Pico (casa de madera, izquierda) */}
          <button
            onClick={() => {
              sound.playSFX('click');
              navigateTo('tavern');
            }}
            className="absolute top-[45%] left-[0%] w-[44%] h-[36%] cursor-pointer focus:outline-none"
            title="Taberna del Pico"
            aria-label="Taberna del Pico"
          />

          {/* Herrería de la colonia (derecha, escudo de martillos) */}
          <button
            onClick={() => {
              sound.playSFX('click');
              navigateTo('forge');
            }}
            className="absolute top-[52%] right-[0%] w-[46%] h-[28%] cursor-pointer focus:outline-none"
            title="Herrería de Silverpeack"
            aria-label="Herrería de Silverpeack"
          />

          {/* Galerías de la mina: abren el tablón de patrullas para asignar héroes */}
          {minesTutorialPending && (
            <div className="absolute top-[66%] left-[52%] z-20 -translate-x-1 px-2.5 py-1 rounded-md bg-[#2a1a0b]/95 border border-amber-400/80 text-amber-100 text-[10px] font-bold uppercase tracking-wide shadow-xl pointer-events-none animate-pulse text-center">
              ¡Boran y Thora te esperan en las galerías!
            </div>
          )}
          <button
            onClick={() => {
              sound.playSFX('click');
              navigateTo('patrol');
            }}
            className={`absolute top-[74%] left-[52%] w-[48%] h-[24%] cursor-pointer focus:outline-none ${
              minesTutorialPending ? 'rounded-xl ring-2 ring-amber-300/80 animate-pulse' : ''
            }`}
            title="Patrullas de la Mina de Plata"
            aria-label="Patrullas de la Mina de Plata"
          />
        </div>

        {/* Bottom Right: botón WORLD, igual que en el Santuario de Icespear */}
        <div className="relative z-20 self-end mb-20 mr-2 sm:mb-22 sm:mr-3 pointer-events-auto">
          <button
            onClick={() => {
              sound.playSFX('click');
              navigateTo('world');
            }}
            className="group relative flex flex-col items-center cursor-pointer hover:scale-106 active:scale-95 transition-transform"
            title="Abrir Mapa del Mundo"
          >
            <img
              src="/assets/items/WORLD BUTTON.png"
              alt="WORLD"
              className="w-16 h-16 sm:w-18 sm:h-18 object-contain filter drop-shadow-2xl"
            />
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // SURFACE ICESPEAR SANCTUARY VIEW
  // ----------------------------------------------------------------------
  return (
    <div className="relative w-full h-full min-h-[580px] flex-1 flex flex-col justify-between overflow-hidden select-none">
      {/* Village Hub Illustrated Artwork with Lights */}
      <img
        src="/assets/backgrounds/icespear_luces.png"
        alt="Santuario de Icespear Iluminado"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
      />

      {/* Atmospheric Cozy Warm Glows on Windows & Hearth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-5">
        {/* Forge Fireplace Glow */}
        <div className="absolute top-[62%] left-[17%] w-16 h-12 bg-amber-500/25 rounded-full blur-md animate-pulse" />
        {/* Inn Main Windows Glow */}
        <div className="absolute top-[42%] right-[28%] w-14 h-12 bg-yellow-400/20 rounded-full blur-md animate-pulse" />
        {/* Cottage Windows Glow */}
        <div className="absolute top-[69%] right-[28%] w-16 h-14 bg-amber-400/20 rounded-full blur-md animate-pulse" />
        {/* Castle Windows Glow */}
        <div className="absolute top-[17%] right-[25%] w-10 h-8 bg-amber-300/20 rounded-full blur-sm" />
        {/* Street Lantern Glows */}
        <div className="absolute bottom-[11%] left-[20%] w-8 h-8 bg-yellow-300/30 rounded-full blur-sm animate-ping opacity-60" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-[9%] right-[32%] w-8 h-8 bg-yellow-300/30 rounded-full blur-sm animate-ping opacity-60" style={{ animationDuration: '4s' }} />
      </div>

      {/* Top Header - Badges only */}
      <div className="relative z-10 p-2.5 sm:p-3 flex items-center justify-between gap-2">
        {/* Top Left Floating Badges */}
        <div className="flex items-center gap-2">
          {/* Theater Mask Badge (Bonds / Afecto) */}
          <button
            onClick={() => {
              sound.playSFX('click');
              setShowBondModal(true);
            }}
            className="w-10 h-10 rounded-full bg-gradient-to-b from-[#8f280a] to-[#3a0d02] border-2 border-[#d97706] shadow-xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform group"
            title="Vínculos y Afecto de Héroes"
          >
            <div className="w-7 h-7 rounded-full bg-[#f8fafc] border border-[#cbd5e1] flex items-center justify-center p-0.5 shadow-inner">
              <svg viewBox="0 0 24 24" className="w-full h-full text-purple-900 fill-current">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.41 2.87 8.19 6.84 9.5.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10.02 10.02 0 0 0 22 12c0-5.52-4.48-10-10-10z" />
              </svg>
            </div>
          </button>

          {/* Hexagon Crest Badge (Sanctuary Blessings / Idle Production) */}
          <button
            onClick={() => {
              sound.playSFX('click');
              setShowBlessingModal(true);
            }}
            className="relative w-10 h-10 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-transform group"
            title="Bendición del Manantial"
          >
            <img
              src="/assets/items/Insignia Mercado Negro app.png"
              alt="Insignia"
              className="w-full h-full object-contain filter drop-shadow-xl"
            />
            {idleEarningsAvailable > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 border border-white text-[7px] font-black text-black flex items-center justify-center animate-bounce shadow">
                !
              </span>
            )}
          </button>

        </div>
      </div>

      {/* Floating Notice Banner if collected tribute */}
      {claimedNotice && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-[#3b170c] border-2 border-amber-400 text-amber-200 px-4 py-1.5 rounded-lg text-xs font-bold shadow-2xl animate-fade-in pointer-events-none">
          {claimedNotice}
        </div>
      )}

      {/* Interactive Hotspots over Buildings */}
      <div className="relative z-10 flex-1 w-full pointer-events-auto">
        {/* Castle Hotspot (Upper Left) */}
        <button
          onClick={() => {
            sound.playSFX('click');
            navigateTo('quest');
          }}
          className="absolute top-[14%] left-[4%] w-[38%] h-[24%] rounded-2xl cursor-pointer group flex flex-col items-center justify-center focus:outline-none"
          title="Castillo de Icespear (Misiones)"
        />

        {/* Forge Hotspot (Bottom Left) */}
        <button
          onClick={() => {
            sound.playSFX('click');
            navigateTo('forge');
          }}
          className="absolute bottom-[22%] left-[4%] w-[42%] h-[26%] rounded-2xl cursor-pointer group flex flex-col items-center justify-center focus:outline-none"
          title="Herrería de Icespear (Forja y Armas)"
        />

        {/* Order / Clan Lodge Hotspot (Mountain Lodge under Waterfall - image_6578a593.png) */}
        <button
          onClick={() => {
            sound.playSFX('click');
            navigateTo('order');
          }}
          className="absolute top-[35%] right-[4%] w-[46%] h-[24%] rounded-2xl cursor-pointer group flex flex-col items-center justify-center focus:outline-none"
          title="Sede de la Orden de Icespear"
        />

        {/* Botica & Tienda de Pociones Hotspot (Center-Right village area) */}
        <button
          onClick={() => {
            sound.playSFX('skill');
            navigateTo('potions');
          }}
          className="absolute top-[48%] left-[38%] w-[26%] h-[22%] rounded-2xl cursor-pointer group flex flex-col items-center justify-center focus:outline-none"
          title="Botica de Pociones & Alquimia de Icespear"
        />

        {/* Tavern Hotspot (Bottom Right) */}
        <button
          onClick={() => {
            sound.playSFX('click');
            navigateTo('tavern');
          }}
          className="absolute bottom-[16%] right-[6%] w-[44%] h-[26%] rounded-2xl cursor-pointer group flex flex-col items-center justify-center focus:outline-none"
          title="Taberna de Icespear (Arlem & Magordito)"
        />
      </div>

      {/* Bottom Right: Authentic Circular WORLD Globe Button */}
      <div className="relative z-20 self-end mb-20 mr-2 sm:mb-22 sm:mr-3 pointer-events-auto">
        <button
          onClick={() => {
            sound.playSFX('click');
            navigateTo('world');
          }}
          className="group relative flex flex-col items-center cursor-pointer hover:scale-106 active:scale-95 transition-transform"
          title="Abrir Mapa del Mundo"
        >
          <img
            src="/assets/items/WORLD BUTTON.png"
            alt="WORLD"
            className="w-16 h-16 sm:w-18 sm:h-18 object-contain filter drop-shadow-2xl"
          />
        </button>
      </div>

      {/* Bond / Affection Modal */}
      {showBondModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
          <div className="wood-frame max-w-sm w-full p-5 rounded-2xl space-y-4 text-center border-2 border-amber-700 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-amber-900/60">
              <div className="flex items-center gap-2 text-amber-200 font-serif font-black text-sm">
                <Heart className="w-4 h-4 text-red-500 fill-current" />
                <span>Vínculos de Compañerismo</span>
              </div>
              <button
                onClick={() => setShowBondModal(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Pasa tiempo con tus héroes en la taberna y completa misiones conjuntas para desbloquear diálogos especiales y estadísticas pasivas de combate.
            </p>
            <div className="bg-[#1b0a04] border border-[#521c08] rounded-xl p-3 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-stone-300">
                <span>Magordito (Afecto Lv.4)</span>
                <span className="text-cyan-400 font-bold">+8% Daño Necrótico</span>
              </div>
              <div className="flex items-center justify-between text-stone-300">
                <span>Pepe Loux (Afecto Lv.3)</span>
                <span className="text-amber-400 font-bold">+8% Defensa</span>
              </div>
              <div className="flex items-center justify-between text-stone-300">
                <span>Kairon (Afecto Lv.5)</span>
                <span className="text-amber-400 font-bold">+10% Daño Sagrado</span>
              </div>
            </div>
            <button
              onClick={() => setShowBondModal(false)}
              className="w-full py-2 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Blessing / Tribute Modal */}
      {showBlessingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
          <div className="wood-frame max-w-sm w-full p-5 rounded-2xl space-y-4 text-center border-2 border-amber-700 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-amber-900/60">
              <div className="flex items-center gap-2 text-amber-200 font-serif font-black text-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Tributo del Santuario</span>
              </div>
              <button
                onClick={() => setShowBlessingModal(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              El Santuario de Icespear acumula tributo de oro de manera pasiva mientras exploras o descansas.
            </p>
            <div className="bg-[#1b0a04] border border-[#521c08] rounded-xl p-4 text-center space-y-2">
              <span className="text-xs text-stone-400 uppercase tracking-widest">Tributo Acumulado</span>
              <div className="text-2xl font-mono font-black text-amber-300">
                +{idleEarningsAvailable.toLocaleString()} Oro
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  handleClaimTribute();
                  setShowBlessingModal(false);
                }}
                disabled={idleEarningsAvailable <= 0}
                className={`flex-1 py-2 font-bold text-xs rounded-lg shadow-md transition-all ${
                  idleEarningsAvailable > 0
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black cursor-pointer'
                    : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  }`}
              >
                Reclamar Tributo
              </button>
              <button
                onClick={() => setShowBlessingModal(false)}
                className="py-2 px-4 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-lg cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
