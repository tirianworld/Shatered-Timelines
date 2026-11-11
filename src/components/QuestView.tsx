import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { safeStorage } from '../utils/storage';
import { X, CheckCircle2, Sparkles } from 'lucide-react';
import { AutoRepeatModal } from './AutoRepeatModal';

interface QuestMission {
  id: string;
  title: string;
  iconType: 'boss' | 'swords' | 'skull';
  difficulty: 'Facil' | 'Normal' | 'Dificil' | 'Extremo' | 'Pesadilla';
  description: string;
  portrait: string;
  portraitClass?: string;
  stageId: string;
  isStory?: boolean;
}

export const QuestView: React.FC = () => {
  const {
    questProgress,
    activeQuestChapter,
    setActiveQuestChapter,
    setSelectedCombatMissionId,
    navigateTo,
    addGold,
    addCrystals,
    addShelfItem,
  } = useGame();

  const isChapter2Unlocked =
    questProgress.completedMissions.includes('m4_puertas_selladas') ||
    questProgress.chapter >= 2;

  const isChapter3Unlocked =
    questProgress.completedMissions.includes('m7_epilogo_aldea') ||
    questProgress.completedMissions.includes('m6_puerta_laberinto') ||
    questProgress.chapter >= 3;


  // Chapter 1 missions - Exclusively Icespear story & boss (no cave missions)
  const chapter1Missions: QuestMission[] = [
    {
      id: 'm1_tirano',
      title: 'El Tirano de Hielo',
      iconType: 'boss',
      difficulty: 'Facil',
      description:
        'El Capitán Gabriel odia a los aventureros, pero la bestia Cryovain ha masacrado a su guardia.',
      portrait: '/assets/portraits/capitan_gabriel_clean.png',
      portraitClass: 'scale-[1.12] translate-y-1 object-center',
      stageId: 'stage_1',
      isStory: true,
    },
    {
      id: 'm2_robo',
      title: 'Robo no tan Justo',
      iconType: 'swords',
      difficulty: 'Facil',
      description:
        '¡El asalto a la mansión ha salido a la luz! Supera las 4 oleadas de la guardia urbana en el callejón y derrota al Sargento Acorazado.',
      portrait: '/assets/combat/guardia_pesado_clean.png',
      portraitClass: 'scale-[1.88] origin-top translate-y-[2px]',
      stageId: 'stage_2',
      isStory: false,
    },
    {
      id: 'm3_bosque',
      title: 'Pisadas en la Nieve',
      iconType: 'swords',
      difficulty: 'Normal',
      description:
        '¡Caldo de Dragón huye al bosque invernal! Un viejo vagabundo revela el secreto de la antigua colonia minera de plata de Glimmerstone... ¡emboscada goblin!',
      portrait: '/assets/combat/goblin_garrote_clean.png',
      portraitClass: 'scale-[1.95] origin-top translate-y-[8px]',
      stageId: 'stage_3_bosque',
      isStory: false,
    },
    {
      id: 'm4_puertas_selladas',
      title: 'Las Puertas Selladas',
      iconType: 'boss',
      difficulty: 'Dificil',
      description:
        '¡Las colosales puertas enanas de Glimmerstone están selladas bajo el hielo! Enfréntate al Devorador Quitinoso en 2 fases para obtener su Coraza y codiciada Carne de Devorador para la cocina.',
      portrait: '/assets/combat/devorador_quitinoso_clean.png',
      portraitClass: 'scale-[1.5] origin-top translate-y-[2px]',
      stageId: 'stage_puertas_selladas',
      isStory: false,
    },
  ];

  // Chapter 2 missions - The subterranean depths of Las Minas de Glimmerstone
  const chapter2Missions: QuestMission[] = [
    {
      id: 'm5_minas_historia',
      title: 'Bajo la Montaña',
      iconType: 'boss',
      difficulty: 'Facil',
      description:
        'Caldo de Dragón cruza las Puertas Selladas descubriendo signos de actividad, una colonia enana aislada y un altivo emisario drow.',
      portrait: '/assets/portraits/enanos_mineros_thumb.png',
      portraitClass: 'scale-[1.12] translate-y-0.5 object-center',
      stageId: 'stage_cuevas_historia',
      isStory: true,
    },
    {
      id: 'm3_cuevas_rojo',
      title: 'Furia Carmesí',
      iconType: 'boss',
      difficulty: 'Normal',
      description:
        'Edacorn penetra en la cámara de cría de las cuevas carmesí y despierta sus alas espectrales. ¡Obtén valiosos Huevos y Larvas de Araknoide para la cocina de la taberna!',
      portrait: '/assets/portraits/edacorn_alas_thumb.png',
      portraitClass: 'scale-[1.12] translate-y-0.5 object-center',
      stageId: 'stage_cuevas_rojo',
      isStory: true,
    },
    {
      id: 'm4_cuevas_azul',
      title: 'Infección Glacial',
      iconType: 'boss',
      difficulty: 'Dificil',
      description:
        'Pepe Loux llega a una caverna congelada y halla a un enano semicongelado mutando por un virus parásito en la roca. ¡Erradica a los 4 acechadores gélidos!',
      portrait: '/assets/portraits/enano_infectado_thumb.png',
      portraitClass: 'scale-[1.12] translate-y-0.5 object-center',
      stageId: 'stage_cuevas_azul',
      isStory: true,
    },
    {
      id: 'm5_cuevas_zancudo',
      title: 'El Zancudo Espectral',
      iconType: 'boss',
      difficulty: 'Dificil',
      description:
        'El grupo se reúne ante la entrada prohibida al corazón de la colonia en el Underdark. Un pacto obligado con el drow y una emboscada con invocaciones os aguardan.',
      portrait: '/assets/combat/semiboss_zancudo_clean.png',
      portraitClass: 'scale-[1.8] origin-top translate-y-[10px]',
      stageId: 'stage_cuevas_zancudo',
      isStory: true,
    },
    {
      id: 'm6_puerta_laberinto',
      title: 'El Laberinto de Lloth',
      iconType: 'skull',
      difficulty: 'Pesadilla',
      description:
        '¡Penúltima Cinemática de Capítulo! Ante las monumentales puertas arácnidas, Lord Vaelas revela la oscura verdad del artefacto y desata su traición.',
      portrait: '/assets/portraits/drow_vaelas_llave_thumb.png',
      portraitClass: 'scale-[1.25] translate-y-0.5 object-center',
      stageId: 'stage_puerta_laberinto',
      isStory: true,
    },
    {
      id: 'm7_epilogo_aldea',
      title: 'El Retorno a Glimmerstone',
      iconType: 'boss',
      difficulty: 'Pesadilla',
      description:
        '¡Cinemática Final y Epílogo del Capítulo 2! Caldo de Dragón llega a la aldea enana para anunciar la verdad y la apertura de las minas. Tras ello, en el laberinto, una misteriosa figura acecha...',
      portrait: '/assets/portraits/drow_vaelas_despeinado_thumb.png',
      portraitClass: 'scale-[1.25] translate-y-0.5 object-center',
      stageId: 'stage_epilogo_aldea',
      isStory: true,
    },
  ];

  // Chapter 3 missions - The path through the snowy forest towards El Mercado Negro
  const chapter3Missions: QuestMission[] = [
    {
      id: 'm8_intro_capitulo3',
      title: 'El Campamento Orco',
      iconType: 'boss',
      difficulty: 'Facil',
      description:
        '¡Cinemática de Apertura del Capítulo 3! Caldo de Dragón sale de las minas al bosque nevado y divisa un campamento de orcos de élite. Arlem urde una desternillante estratagema con magia de ilusión...',
      portrait: '/assets/portraits/arlem_orco_thumb.png',
      portraitClass: 'scale-[1.25] translate-y-0.5 object-center',
      stageId: 'stage_intro_capitulo3',
      isStory: true,
    },
    {
      id: 'm9_emboscada_ferton',
      title: 'Los Guardias de Ferton',
      iconType: 'skull',
      difficulty: 'Pesadilla',
      description:
        '¡Combate en el Camino Nevado! Una comitiva clandestina con armaduras de ébano y oro carga suministros por orden de un Capataz Hobgoblin: "¡Cargadlas muchachos, Ferton no espera!". ¡Sobrevive a 3 oleadas de lanceros, ballesteros y caballeros acorazados!',
      portrait: '/assets/portraits/guarda_negro_espada_thumb.png',
      portraitClass: 'scale-[1.25] translate-y-0.5 object-center',
      stageId: 'stage_camino_ferton',
      isStory: true,
    },
    {
      id: 'm10_hobgoblin_boss',
      title: 'El Capataz de Ferton',
      iconType: 'boss',
      difficulty: 'Pesadilla',
      description:
        '¡Duelo a Muerte contra el Capataz Hobgoblin! Tras la caída de su guardia, el furioso comandante insulta a sus soldados y se encara con Caldo de Dragón. ¡Una encarnizada boss fight en 3 fases: cuerpo a cuerpo, granadas alquímicas y su letal arma de fuego!',
      portrait: '/assets/portraits/hobgoblin_capataz_thumb.png',
      portraitClass: 'scale-[1.25] translate-y-0.5 object-center',
      stageId: 'stage_duelo_hobgoblin',
      isStory: true,
    },
  ];

  // Active missions list based on selected chapter
  const missions =
    activeQuestChapter === 3 && isChapter3Unlocked
      ? chapter3Missions
      : activeQuestChapter === 2 && isChapter2Unlocked
      ? chapter2Missions
      : chapter1Missions;
  const currentChapter =
    activeQuestChapter === 3 && isChapter3Unlocked
      ? 3
      : activeQuestChapter === 2 && isChapter2Unlocked
      ? 2
      : 1;

  // Chest claimed states per chapter
  const [chestClaimedCh1, setChestClaimedCh1] = useState<boolean>(() => {
    return safeStorage.getItem('cdd_quest_chest_ch1_claimed') === 'true';
  });
  const [chestClaimedCh2, setChestClaimedCh2] = useState<boolean>(() => {
    return safeStorage.getItem('cdd_quest_chest_ch2_claimed') === 'true';
  });
  const [chestClaimedCh3, setChestClaimedCh3] = useState<boolean>(() => {
    return safeStorage.getItem('cdd_quest_chest_ch3_claimed') === 'true';
  });
  const [showChestModal, setShowChestModal] = useState(false);
  const [autoRepeatMission, setAutoRepeatMission] = useState<QuestMission | null>(null);


  // Content scroll & drag interaction (no visible scrollbar, drag to scroll)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isContentDragging = useRef(false);
  const contentStartY = useRef(0);
  const contentStartScroll = useRef(0);

  const handleContentPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    isContentDragging.current = true;
    contentStartY.current = e.clientY;
    contentStartScroll.current = scrollContainerRef.current?.scrollTop || 0;
  };

  const handleContentPointerMove = (e: React.PointerEvent) => {
    if (!isContentDragging.current || !scrollContainerRef.current) return;
    const deltaY = e.clientY - contentStartY.current;
    scrollContainerRef.current.scrollTop = contentStartScroll.current - deltaY;
  };

  const handleContentPointerUp = () => {
    isContentDragging.current = false;
  };

  // Dynamic completed missions count for current chapter
  const completedCount = missions.filter((m) =>
    questProgress.completedMissions.includes(m.id)
  ).length;

  const totalCount = missions.length;
  const isChapterFullyCompleted = completedCount >= totalCount;

  const getDifficultyColor = (diff: QuestMission['difficulty']) => {
    switch (diff) {
      case 'Facil':
        return 'text-[#15803d]';
      case 'Normal':
        return 'text-[#0284c7]';
      case 'Dificil':
        return 'text-[#9333ea]';
      case 'Extremo':
        return 'text-[#ea580c]';
      case 'Pesadilla':
        return 'text-[#dc2626]';
      default:
        return 'text-[#15803d]';
    }
  };

  const handleLaunchMission = (mission: QuestMission, forceStory = false) => {
    sound.playSFX('click');
    if (
      (mission.id === 'm1_tirano' ||
        mission.id === 'm2_robo' ||
        mission.id === 'm3_bosque' ||
        mission.id === 'm4_puertas_selladas' ||
        mission.id === 'm5_minas_historia' ||
        mission.id === 'm8_intro_capitulo3' ||
        mission.id === 'm9_emboscada_ferton' ||
        mission.id === 'm10_hobgoblin_boss' ||
        mission.isStory) &&
      (!questProgress.completedMissions.includes(mission.id) || forceStory || mission.isStory)
    ) {
      if (forceStory && questProgress.completedMissions.includes(mission.id)) {
        if (mission.id === 'm10_hobgoblin_boss') {
          setSelectedCombatMissionId('m10_hobgoblin_boss_epilogo');
        } else if (mission.id === 'm9_emboscada_ferton') {
          setSelectedCombatMissionId('m9_emboscada_ferton_epilogo');
        } else if (mission.id === 'm2_robo') {
          setSelectedCombatMissionId('m2_robo_epilogo');
        } else if (mission.id === 'm3_bosque') {
          setSelectedCombatMissionId('m3_bosque_epilogo');
        } else if (mission.id === 'm4_puertas_selladas') {
          setSelectedCombatMissionId('m4_puertas_selladas_epilogo');
        } else if (mission.id === 'm3_cuevas_rojo') {
          setSelectedCombatMissionId('m3_cuevas_rojo_epilogo');
        } else if (mission.id === 'm4_cuevas_azul') {
          setSelectedCombatMissionId('m4_cuevas_azul_epilogo');
        } else if (mission.id === 'm5_cuevas_zancudo') {
          setSelectedCombatMissionId('m5_cuevas_zancudo_epilogo');
        } else {
          setSelectedCombatMissionId(mission.id);
        }
      } else {
        setSelectedCombatMissionId(mission.id);
      }
      navigateTo('story');
      return;
    }
    setSelectedCombatMissionId(mission.id);
    navigateTo('combat');
  };

  const handleClaimChest = () => {
    sound.playSFX('victory');
    if (currentChapter === 1) {
      if (!chestClaimedCh1 && isChapterFullyCompleted) {
        addGold(15000);
        addCrystals(500);
        setChestClaimedCh1(true);
        safeStorage.setItem('cdd_quest_chest_ch1_claimed', 'true');
      }
    } else if (currentChapter === 2) {
      if (!chestClaimedCh2 && isChapterFullyCompleted) {
        addGold(25000);
        addCrystals(800);
        addShelfItem({
          id: 'recompensa_mina_plata',
          name: 'Veta de Plata Pura de Glimmerstone',
          category: 'materials',
          count: 5,
          icon: '/assets/items/lingote_plata_app.png',
          rarity: 'SSR',
          priceGold: 5000,
          description: 'Lingotes de plata pura extraídos de las profundidades de Glimmerstone.',
        });
        setChestClaimedCh2(true);
        safeStorage.setItem('cdd_quest_chest_ch2_claimed', 'true');
      }
    } else {
      if (!chestClaimedCh3 && isChapterFullyCompleted) {
        addGold(35000);
        addCrystals(1200);
        addShelfItem({
          id: 'recompensa_bosque_orcos',
          name: 'Estandarte del Clan Colmillo y Vino Especiado',
          category: 'materials',
          count: 1,
          icon: '/assets/portraits/gromock_icono.png',
          rarity: 'UR',
          priceGold: 10000,
          description: 'Trofeos reclamados tras el despeje pacífico del campamento orco en los bosques de Icespear.',
        });
        setChestClaimedCh3(true);
        safeStorage.setItem('cdd_quest_chest_ch3_claimed', 'true');
      }
    }
    setShowChestModal(true);
  };

  const handleSelectChapter = (chapterNum: number) => {
    // Capítulos bloqueados: pulsar no hace nada (ni sonido ni aviso).
    if (chapterNum === 2 && !isChapter2Unlocked) return;
    if (chapterNum === 3 && !isChapter3Unlocked) return;
    if (chapterNum >= 4) return;
    sound.playSFX('click');
    setActiveQuestChapter(chapterNum);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-start bg-transparent select-none overflow-hidden">
      {/* 1. AUTHENTIC FULL-BLEED BACKGROUND:
          - Chapter 1: fondo_icespear_1.png
          - Chapter 2: image_5518948d.png (User-provided ornate mine background with tracks and lantern)
          - Chapter 3: image_0fed218e.png (User-provided ornate Mercado Negro board with auction house and fortress) */}
      <img
        src={
          currentChapter === 3
            ? '/assets/aistudio/image_0fed218e.png'
            : currentChapter === 2
            ? '/assets/aistudio/image_5518948d.png'
            : '/assets/backgrounds/fondo_icespear_1.png'
        }
        alt={
          currentChapter === 3
            ? 'Tablón de Misiones del Mercado Negro'
            : currentChapter === 2
            ? 'Las Minas de Glimmerstone'
            : 'Fondo Icespear'
        }
        className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none z-0"
      />


      {/* 2. TOP CHAPTER TABS (Positioned on the top wooden plank) */}
      <div className="relative z-20 w-full px-[4.5%] pt-[1.5%] pb-[1%] shrink-0">
        <div className="grid grid-cols-4 gap-1.5 h-10 sm:h-11 items-center">
          {/* TAB 1: CAPITULO I ICESPEAR */}
          <button
            type="button"
            onClick={() => handleSelectChapter(1)}
            className={`relative h-full rounded-md flex flex-col items-center justify-center cursor-pointer transition-transform ${
              currentChapter === 1
                ? 'filter brightness-110 drop-shadow-[0_2px_6px_rgba(251,191,36,0.6)]'
                : 'opacity-85 hover:opacity-100'
            }`}
          >
            <img
              src="/assets/items/boton_historia.png"
              alt="Capitulo I"
              className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
            />
            <span className="relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase text-amber-100 leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
              CAPITULO I
            </span>
            <span className="relative z-10 text-[7.5px] sm:text-[8.5px] font-bold uppercase text-amber-300 leading-tight tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
              ICESPEAR
            </span>
          </button>

          {/* TAB 2: CAPITULO II LAS MINAS */}
          {isChapter2Unlocked ? (
            <button
              type="button"
              onClick={() => handleSelectChapter(2)}
              className={`relative h-full rounded-md flex flex-col items-center justify-center cursor-pointer transition-transform ${
                currentChapter === 2
                  ? 'filter brightness-115 drop-shadow-[0_2px_8px_rgba(56,189,248,0.7)]'
                  : 'opacity-85 hover:opacity-100'
              }`}
            >
              <img
                src="/assets/items/boton_historia.png"
                alt="Capitulo II"
                className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
              />
              <span className="relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase text-amber-100 leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                CAPITULO II
              </span>
              <span className="relative z-10 text-[7.5px] sm:text-[8.5px] font-bold uppercase text-yellow-300 leading-tight tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                LAS MINAS
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSelectChapter(2)}
              className="relative h-full rounded-md flex flex-col items-center justify-center cursor-pointer filter brightness-75 hover:brightness-90 transition-all"
            >
              <img
                src="/assets/items/boton_historia.png"
                alt="Capitulo II Bloqueado"
                className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
              />
              <span className="relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase text-stone-300 leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                CAPITULO II
              </span>
              <span className="relative z-10 text-[7px] sm:text-[8px] font-bold uppercase text-stone-400 leading-tight tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                LAS MINAS
              </span>
              {/* Hanging Padlock */}
              <img
                src="/assets/items/CANDADO.png"
                alt="Bloqueado"
                className="absolute -bottom-1.5 w-4 h-4.5 object-contain z-20 drop-shadow-md pointer-events-none"
              />
            </button>
          )}

          {/* TAB 3: CAPITULO III EL MERCADO NEGRO */}
          {isChapter3Unlocked ? (
            <button
              type="button"
              onClick={() => handleSelectChapter(3)}
              className={`relative h-full rounded-md flex flex-col items-center justify-center cursor-pointer transition-transform ${
                currentChapter === 3
                  ? 'filter brightness-115 drop-shadow-[0_2px_8px_rgba(234,179,8,0.7)]'
                  : 'opacity-85 hover:opacity-100'
              }`}
            >
              <img
                src="/assets/items/boton_historia.png"
                alt="Capitulo III"
                className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
              />
              <span className="relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase text-amber-100 leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                CAPITULO III
              </span>
              <span className="relative z-10 text-[6.5px] sm:text-[7.5px] font-bold uppercase text-yellow-300 leading-tight tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                MERCADO NEGRO
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSelectChapter(3)}
              className="relative h-full rounded-md flex flex-col items-center justify-center cursor-pointer filter brightness-75 hover:brightness-90 transition-all"
              title="Capítulo III: El Mercado Negro (Bloqueado)"
            >
              <img
                src="/assets/items/boton_historia.png"
                alt="Capitulo III Bloqueado"
                className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
              />
              <span className="relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase text-stone-300 leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                CAPITULO III
              </span>
              <span className="relative z-10 text-[6.5px] sm:text-[7.5px] font-bold uppercase text-stone-400 leading-tight tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                MERCADO NEGRO
              </span>
              {/* Hanging Padlock */}
              <img
                src="/assets/items/CANDADO.png"
                alt="Bloqueado"
                className="absolute -bottom-1.5 w-4 h-4.5 object-contain z-20 drop-shadow-md pointer-events-none"
              />
            </button>
          )}


          {/* TAB 4: CAPITULO IV PICO ICESPEAR (Bloqueado) */}
          <button
            type="button"
            onClick={() => handleSelectChapter(4)}
            className="relative h-full rounded-md flex flex-col items-center justify-center cursor-pointer filter brightness-75 hover:brightness-90 transition-all"
            title="Capítulo IV: Pico Icespear (Próximamente)"
          >
            <img
              src="/assets/items/boton_historia.png"
              alt="Capitulo IV Bloqueado"
              className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
            />
            <span className="relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase text-stone-300 leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
              CAPITULO IV
            </span>
            <span className="relative z-10 text-[6.5px] sm:text-[7.5px] font-bold uppercase text-stone-400 leading-tight tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
              PICO ICESPEAR
            </span>
            {/* Hanging Padlock */}
            <img
              src="/assets/items/CANDADO.png"
              alt="Bloqueado"
              className="absolute -bottom-1.5 w-4 h-4.5 object-contain z-20 drop-shadow-md pointer-events-none"
            />
          </button>
        </div>
      </div>

      {/* 3. CABIN / MINE ILLUSTRATION SPACER (Framed window shows cabin in Ch1 or Mine Tunnel in Ch2) */}
      <div className="relative z-10 w-full h-[14.5%] sm:h-[15%] min-h-[92px] max-h-[135px] shrink-0 pointer-events-none" />

      {/* 4. MAIN CONTENT AREA ON WOODEN PLANKS */}
      <div className="relative z-10 w-full flex-1 flex flex-col px-[4%] sm:px-[4.5%] pb-2 overflow-hidden min-h-0">
        {/* PROGRESO DEL CAPITULO */}
        <div className="relative w-full rounded-2xl p-2 sm:p-2.5 bg-[#170803]/90 border-2 border-[#4a1c0b] shadow-[inset_0_2px_6px_rgba(0,0,0,0.7),0_3px_8px_rgba(0,0,0,0.7)] flex items-center justify-between gap-2.5 shrink-0 my-1">
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-[10px] sm:text-[10.5px] font-black text-[#d6c2a5] tracking-wide uppercase">
              <span>
                {currentChapter === 2
                  ? 'PROGRESO CAPÍTULO II • LAS MINAS'
                  : 'PROGRESO CAPÍTULO I • ICESPEAR'}
              </span>
              <span className="font-mono text-[#d6c2a5] text-[10px] sm:text-[10.5px]">
                {completedCount}/{totalCount}
              </span>
            </div>

            {/* Glowing Molten Progress Bar */}
            <div className="relative w-full h-4 sm:h-4.5 rounded-full bg-[#0c0401] border border-[#521c08] p-0.5 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full ${
                  currentChapter === 2
                    ? 'bg-gradient-to-r from-[#0284c7] via-[#06b6d4] to-[#f59e0b] shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                    : 'bg-gradient-to-r from-[#dc2626] via-[#ea580c] to-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                } transition-all duration-500`}
                style={{ width: `${Math.min(100, (completedCount / totalCount) * 100)}%` }}
              />
            </div>
          </div>

          {/* Treasure Chest in recessed slot */}
          <button
            type="button"
            onClick={handleClaimChest}
            className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#120502] border-2 border-[#4a1c0b] flex items-center justify-center shrink-0 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform ${
              isChapterFullyCompleted ? 'ring-2 ring-amber-400/80 animate-pulse' : ''
            }`}
            title={
              currentChapter === 2
                ? 'Cofre de las Minas de Glimmerstone'
                : 'Cofre de Recompensas de Icespear'
            }
          >
            <img
              src={
                currentChapter === 2
                  ? '/assets/items/cofre_sellado_mansion.png'
                  : '/assets/items/cofre_de_tintes_app.png'
              }
              alt="Cofre"
              className="w-8.5 h-8.5 sm:w-9 sm:h-9 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.9)]"
            />
          </button>
        </div>

        {/* MISSIONS LIST */}
        <div
          ref={scrollContainerRef}
          onPointerDown={handleContentPointerDown}
          onPointerMove={handleContentPointerMove}
          onPointerUp={handleContentPointerUp}
          onPointerCancel={handleContentPointerUp}
          onPointerLeave={handleContentPointerUp}
          className="w-full flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth flex flex-col gap-2.5 sm:gap-3 mt-1.5 pb-28 sm:pb-32 cursor-grab active:cursor-grabbing touch-pan-y"
        >
          {missions.map((mission, idx) => {
            const isCompleted = questProgress.completedMissions.includes(mission.id);
            // In chapter 2, first mission is automatically unlocked once Chapter 2 is opened
            const isUnlocked =
              idx === 0 ||
              questProgress.completedMissions.includes(missions[idx - 1].id) ||
              (missions[idx - 1].id === 'm6_puerta_laberinto' && questProgress.completedMissions.includes('m6_cuevas_titan')) ||
              isCompleted;

            const isFertonMission = mission.id === 'm9_emboscada_ferton';
            const isStoryMission =
              (mission.isStory && !isFertonMission) ||
              mission.id === 'm1_tirano' ||
              mission.id === 'm5_minas_historia';
            const isRoboMission = mission.id === 'm2_robo';
            const isBosqueMission = mission.id === 'm3_bosque';
            const isPuertasMission = mission.id === 'm4_puertas_selladas';
            const isLaberintoMission = mission.id === 'm6_puerta_laberinto';
            const isAldeaEpilogueMission = mission.id === 'm7_epilogo_aldea';

            if (isCompleted || isUnlocked) {
              return (
                <div
                  key={mission.id}
                  onClick={() => handleLaunchMission(mission, false)}
                  className="relative w-full h-[98px] sm:h-[102px] rounded-xl overflow-hidden flex items-center px-3 sm:px-3.5 py-2 sm:py-2.5 shadow-md shrink-0 border border-transparent cursor-pointer hover:brightness-105 active:scale-[0.99] transition-all"
                >
                  <img
                    src="/assets/items/HISTORIA NIVEL BOTON.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
                  />
                  <div className="relative z-10 w-[68px] h-[68px] sm:w-[72px] sm:h-[72px] rounded-xl overflow-hidden bg-[#100703] border-[2.5px] border-[#9e521e] shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.85),0_2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center">
                    <img
                      src={mission.portrait}
                      alt={mission.title}
                      className={`w-full h-full object-contain pointer-events-none select-none transition-transform duration-300 ${
                        mission.portraitClass || 'scale-[1.8] origin-top'
                      }`}
                    />
                  </div>
                  <div className="relative z-10 flex-1 min-w-0 pl-3 pr-2 flex flex-col justify-center space-y-0.5 sm:space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-serif font-black text-xs sm:text-[13px] text-[#3d1908] truncate drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
                        {mission.title}
                      </h4>
                      {isFertonMission && (
                        <span className="px-1.5 py-0.2 rounded-full bg-red-950/95 text-amber-300 border border-amber-500/50 font-sans font-black text-[7px] uppercase tracking-wide animate-pulse">
                          3 OLEADAS DE ÉLITE
                        </span>
                      )}
                      {isPuertasMission && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-700/90 text-rose-100 font-sans font-black text-[7px] uppercase tracking-wide animate-pulse">
                          JEFE • 2 FASES
                        </span>
                      )}
                      {isLaberintoMission && (
                        <span className="px-1.5 py-0.2 rounded-full bg-purple-700/90 text-purple-100 font-sans font-black text-[7px] uppercase tracking-wide animate-pulse">
                          CINEMÁTICA
                        </span>
                      )}
                      {isAldeaEpilogueMission && (
                        <span className="px-1.5 py-0.2 rounded-full bg-indigo-700/90 text-indigo-100 font-sans font-black text-[7px] uppercase tracking-wide animate-pulse">
                          EPÍLOGO FINAL
                        </span>
                      )}
                      {isStoryMission && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-600/90 text-amber-100 font-sans font-black text-[7px] uppercase tracking-wide">
                          HISTORIA
                        </span>
                      )}
                      {isRoboMission && (
                        <span className="px-1.5 py-0.2 rounded-full bg-orange-700/90 text-orange-100 font-sans font-black text-[7px] uppercase tracking-wide">
                          4 OLEADAS
                        </span>
                      )}
                      {isBosqueMission && (
                        <span className="px-1.5 py-0.2 rounded-full bg-lime-700/90 text-lime-100 font-sans font-black text-[7px] uppercase tracking-wide">
                          2 OLEADAS
                        </span>
                      )}
                    </div>
                    <p className="text-[9.5px] sm:text-[10px] text-[#4d240e] leading-snug font-medium line-clamp-2">
                      {mission.description}
                    </p>
                    <span
                      className={`text-[9px] sm:text-[9.5px] font-black tracking-wide leading-none pt-0.5 ${getDifficultyColor(
                        mission.difficulty
                      )}`}
                    >
                      {mission.difficulty}
                    </span>
                  </div>

                  {/* Action Buttons: COMBATE / HISTORIA, and if completed: AUTO-REPEAT (BARRIDO ASTRAL) */}
                  <div className="relative z-10 flex flex-col items-center justify-center shrink-0 pl-1 space-y-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLaunchMission(mission, false);
                      }}
                      className="w-[86px] sm:w-[92px] py-1.5 px-2 rounded-lg border border-[#fed7aa]/50 bg-gradient-to-b from-[#f97316] via-[#ea580c] to-[#c2410c] shadow-[0_2px_8px_rgba(234,88,12,0.6)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                      title="Entrar a combate"
                    >
                      <div className="flex items-center gap-0.5">
                        <img
                          src={
                            isCompleted
                              ? '/assets/items/estrella_mejora.png'
                              : '/assets/items/estrella_bronce.png'
                          }
                          alt=""
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5 object-contain drop-shadow"
                        />
                        <img
                          src={
                            isCompleted
                              ? '/assets/items/estrella_mejora.png'
                              : '/assets/items/estrella_bronce.png'
                          }
                          alt=""
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5 object-contain drop-shadow"
                        />
                        <img
                          src={
                            isCompleted
                              ? '/assets/items/estrella_mejora.png'
                              : '/assets/items/estrella_bronce.png'
                          }
                          alt=""
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5 object-contain drop-shadow"
                        />
                      </div>
                      <span className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] leading-tight">
                        {isStoryMission ? 'HISTORIA' : 'COMBATE'}
                      </span>
                    </button>

                    {/* Secondary Action Row: VER and/or AUTO (BARRIDO ASTRAL) */}
                    {(() => {
                      const hasStoryBtn =
                        mission.isStory ||
                        mission.id === 'm1_tirano' ||
                        mission.id === 'm2_robo' ||
                        mission.id === 'm3_bosque' ||
                        mission.id === 'm4_puertas_selladas' ||
                        mission.id === 'm5_minas_historia';

                      if (hasStoryBtn && isCompleted) {
                        return (
                          <div className="flex items-center gap-1 w-[86px] sm:w-[92px]">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLaunchMission(mission, true);
                              }}
                              className="flex-1 py-1 px-1 rounded-md border border-amber-600/70 bg-[#2b1007] hover:bg-[#3d180c] text-amber-200 hover:text-white text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider shadow active:scale-95 transition-all cursor-pointer text-center truncate"
                              title="Ver historia"
                            >
                              VER
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                sound.playSFX('click');
                                setAutoRepeatMission(mission);
                              }}
                              className="flex-1 py-1 px-1 rounded-md border border-cyan-400/80 bg-gradient-to-b from-[#09222f] via-[#051722] to-[#030e15] hover:border-cyan-300 text-cyan-200 hover:text-white text-[7.5px] sm:text-[8px] font-black uppercase tracking-tight shadow-[0_1px_4px_rgba(6,182,212,0.4)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-0.5"
                              title="Repetir automáticamente con Fragmentos Astrales (10✦)"
                            >
                              <img
                                src="/assets/items/fragmento_astral.png"
                                alt=""
                                className="w-2.5 h-2.5 object-contain shrink-0 drop-shadow"
                              />
                              <span>AUTO</span>
                            </button>
                          </div>
                        );
                      }

                      if (isCompleted && !hasStoryBtn) {
                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sound.playSFX('click');
                              setAutoRepeatMission(mission);
                            }}
                            className="w-[86px] sm:w-[92px] py-1 px-1 rounded-md border border-cyan-400/80 bg-gradient-to-r from-[#072433] via-[#0c3950] to-[#072433] hover:border-cyan-300 text-cyan-200 hover:text-white text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider shadow-[0_1px_5px_rgba(6,182,212,0.4)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1 group"
                            title="Repetir automáticamente con Fragmentos Astrales (10✦)"
                          >
                            <img
                              src="/assets/items/fragmento_astral.png"
                              alt=""
                              className="w-3 h-3 object-contain shrink-0 group-hover:scale-110 transition-transform drop-shadow"
                            />
                            <span>AUTO ✦10</span>
                          </button>
                        );
                      }

                      if (hasStoryBtn && !isCompleted) {
                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLaunchMission(mission, true);
                            }}
                            className="w-[86px] sm:w-[92px] py-1 px-2 rounded-md border border-amber-600/70 bg-[#2b1007] hover:bg-[#3d180c] text-amber-200 hover:text-white text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider shadow active:scale-95 transition-all cursor-pointer text-center"
                            title="Ver historia"
                          >
                            VER
                          </button>
                        );
                      }

                      return null;
                    })()}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={mission.id}
                className="relative w-full h-[90px] sm:h-[94px] rounded-xl overflow-hidden flex items-center px-3 sm:px-3.5 py-2 bg-[#180a04]/90 border border-[#3b170c] shadow-inner opacity-85 shrink-0"
              >
                <div className="relative w-14 h-14 sm:w-15 sm:h-15 rounded-lg overflow-hidden bg-[#0c0402] border-2 border-[#381406] shrink-0 shadow-inner flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-[#1c0a03] mb-1.5" />
                  <div className="absolute bottom-0.5 w-9 h-4.5 rounded-t-full bg-[#1c0a03]" />
                  <img
                    src="/assets/items/CANDADO.png"
                    alt="Bloqueado"
                    className="absolute w-5 h-5.5 object-contain drop-shadow"
                  />
                </div>
                <div className="relative flex-1 min-w-0 pl-3 flex flex-col justify-center space-y-0.5">
                  <h4 className="font-serif font-black text-xs sm:text-[13px] text-stone-300 truncate">
                    {mission.title}
                  </h4>
                  <p className="text-[9px] sm:text-[9.5px] text-stone-400 font-medium line-clamp-1">
                    {mission.description}
                  </p>
                </div>
                <div className="relative flex items-center gap-1.5 pr-1.5 shrink-0">
                  <span className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-[#ef4444] drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                    BLOQUEADO
                  </span>
                  <img
                    src="/assets/items/CANDADO.png"
                    alt="Bloqueado"
                    className="w-4 h-4.5 object-contain drop-shadow"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. CHEST REWARD MODAL */}
      {showChestModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowChestModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none animate-fade-in"
        >
          <div className="relative w-full max-w-xs bg-[#240c03] border-4 border-[#78350f] rounded-2xl p-4 text-center text-stone-200 shadow-2xl space-y-3">
            <button
              type="button"
              onClick={() => setShowChestModal(false)}
              className="absolute top-2.5 right-2.5 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center pt-2">
              <img
                src={
                  currentChapter === 2
                    ? '/assets/items/cofre_sellado_mansion.png'
                    : '/assets/items/cofre_de_tintes_app.png'
                }
                alt="Cofre de Recompensas"
                className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.9)]"
              />
            </div>

            <h3 className="font-serif font-black text-base uppercase text-amber-300 drop-shadow">
              {currentChapter === 3
                ? '¡Cofre del Campamento Orco en el Bosque!'
                : currentChapter === 2
                ? '¡Cofre de Las Minas de Glimmerstone!'
                : '¡Cofre de Icespear Reclamado!'}
            </h3>

            <p className="text-xs text-stone-300">
              {isChapterFullyCompleted
                ? `¡Has completado con éxito todas las misiones del Capítulo ${
                    currentChapter === 3 ? 'III' : currentChapter === 2 ? 'II' : 'I'
                  }! Recompensas entregadas a tu bastión:`
                : `Avanza y supera las misiones del Capítulo ${
                    currentChapter === 3 ? 'III' : currentChapter === 2 ? 'II' : 'I'
                  } para reclamar el botín completo (${completedCount}/${totalCount}).`}
            </p>

            {isChapterFullyCompleted ? (
              <div className="flex items-center justify-center gap-4 py-2 bg-[#140602] rounded-lg border border-amber-900/60">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 font-mono">
                  <span>+{currentChapter === 3 ? '35,000' : currentChapter === 2 ? '25,000' : '15,000'}</span>
                  <span className="text-[10px] text-amber-200">ORO</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-black text-sky-400 font-mono">
                  <span>+{currentChapter === 3 ? '1,200' : currentChapter === 2 ? '800' : '500'}</span>
                  <span className="text-[10px] text-sky-200">GEMAS</span>
                </div>
              </div>
            ) : (
              <div className="py-2 px-3 rounded-lg bg-black/50 border border-stone-800 text-[11px] text-amber-200/90 font-mono">
                {currentChapter === 3
                  ? 'Recompensa final: +35,000 Oro, +1,200 Gemas y Estandarte Orco'
                  : currentChapter === 2
                  ? 'Recompensa final: +25,000 Oro, +800 Gemas y Veta de Plata'
                  : 'Recompensa final: +15,000 Oro y +500 Gemas'}
              </div>
            )}


            <button
              type="button"
              onClick={() => setShowChestModal(false)}
              className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:brightness-110 text-white font-black rounded-lg text-xs uppercase tracking-wider cursor-pointer shadow-lg active:scale-95 transition-transform"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* Astral Fragment Auto-Repeat Modal */}
      {autoRepeatMission && (
        <AutoRepeatModal
          mission={autoRepeatMission}
          onClose={() => setAutoRepeatMission(null)}
        />
      )}
    </div>
  );
};
