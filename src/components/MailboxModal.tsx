import React from 'react';
import { useGame } from '../context/GameContext';
import { Check, Mail, Sparkles, Clock } from 'lucide-react';
import { sound } from '../services/soundService';

export const MailboxModal: React.FC = () => {
  const { isMailboxOpen, setIsMailboxOpen, mailItems, claimMailReward } = useGame();

  if (!isMailboxOpen) return null;

  const unclaimedCount = mailItems.filter((m) => !m.claimed).length;

  const handleClaimAll = () => {
    sound.playSFX('chime');
    mailItems.forEach((m) => {
      if (!m.claimed) {
        claimMailReward(m.id);
      }
    });
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playSFX('click');
          setIsMailboxOpen(false);
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 select-none animate-fade-in"
    >
      {/* Grand Parchment Modal Container matching user screenshot */}
      <div className="relative w-full max-w-[420px] sm:max-w-[440px] h-[78vh] sm:h-[650px] max-h-[88vh] flex flex-col">
        {/* Authentic Smooth Background Parchment Asset (fondo_mensajes.png) */}
        <img
          src="/assets/backgrounds/fondo_mensajes.png"
          alt="Pergamino de Notificaciones"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
        />

        {/* Authentic Red Wax Seal Close Button (sello_cerrar.png) on Top-Left */}
        <button
          type="button"
          onClick={() => {
            sound.playSFX('click');
            setIsMailboxOpen(false);
          }}
          className="absolute -top-3.5 -left-3.5 sm:-top-4 sm:-left-4 z-30 w-13 h-13 sm:w-16 sm:h-16 cursor-pointer hover:scale-105 active:scale-95 transition-transform group drop-shadow-[0_6px_10px_rgba(0,0,0,0.7)]"
          title="Cerrar Buzón"
          aria-label="Cerrar Buzón"
        >
          <img
            src="/assets/ui/sello_cerrar.png"
            alt="Cerrar"
            className="w-full h-full object-contain filter group-hover:brightness-110"
          />
        </button>

        {/* Inner Content Area (framed within the parchment lines) */}
        <div className="relative z-10 w-full h-full pt-8 sm:pt-10 pb-7 px-5 sm:px-7 flex flex-col">
          {/* Parchment Header */}
          <div className="pb-2 mb-2 border-b border-[#a8652d]/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-[#5c2406]" />
              <div>
                <h3 className="font-serif font-black text-[#3a1503] text-sm sm:text-base tracking-wide uppercase drop-shadow-[0_1px_0_rgba(255,225,185,0.8)] leading-tight">
                  Buzón de la Guarnición
                </h3>
                <p className="text-[10px] text-[#78401c] font-medium leading-none">
                  Avisos de Moonhaven y suministros imperiales
                </p>
              </div>
            </div>

            {/* Quick Claim All if multiple unclaimed rewards exist */}
            {unclaimedCount > 0 && (
              <button
                type="button"
                onClick={handleClaimAll}
                className="relative px-2.5 py-1 text-[11px] font-black text-amber-950 uppercase tracking-wider cursor-pointer hover:brightness-110 active:scale-95 transition-transform flex items-center justify-center shrink-0 shadow-sm"
                title="Reclamar todas las recompensas"
              >
                <img
                  src="/assets/items/BOTON BOTON TIENDA.png"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover rounded pointer-events-none"
                />
                <span className="relative z-10 px-1 drop-shadow-[0_1px_0_rgba(255,255,255,0.4)] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-900" />
                  Todo ({unclaimedCount})
                </span>
              </button>
            )}
          </div>

          {/* Scrollable Notification List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 no-scrollbar">
            {mailItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#753c18]">
                <Mail className="w-10 h-10 opacity-40 mb-2" />
                <p className="font-serif font-bold text-sm">Tu buzón está vacío</p>
                <p className="text-xs opacity-75">No hay mensajes pendientes de la guarnición.</p>
              </div>
            ) : (
              mailItems.map((mail) => (
                <div
                  key={mail.id}
                  className={`relative w-full rounded-md overflow-hidden transition-all filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] shrink-0 ${
                    mail.claimed ? 'opacity-90' : 'hover:scale-[1.01]'
                  }`}
                >
                  {/* Paper Background Asset (HISTORIA NIVEL BOTON.png) requested by user */}
                  <img
                    src="/assets/items/historia_nivel_boton.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                  />

                  {/* Notification Content on top of paper asset */}
                  <div className="relative z-10 p-3 sm:p-3.5 flex flex-col justify-between min-h-[112px]">
                    {/* Top Row: Sender & Date */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-serif font-black text-[#481c03] text-xs truncate drop-shadow-[0_1px_0_rgba(255,230,195,0.7)]">
                          {mail.sender}
                        </span>
                        {!mail.claimed && (
                          <span className="px-1.5 py-0.2 rounded-full bg-red-600/90 text-white text-[9px] font-black uppercase tracking-wider animate-pulse shadow-xs">
                            ¡Nuevo!
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-[#7a411d] font-mono shrink-0">
                        <Clock className="w-2.5 h-2.5 opacity-70" />
                        <span>{mail.date}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="font-serif font-extrabold text-[#240c02] text-xs sm:text-[13px] leading-tight my-1">
                      {mail.title}
                    </h4>

                    {/* Body */}
                    <p className="text-[11px] text-[#47220d] leading-snug font-medium mb-2 line-clamp-3">
                      {mail.body}
                    </p>

                    {/* Bottom Row: Rewards & Claim Button */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#9d602a]/30">
                      {/* Rewards */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {mail.rewardGold && (
                          <div className="flex items-center gap-1 bg-[#3a1805]/15 px-2 py-0.5 rounded-full border border-[#854516]/30">
                            <img
                              src="/assets/items/moneda_de_moonhaven.png"
                              alt="Oro"
                              className="w-3.5 h-3.5 object-contain"
                            />
                            <span className="font-mono font-bold text-[#451b03] text-[11px]">
                              +{mail.rewardGold.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {mail.rewardCrystals && (
                          <div className="flex items-center gap-1 bg-[#3a1805]/15 px-2 py-0.5 rounded-full border border-[#854516]/30">
                            <img
                              src="/assets/items/gema_del_recuerdo.png"
                              alt="Cristales del Recuerdo"
                              className="w-3.5 h-3.5 object-contain"
                            />
                            <span className="font-mono font-bold text-[#0c3c52] text-[11px]">
                              +{mail.rewardCrystals}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Claim Action */}
                      {(mail.rewardGold || mail.rewardCrystals) && (
                        <div>
                          {mail.claimed ? (
                            <div className="px-2.5 py-0.5 text-[10px] font-bold text-[#6d3e21] bg-[#4a240e]/15 border border-[#824c28]/40 rounded flex items-center gap-1">
                              <Check className="w-3 h-3 text-[#2d6a4f]" />
                              <span>Reclamado</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                sound.playSFX('chime');
                                claimMailReward(mail.id);
                              }}
                              className="relative px-3 py-1 text-xs font-black text-amber-950 uppercase tracking-wide cursor-pointer hover:brightness-110 active:scale-95 transition-transform flex items-center justify-center shrink-0 shadow-sm"
                            >
                              <img
                                src="/assets/items/BOTON BOTON TIENDA.png"
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover rounded pointer-events-none"
                              />
                              <span className="relative z-10 px-1 drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
                                Reclamar
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
