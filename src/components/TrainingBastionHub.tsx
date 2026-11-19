import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { Heart, Sparkles, X, Shield, Swords, FlaskConical, Castle } from 'lucide-react';
import { AuctionHouseModal } from './AuctionHouseModal';

export const TrainingBastionHub: React.FC<{ onBackToLibrary: () => void }> = ({ onBackToLibrary }) => {
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
          src="/assets/aistudio/image_159218c1.webp"
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
                src="/assets/items/Insignia Mercado Negro app.webp"
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
                src="/assets/items/Inventary_Button.webp"
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
              src="/assets/backgrounds/icespear SANTUARIO BUTTON.webp"
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
  // SURFACE ICESPEAR SANCTUARY VIEW
  // ----------------------------------------------------------------------
  return (
    <div className="relative w-full h-full min-h-0 flex-1 flex flex-col overflow-hidden select-none bg-[#090d18]">
      {/* Fondo de Icespear reutilizado del santuario original */}
      <img
        src="/assets/backgrounds/icespear_luces.webp"
        alt="Icespear"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#07101e]/55 via-[#08101d]/35 to-[#05070d]/90 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(69,139,190,0.28),transparent_58%)] pointer-events-none" />

      {/* Accesos rápidos de vínculos y tributo */}
      <div className="relative z-20 flex items-center justify-between px-3 pt-2 pb-1 shrink-0 gap-2">
        <button
          onClick={() => { sound.playSFX('click'); onBackToLibrary(); }}
          className="w-9 h-9 shrink-0 rounded-lg border border-amber-300/60 bg-[#160e0b]/90 text-amber-100 shadow-lg flex items-center justify-center"
          title="Volver al Bastión"
          aria-label="Volver al Bastión"
        ><span className="text-xl leading-none">‹</span></button>
        <button
          onClick={() => { sound.playSFX('click'); setShowBondModal(true); }}
          className="flex items-center gap-2 rounded-full border border-amber-300/45 bg-[#160e0b]/85 px-3 py-1.5 shadow-lg"
          title="Vínculos de héroes"
        >
          <span className="text-rose-300 text-sm">♥</span>
          <span className="text-[10px] font-bold tracking-wide text-amber-100">VÍNCULOS</span>
        </button>
        <button
          onClick={() => { sound.playSFX('click'); setShowBlessingModal(true); }}
          className="relative flex items-center gap-2 rounded-full border border-amber-300/45 bg-[#160e0b]/85 px-3 py-1.5 shadow-lg"
          title="Tributo del santuario"
        >
          <img src="/assets/items/Insignia Mercado Negro app.webp" alt="" className="w-5 h-5 object-contain" />
          <span className="text-[10px] font-bold text-amber-100">TRIBUTO</span>
          {idleEarningsAvailable > 0 && <span className="absolute -right-1 -top-1 w-3 h-3 rounded-full bg-red-500 border border-amber-100 animate-pulse" />}
        </button>
      </div>

      {claimedNotice && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 bg-[#3b170c] border-2 border-amber-400 text-amber-200 px-4 py-1.5 rounded-lg text-xs font-bold shadow-2xl pointer-events-none">
          {claimedNotice}
        </div>
      )}

      {/* Tablero de actividades: tarjetas ilustradas con navegación real */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto no-scrollbar px-2.5 pt-1 pb-2 space-y-[7px]">
        <div className="px-1 flex items-end justify-between">
          <div>
            <div className="text-[9px] uppercase tracking-[0.28em] text-sky-200/80 font-bold">Santuario de Icespear</div>
            <h2 className="text-[19px] leading-tight font-serif font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">Centro de actividades</h2>
          </div>
          <div className="text-[9px] uppercase tracking-widest text-amber-200/80 pb-1">Aventuras</div>
        </div>

        {/* Actividad destacada */}
        <button
          onClick={() => { sound.playSFX('click'); navigateTo('quest'); }}
          className="group relative w-full h-[126px] overflow-hidden rounded-lg border-[3px] border-[#b1844b] shadow-[0_5px_14px_rgba(0,0,0,0.8)] text-left ring-1 ring-black/70"
          title="Misiones especiales"
        >
          <img src="/assets/backgrounds/fondo_quest.webp" alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#17051e]/95 via-[#25072e]/45 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-white/5" />
          <div className="absolute left-4 bottom-3">
            <span className="inline-block rounded-full border border-fuchsia-200/60 bg-fuchsia-950/75 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] text-fuchsia-100">Contenido especial</span>
            <div className="mt-1 text-[21px] font-serif font-black italic text-white drop-shadow-[0_2px_3px_#000]">Misiones especiales</div>
            <div className="text-[9px] font-semibold text-amber-100/90">Explora mazmorras y desafíos</div>
          </div>
          <div className="absolute right-3 bottom-3 rounded-full border border-amber-200/70 bg-black/55 px-3 py-1 text-[9px] font-black text-amber-100">ENTRAR ›</div>
        </button>

        {/* Farmeo de oro */}
        <button
          onClick={() => { sound.playSFX('coin'); navigateTo('quest'); }}
          className="group relative w-full h-[108px] overflow-hidden rounded-lg border-[3px] border-[#b18b50] shadow-[0_5px_13px_rgba(0,0,0,0.75)] text-left ring-1 ring-black/70"
          title="Misiones de oro"
        >
          <img src="/assets/backgrounds/FONDO TIENDA.webp" alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#120d09]/95 via-[#24170b]/55 to-transparent" />
          <div className="absolute left-3 bottom-2.5">
            <div className="text-[8px] font-black uppercase tracking-[0.22em] text-amber-200">Recursos</div>
            <div className="text-[23px] leading-none font-serif font-black italic text-white drop-shadow-[0_2px_3px_#000]">Oro</div>
            <div className="mt-1 text-[9px] font-semibold text-amber-100">Completa pruebas y consigue monedas</div>
          </div>
          <img src="/assets/items/oro.webp" alt="" className="absolute right-5 top-1/2 -translate-y-1/2 w-[76px] h-[76px] object-contain drop-shadow-[0_3px_7px_rgba(0,0,0,0.9)]" />
          <div className="absolute right-2 bottom-2 rounded-full bg-black/65 border border-amber-200/60 px-2 py-1 text-[8px] font-black text-amber-100">FARMEAR ›</div>
        </button>

        {/* Evolución y mejora */}
        <div className="grid grid-cols-2 gap-[7px]">
          <button
            onClick={() => { sound.playSFX('click'); navigateTo('heroes'); }}
            className="group relative h-[112px] overflow-hidden rounded-lg border-[3px] border-[#a77b49] shadow-[0_5px_13px_rgba(0,0,0,0.75)] text-left ring-1 ring-black/70"
            title="Evolucionar héroes"
          >
            <img src="/assets/backgrounds/fondo_personajes.webp" alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#100718]/95 via-[#160c20]/30 to-transparent" />
            <img src="/assets/items/ascender boton.webp" alt="" className="absolute left-1 top-1 w-12 h-12 object-contain drop-shadow-lg" />
            <div className="absolute left-2 bottom-2">
              <div className="text-[17px] leading-none font-serif font-black italic text-white drop-shadow-[0_2px_3px_#000]">Evolucionar</div>
              <div className="text-[8px] font-bold text-amber-200 mt-1">Despierta su potencial</div>
            </div>
            <span className="absolute right-2 top-2 text-amber-200 text-lg drop-shadow">›</span>
          </button>

          <button
            onClick={() => { sound.playSFX('skill'); navigateTo('forge'); }}
            className="group relative h-[116px] overflow-hidden rounded-xl border-[3px] border-[#8c633d] shadow-[0_5px_13px_rgba(0,0,0,0.7)] text-left"
            title="Mejora de equipo"
          >
            <img src="/assets/backgrounds/FONDO HERRERIA.webp" alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#100b08]/95 via-[#160c20]/25 to-transparent" />
            <img src="/assets/items/mejorar equipo boton.webp" alt="" className="absolute left-1 top-1 w-12 h-12 object-contain drop-shadow-lg" />
            <div className="absolute left-2 bottom-2">
              <div className="text-[19px] leading-none font-serif font-black italic text-white drop-shadow-[0_2px_3px_#000]">Mejora</div>
              <div className="text-[8px] font-bold text-amber-200 mt-1">Refuerza tu equipamiento</div>
            </div>
            <span className="absolute right-2 top-2 text-amber-200 text-lg drop-shadow">›</span>
          </button>
        </div>

        {/* Evento de batalla */}
        <button
          onClick={() => { sound.playSFX('click'); navigateTo('quest'); }}
          className="group relative w-full h-[82px] overflow-hidden rounded-lg border-[3px] border-[#b18b50] shadow-[0_5px_13px_rgba(0,0,0,0.75)] text-left ring-1 ring-black/70"
          title="Eventos de batalla"
        >
          <img src="/assets/backgrounds/fondo_historia.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071827]/90 via-[#102b38]/45 to-[#17080a]/55" />
          <div className="absolute left-3 bottom-2">
            <div className="text-[18px] leading-none font-serif font-black italic text-white drop-shadow-[0_2px_3px_#000]">Evento de batalla</div>
            <div className="text-[8px] font-bold text-sky-100 mt-1">Desafíos y recompensas especiales</div>
          </div>
          <div className="absolute right-3 top-2 rounded-md border border-cyan-200/70 bg-cyan-950/75 px-2 py-1 text-[8px] font-black text-cyan-100">EVENTO</div>
          <span className="absolute right-3 bottom-2 text-amber-100 text-lg">›</span>
        </button>

        {/* Acceso al mapa */}
        <button
          onClick={() => { sound.playSFX('click'); navigateTo('world'); }}
          className="mx-auto flex items-center gap-2 rounded-full border border-sky-200/45 bg-gradient-to-b from-[#132d42]/90 to-[#07111d]/95 px-4 py-1.5 shadow-[0_3px_10px_rgba(0,0,0,0.8)]"
          title="Mapa del mundo"
        >
          <img src="/assets/items/WORLD BUTTON.webp" alt="" className="w-6 h-6 object-contain" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-sky-100">Mapa del mundo</span>
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
