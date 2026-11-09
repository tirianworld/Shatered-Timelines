import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { launchConfetti } from '../utils/confetti';
import {
  STORY_TIRANO_DIALOGUE,
  STORY_ROBO_DIALOGUE,
  STORY_ROBO_EPILOGUE_DIALOGUE,
  STORY_BOSQUE_DIALOGUE,
  STORY_BOSQUE_EPILOGUE_DIALOGUE,
  STORY_PUERTAS_SELLADAS_DIALOGUE,
  STORY_PUERTAS_SELLADAS_EPILOGUE_DIALOGUE,
  STORY_EMBOSCADA_BANDIDOS_DIALOGUE,
  STORY_EMBOSCADA_BANDIDOS_EPILOGUE_DIALOGUE,
  STORY_ASALTO_ORCO_DIALOGUE,
  STORY_ASALTO_ORCO_EPILOGUE_DIALOGUE,
  STORY_MINAS_HISTORIA_DIALOGUE,
  STORY_FURIA_CARMESI_DIALOGUE,
  STORY_FURIA_CARMESI_EPILOGUE_DIALOGUE,
  STORY_CAVERNA_CONGELADA_DIALOGUE,
  STORY_CAVERNA_CONGELADA_EPILOGUE_DIALOGUE,
  STORY_ZANCUDO_ESPECTRAL_DIALOGUE,
  STORY_ZANCUDO_ESPECTRAL_EPILOGUE_DIALOGUE,
  STORY_TITAN_MELENUDO_DIALOGUE,
  STORY_TITAN_MELENUDO_EPILOGUE_DIALOGUE,
  CHARACTER_PROFILES,
  DialogueLine,
  EmotionType,
  formatDialogueText,
} from '../data/storyDialogueData';
import { loadTavernCookingStock, saveTavernCookingStock } from '../data/cookingData';
import {
  Volume2,
  VolumeX,
  Play,
  FastForward,
  RotateCcw,
  BookOpen,
  X,
  Swords,
  ChevronRight,
  Shield,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface StoryDialogueViewProps {
  onFinish?: () => void;
  onLaunchCombat?: () => void;
}

/**
 * Splits dialogue lines so that dialogue never shrinks or crams large paragraphs
 * into a single box. Long lines are naturally broken into multiple sequential screens.
 */
function paginateDialogueLines(lines: DialogueLine[]): DialogueLine[] {
  const result: DialogueLine[] = [];

  for (const line of lines) {
    const rawText = line.text;
    if (rawText.length <= 130) {
      result.push(line);
      continue;
    }

    // Split text into digestible sentences/clauses
    const sentenceRegex = /[^.!?…\n]+(?:[.!?…]+|\n|$)/g;
    const rawSentences = rawText.match(sentenceRegex) || [rawText];
    const chunks: string[] = [];
    let cur = '';

    for (const s of rawSentences) {
      const trimmed = s.trim();
      if (!trimmed) continue;
      if (!cur) {
        cur = trimmed;
      } else if ((cur + ' ' + trimmed).length <= 125) {
        cur += ' ' + trimmed;
      } else {
        chunks.push(cur);
        cur = trimmed;
      }
    }
    if (cur) chunks.push(cur);

    // If any chunk is still long, split by words
    const finalChunks: string[] = [];
    for (const c of chunks) {
      if (c.length <= 135) {
        finalChunks.push(c);
      } else {
        const words = c.split(' ');
        let sub = '';
        for (const w of words) {
          if (!sub) sub = w;
          else if ((sub + ' ' + w).length <= 120) sub += ' ' + w;
          else {
            finalChunks.push(sub);
            sub = w;
          }
        }
        if (sub) finalChunks.push(sub);
      }
    }

    finalChunks.forEach((chunk, idx) => {
      result.push({
        ...line,
        id: `${line.id}_p${idx}`,
        text: chunk,
        soundEffect: idx === 0 ? line.soundEffect : undefined,
        shakeScreen: idx === 0 ? line.shakeScreen : undefined,
        screenFlash: idx === 0 ? line.screenFlash : undefined,
      });
    });
  }

  return result.length > 0 ? result : lines;
}

export const StoryDialogueView: React.FC<StoryDialogueViewProps> = ({
  onFinish,
  onLaunchCombat,
}) => {
  const {
    navigateTo,
    selectedCombatMissionId,
    setSelectedCombatMissionId,
    completeQuestMission,
    addGold,
    addCrystals,
    addShelfItem,
    setActiveQuestChapter,
  } = useGame();

  const isTitanEpilogue =
    selectedCombatMissionId === 'm6_cuevas_titan_epilogo' ||
    selectedCombatMissionId === 'm6_cuevas_titan_epilogue';
  const isTitanMission = selectedCombatMissionId === 'm6_cuevas_titan';
  const isZancudoEpilogue =
    selectedCombatMissionId === 'm5_cuevas_zancudo_epilogo' ||
    selectedCombatMissionId === 'm5_cuevas_zancudo_epilogue';
  const isZancudoMission = selectedCombatMissionId === 'm5_cuevas_zancudo';
  const isCavernaAzulEpilogue =
    selectedCombatMissionId === 'm4_cuevas_azul_epilogo' ||
    selectedCombatMissionId === 'm4_cuevas_azul_epilogue';
  const isCavernaAzulMission = selectedCombatMissionId === 'm4_cuevas_azul';
  const isFuriaCarmesiEpilogue =
    selectedCombatMissionId === 'm3_cuevas_rojo_epilogo' ||
    selectedCombatMissionId === 'm3_cuevas_rojo_epilogue';
  const isFuriaCarmesiMission = selectedCombatMissionId === 'm3_cuevas_rojo';
  const isAsaltoOrcoEpilogue =
    selectedCombatMissionId === 'evento_asalto_orco_epilogo' ||
    selectedCombatMissionId === 'evento_asalto_orco_epilogue';
  const isAsaltoOrcoMission = selectedCombatMissionId === 'evento_asalto_orco';
  const isEmboscadaEpilogue =
    selectedCombatMissionId === 'evento_emboscada_bandidos_epilogo' ||
    selectedCombatMissionId === 'evento_emboscada_bandidos_epilogue';
  const isEmboscadaMission = selectedCombatMissionId === 'evento_emboscada_bandidos';
  const isRoboEpilogue =
    selectedCombatMissionId === 'm2_robo_epilogo' ||
    selectedCombatMissionId === 'm2_robo_epilogue';
  const isBosqueEpilogue =
    selectedCombatMissionId === 'm3_bosque_epilogo' ||
    selectedCombatMissionId === 'm3_bosque_epilogue';
  const isPuertasEpilogue =
    selectedCombatMissionId === 'm4_puertas_selladas_epilogo' ||
    selectedCombatMissionId === 'm4_puertas_selladas_epilogue';
  const isRoboMission = selectedCombatMissionId === 'm2_robo';
  const isBosqueMission = selectedCombatMissionId === 'm3_bosque';
  const isPuertasMission = selectedCombatMissionId === 'm4_puertas_selladas';
  const isMinasHistoriaMission = selectedCombatMissionId === 'm5_minas_historia';

  const rawDialogueLines = isTitanEpilogue
    ? STORY_TITAN_MELENUDO_EPILOGUE_DIALOGUE
    : isTitanMission
    ? STORY_TITAN_MELENUDO_DIALOGUE
    : isZancudoEpilogue
    ? STORY_ZANCUDO_ESPECTRAL_EPILOGUE_DIALOGUE
    : isZancudoMission
    ? STORY_ZANCUDO_ESPECTRAL_DIALOGUE
    : isCavernaAzulEpilogue
    ? STORY_CAVERNA_CONGELADA_EPILOGUE_DIALOGUE
    : isCavernaAzulMission
    ? STORY_CAVERNA_CONGELADA_DIALOGUE
    : isFuriaCarmesiEpilogue
    ? STORY_FURIA_CARMESI_EPILOGUE_DIALOGUE
    : isAsaltoOrcoEpilogue
    ? STORY_ASALTO_ORCO_EPILOGUE_DIALOGUE
    : isAsaltoOrcoMission
    ? STORY_ASALTO_ORCO_DIALOGUE
    : isEmboscadaEpilogue
    ? STORY_EMBOSCADA_BANDIDOS_EPILOGUE_DIALOGUE
    : isEmboscadaMission
    ? STORY_EMBOSCADA_BANDIDOS_DIALOGUE
    : isPuertasEpilogue
    ? STORY_PUERTAS_SELLADAS_EPILOGUE_DIALOGUE
    : isPuertasMission
    ? STORY_PUERTAS_SELLADAS_DIALOGUE
    : isMinasHistoriaMission
    ? STORY_MINAS_HISTORIA_DIALOGUE
    : isFuriaCarmesiMission
    ? STORY_FURIA_CARMESI_DIALOGUE
    : isRoboEpilogue
    ? STORY_ROBO_EPILOGUE_DIALOGUE
    : isBosqueEpilogue
    ? STORY_BOSQUE_EPILOGUE_DIALOGUE
    : isRoboMission
    ? STORY_ROBO_DIALOGUE
    : isBosqueMission
    ? STORY_BOSQUE_DIALOGUE
    : STORY_TIRANO_DIALOGUE;

  const dialogueLines = useMemo(() => paginateDialogueLines(rawDialogueLines), [rawDialogueLines]);

  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [isBacklogOpen, setIsBacklogOpen] = useState<boolean>(false);
  const [isSkipConfirmOpen, setIsSkipConfirmOpen] = useState<boolean>(false);
  const [isStoryCompleted, setIsStoryCompleted] = useState<boolean>(false);
  const [battleTransitionAlert, setBattleTransitionAlert] = useState<boolean>(false);
  const [screenFlash, setScreenFlash] = useState<'red' | 'cyan' | 'gold' | 'purple' | null>(null);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getIsMuted());

  const currentLine: DialogueLine = dialogueLines[currentLineIndex] || dialogueLines[0];
  const speakerProfile = CHARACTER_PROFILES[currentLine.speakerId] || CHARACTER_PROFILES.arlem;

  // Speaker Animation States for Offscreen Slide-In & Slide-Out
  interface ActiveSpeakerState {
    characterId: typeof currentLine.speakerId;
    side: 'left' | 'right' | 'center';
    pose: string;
    emotion?: EmotionType;
    animType: 'enter' | 'hop';
    id: string;
  }

  interface ExitingSpeakerState {
    characterId: typeof currentLine.speakerId;
    side: 'left' | 'right' | 'center';
    pose: string;
    id: string;
  }

  const [activeSpeaker, setActiveSpeaker] = useState<ActiveSpeakerState>({
    characterId: currentLine.speakerId,
    side: currentLine.speakerSide,
    pose: currentLine.pose,
    emotion: currentLine.emotion,
    animType: 'enter',
    id: `active-${currentLine.speakerId}-0`,
  });

  const [exitingSpeaker, setExitingSpeaker] = useState<ExitingSpeakerState | null>(null);

  const prevSpeakerRef = useRef<{
    characterId: typeof currentLine.speakerId;
    side: 'left' | 'right' | 'center';
    pose: string;
  } | null>({
    characterId: currentLine.speakerId,
    side: currentLine.speakerSide,
    pose: currentLine.pose,
  });

  // Track speaker changes for slide-in / slide-out
  useEffect(() => {
    const newSpeakerId = currentLine.speakerId;
    const newSide = currentLine.speakerSide;
    const newPose = currentLine.pose;
    const newEmotion = currentLine.emotion;

    const prev = prevSpeakerRef.current;
    const speakerChanged = !prev || prev.characterId !== newSpeakerId || prev.side !== newSide;

    if (speakerChanged) {
      if (prev) {
        setExitingSpeaker({
          characterId: prev.characterId,
          side: prev.side,
          pose: prev.pose,
          id: `exit-${prev.characterId}-${Date.now()}`,
        });
      }

      setActiveSpeaker({
        characterId: newSpeakerId,
        side: newSide,
        pose: newPose,
        emotion: newEmotion,
        animType: 'enter',
        id: `active-${newSpeakerId}-${currentLineIndex}`,
      });

      const timer = setTimeout(() => {
        setExitingSpeaker(null);
      }, 360);

      prevSpeakerRef.current = {
        characterId: newSpeakerId,
        side: newSide,
        pose: newPose,
      };

      return () => clearTimeout(timer);
    } else {
      setActiveSpeaker({
        characterId: newSpeakerId,
        side: newSide,
        pose: newPose,
        emotion: newEmotion,
        animType: 'hop',
        id: `active-${newSpeakerId}-${currentLineIndex}`,
      });

      prevSpeakerRef.current = {
        characterId: newSpeakerId,
        side: newSide,
        pose: newPose,
      };
    }
  }, [currentLineIndex, currentLine.speakerId, currentLine.speakerSide, currentLine.pose, currentLine.emotion]);

  // Ref to handle auto-play timeout
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typewriterTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Background audio setup
  useEffect(() => {
    sound.initBGM('/assets/audio/blades_of_the_astral_gate.mp3');
    sound.playBGM();
    return () => {
      sound.stopBGM();
    };
  }, []);

  // Handle dramatic SFX & Screen Shake on line change
  useEffect(() => {
    if (currentLine.shakeScreen) {
      setIsScreenShaking(true);
      setTimeout(() => setIsScreenShaking(false), 500);
    }

    if (currentLine.screenFlash) {
      setScreenFlash(currentLine.screenFlash);
      setTimeout(() => setScreenFlash(null), 350);
    }

    // Play thematic SFX
    if (currentLine.soundEffect) {
      switch (currentLine.soundEffect) {
        case 'slam':
        case 'furious':
          sound.playSFX('critical');
          break;
        case 'roar':
          sound.playSFX('dark_god');
          break;
        case 'drink':
        case 'laugh':
          sound.playSFX('powerup');
          break;
        case 'fanfare':
          sound.playSFX('victory');
          break;
        case 'whisper':
          sound.playSFX('merge');
          break;
        default:
          sound.playSFX('click');
          break;
      }
    }
  }, [currentLineIndex, currentLine]);

  // Typewriter effect
  useEffect(() => {
    setIsTyping(true);
    setDisplayedText('');
    let charIdx = 0;
    const fullText = formatDialogueText(currentLine.text);

    if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);

    typewriterTimerRef.current = setInterval(() => {
      charIdx++;
      if (charIdx <= fullText.length) {
        setDisplayedText(fullText.slice(0, charIdx));
      } else {
        setIsTyping(false);
        if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
      }
    }, 20);

    return () => {
      if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
    };
  }, [currentLineIndex, currentLine.text]);

  // Handle auto-advance
  useEffect(() => {
    if (!isAutoPlay || isTyping) {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setTimeout(() => {
      handleAdvance();
    }, 2200);

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [isAutoPlay, isTyping, currentLineIndex]);

  const handleAdvance = useCallback(() => {
    // If still typing, complete current line instantly
    if (isTyping) {
      if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
      setDisplayedText(formatDialogueText(currentLine.text));
      setIsTyping(false);
      return;
    }

    // Advance to next line
    if (currentLineIndex < dialogueLines.length - 1) {
      sound.playSFX('click');
      setCurrentLineIndex((prev) => prev + 1);
    } else {
      if (isTitanEpilogue || isZancudoEpilogue || isCavernaAzulEpilogue || isFuriaCarmesiEpilogue || isRoboEpilogue || isBosqueEpilogue || isPuertasEpilogue || isEmboscadaEpilogue || isAsaltoOrcoEpilogue) {
        handleCompleteStory();
      } else if (isTitanMission || isZancudoMission || isCavernaAzulMission || isRoboMission || isBosqueMission || isPuertasMission || isEmboscadaMission || isAsaltoOrcoMission || isFuriaCarmesiMission) {
        sound.playSFX('critical');
        setScreenFlash(isTitanMission ? 'gold' : isZancudoMission ? 'purple' : isCavernaAzulMission ? 'cyan' : isFuriaCarmesiMission ? 'cyan' : 'red');
        setBattleTransitionAlert(true);
        setTimeout(() => {
          handleStartCombatAfterStory();
        }, 1200);
      } else {
        handleCompleteStory();
      }
    }
  }, [isTyping, currentLine.text, currentLineIndex, dialogueLines.length, isTitanMission, isTitanEpilogue, isZancudoMission, isZancudoEpilogue, isRoboMission, isRoboEpilogue, isBosqueMission, isBosqueEpilogue, isPuertasMission, isPuertasEpilogue, isEmboscadaMission, isEmboscadaEpilogue, isAsaltoOrcoMission, isAsaltoOrcoEpilogue, isMinasHistoriaMission, isFuriaCarmesiMission, isFuriaCarmesiEpilogue, isCavernaAzulMission, isCavernaAzulEpilogue]);

  const handleCompleteStory = () => {
    sound.playSFX('victory');
    launchConfetti();
    setIsStoryCompleted(true);
    setIsAutoPlay(false);

    if (isTitanEpilogue) {
      completeQuestMission('m6_cuevas_titan', 3);
      addGold(12000);
      addCrystals(400);
      addShelfItem({
        id: `pelaje_electrico_titan_${Date.now()}`,
        name: 'Pelaje Electrificado de Titán',
        category: 'materials',
        count: 1,
        icon: '/assets/items/cuero.png',
        rarity: 'SSR',
        priceGold: 9500,
        description: 'Manto de cerdas del Titán Melenudo que aún chisporrotea con descargas eléctricas puras del Underdark.',
      });
      return;
    }

    if (isZancudoEpilogue) {
      completeQuestMission('m5_cuevas_zancudo', 3);
      addGold(10000);
      addCrystals(350);
      addShelfItem({
        id: `pata_aguja_zancudo_${Date.now()}`,
        name: 'Aguja Espectral de Zancudo',
        category: 'materials',
        count: 1,
        icon: '/assets/items/fragmento_de_quitina.png',
        rarity: 'SSR',
        priceGold: 8000,
        description: 'Pata larguísima e hiperdensa impregnada de magia sombría del Underdark.',
      });
      return;
    }

    if (isCavernaAzulEpilogue) {
      completeQuestMission('m4_cuevas_azul', 3);
      addGold(8000);
      addCrystals(250);
      addShelfItem({
        id: `aguja_criogenica_viral_${Date.now()}`,
        name: 'Aguja Criogénica Parasitaria',
        category: 'materials',
        count: 1,
        icon: '/assets/items/fragmento_de_quitina.png',
        rarity: 'SSR',
        priceGold: 6000,
        description: 'Púa glacial extraída de los acechadores congelados que inocula la mutación viral arácnida.',
      });
      return;
    }

    if (isFuriaCarmesiEpilogue) {
      completeQuestMission('m3_cuevas_rojo', 3);
      addGold(7000);
      addCrystals(250);
      addShelfItem({
        id: `huevo_carmesi_calcificado_${Date.now()}`,
        name: 'Huevo Carmesí Calcificado',
        category: 'materials',
        count: 1,
        icon: '/assets/items/fragmento_de_quitina.png',
        rarity: 'SSR',
        priceGold: 5000,
        description: 'Huevo mutante petrificado de la cámara de cría tras la purga de Edacorn. Reliquia repleta de maná primigenio.',
      });
      addShelfItem({
        id: `ing_huevos_araknoide_${Date.now()}`,
        name: 'Huevos de Araknoide',
        category: 'materials',
        count: 4,
        icon: '/assets/items/ing_huevos_araknoide.png',
        rarity: 'SR',
        priceGold: 160,
        description: 'Huevos translúcidos recolectados en los nidos carmesíes de la colonia. Ingrediente exótico con suave luminiscencia nutritiva.',
      });
      addShelfItem({
        id: `ing_larvas_araknoide_${Date.now()}`,
        name: 'Larvas de Araknoide',
        category: 'materials',
        count: 4,
        icon: '/assets/items/ing_larvas_araknoide.png',
        rarity: 'SR',
        priceGold: 150,
        description: 'Larvas cavernícolas ricas en proteínas y maná residual. Crujientes al saltear y de gran valor culinario.',
      });
      try {
        const stock = loadTavernCookingStock();
        stock['ing_huevos_araknoide'] = (stock['ing_huevos_araknoide'] || 0) + 4;
        stock['ing_larvas_araknoide'] = (stock['ing_larvas_araknoide'] || 0) + 4;
        saveTavernCookingStock(stock);
      } catch (e) {
        console.error('Failed to update tavern stock:', e);
      }
      return;
    }

    if (isMinasHistoriaMission) {
      completeQuestMission('m5_minas_historia', 3);
      addGold(5000);
      addCrystals(200);
      addShelfItem({
        id: `plata_glimmerstone_${Date.now()}`,
        name: 'Lingote de Plata Glimmerstone',
        category: 'materials',
        count: 2,
        icon: '/assets/items/lingote_de_plata.png',
        rarity: 'SSR',
        priceGold: 3500,
        description: 'Plata subterránea pura de máxima pureza extraída por los hermanos Boran y Thora en las minas profundas.',
      });
      return;
    }

    if (isEmboscadaEpilogue) {
      addGold(4000);
      addCrystals(150);
      addShelfItem({
        id: `kebab_recompensa_${Date.now()}`,
        name: 'Kebab Especiado de Mercader',
        category: 'food',
        count: 2,
        icon: '/assets/items/kebab.png',
        rarity: 'SR',
        priceGold: 800,
        description: 'Suculenta porción de carne asada con hierbas de montaña entregada como muestra de agradecimiento por la caravana rescatada.',
      });
      addShelfItem({
        id: `tortilla_recompensa_${Date.now()}`,
        name: 'Tortilla de Patatas de la Caravana',
        category: 'food',
        count: 1,
        icon: '/assets/items/tortilla_patata.png',
        rarity: 'SSR',
        priceGold: 1500,
        description: 'Generosa tortilla recién preparada por los mercaderes agradecidos tras ahuyentar a los bandidos de los riscos.',
      });
      return;
    }

    if (isPuertasEpilogue) {
      completeQuestMission('m4_puertas_selladas', 3);
      setActiveQuestChapter(2);
      addGold(8000);
      addCrystals(300);
      addShelfItem({
        id: 'coraza_quitinosa_titan',
        name: 'Placas del Devorador Quitinoso',
        category: 'materials',
        count: 1,
        icon: '/assets/items/fragmento_de_quitina.png',
        rarity: 'SSR',
        priceGold: 6000,
        description: 'Placas titánicas de quitina adamantina arrancadas del Devorador Quitinoso en las Puertas de Glimmerstone.',
      });
      addShelfItem({
        id: `ing_carne_devorador_${Date.now()}`,
        name: 'Carne de Devorador',
        category: 'materials',
        count: 3,
        icon: '/assets/items/ing_carne_devorador.png',
        rarity: 'SSR',
        priceGold: 240,
        description: 'Carne densa y marmolada protegida por la coraza quitinosa del Devorador. Jugosa, potente y digna de un banquete colosal.',
      });
      try {
        const stock = loadTavernCookingStock();
        stock['ing_carne_devorador'] = (stock['ing_carne_devorador'] || 0) + 3;
        saveTavernCookingStock(stock);
      } catch (e) {
        console.error('Failed to update tavern stock:', e);
      }
      return;
    }

    if (isRoboEpilogue) {
      completeQuestMission('m2_robo', 3);
      addGold(2000);
      addCrystals(100);
      return;
    }

    if (isBosqueEpilogue) {
      completeQuestMission('m3_bosque', 3);
      addGold(4000);
      addCrystals(150);
      return;
    }

    if (isBosqueMission) {
      completeQuestMission('m3_bosque', 3);
      addGold(3000);
      addCrystals(150);
      return;
    }

    completeQuestMission('m1_tirano', 3);
    addGold(2500);
    addCrystals(150);
    addShelfItem({
      id: 'escamas_cryovain_recompensa',
      name: 'Escamas de Cryovain',
      category: 'materials',
      count: 2,
      icon: '/assets/items/escamas_de_cryovain.png',
      rarity: 'SSR',
      priceGold: 2000,
      description: 'Gélidas escamas desprendidas del dragón blanco Cryovain tras su ataque a Icespear.',
    });
  };

  const handleSkipStory = () => {
    setIsSkipConfirmOpen(false);
    if (isTitanEpilogue || isZancudoEpilogue || isCavernaAzulEpilogue || isFuriaCarmesiEpilogue || isMinasHistoriaMission || isEmboscadaEpilogue || isRoboEpilogue || isBosqueEpilogue || isPuertasEpilogue || isAsaltoOrcoEpilogue) {
      handleCompleteStory();
    } else if (isTitanMission || isZancudoMission || isCavernaAzulMission || isEmboscadaMission || isRoboMission || isBosqueMission || isPuertasMission || isFuriaCarmesiMission) {
      handleStartCombatAfterStory();
    } else {
      handleCompleteStory();
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleAutoPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playSFX('click');
    setIsAutoPlay((prev) => !prev);
  };

  const handleOpenBacklog = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playSFX('click');
    setIsBacklogOpen(true);
  };

  const handleStartCombatAfterStory = () => {
    sound.playSFX('click');
    if (isTitanMission) {
      setSelectedCombatMissionId('m6_cuevas_titan');
    } else if (isZancudoMission) {
      setSelectedCombatMissionId('m5_cuevas_zancudo');
    } else if (isCavernaAzulMission) {
      setSelectedCombatMissionId('m4_cuevas_azul');
    } else if (isFuriaCarmesiMission) {
      setSelectedCombatMissionId('m3_cuevas_rojo');
    } else if (isMinasHistoriaMission) {
      setSelectedCombatMissionId('m3_cuevas_rojo');
    } else if (isAsaltoOrcoMission) {
      setSelectedCombatMissionId('evento_asalto_orco');
    } else if (isEmboscadaMission) {
      setSelectedCombatMissionId('evento_emboscada_bandidos');
    } else if (isPuertasMission) {
      setSelectedCombatMissionId('m4_puertas_selladas');
    } else if (isBosqueMission) {
      setSelectedCombatMissionId('m3_bosque');
    } else if (isRoboMission) {
      setSelectedCombatMissionId('m2_robo');
    } else {
      setSelectedCombatMissionId('m1_tirano');
    }
    if (onLaunchCombat) {
      onLaunchCombat();
    } else {
      navigateTo('combat');
    }
  };

  const handleReturnToQuests = () => {
    sound.playSFX('click');
    if (isAsaltoOrcoEpilogue || isEmboscadaEpilogue) {
      setSelectedCombatMissionId(null);
      navigateTo('world');
      return;
    }
    if (onFinish) {
      onFinish();
    } else {
      navigateTo('quest');
    }
  };


  return (
    <div
      onClick={handleAdvance}
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden select-none bg-black cursor-pointer ${
        isScreenShaking ? 'animate-fgo-shake' : ''
      }`}
    >
      {/* 1. SCENE BACKGROUND */}
      <img
        src={currentLine.background}
        alt="Fondo Historia"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0 transition-opacity duration-700 ease-in-out"
      />

      {/* Atmospheric Overlays */}
      {currentLine.bgOverlay === 'tavern-warmth' && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-amber-950/20 to-black/30 pointer-events-none z-[1]" />
      )}
      {currentLine.bgOverlay === 'blizzard-frost' && (
        <div className="absolute inset-0 bg-gradient-to-t from-sky-950/80 via-cyan-950/30 to-black/40 pointer-events-none z-[1]" />
      )}
      {currentLine.bgOverlay === 'tense-shadow' && (
        <div className="absolute inset-0 bg-gradient-to-t from-red-950/80 via-black/40 to-black/50 pointer-events-none z-[1]" />
      )}
      {currentLine.bgOverlay === 'void-purple' && (
        <div className="absolute inset-0 bg-gradient-to-t from-purple-950/90 via-[#180326]/50 to-black/60 pointer-events-none z-[1]" />
      )}

      {/* Screen Flash on Critical Dramatic Beats */}
      {screenFlash && (
        <div
          className={`absolute inset-0 z-40 pointer-events-none transition-opacity duration-300 ${
            screenFlash === 'red'
              ? 'bg-red-600/50'
              : screenFlash === 'cyan'
              ? 'bg-cyan-400/50'
              : screenFlash === 'purple'
              ? 'bg-purple-600/70 shadow-[inset_0_0_90px_rgba(168,85,247,0.9)]'
              : 'bg-amber-300/60'
          }`}
        />
      )}

      {/* 2. TOP FGO HUD / CONTROLS */}
      <div className="relative z-30 w-full px-3 pt-2.5 flex items-center justify-end text-amber-100 shrink-0">
        {/* FGO Action Buttons */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* AUTO PLAY BUTTON */}
          <button
            type="button"
            onClick={handleToggleAutoPlay}
            className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border shadow transition-all cursor-pointer ${
              isAutoPlay
                ? 'bg-emerald-800 text-emerald-100 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                : 'bg-[#220d05]/90 text-stone-300 border-[#5e270d] hover:text-white'
            }`}
            title="Avance Automático"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAutoPlay ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'
              }`}
            />
            <span>AUTO</span>
          </button>

          {/* LOG / BACKLOG BUTTON */}
          <button
            type="button"
            onClick={handleOpenBacklog}
            className="px-2.5 py-1 rounded-md bg-[#220d05]/90 text-stone-300 border border-[#5e270d] hover:text-white text-[9px] font-black uppercase tracking-wider shadow cursor-pointer transition-all active:scale-95"
            title="Historial de Diálogos"
          >
            LOG
          </button>

          {/* AUDIO MUTE TOGGLE */}
          <button
            type="button"
            onClick={handleToggleMute}
            className="p-1 rounded-md bg-[#220d05]/90 text-stone-300 border border-[#5e270d] hover:text-white shadow cursor-pointer"
            title={isMuted ? 'Activar Sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-300" />}
          </button>

          {/* SKIP BUTTON */}
          <button
            type="button"
            onClick={() => setIsSkipConfirmOpen(true)}
            className="px-2.5 py-1 rounded-md bg-gradient-to-b from-[#852a12] to-[#541907] text-amber-200 border border-[#a33d18] hover:brightness-110 text-[9px] font-black uppercase tracking-wider shadow flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="Saltar Diálogo"
          >
            <FastForward className="w-3 h-3" />
            <span>SKIP</span>
          </button>
        </div>
      </div>

      {/* 3. CHARACTER STAGE (Waist-Up Visual Novel Quality with Slide-In & Slide-Out Transitions) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 flex items-end">
        {/* Outgoing Speaker (Sliding Out Offscreen) */}
        {exitingSpeaker && (() => {
          const exitProf = CHARACTER_PROFILES[exitingSpeaker.characterId];
          const exitPoseUrl =
            exitProf.poses[exitingSpeaker.pose] ||
            Object.values(exitProf.poses)[0] ||
            exitProf.avatar;
          const exitAnim =
            exitingSpeaker.side === 'left'
              ? 'animate-fgo-exit-left'
              : exitingSpeaker.side === 'right'
              ? 'animate-fgo-exit-right'
              : 'animate-fgo-exit-center';
          const exitPos =
            exitingSpeaker.side === 'left'
              ? 'left-[3%] sm:left-[8%]'
              : exitingSpeaker.side === 'right'
              ? 'right-[3%] sm:right-[8%]'
              : 'left-1/2';

          return (
            <div
              key={exitingSpeaker.id}
              className={`absolute bottom-0 ${exitPos} ${exitAnim} z-10 flex flex-col items-center pointer-events-none select-none`}
            >
              <img
                src={exitPoseUrl}
                alt={exitProf.name}
                className={`${exitProf.framing.height} w-auto max-w-none object-contain brightness-90 transition-all ${exitProf.framing.translateY}`}
              />
            </div>
          );
        })()}

        {/* Active Speaker (Sliding In From Offscreen or Hopping in Focus) */}
        {activeSpeaker && (() => {
          const activeProf = CHARACTER_PROFILES[activeSpeaker.characterId];
          const activePoseUrl =
            activeProf.poses[activeSpeaker.pose] ||
            Object.values(activeProf.poses)[0] ||
            activeProf.avatar;
          const enterAnim =
            activeSpeaker.side === 'left'
              ? activeSpeaker.animType === 'enter'
                ? 'animate-fgo-enter-left'
                : 'animate-fgo-hop'
              : activeSpeaker.side === 'right'
              ? activeSpeaker.animType === 'enter'
                ? 'animate-fgo-enter-right'
                : 'animate-fgo-hop'
              : activeSpeaker.animType === 'enter'
              ? 'animate-fgo-enter-center'
              : '-translate-x-1/2 animate-fgo-hop';
          const activePos =
            activeSpeaker.side === 'left'
              ? 'left-[3%] sm:left-[8%]'
              : activeSpeaker.side === 'right'
              ? 'right-[3%] sm:right-[8%]'
              : 'left-1/2';

          return (
            <div
              key={activeSpeaker.id}
              className={`absolute bottom-0 ${activePos} ${enterAnim} z-20 flex flex-col items-center pointer-events-none select-none`}
            >
              {/* Character Standing Sprite: Waist-up clearly visible, waist-down 100% concealed behind dialogue box */}
              <img
                src={activePoseUrl}
                alt={activeProf.name}
                className={`${activeProf.framing.height} w-auto max-w-none object-contain brightness-110 drop-shadow-[0_0_24px_rgba(251,191,36,0.35)] transition-all ${activeProf.framing.translateY}`}
              />
            </div>
          );
        })()}
      </div>

      {/* 4. AUTHENTIC FATE/GRAND ORDER DIALOGUE BOX (Taller, 4% larger, flush to bottom, hides waist-down completely) */}
      <div className="relative z-30 w-full px-0 pb-0 shrink-0 mt-auto">
        {/* Dialogue frame container scaled 4% larger and taller */}
        <div className="relative w-full h-[245px] sm:h-[270px] scale-[1.04] origin-bottom flex flex-col justify-end bg-gradient-to-t from-black via-[#0d0401] to-[#0d0401]/95">
          {/* Exact Ornate Dialog Frame Asset - 4% larger with crisp drop-shadow */}
          <img
            src="/assets/items/panel_dialogo_idl.png"
            alt="Panel de Diálogo"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none drop-shadow-[0_-4px_20px_rgba(0,0,0,0.98)]"
          />

          {/* SPEAKER RIBBON (Top-Left Golden Scroll on panel_dialogo_idl.png) */}
          <div
            className="absolute left-[3.2%] top-[3%] w-[36%] h-[20%] flex flex-col justify-center items-center text-center px-1 pointer-events-none select-none z-10"
          >
            <span className="font-serif font-black text-[12px] sm:text-[14px] uppercase tracking-wide text-[#381303] leading-none drop-shadow-[0_1px_0_rgba(255,240,200,0.85)] truncate max-w-full">
              {currentLine.speakerName}
            </span>
            <span className="text-[7.5px] sm:text-[8.5px] font-sans font-bold uppercase tracking-wider text-[#632408] leading-tight truncate max-w-full mt-0.5">
              {currentLine.speakerTitle || speakerProfile.title}
            </span>
          </div>

          {/* DIALOGUE TEXT BODY (Centered inside the dark parchment scroll body, responsive fit, never cuts off) */}
          <div
            className="absolute left-[5%] right-[8%] top-[22%] bottom-[6%] flex flex-col justify-start overflow-y-auto no-scrollbar pointer-events-auto z-10 px-1 pt-0.5"
          >
            <p className="font-sans text-[#fef3c7] font-semibold text-[13px] sm:text-[14px] leading-[1.44] drop-shadow-[0_1px_2px_rgba(0,0,0,0.98)] tracking-wide selection:bg-amber-600 break-words">
              {displayedText}
              {isTyping && (
                <span className="inline-block w-1.5 h-3.5 bg-amber-400 ml-1 animate-pulse align-middle" />
              )}
            </p>
          </div>

          {/* PROMPT NEXT INDICATOR (Bottom-Right Heart/Shield Badge with Pulsing Bounce) */}
          <div
            className="absolute right-[2.5%] bottom-[5%] w-[10%] h-[18%] flex items-center justify-center pointer-events-none z-10"
          >
            {!isTyping && (
              <div className="animate-fgo-cursor flex items-center justify-center">
                <ChevronRight className="w-5 h-5 text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,1)] transform rotate-90" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. BACKLOG MODAL (Fate/Grand Order style scrollable text log) */}
      {isBacklogOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsBacklogOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 select-none animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm max-h-[80vh] flex flex-col bg-[#1c0a03] border-4 border-[#6e2b0d] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-2.5 bg-[#2b1005] border-b border-[#5e250b] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif font-black text-xs uppercase tracking-wider text-amber-200">
                  Historial de Diálogo (Log)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBacklogOpen(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable list of lines heard so far */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 [scrollbar-width:thin] text-left">
              {dialogueLines.slice(0, currentLineIndex + 1).map((line, idx) => {
                const charProf = CHARACTER_PROFILES[line.speakerId] || CHARACTER_PROFILES.arlem;
                return (
                  <div
                    key={line.id}
                    className="flex gap-2.5 p-2 rounded-xl bg-[#130601] border border-[#4a1c07] shadow-sm"
                  >
                    <img
                      src={charProf.avatar}
                      alt={charProf.name}
                      className="w-10 h-10 rounded-lg object-cover border border-amber-600/60 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-black text-[11px] text-amber-300">
                          {charProf.name}
                        </span>
                        <span className="text-[8px] font-mono text-stone-500">#{idx + 1}</span>
                      </div>
                      <p className="text-[10.5px] text-stone-200 leading-snug mt-0.5">
                        {formatDialogueText(line.text)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-2 bg-[#2b1005] border-t border-[#5e250b] text-center">
              <button
                type="button"
                onClick={() => setIsBacklogOpen(false)}
                className="w-full py-1.5 rounded-lg bg-gradient-to-r from-amber-700 to-amber-800 text-white font-black text-[10px] uppercase tracking-wider cursor-pointer shadow hover:brightness-110"
              >
                Cerrar Historial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. SKIP CONFIRMATION MODAL */}
      {isSkipConfirmOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsSkipConfirmOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 select-none animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xs p-4 bg-[#210c04] border-3 border-[#78350f] rounded-2xl text-center space-y-3 shadow-2xl"
          >
            <h4 className="font-serif font-black text-sm uppercase text-amber-300">
              {isRoboMission ? '¿Saltar Diálogo e Iniciar Combate?' : '¿Saltar Prólogo de Historia?'}
            </h4>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              {isRoboMission
                ? 'Saltarás la escena cómica del asalto a la mansión y comenzarás de inmediato el combate contra las 4 oleadas de la guardia urbana en el callejón.'
                : 'Completarás la escena narrativa, firmarás el contrato del Capitán Gabriel y desbloquearás la batalla contra Cryovain.'}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsSkipConfirmOpen(false)}
                className="flex-1 py-1.5 rounded-lg bg-[#381608] border border-[#5a240c] text-stone-300 text-[10px] font-bold uppercase cursor-pointer hover:text-white"
              >
                Continuar Viendo
              </button>
              <button
                type="button"
                onClick={handleSkipStory}
                className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer shadow hover:brightness-110"
              >
                {isRoboMission ? '¡A las Armas!' : 'Saltar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATTLE TRANSITION ALERT OVERLAY (IMMEDIATE CUTSCENE TO COMBAT TRANSITION) */}
      {battleTransitionAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 select-none animate-in fade-in zoom-in-95">
          <div className="relative w-full max-w-xs p-5 bg-gradient-to-b from-red-950 via-[#1f0704] to-black border-2 border-red-500 rounded-2xl text-center space-y-2.5 shadow-[0_0_35px_rgba(239,68,68,0.8)]">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-600/30 border border-red-500 flex items-center justify-center animate-pulse">
              <Swords className="w-6 h-6 text-red-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-red-400 block animate-pulse">
              {isTitanMission
                ? '¡DESPERTAR DEL TITÁN MELENUDO!'
                : isZancudoMission
                ? '¡EMBOSCADA EN LAS TELARAÑAS!'
                : isCavernaAzulMission
                ? '¡BROTE PARASITARIO EN EL HIELO!'
                : isEmboscadaMission
                ? '¡ASALTO EN EL VADO!'
                : isPuertasMission
                ? '¡EL SELLO SE ROMPE!'
                : '¡ALARMA EN EL CALLEJÓN!'}
            </span>
            <h3 className="font-serif font-black text-base uppercase text-amber-200">
              {isTitanMission
                ? '¡El Titán Melenudo!'
                : isZancudoMission
                ? '¡El Zancudo Espectral!'
                : isCavernaAzulMission
                ? '¡Acechadores Gélidos!'
                : isEmboscadaMission
                ? '¡Emboscada de Bandidos!'
                : isPuertasMission
                ? '¡Devorador Quitinoso!'
                : '¡Rodeados por la Guardia!'}
            </h3>
            <p className="text-[11px] text-stone-200 leading-snug">
              {isTitanMission
                ? '¡El estornudo de Lord Vaelas ha despertado al titán! Todos sus ataques son eléctricos (25% aturdimiento) y tiene 80% de resistencia al daño definitivo.'
                : isZancudoMission
                ? '¡La temible tejedora de agujas desciende de las vigas! Cuidado: ¡cada vez que recibe daño invoca a un araknoide básico más!'
                : isCavernaAzulMission
                ? '¡Cuatro acechadores gélidos emergen de las estalagmitas! Pepe Loux se dispone a erradicar la infección arácnida.'
                : isEmboscadaMission
                ? '¡Defiende la caravana de mercaderes y derrota al grupo de forajidos!'
                : isPuertasMission
                ? '¡Una monstruosidad ancestral despierta frente a las puertas selladas!'
                : 'Los silbatos de alerta resuenan en la noche de Icespear. ¡Iniciando combate de 4 oleadas consecutivas!'}
            </p>
          </div>
        </div>
      )}

      {/* 7. STORY MISSION CLEAR VICTORY MODAL (Fate/Grand Order style quest banner) */}
      {isStoryCompleted && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 select-none animate-fade-in"
        >
          <div className="relative w-full max-w-sm bg-gradient-to-b from-[#2a1005] via-[#1a0802] to-[#0c0401] border-4 border-[#d97706] rounded-2xl p-4 sm:p-5 text-center text-stone-200 shadow-[0_0_30px_rgba(217,119,6,0.6)] space-y-3.5">
            {/* Top Crest */}
            <div className="flex justify-center -mt-8 sm:-mt-9">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 p-1 border-2 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.8)] flex items-center justify-center">
                <Trophy className="w-7 h-7 text-amber-100 drop-shadow" />
              </div>
            </div>

            {/* Mission Clear Banner */}
            <div>
              <span className="px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/60 text-[9px] font-black uppercase tracking-widest text-amber-300 inline-block mb-1">
                {isZancudoEpilogue
                  ? '¡EL ZANCUDO ESPECTRAL PURGADO!'
                  : isCavernaAzulEpilogue
                  ? '¡INFECCIÓN GLACIAL PURIFICADA!'
                  : isFuriaCarmesiEpilogue
                  ? '¡CÁMARA CARMESÍ PURGADA!'
                  : isAsaltoOrcoEpilogue
                  ? '¡MISIÓN DE MAPA SUPERADA CON ÉXITO!'
                  : isAsaltoOrcoMission
                  ? 'MISIÓN DE MAPA: ASALTO ORCO CANÍBAL'
                  : isMinasHistoriaMission
                  ? 'HISTORIA: BAJO LA MONTAÑA'
                  : isPuertasEpilogue
                  ? '¡CAPÍTULO I COMPLETADO • NUEVO CAPÍTULO DISPONIBLE!'
                  : isPuertasMission
                  ? 'HISTORIA: LAS PUERTAS SELLADAS'
                  : isRoboEpilogue
                  ? 'EPÍLOGO: ROBO NO TAN JUSTO'
                  : isBosqueEpilogue
                  ? 'EPÍLOGO: PISADAS EN LA NIEVE'
                  : isRoboMission
                  ? 'HISTORIA: ROBO NO TAN JUSTO'
                  : isBosqueMission
                  ? 'HISTORIA: PISADAS EN LA NIEVE'
                  : 'PRÓLOGO DE HISTORIA SUPERADO'}
              </span>
              <h3 className="font-serif font-black text-lg sm:text-xl uppercase text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {isZancudoEpilogue
                  ? '¡LA CAÍDA DE LA TEJEDORA DE AGUJAS!'
                  : isCavernaAzulEpilogue
                  ? '¡LA CAÍDA DE LOS ACECHADORES GÉLIDOS!'
                  : isFuriaCarmesiEpilogue
                  ? '¡EL EXTERMINIO DE LA TRINIDAD CARMESÍ!'
                  : isMinasHistoriaMission
                  ? '¡PACTO SELLADO BAJO LA MONTAÑA!'
                  : isAsaltoOrcoEpilogue
                  ? '¡FAMILIA TIEFLING A SALVO!'
                  : isAsaltoOrcoMission
                  ? '¡ALERTA CANÍBAL EN EL PASO HELADO!'
                  : isPuertasEpilogue
                  ? '¡CAPÍTULO II: LAS MINAS DESBLOQUEADO!'
                  : isPuertasMission
                  ? '¡Acorralados ante el Muro Enano!'
                  : isRoboEpilogue
                  ? '¡El Enigma de la Figura Oscura!'
                  : isBosqueEpilogue
                  ? '¡El Horror de la Jaula Liberado!'
                  : isRoboMission
                  ? '¡Sorprendidos In Fraganti!'
                  : isBosqueMission
                  ? '¡Emboscada en el Bosque!'
                  : '¡Contrato de Cryovain Aceptado!'}
              </h3>
              <p className="text-[11px] text-stone-300 leading-snug mt-1">
                {isZancudoEpilogue
                  ? '¡Caldo de Dragón y Lord Vaelas han aniquilado al Zancudo Espectral! La entrada al corazón más profundo de la colonia queda abierta y el descenso final hacia la Reina y el artefacto drow os aguarda.'
                  : isCavernaAzulEpilogue
                  ? '¡Pepe Loux ha erradicado la plaga parasitaria de los cuatro acechadores gélidos en la caverna congelada! El sacrificio de Durnik ha sido honrado y la galería queda libre del virus arácnido.'
                  : isFuriaCarmesiEpilogue
                  ? '¡Edacorn ha purgado la cámara de cría calcinando los racimos de huevos carmesís con fuego y azufre! La galería oeste queda libre de peligro y los diarios mineros de la Casa Loux han sido recuperados.'
                  : isMinasHistoriaMission
                  ? 'Caldo de Dragón ha sellado el juramento con la colonia enana para exterminar a la plaga de araknoides del Underdark y descender hasta las simas de la Madre de Nidos. ¡Las galerías mineras os aguardan!'
                  : isAsaltoOrcoEpilogue
                  ? '¡El temible Caudillo Gorrak y sus orcos han sido derrotados! Kallista abraza con lágrimas en los ojos a su pequeña Lily mientras Caldo de Dragón las escolta sanas y salvas hacia la calidez del Gran Santuario de Icespear.'
                  : isAsaltoOrcoMission
                  ? '¡Los orcos afirman que nunca han probado tiefling y pretenden devorar a la pequeña de cuernos morados y a su madre! Caldo de Dragón interviene para impedir la tragedia.'
                  : isPuertasEpilogue
                  ? '¡El descomunal Devorador Quitinoso ha mordido el polvo de la nieve! Con la Llave Maestra enana y los sellos arcanos destruidos, las puertas hacia la colonia subterránea de Glimmerstone han quedado abiertas de par en par. ¡El Capítulo II: Las Minas ya está desbloqueado en el panel de misiones!'
                  : isPuertasMission
                  ? '¡Las gigantescas puertas de la colonia minera están selladas a vuestras espaldas! La monstruosidad subterránea corta el desfiladero y Caldo de Dragón debe luchar por su supervivencia.'
                  : isRoboEpilogue
                  ? 'Con un chasquido de dedos, la enigmática silueta encapuchada de ojos morados borró los recuerdos de los guardias noqueados. Caldo de Dragón escapa velozmente con el botín de la mansión... ¡pero las intenciones de esta entidad permanecen en las sombras!'
                  : isBosqueEpilogue
                  ? '¡Los goblins derrotados abrieron la jaula de hierro enano oculta en la maleza! El colosal Devorador Quitinoso los engulló en un santiamén y ahora embiste a toda carrera persiguiendo a Caldo de Dragón hacia la colonia minera de plata.'
                  : isRoboMission
                  ? '¡El atraco a la mansión ha salido a pedir de boca... hasta que sonaron los silbatos de alarma! Cuatro oleadas de la guardia os rodean en el callejón.'
                  : isBosqueMission
                  ? '¡El anciano vagabundo os reveló la entrada secreta a la colonia minera de plata de Glimmerstone! Pero una jauría de goblins salta de los pinos para cortar vuestro paso.'
                  : 'El Capitán Gabriel se ha tragado su odio hacia los aventureros ante la desesperación de la masacre de su guardia. ¡Caldo de Dragón marcha hacia el glaciar!'}
              </p>
            </div>

            {/* Mission Rewards Container */}
            <div className="bg-[#120501] border border-[#521c08] rounded-xl p-2.5 space-y-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 block">
                Recompensas de Misión
              </span>
              <div className="grid grid-cols-3 gap-2">
                {/* Reward 1: Oro */}
                <div className="flex flex-col items-center p-1.5 rounded-lg bg-[#240c04] border border-[#6b2507]">
                  <span className="font-mono text-xs font-black text-amber-400">
                    {isZancudoEpilogue
                      ? '+10,000'
                      : isCavernaAzulEpilogue
                      ? '+8,000'
                      : isFuriaCarmesiEpilogue
                      ? '+7,000'
                      : isMinasHistoriaMission
                      ? '+5,000'
                      : isAsaltoOrcoEpilogue
                      ? '+5,000'
                      : isAsaltoOrcoMission
                      ? '+3,000'
                      : isPuertasEpilogue
                      ? '+8,000'
                      : isPuertasMission
                      ? '+4,000'
                      : isRoboEpilogue
                      ? '+2,000'
                      : isBosqueEpilogue
                      ? '+4,000'
                      : isRoboMission
                      ? '+1,500'
                      : isBosqueMission
                      ? '+3,000'
                      : '+2,500'}
                  </span>
                  <span className="text-[8px] font-bold uppercase text-amber-200">ORO</span>
                </div>
                {/* Reward 2: Gemas */}
                <div className="flex flex-col items-center p-1.5 rounded-lg bg-[#240c04] border border-[#6b2507]">
                  <span className="font-mono text-xs font-black text-sky-400">
                    {isZancudoEpilogue
                      ? '+350'
                      : isCavernaAzulEpilogue
                      ? '+250'
                      : isFuriaCarmesiEpilogue
                      ? '+250'
                      : isMinasHistoriaMission
                      ? '+200'
                      : isAsaltoOrcoEpilogue
                      ? '+200'
                      : isAsaltoOrcoMission
                      ? '+100'
                      : isPuertasEpilogue
                      ? '+300'
                      : isPuertasMission
                      ? '+150'
                      : isRoboEpilogue
                      ? '+100'
                      : isBosqueEpilogue
                      ? '+150'
                      : isRoboMission
                      ? '+50'
                      : isBosqueMission
                      ? '+100'
                      : '+150'}
                  </span>
                  <span className="text-[8px] font-bold uppercase text-sky-200">GEMAS</span>
                </div>
                {/* Reward 3 */}
                <div className="flex flex-col items-center p-1.5 rounded-lg bg-[#240c04] border border-[#6b2507]">
                  <img
                    src={
                      isZancudoEpilogue
                        ? '/assets/combat/semiboss_zancudo_thumb.png'
                        : isCavernaAzulEpilogue
                        ? '/assets/portraits/enano_infectado_thumb.png'
                        : isFuriaCarmesiEpilogue
                        ? '/assets/portraits/edacorn_alas_thumb.png'
                        : isMinasHistoriaMission
                        ? '/assets/portraits/enanos_mineros_thumb.png'
                        : isAsaltoOrcoEpilogue || isAsaltoOrcoMission
                        ? '/assets/combat/orco_caudillo_thumb.png'
                        : isPuertasEpilogue || isPuertasMission
                        ? '/assets/combat/bestia_jaula_clean.png'
                        : isRoboEpilogue
                        ? '/assets/items/cofre_sellado_mansion.png'
                        : isBosqueEpilogue
                        ? '/assets/portraits/bestia_jaula_thumb.png'
                        : isRoboMission
                        ? '/assets/combat/guardia_lanza_thumb.png'
                        : isBosqueMission
                        ? '/assets/combat/goblin_garrote_thumb.png'
                        : '/assets/items/escamas_de_cryovain.png'
                    }
                    alt="Recompensa"
                    className="w-5 h-5 object-contain"
                  />
                  <span className="text-[8px] font-bold uppercase text-amber-300 mt-0.5 truncate max-w-[80px]">
                    {isZancudoEpilogue
                      ? 'AGUJA ZANCUDO'
                      : isCavernaAzulEpilogue
                      ? 'AGUJA VIRAL'
                      : isFuriaCarmesiEpilogue
                      ? 'HUEVO SSR'
                      : isMinasHistoriaMission
                      ? 'PACTO ENANO'
                      : isAsaltoOrcoEpilogue
                      ? 'COLMILLO GORRAK'
                      : isAsaltoOrcoMission
                      ? 'BANDA ORCA'
                      : isPuertasEpilogue
                      ? 'CORAZA TITÁN'
                      : isPuertasMission
                      ? 'JEFE 2 FASES'
                      : isRoboEpilogue
                      ? 'COFRE BOTÍN'
                      : isBosqueEpilogue
                      ? 'DEVORADOR'
                      : isRoboMission
                      ? 'INSIGNIA'
                      : isBosqueMission
                      ? 'MAPA PLATA'
                      : 'x2 ESCAMAS'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {!isRoboEpilogue && !isBosqueEpilogue && !isPuertasEpilogue && !isEmboscadaEpilogue && !isAsaltoOrcoEpilogue && !isFuriaCarmesiEpilogue && !isCavernaAzulEpilogue && !isZancudoEpilogue && (
                <button
                  type="button"
                  onClick={handleStartCombatAfterStory}
                  className="w-full py-2.5 bg-gradient-to-r from-red-600 via-amber-600 to-orange-600 hover:brightness-110 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(234,88,12,0.6)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Swords className="w-4 h-4" />
                  <span>
                    {isMinasHistoriaMission
                      ? '¡Iniciar Exterminio: Araknoide Carmesí!'
                      : isAsaltoOrcoMission
                      ? '¡Enfrentar al Caudillo Gorrak y sus Orcos!'
                      : isEmboscadaMission
                      ? '¡Combatir la Emboscada de Bandidos!'
                      : isPuertasMission
                      ? '¡Enfrentar al Devorador Quitinoso (Jefe 2 Fases)!'
                      : isRoboMission
                      ? '¡Combatir a la Guardia por Oleadas!'
                      : isBosqueMission
                      ? '¡Combatir la Emboscada Goblin!'
                      : '¡Ir al Combate contra Cryovain!'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (isBosqueEpilogue) {
                    setSelectedCombatMissionId('m4_puertas_selladas');
                  } else if (isPuertasEpilogue) {
                    setActiveQuestChapter(2);
                    handleReturnToQuests();
                  } else {
                    handleReturnToQuests();
                  }
                }}
                className={`w-full py-2.5 bg-gradient-to-r ${
                  isFuriaCarmesiEpilogue || isPuertasEpilogue
                    ? 'from-amber-500 via-yellow-400 to-amber-500 text-stone-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.7)] ring-2 ring-yellow-400/60'
                    : 'from-amber-700 via-amber-600 to-yellow-600 text-stone-950 font-black shadow-md'
                } hover:brightness-110 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all active:scale-95`}
              >
                {isFuriaCarmesiEpilogue
                  ? '¡Galería Oeste Purgada! Volver al Nexo'
                  : isMinasHistoriaMission
                  ? '¡Pacto Sellado! Volver al Mapa'
                  : isAsaltoOrcoEpilogue
                  ? '¡Misión Cumplida! Volver al Mapa'
                  : isEmboscadaEpilogue
                  ? '¡Misión Cumplida! Volver al Mapa'
                  : isPuertasEpilogue
                  ? '¡Desbloquear Capítulo II: Las Minas!'
                  : isRoboEpilogue
                  ? 'Continuar con el Botín Seguro'
                  : isBosqueEpilogue
                  ? '¡Avanzar a las Puertas Selladas!'
                  : 'Volver al Panel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
