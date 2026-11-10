import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { TavernKitchenView } from './TavernKitchenView';
import { Beer, MessageCircle, Clock, Sparkles, X, UtensilsCrossed } from 'lucide-react';

const MAGORDITO_LINES = [
  "¿'Magordito'? Un viejo apodo irónico para despistar a los incautos antes de que prueben mis artes oscuras.",
  "La nigromancia exige una voluntad inquebrantable. Dominar la energía de la muerte no es un juego de niños.",
  "¿Ves ese reloj con ojos? Perteneció a un brujo que creyó que podía medir mi poder. Ahora solo cuenta mis victorias.",
  "Si los bandidos o los orcos causan problemas en las afueras, avísame. Mis rayos necróticos tienen hambre.",
  "¡Sirve otra jarra bien fría! Nada como un buen trago tras doblegar el vacío oscuro.",
  "¡El fogón de piedra está al rojo vivo! Si traes ingredientes, podemos cocinar banquetes que otorgan bufos brutales en combate.",
];

export const TavernView: React.FC = () => {
  const { gold, addGold, navigateTo, activeSanctuary, setActiveSanctuary } = useGame();
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCookingOpen, setIsCookingOpen] = useState(false);

  const handleTalkMagordito = () => {
    sound.playSFX('click');
    setDialogueIndex((prev) => (prev + 1) % MAGORDITO_LINES.length);
    setShowSpeechBubble(true);
  };

  const handleDrinkBeer = () => {
    if (gold >= 50) {
      sound.playSFX('coin');
      addGold(-50);
      setToastMessage('¡Has bebido cerveza de Icespear! (+10% Moral para el próximo combate)');
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      sound.playSFX('hurt');
      setToastMessage('¡No tienes suficiente oro para una jarra!');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleOpenSecretDoor = () => {
    sound.playSFX('lockpick');
    setToastMessage('Cruzando la puerta secreta hacia el Santuario Subterráneo...');
    setTimeout(() => {
      setActiveSanctuary('mercado_negro');
      navigateTo('santuario');
    }, 350);
  };

  const handleOpenKitchen = () => {
    sound.playSFX('powerup');
    navigateTo('cooking');
  };

  if (isCookingOpen) {
    return <TavernKitchenView onClose={() => setIsCookingOpen(false)} />;
  }

  return (
    <div className="relative w-full h-full min-h-[580px] flex-1 flex flex-col justify-between overflow-hidden select-none">
      {/* Tavern Interior Illustration */}
      <img
        src="/assets/aistudio/image_14e93a8e.png"
        alt="Interior de la Taberna"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />

      {/* Toast Alert Notice */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-[#3b170c] border-2 border-amber-400 text-amber-200 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl animate-fade-in text-center max-w-xs">
          {toastMessage}
        </div>
      )}

      {/* Interactive Magordito Speech Bubble */}
      {showSpeechBubble && (
        <div className="absolute bottom-[24%] left-[6%] right-[6%] z-30 bg-[#fef3c7] text-[#451a03] p-3 rounded-xl border-2 border-[#b45309] shadow-2xl text-xs leading-relaxed font-serif animate-fade-in">
          <div className="flex items-center justify-between pb-1 border-b border-[#b45309]/30 mb-1">
            <span className="font-black text-amber-900">Magordito • Nigromante Colosal (2m Mazado)</span>
            <button
              onClick={() => setShowSpeechBubble(false)}
              className="text-amber-800 font-bold hover:text-red-700 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p>{MAGORDITO_LINES[dialogueIndex]}</p>
        </div>
      )}

      {/* Tavern Interactive Zones */}
      <div className="relative z-10 flex-1 w-full">
        {/* ============================================================== */}
        {/* HORNO / FOGÓN DE LA TABERNA (Interactive Hearth / Cooking Oven) */}
        {/* ============================================================== */}
        <div className="absolute top-[40%] left-[2%] w-[42%] h-[35%] z-20">
          {/* Hotspot Button on the Chimney Hearth */}
          <button
            onClick={handleOpenKitchen}
            className="w-full h-full cursor-pointer focus:outline-none flex flex-col items-center justify-end pb-3"
            title="Horno de la Taberna • Toca para Cocinar Platos (Estilo 7DS Grand Cross)"
            aria-label="Abrir Menú de Cocina del Horno"
          >
          </button>
        </div>

        {/* Magordito Hotspot (Colossal Necromancer at table) */}
        <button
          onClick={handleTalkMagordito}
          className="absolute bottom-[2%] left-[24%] w-[52%] h-[40%] rounded-full cursor-pointer focus:outline-none"
          title="Hablar con Magordito (Nigromante Colosal)"
        />

        {/* Secret Door to Underground Sanctuary (Right wall behind bar) */}
        <button
          onClick={handleOpenSecretDoor}
          className="absolute top-[28%] right-[2%] w-[29%] h-[42%] rounded-t-full cursor-pointer focus:outline-none"
          title="Puerta"
          aria-label="Puerta al Santuario Subterráneo"
        />

        {/* Tavern Action Buttons Row (Top Right) */}
        <div className="absolute top-4 right-3 z-20 flex flex-col gap-2">
          {/* Quick Cook Button */}
          <button
            onClick={handleOpenKitchen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-700 via-amber-700 to-amber-600 hover:from-orange-600 hover:to-amber-500 text-white font-bold text-xs border border-amber-300 shadow-xl cursor-pointer active:scale-95 transition-all"
            title="Abrir Horno de Cocina"
          >
            <UtensilsCrossed className="w-4 h-4 text-yellow-300" />
            <span>Cocinar Platos</span>
          </button>

          {/* Tavern Drink Beer Button */}
          <button
            onClick={handleDrinkBeer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-xs border border-amber-400/60 shadow-xl cursor-pointer active:scale-95 transition-all"
            title="Pedir Cerveza Helada (50 Oro)"
          >
            <Beer className="w-4 h-4 text-amber-300" />
            <span>Pedir Trago (50$)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
