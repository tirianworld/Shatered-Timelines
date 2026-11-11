import React from 'react';
import { useGame } from '../context/GameContext';
import { getMaterialSources } from '../data/materialSources';
import { X, Compass, ArrowRight } from 'lucide-react';
import { sound } from '../services/soundService';

interface MaterialSourcesModalProps {
  material: {
    name: string;
    icon: string;
    have?: number;
    need?: number;
  };
  onClose: () => void;
}

/**
 * Aviso de "dónde conseguirlo" al pulsar un material que falta, al estilo de 7DS:
 * icono del material, cuánto tienes y una lista de sitios con acceso directo.
 */
export const MaterialSourcesModal: React.FC<MaterialSourcesModalProps> = ({ material, onClose }) => {
  const { navigateTo } = useGame();
  const sources = getMaterialSources(material.name, material.icon);
  const missing = typeof material.need === 'number' && typeof material.have === 'number' ? material.need - material.have : null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/85 p-3 sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border-2 border-[#c9a15d] bg-gradient-to-b from-[#2a1d10] to-[#140c06] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center gap-3 px-4 py-3 border-b border-[#7a5a2a]/70 bg-gradient-to-b from-[#3a2a16] to-[#241708]">
          <div className="w-12 h-12 rounded-lg border border-[#c9a15d]/70 bg-black/60 flex items-center justify-center overflow-hidden shrink-0">
            <img src={material.icon} alt={material.name} className="w-10 h-10 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif font-black text-[#f3dfb2] text-sm truncate">{material.name}</h3>
            <p className="text-[10.5px] text-stone-400">
              {missing !== null && missing > 0 ? (
                <>
                  Te faltan <b className="text-rose-300">{missing}</b> · tienes {material.have}/{material.need}
                </>
              ) : (
                'Dónde conseguirlo'
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#e8d4a8] hover:text-white p-1 rounded-md bg-black/40 cursor-pointer shrink-0"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 space-y-2">
          {sources.map((source) => (
            <div
              key={source.title}
              className="flex items-center gap-2.5 rounded-xl border border-stone-700/70 bg-stone-900/70 px-2.5 py-2"
            >
              <Compass className="w-4 h-4 text-[#c9a15d] shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[11.5px] font-bold text-[#f0c477]">{source.title}</div>
                <div className="text-[10px] text-stone-400 leading-snug">{source.detail}</div>
              </div>
              {source.tab && (
                <button
                  onClick={() => {
                    sound.playSFX('click');
                    onClose();
                    navigateTo(source.tab as string);
                  }}
                  className="shrink-0 flex items-center gap-0.5 px-2 py-1 rounded-md border border-[#c9a15d]/70 bg-[#3a2a16] text-[10px] font-bold text-[#f0c477] hover:brightness-110 cursor-pointer"
                >
                  {source.action ?? 'Ir'}
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="px-3 pb-3">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg border border-stone-600 bg-stone-800 text-[11px] font-bold text-stone-300 cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
