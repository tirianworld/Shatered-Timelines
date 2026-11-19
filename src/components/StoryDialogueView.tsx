import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { launchConfetti } from '../utils/confetti';
import { SPRITE_POSE_SCALE } from '../data/spriteContentRatio';
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
  STORY_PUERTA_LABERINTO_DIALOGUE,
  STORY_ALDEA_EPILOGO_DIALOGUE,
  STORY_CAPITULO3_INTRO_DIALOGUE,
  STORY_CAPITULO3_M9_DIALOGUE,
  STORY_CAPITULO3_M9_EPILOGUE_DIALOGUE,
  STORY_CAPITULO3_M10_DIALOGUE,
  STORY_CAPITULO3_M10_EPILOGUE_DIALOGUE,
  STORY_CAPITULO3_CHISPO_DIALOGUE,
  STORY_CAPITULO3_MANSION_BARON_DIALOGUE,
  STORY_CAPITULO3_M10C_DIALOGUE,
  STORY_CAPITULO3_M10C_EPILOGUE_DIALOGUE,
  STORY_CAPITULO3_M10E_DIALOGUE,
  STORY_CAPITULO3_M10E_EPILOGUE_DIALOGUE,
  STORY_CAPITULO4_M11_DIALOGUE,
  STORY_CAPITULO4_M12_DIALOGUE,
  STORY_CAPITULO4_M12_EPILOGUE_DIALOGUE,
  STORY_CAPITULO4_M13_DIALOGUE,
  STORY_CAPITULO4_M13_EPILOGUE_DIALOGUE,
  STORY_CAPITULO4_M14_DIALOGUE,
  STORY_CAPITULO4_M14_EPILOGUE_DIALOGUE,
  STORY_CAPITULO4_M15_DIALOGUE,
  STORY_CAPITULO4_M16_DIALOGUE,
  STORY_CAPITULO5_M17_DIALOGUE,
  STORY_CAPITULO5_M18_DIALOGUE,
  STORY_CAPITULO5_M18_EPILOGUE_DIALOGUE,
  STORY_CAPITULO5_M19_DIALOGUE,
  STORY_CAPITULO5_M19_EPILOGUE_DIALOGUE,
  STORY_CAPITULO5_M20_DIALOGUE,
  STORY_CAPITULO5_M20_EPILOGUE_DIALOGUE,
  STORY_CAPITULO5_M21_COLISEO_DIALOGUE,
  STORY_EVENTO_COLISEO_EPILOGUE_DIALOGUE,
  STORY_CAPITULO6_INTRO_DIALOGUE,
  STORY_CAPITULO6_PUERTA_EPILOGUE_DIALOGUE,
  STORY_CAPITULO6_VERDAD_GABRIEL_DIALOGUE,
  STORY_TOMO2_C1_M5_CID_DIALOGUE,
  STORY_TOMO2_C1_BARRACON_INTRO_DIALOGUE,
  STORY_TOMO2_C1_BARRACON_EPILOGUE_DIALOGUE,
  STORY_TOMO2_C1_JAURIA_DIALOGUE,
  STORY_TOMO2_C1_ARMADURA_DIALOGUE,
  STORY_TOMO2_C1_ARANA_DIALOGUE,
  STORY_MIDAS_EASY_DIALOGUE,
  STORY_MIDAS_EASY_EPILOGUE_DIALOGUE,
  CHARACTER_PROFILES,
  DialogueLine,
  EmotionType,
  formatDialogueText,
} from '../data/storyDialogueData';
import { loadTavernCookingStock, saveTavernCookingStock } from '../data/cookingData';
import {
  KITCHEN_MONSTERS_INTRO_MISSION_ID,
  PACO_FOGON_DIALOGUE,
  PACO_MONSTERS_DIALOGUE,
} from '../data/kitchenIntroData';
import { FORGE_INTRO_MISSION_ID, GORYN_FORGE_DIALOGUE } from '../data/forgeIntroData';
import { BOTICA_INTRO_MISSION_ID, RAXXAR_BOTICA_DIALOGUE } from '../data/boticaIntroData';
import { NALA_ORDER_HQ_DIALOGUE, ORDER_HQ_INTRO_MISSION_ID } from '../data/orderHqIntroData';
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
    setPendingMissionLaunch,
    completeQuestMission,
    addGold,
    addCrystals,
    addShelfItem,
    setActiveQuestChapter,
    setActiveWorldPlane,
    isMissionCompleted,
  } = useGame();

  const isTome2Ch1BarraconEpilogue =
    selectedCombatMissionId === 't2_c1_m1_trincheras_nomuertos_epilogo';
  const isTome2Ch1BarraconMission =
    selectedCombatMissionId === 't2_c1_m1_trincheras_nomuertos' ||
    isTome2Ch1BarraconEpilogue;
  const isTome2Ch1JauriaMission = selectedCombatMissionId === 't2_c1_m2_jauria_salas';
  const isTome2Ch1ArmaduraMission =
    selectedCombatMissionId === 't2_c1_m3_custodios_anillo';
  const isTome2Ch1AranaMission = selectedCombatMissionId === 't2_c1_m4_arana_acorazada';
  const isTome2Ch1Story =
    isTome2Ch1BarraconMission ||
    isTome2Ch1JauriaMission ||
    isTome2Ch1ArmaduraMission ||
    isTome2Ch1AranaMission;
  // Resumen del prólogo del Tomo II (el salto de historia no debe hablar de Cryovain).
  const tome2Ch1SkipTitle = isTome2Ch1BarraconMission
    ? '¡DESPERTAIS EN EL BARRACÓN ABANDONADO!'
    : isTome2Ch1JauriaMission
    ? '¡EMBOSCADA EN LA SALA TRES!'
    : isTome2Ch1ArmaduraMission
    ? '¡EL ANILLO DE LADRÓN ES VUESTRO!'
    : '¡LA ARAÑA ACORAZADA HA CAÍDO!';
  const tome2Ch1SkipText = isTome2Ch1BarraconMission
    ? 'Seis desconocidos despiertan casi desnudos en un barracón abandonado, lejos de Kaliria y sin saber cómo han llegado hasta allí. Una nota tras la mesa volcada les señala el equipo escondido tras el horno de la cocina, y el pasillo de la derecha termina en un muro: la única salida son las escaleras.'
    : isTome2Ch1JauriaMission
    ? 'En la sala dos, un mueble de alquimista guarda una poción de curación por cabeza. El pasillo largo acaba en una rejilla cerrada con llave, así que el grupo vuelve sobre sus pasos... y dos perros asalvajados saltan desde los papeles amontonados de la sala tres.'
    : isTome2Ch1ArmaduraMission
    ? 'Bajo la alfombra de la sala cinco aparece una llave oxidada: la de la rejilla. Tras abrirse paso entre tres soldados no muertos, Ragnavaldr sube a la sala hexagonal, donde una armadura en un pedestal cobra vida al tocar el cofre. Al vencerla, la armadura se desvanece y el cofre entrega el Anillo de Ladrón.'
    : 'En la sala seis, dos no muertos rezan arrodillados ante una puerta entreabierta. Al otro lado espera la Araña Acorazada: caparazón como escudo, telas que la guían y un cono de fuego que obliga a separarse. La bestia cae y el barracón empieza a arder.';
  const tome2Ch1SkipIcon = isTome2Ch1AranaMission
    ? '/assets/portraits/arana_acorazada_thumb.webp'
    : isTome2Ch1ArmaduraMission
    ? '/assets/portraits/armadura_reanimada_thumb.webp'
    : isTome2Ch1JauriaMission
    ? '/assets/portraits/perro_asalvajado_thumb.webp'
    : '/assets/portraits/no_muerto_thumb.webp';
  const isTome2Ch1CidMission =
    selectedCombatMissionId === 't2_c1_m5_carreta_cid' ||
    selectedCombatMissionId === 't2_c1_m5_carreta_cid_epilogo';
  const isCh6VerdadGabrielMission =
    selectedCombatMissionId === 'm21d_verdad_gabriel' ||
    selectedCombatMissionId === 'm21d_verdad_gabriel_epilogo';
  const isCh6ForzarPuertaEpilogue =
    selectedCombatMissionId === 'm21c_forzar_puerta_epilogo';
  const isCh6CasaGabrielMission =
    selectedCombatMissionId === 'm21b_casa_gabriel' ||
    selectedCombatMissionId === 'm21b_casa_gabriel_epilogo';
  const isEventoColiseoEpilogue =
    selectedCombatMissionId === 'evento_coliseo_suenos_epilogo';
  const isColiseoSuenosMission =
    selectedCombatMissionId === 'm21_coliseo_suenos' ||
    selectedCombatMissionId === 'm21_coliseo_suenos_epilogo';
  const isBulezauMazmorraMission =
    selectedCombatMissionId === 'm20_tercera_camara_bulezau' ||
    selectedCombatMissionId === 'm20_tercera_camara_bulezau_epilogo';
  const isBulezauMazmorraEpilogue =
    selectedCombatMissionId === 'm20_tercera_camara_bulezau_epilogo';
  const isAireMazmorraMission =
    selectedCombatMissionId === 'm19_segunda_camara_aire' ||
    selectedCombatMissionId === 'm19_segunda_camara_aire_epilogo';
  const isAireMazmorraEpilogue =
    selectedCombatMissionId === 'm19_segunda_camara_aire_epilogo';
  const isGorgonMazmorraMission =
    selectedCombatMissionId === 'm18_primera_camara_gorgon' ||
    selectedCombatMissionId === 'm18_primera_camara_gorgon_epilogo';
  const isGorgonMazmorraEpilogue =
    selectedCombatMissionId === 'm18_primera_camara_gorgon_epilogo';
  const isDespertarSuenosMission =
    selectedCombatMissionId === 'm17_despertar_suenos' ||
    selectedCombatMissionId === 'm17_despertar_suenos_epilogo';
  const isAudienciaBaronMission =
    selectedCombatMissionId === 'm16_audiencia_baron' ||
    selectedCombatMissionId === 'm16_audiencia_baron_epilogo';
  const isDespachoFertonMission =
    selectedCombatMissionId === 'm15_despacho_ferton' ||
    selectedCombatMissionId === 'm15_despacho_ferton_epilogo';
  const isPlantaIntermediaMansionMission =
    selectedCombatMissionId === 'm14_planta_intermedia_ferton' ||
    selectedCombatMissionId === 'm14_planta_intermedia_ferton_epilogo';
  const isPlantaIntermediaMansionEpilogue =
    selectedCombatMissionId === 'm14_planta_intermedia_ferton_epilogo';
  const isDurnikEscalerasMission =
    selectedCombatMissionId === 'm13_escaleras_durnik' ||
    selectedCombatMissionId === 'm13_escaleras_durnik_epilogo';
  const isDurnikEscalerasEpilogue =
    selectedCombatMissionId === 'm13_escaleras_durnik_epilogo';
  const isRecibidorMansionMission =
    selectedCombatMissionId === 'm12_recibidor_mansion_ferton' ||
    selectedCombatMissionId === 'm12_recibidor_mansion_ferton_epilogo';
  const isRecibidorMansionEpilogue =
    selectedCombatMissionId === 'm12_recibidor_mansion_ferton_epilogo';
  const isMansionFertonLlegadaMission =
    selectedCombatMissionId === 'm11_llegada_mansion_ferton' ||
    selectedCombatMissionId === 'm11_llegada_mansion_ferton_epilogo';
  const isTabernaDuergarEpilogue =
    selectedCombatMissionId === 'm10e_taberna_duergar_epilogo';
  const isTabernaDuergarMission =
    selectedCombatMissionId === 'm10e_taberna_duergar';
  const isBaronMansionMission =
    selectedCombatMissionId === 'm10d_mansion_baron' ||
    selectedCombatMissionId === 'm10d_mansion_baron_epilogo';
  const isCallejonHoggoblinsMission =
    selectedCombatMissionId === 'm10c_callejon_hoggoblins' ||
    selectedCombatMissionId === 'm10c_callejon_hoggoblins_epilogo';
  const isCallejonHoggoblinsEpilogue =
    selectedCombatMissionId === 'm10c_callejon_hoggoblins_epilogo';
  const isChispoEncuentroMission =
    selectedCombatMissionId === 'm10b_encuentro_chispo' ||
    selectedCombatMissionId === 'm10b_encuentro_chispo_epilogo';
  const isHobgoblinBossMission =
    selectedCombatMissionId === 'm10_hobgoblin_boss' ||
    selectedCombatMissionId === 'm10_hobgoblin_boss_epilogo';
  const isHobgoblinBossEpilogue =
    selectedCombatMissionId === 'm10_hobgoblin_boss_epilogo';
  const isFertonMission =
    selectedCombatMissionId === 'm9_emboscada_ferton' ||
    selectedCombatMissionId === 'm9_emboscada_ferton_epilogo';
  const isFertonEpilogue =
    selectedCombatMissionId === 'm9_emboscada_ferton_epilogo';
  const isCapitulo3IntroMission =
    selectedCombatMissionId === 'm8_intro_capitulo3' ||
    selectedCombatMissionId === 'm8_intro_capitulo3_epilogo' ||
    selectedCombatMissionId === 'm8_campamento_orco';
  const isAldeaEpilogue =
    selectedCombatMissionId === 'm7_epilogo_aldea' ||
    selectedCombatMissionId === 'm7_epilogo_aldea_epilogo';
  const isLaberintoMission =
    selectedCombatMissionId === 'm6_puerta_laberinto' ||
    selectedCombatMissionId === 'm6_puerta_laberinto_epilogo' ||
    selectedCombatMissionId === 'm6_cuevas_titan';
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
  const isKitchenIntro = selectedCombatMissionId === 'cocina_paco';
  const isKitchenMonstersIntro = selectedCombatMissionId === KITCHEN_MONSTERS_INTRO_MISSION_ID;
  const isForgeIntro = selectedCombatMissionId === FORGE_INTRO_MISSION_ID;
  const isBoticaIntro = selectedCombatMissionId === BOTICA_INTRO_MISSION_ID;
  const isOrderHqIntro = selectedCombatMissionId === ORDER_HQ_INTRO_MISSION_ID;
  const isMidasEasyMission = selectedCombatMissionId === 'midas_dungeon_easy';
  const isMidasEasyEpilogue = selectedCombatMissionId === 'midas_dungeon_easy_epilogo';

  const rawDialogueLines = isMidasEasyEpilogue
    ? STORY_MIDAS_EASY_EPILOGUE_DIALOGUE
    : isMidasEasyMission
    ? STORY_MIDAS_EASY_DIALOGUE
    : isKitchenMonstersIntro
    ? PACO_MONSTERS_DIALOGUE
    : isBoticaIntro
    ? RAXXAR_BOTICA_DIALOGUE
    : isOrderHqIntro
    ? NALA_ORDER_HQ_DIALOGUE
    : isForgeIntro
    ? GORYN_FORGE_DIALOGUE
    : isKitchenIntro
    ? PACO_FOGON_DIALOGUE
    : isTome2Ch1AranaMission
    ? STORY_TOMO2_C1_ARANA_DIALOGUE
    : isTome2Ch1ArmaduraMission
    ? STORY_TOMO2_C1_ARMADURA_DIALOGUE
    : isTome2Ch1JauriaMission
    ? STORY_TOMO2_C1_JAURIA_DIALOGUE
    : isTome2Ch1BarraconMission
    ? isTome2Ch1BarraconEpilogue
      ? STORY_TOMO2_C1_BARRACON_EPILOGUE_DIALOGUE
      : STORY_TOMO2_C1_BARRACON_INTRO_DIALOGUE
    : isTome2Ch1CidMission
    ? STORY_TOMO2_C1_M5_CID_DIALOGUE
    : isCh6VerdadGabrielMission
    ? STORY_CAPITULO6_VERDAD_GABRIEL_DIALOGUE
    : isCh6ForzarPuertaEpilogue
    ? STORY_CAPITULO6_PUERTA_EPILOGUE_DIALOGUE
    : isCh6CasaGabrielMission
    ? STORY_CAPITULO6_INTRO_DIALOGUE
    : isEventoColiseoEpilogue
    ? STORY_EVENTO_COLISEO_EPILOGUE_DIALOGUE
    : isColiseoSuenosMission
    ? STORY_CAPITULO5_M21_COLISEO_DIALOGUE
    : isBulezauMazmorraEpilogue
    ? STORY_CAPITULO5_M20_EPILOGUE_DIALOGUE
    : isBulezauMazmorraMission
    ? STORY_CAPITULO5_M20_DIALOGUE
    : isAireMazmorraEpilogue
    ? STORY_CAPITULO5_M19_EPILOGUE_DIALOGUE
    : isAireMazmorraMission
    ? STORY_CAPITULO5_M19_DIALOGUE
    : isGorgonMazmorraEpilogue
    ? STORY_CAPITULO5_M18_EPILOGUE_DIALOGUE
    : isGorgonMazmorraMission
    ? STORY_CAPITULO5_M18_DIALOGUE
    : isDespertarSuenosMission
    ? STORY_CAPITULO5_M17_DIALOGUE
    : isAudienciaBaronMission
    ? STORY_CAPITULO4_M16_DIALOGUE
    : isDespachoFertonMission
    ? STORY_CAPITULO4_M15_DIALOGUE
    : isPlantaIntermediaMansionEpilogue
    ? STORY_CAPITULO4_M14_EPILOGUE_DIALOGUE
    : isPlantaIntermediaMansionMission
    ? STORY_CAPITULO4_M14_DIALOGUE
    : isDurnikEscalerasEpilogue
    ? STORY_CAPITULO4_M13_EPILOGUE_DIALOGUE
    : isDurnikEscalerasMission
    ? STORY_CAPITULO4_M13_DIALOGUE
    : isRecibidorMansionEpilogue
    ? STORY_CAPITULO4_M12_EPILOGUE_DIALOGUE
    : isRecibidorMansionMission
    ? STORY_CAPITULO4_M12_DIALOGUE
    : isMansionFertonLlegadaMission
    ? STORY_CAPITULO4_M11_DIALOGUE
    : isTabernaDuergarEpilogue
    ? STORY_CAPITULO3_M10E_EPILOGUE_DIALOGUE
    : isTabernaDuergarMission
    ? STORY_CAPITULO3_M10E_DIALOGUE
    : isBaronMansionMission
    ? STORY_CAPITULO3_MANSION_BARON_DIALOGUE
    : isCallejonHoggoblinsEpilogue
    ? STORY_CAPITULO3_M10C_EPILOGUE_DIALOGUE
    : isCallejonHoggoblinsMission
    ? STORY_CAPITULO3_M10C_DIALOGUE
    : isChispoEncuentroMission
    ? STORY_CAPITULO3_CHISPO_DIALOGUE
    : isHobgoblinBossEpilogue
    ? STORY_CAPITULO3_M10_EPILOGUE_DIALOGUE
    : isHobgoblinBossMission
    ? STORY_CAPITULO3_M10_DIALOGUE
    : isFertonEpilogue
    ? STORY_CAPITULO3_M9_EPILOGUE_DIALOGUE
    : isFertonMission
    ? STORY_CAPITULO3_M9_DIALOGUE
    : isCapitulo3IntroMission
    ? STORY_CAPITULO3_INTRO_DIALOGUE
    : isAldeaEpilogue
    ? STORY_ALDEA_EPILOGO_DIALOGUE

    : isLaberintoMission
    ? STORY_PUERTA_LABERINTO_DIALOGUE
    : isTitanEpilogue
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
  const [screenFlash, setScreenFlash] = useState<'red' | 'cyan' | 'gold' | 'purple' | 'pink' | null>(null);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getIsMuted());

  const currentLine: DialogueLine = dialogueLines[currentLineIndex] || dialogueLines[0];
  const speakerProfile = CHARACTER_PROFILES[currentLine.speakerId] || CHARACTER_PROFILES.arlem;

  const hasEdacornSkullHelmet = isMissionCompleted('m20_tercera_camara_bulezau');
  const isPreBulezauHelmetMission =
    !isBulezauMazmorraEpilogue &&
    Boolean(selectedCombatMissionId) &&
    [
      'm1_tirano',
      'm2_robo',
      'm2_robo_epilogo',
      'm3_bosque',
      'm3_bosque_epilogo',
      'm4_puertas_selladas',
      'm4_puertas_selladas_epilogo',
      'evento_emboscada_bandidos',
      'evento_emboscada_bandidos_epilogo',
      'evento_asalto_orco',
      'evento_asalto_orco_epilogo',
      'm5_minas_historia',
      'm3_cuevas_rojo',
      'm3_cuevas_rojo_epilogo',
      'm4_cuevas_azul',
      'm4_cuevas_azul_epilogo',
      'm5_cuevas_zancudo',
      'm5_cuevas_zancudo_epilogo',
      'm6_cuevas_titan',
      'm6_cuevas_titan_epilogo',
      'm6_puerta_laberinto',
      'm7_epilogo_aldea',
      'm7_epilogo_aldea_epilogo',
      'm8_intro_capitulo3',
      'm8_intro_capitulo3_epilogo',
      'm8_campamento_orco',
      'm9_emboscada_ferton',
      'm9_emboscada_ferton_epilogo',
      'm10_hobgoblin_boss',
      'm10_hobgoblin_boss_epilogo',
      'm10b_encuentro_chispo',
      'm10b_encuentro_chispo_epilogo',
      'm10c_callejon_hoggoblins',
      'm10c_callejon_hoggoblins_epilogo',
      'm10d_mansion_baron',
      'm10d_mansion_baron_epilogo',
      'm10e_taberna_duergar',
      'm10e_taberna_duergar_epilogo',
      'm11_llegada_mansion_ferton',
      'm11_llegada_mansion_ferton_epilogo',
      'm12_recibidor_mansion_ferton',
      'm12_recibidor_mansion_ferton_epilogo',
      'm13_escaleras_durnik',
      'm13_escaleras_durnik_epilogo',
      'm14_planta_intermedia_ferton',
      'm14_planta_intermedia_ferton_epilogo',
      'm15_despacho_ferton',
      'm15_despacho_ferton_epilogo',
      'm16_audiencia_baron',
      'm16_audiencia_baron_epilogo',
      'm17_despertar_suenos',
      'm17_despertar_suenos_epilogo',
      'm18_primera_camara_gorgon',
      'm18_primera_camara_gorgon_epilogo',
      'm19_segunda_camara_aire',
      'm19_segunda_camara_aire_epilogo',
      'm20_tercera_camara_bulezau',
    ].includes(selectedCombatMissionId!);

  const resolveStoryPoseUrl = (
    characterId: typeof currentLine.speakerId,
    pose: string,
    profile: (typeof CHARACTER_PROFILES)[keyof typeof CHARACTER_PROFILES]
  ): string => {
    let effectivePose = pose;
    if (
      characterId === 'edacorn' &&
      hasEdacornSkullHelmet &&
      !isPreBulezauHelmetMission &&
      !isBulezauMazmorraEpilogue &&
      !pose.startsWith('alas') &&
      !pose.startsWith('casco_bulezau')
    ) {
      if (pose === 'saludo') effectivePose = 'casco_bulezau_saludo';
      else if (pose === 'llegada') effectivePose = 'casco_bulezau_llegada';
      else effectivePose = 'casco_bulezau';
    }
    return (
      profile.poses[effectivePose] ||
      Object.values(profile.poses)[0] ||
      profile.avatar
    );
  };

  const resolveStoryAvatarUrl = (
    line: DialogueLine,
    profile: (typeof CHARACTER_PROFILES)[keyof typeof CHARACTER_PROFILES]
  ): string => {
    if (
      line.speakerId === 'edacorn' &&
      (line.pose.startsWith('casco_bulezau') ||
        (hasEdacornSkullHelmet && !isPreBulezauHelmetMission && !isBulezauMazmorraEpilogue))
    ) {
      return '/assets/portraits/edacorn_bulezau_thumb.webp';
    }
    return profile.avatar;
  };

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

  // Música propia de las cinemáticas (aventura épica), distinta de la del combate.
  const CINEMATIC_BGM = '/assets/audio/cinematic_adventure.mp3';

  // Background audio setup
  useEffect(() => {
    sound.initBGM(CINEMATIC_BGM);
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
      setCurrentLineIndex((prev) => prev + 1);
    } else {
      if (isTabernaDuergarEpilogue) {
        handleCompleteStory();
      } else if (isTabernaDuergarMission) {
        setScreenFlash('gold');
        setBattleTransitionAlert(true);
        setTimeout(() => {
          handleStartDrinkingContest();
        }, 1050);
      } else if (isMidasEasyEpilogue || isTome2Ch1CidMission || isCh6VerdadGabrielMission || isCh6ForzarPuertaEpilogue || isCh6CasaGabrielMission || isEventoColiseoEpilogue || isColiseoSuenosMission || isBulezauMazmorraEpilogue || isAireMazmorraEpilogue || isGorgonMazmorraEpilogue || isDespertarSuenosMission || isAudienciaBaronMission || isDespachoFertonMission || isMansionFertonLlegadaMission || isBaronMansionMission || isAldeaEpilogue || isLaberintoMission || isTitanEpilogue || isZancudoEpilogue || isCavernaAzulEpilogue || isFuriaCarmesiEpilogue || isRoboEpilogue || isBosqueEpilogue || isPuertasEpilogue || isEmboscadaEpilogue || isAsaltoOrcoEpilogue || isFertonEpilogue || isChispoEncuentroMission || isCallejonHoggoblinsEpilogue || isRecibidorMansionEpilogue || isDurnikEscalerasEpilogue || isPlantaIntermediaMansionEpilogue) {
        handleCompleteStory();
      } else if (isMidasEasyMission || isTitanMission || isZancudoMission || isCavernaAzulMission || isRoboMission || isBosqueMission || isPuertasMission || isEmboscadaMission || isAsaltoOrcoMission || isFuriaCarmesiMission || (isFertonMission && !isFertonEpilogue) || (isCallejonHoggoblinsMission && !isCallejonHoggoblinsEpilogue) || (isRecibidorMansionMission && !isRecibidorMansionEpilogue) || (isDurnikEscalerasMission && !isDurnikEscalerasEpilogue) || (isPlantaIntermediaMansionMission && !isPlantaIntermediaMansionEpilogue) || (isGorgonMazmorraMission && !isGorgonMazmorraEpilogue) || (isAireMazmorraMission && !isAireMazmorraEpilogue) || (isBulezauMazmorraMission && !isBulezauMazmorraEpilogue)) {
        setScreenFlash(isMidasEasyMission ? 'gold' : isBulezauMazmorraMission ? 'purple' : isAireMazmorraMission ? 'cyan' : isGorgonMazmorraMission ? 'pink' : isPlantaIntermediaMansionMission || isDurnikEscalerasMission || isRecibidorMansionMission ? 'gold' : isCallejonHoggoblinsMission ? 'red' : isFertonMission ? 'gold' : isTitanMission ? 'gold' : isZancudoMission ? 'purple' : isCavernaAzulMission ? 'cyan' : isFuriaCarmesiMission ? 'cyan' : 'red');
        setBattleTransitionAlert(true);
        setTimeout(() => {
          handleStartCombatAfterStory();
        }, 1200);
      } else if (isKitchenMonstersIntro) {
        finishKitchenMonstersIntro();
      } else if (isKitchenIntro) {
        finishKitchenIntro();
      } else if (isForgeIntro) {
        finishForgeIntro();
      } else if (isBoticaIntro) {
        finishBoticaIntro();
      } else if (isOrderHqIntro) {
        finishOrderHqIntro();
      } else {
        handleCompleteStory();
      }
    }
  }, [isTyping, currentLine.text, currentLineIndex, dialogueLines.length, isMidasEasyMission, isMidasEasyEpilogue, isTome2Ch1CidMission, isCh6VerdadGabrielMission, isCh6ForzarPuertaEpilogue, isCh6CasaGabrielMission, isEventoColiseoEpilogue, isColiseoSuenosMission, isBulezauMazmorraMission, isBulezauMazmorraEpilogue, isAireMazmorraMission, isAireMazmorraEpilogue, isGorgonMazmorraMission, isGorgonMazmorraEpilogue, isDespertarSuenosMission, isAudienciaBaronMission, isDespachoFertonMission, isPlantaIntermediaMansionMission, isPlantaIntermediaMansionEpilogue, isDurnikEscalerasMission, isDurnikEscalerasEpilogue, isRecibidorMansionMission, isRecibidorMansionEpilogue, isMansionFertonLlegadaMission, isTabernaDuergarEpilogue, isTabernaDuergarMission, isBaronMansionMission, isAldeaEpilogue, isLaberintoMission, isTitanMission, isTitanEpilogue, isZancudoMission, isZancudoEpilogue, isRoboMission, isRoboEpilogue, isBosqueMission, isBosqueEpilogue, isPuertasMission, isPuertasEpilogue, isEmboscadaMission, isEmboscadaEpilogue, isAsaltoOrcoMission, isAsaltoOrcoEpilogue, isMinasHistoriaMission, isFuriaCarmesiMission, isFuriaCarmesiEpilogue, isCavernaAzulMission, isCavernaAzulEpilogue, isFertonMission, isFertonEpilogue, isHobgoblinBossMission, isHobgoblinBossEpilogue, isChispoEncuentroMission, isCallejonHoggoblinsMission, isCallejonHoggoblinsEpilogue]);

  const handleCompleteStory = () => {
    // Las bienvenidas del fogón y de la forja no son misiones: nunca deben
    // completar la misión 1 ni repartir sus recompensas.
    if (isOrderHqIntro) {
      finishOrderHqIntro();
      return;
    }
    if (isForgeIntro) {
      finishForgeIntro();
      return;
    }
    if (isKitchenIntro) {
      finishKitchenIntro();
      return;
    }
    if (isKitchenMonstersIntro) {
      finishKitchenMonstersIntro();
      return;
    }

    launchConfetti();
    setIsStoryCompleted(true);
    setIsAutoPlay(false);

    if (isMidasEasyEpilogue || isTabernaDuergarEpilogue || isEventoColiseoEpilogue || isCh6ForzarPuertaEpilogue) {
      // Las estrellas y recompensas ya se otorgaron al ganar el evento o las 4 salas.
      return;
    }

    if (isTome2Ch1CidMission) {
      const alreadyCleared = isMissionCompleted('t2_c1_m5_carreta_cid');
      completeQuestMission('t2_c1_m5_carreta_cid', 3);
      if (!alreadyCleared) {
        addGold(25000);
        addCrystals(1000);
        addShelfItem({
          id: `salvoconducto_santuario_kaliria_${Date.now()}`,
          name: 'Salvoconducto del Santuario de Kaliria',
          category: 'materials',
          count: 1,
          icon: '/assets/portraits/cid_icono.webp',
          rarity: 'UR',
          priceGold: 30000,
          description: 'Carta de paso entregada por Cid, el caballero esclavo, tras rescatar a Caldo de Dragón entre los escombros del barracón y guiarlos hacia Artorias en Kaliria.',
        });
      }
      return;
    }

    if (isCh6VerdadGabrielMission) {
      const alreadyCleared = isMissionCompleted('m21d_verdad_gabriel');
      completeQuestMission('m21d_verdad_gabriel', 3);
      if (!alreadyCleared) {
        addGold(225000);
        addCrystals(9500);
        addShelfItem({
          id: `insignia_helada_gabriel_${Date.now()}`,
          name: 'Insignia Helada del Verdadero Gabriel',
          category: 'materials',
          count: 1,
          icon: '/assets/portraits/verdad_gabriel_thumb.webp',
          rarity: 'UR',
          priceGold: 260000,
          description: 'Emblema de la guardia de Icespear recuperado ante la tumba glacial del verdadero Capitán Gabriel tras descubrir que Cryovain se hizo pasar por él bajo órdenes de sus «Maestros».',
        });
      }
      return;
    }

    if (isCh6CasaGabrielMission) {
      const alreadyCleared = isMissionCompleted('m21b_casa_gabriel');
      completeQuestMission('m21b_casa_gabriel', 3);
      if (!alreadyCleared) {
        addGold(200000);
        addCrystals(8500);
        addShelfItem({
          id: `aldaba_helada_gabriel_${Date.now()}`,
          name: 'Aldaba Escarchada de Gabriel',
          category: 'materials',
          count: 1,
          icon: '/assets/portraits/casa_gabriel_thumb.webp',
          rarity: 'UR',
          priceGold: 220000,
          description: 'Aldaba de hierro cubierta de hielo recogida ante la puerta cerrada del Capitán Gabriel al regreso de Caldo de Dragón y Chispo Deez a Icespear.',
        });
      }
      return;
    }

    if (isColiseoSuenosMission) {
      const alreadyCleared = isMissionCompleted('m21_coliseo_suenos');
      completeQuestMission('m21_coliseo_suenos', 3);
      if (!alreadyCleared) {
        addGold(190000);
        addCrystals(8000);
        addShelfItem({
          id: `invitacion_coliseo_varianthel_${Date.now()}`,
          name: 'Sello Real de Varianthel',
          category: 'materials',
          count: 1,
          icon: '/assets/portraits/varianthel_thumb.webp',
          rarity: 'UR',
          priceGold: 240000,
          description: 'Pase onírico sellado por el Príncipe de los Sueños que habilita el acceso al Plano de los Sueños y al torneo del Coliseo de los Sueños.',
        });
      }
      return;
    }

    if (isBulezauMazmorraEpilogue) {
      const alreadyCleared = isMissionCompleted('m20_tercera_camara_bulezau');
      completeQuestMission('m20_tercera_camara_bulezau', 3);
      if (!alreadyCleared) {
        addGold(175000);
        addCrystals(7000);
        addShelfItem({
          id: `glandula_putrefaccion_bulezau_epilogo_${Date.now()}`,
          name: 'Glándula de Putrefacción de la Tercera Cámara',
          category: 'materials',
          count: 1,
          icon: '/assets/portraits/bulezau_thumb.webp',
          rarity: 'UR',
          priceGold: 210000,
          description: 'Reliquia abisal purificada tras abatir al Bulezau y disipar su miasma verdoso-amarillento en la Tercera Cámara.',
        });
      }
      return;
    }

    if (isAireMazmorraEpilogue) {
      const alreadyCleared = isMissionCompleted('m19_segunda_camara_aire');
      completeQuestMission('m19_segunda_camara_aire', 3);
      if (!alreadyCleared) {
        addGold(160000);
        addCrystals(6500);
        addShelfItem({
          id: `esencia_eterea_aire_epilogo_${Date.now()}`,
          name: 'Esencia Etérea de la Segunda Cámara',
          category: 'materials',
          count: 1,
          icon: '/assets/portraits/elemental_aire_thumb.webp',
          rarity: 'UR',
          priceGold: 190000,
          description: 'Núcleo de viento condensado recuperado al disipar al Elemental de Aire de la Segunda Cámara.',
        });
      }
      return;
    }

    if (isGorgonMazmorraEpilogue) {
      const alreadyCleared = isMissionCompleted('m18_primera_camara_gorgon');
      completeQuestMission('m18_primera_camara_gorgon', 3);
      if (!alreadyCleared) {
        addGold(145000);
        addCrystals(6000);
        addShelfItem({
          id: `placafierro_gorgon_epilogo_${Date.now()}`,
          name: 'Placa Ferroverde de la Primera Cámara',
          category: 'materials',
          count: 1,
          icon: '/assets/portraits/gorgon_thumb.webp',
          rarity: 'UR',
          priceGold: 175000,
          description: 'Trofeo metálico recuperado tras derrotar al Gorgon de Hierro guardián detrás de la puerta rosada de la mazmorra.',
        });
      }
      return;
    }

    if (isDespertarSuenosMission) {
      const alreadyCleared = isMissionCompleted('m17_despertar_suenos');
      completeQuestMission('m17_despertar_suenos', 3);
      if (!alreadyCleared) {
        addGold(130000);
        addCrystals(5500);
        addShelfItem({
          id: `eco_runico_portal_suenos_${Date.now()}`,
          name: 'Sello Rúnico de los Pozos de Pelea',
          category: 'materials',
          count: 1,
          icon: '/assets/portraits/chispo_deez_icono.webp',
          rarity: 'UR',
          priceGold: 160000,
          description: 'Resonancia arcana de la antigua mazmorra del Mercado Negro que señala el rastro de Chispo Deez rumbo al Reino de los Sueños.',
        });
      }
      return;
    }

    if (isAudienciaBaronMission) {
      const alreadyCleared = isMissionCompleted('m16_audiencia_baron');
      completeQuestMission('m16_audiencia_baron', 3);
      if (!alreadyCleared) {
        addGold(120000);
        addCrystals(5000);
        addShelfItem({
          id: `invitacion_baron_mercado_negro_${Date.now()}`,
          name: 'Pase de Invitado de Honor del Barón',
          category: 'materials',
          count: 1,
          icon: '/assets/portraits/el_baron_icono.webp',
          rarity: 'UR',
          priceGold: 150000,
          description: 'Salvoconducto dorado otorgado por Alistar Vandimere tras erradicar a Ferton y su mansión. Concede libertad total para circular por cualquier rincón del Mercado Negro.',
        });
      }
      return;
    }

    if (isDespachoFertonMission) {
      const alreadyCleared = isMissionCompleted('m15_despacho_ferton');
      completeQuestMission('m15_despacho_ferton', 3);
      if (!alreadyCleared) {
        addGold(100000);
        addCrystals(4000);
        addShelfItem({
          id: `cenizas_sello_ferton_${Date.now()}`,
          name: 'Cenizas y Sello Calcinado de Ferton',
          category: 'materials',
          count: 1,
          icon: '/assets/portraits/ferton_icono.webp',
          rarity: 'UR',
          priceGold: 100000,
          description: 'Sello aurífero ennegrecido recogido entre las cenizas de la Mansión de Ferton tras la explosión del alcohol en gas.',
        });
      }
      return;
    }

    if (isPlantaIntermediaMansionEpilogue) {
      const alreadyCleared = isMissionCompleted('m14_planta_intermedia_ferton');
      completeQuestMission('m14_planta_intermedia_ferton', 3);
      if (!alreadyCleared) {
        addGold(70000);
        addCrystals(2800);
        addShelfItem({
          id: `botella_alcohol_gas_ferton_${Date.now()}`,
          name: 'Destilado Etílico de la Mansión',
          category: 'materials',
          count: 1,
          icon: '/assets/items/alcohol_en_gas.webp',
          rarity: 'UR',
          priceGold: 80000,
          description: 'Trofeo de la planta intermedia tras tumbar a 4 oleadas borrachas de Guardia Áurea y hoggoblins con el alcohol en gas de Ultrak.',
        });
      }
      return;
    }

    if (isDurnikEscalerasEpilogue) {
      const alreadyCleared = isMissionCompleted('m13_escaleras_durnik');
      completeQuestMission('m13_escaleras_durnik', 3);
      if (!alreadyCleared) {
        addGold(60000);
        addCrystals(2500);
        addShelfItem({
          id: `soga_y_martillo_durnik_${Date.now()}`,
          name: 'Martillo y Soga de Durnik',
          category: 'materials',
          count: 1,
          icon: '/assets/portraits/durnik_thumb.webp',
          rarity: 'UR',
          priceGold: 70000,
          description: 'Trofeo de las escaleras de Ferton tras dejar a su guardaespaldas enano noqueado y bien atado.',
        });
      }
      return;
    }

    if (isRecibidorMansionEpilogue) {
      const alreadyCleared = isMissionCompleted('m12_recibidor_mansion_ferton');
      completeQuestMission('m12_recibidor_mansion_ferton', 3);
      if (!alreadyCleared) {
        addGold(55000);
        addCrystals(2200);
        addShelfItem({
          id: `bandeja_plata_ferton_${Date.now()}`,
          name: 'Bandeja de Plata y Librea de Ferton',
          category: 'materials',
          count: 1,
          icon: '/assets/portraits/bugbear_criado_thumb.webp',
          rarity: 'UR',
          priceGold: 60000,
          description: 'Bandeja de plata maciza y emblema de la servidumbre bugbear noqueada en el recibidor de la Mansión Ferton.',
        });
      }
      return;
    }

    if (isMansionFertonLlegadaMission) {
      const alreadyCleared = isMissionCompleted('m11_llegada_mansion_ferton');
      completeQuestMission('m11_llegada_mansion_ferton', 3);
      if (!alreadyCleared) {
        addGold(50000);
        addCrystals(2000);
        addShelfItem({
          id: `tizon_ilusorio_elemental_${Date.now()}`,
          name: 'Ascua Ilusoria del Elemental de Fuego',
          category: 'materials',
          count: 1,
          icon: '/assets/portraits/elemental_fuego_icono.webp',
          rarity: 'UR',
          priceGold: 55000,
          description: 'Rescoldo arcano cristalizado tras la magistral ilusión con la que Arlem Díaz atrajo a los hoggoblins y a la Guardia Áurea fuera de la Mansión de Ferton.',
        });
      }
      return;
    }

    if (isBaronMansionMission) {
      const alreadyCleared = isMissionCompleted('m10d_mansion_baron');
      completeQuestMission('m10d_mansion_baron', 3);
      if (!alreadyCleared) {
        addGold(75000);
        addCrystals(3000);
        addShelfItem({
          id: `sello_rey_negro_vandimere_${Date.now()}`,
          name: 'Sello Real del Rey de Negro (Vandimere)',
          category: 'materials',
          count: 1,
          icon: '/assets/items/insignia_mercado_negro_app.webp',
          rarity: 'UR',
          priceGold: 60000,
          description: 'Insignia hexagonal de plata y obsidiana entregada por Alistar Vandimere, Rey de Negro y Rey del Mercado Negro, sellando la cacería brutal contra Ferton.',
        });
      }
      return;
    }

    if (isCallejonHoggoblinsEpilogue) {
      completeQuestMission('m10c_callejon_hoggoblins', 3);
      addGold(45000);
      addCrystals(1800);
      addShelfItem({
        id: `tunica_sicario_ferton_${Date.now()}`,
        name: 'Túnica Negra y Dorada de Sicario de Ferton',
        category: 'materials',
        count: 1,
        icon: '/assets/portraits/hoggoblin_daga_thumb.webp',
        rarity: 'UR',
        priceGold: 40000,
        description: 'Túnica encapuchada negra con bordados dorados requisada a los hoggoblins que tendieron una emboscada en el callejón de la taberna.',
      });
      return;
    }

    if (isChispoEncuentroMission) {
      completeQuestMission('m10b_encuentro_chispo', 3);
      addGold(30000);
      addCrystals(1200);
      addShelfItem({
        id: `jarra_glimmerstone_marduk_${Date.now()}`,
        name: 'Jarra Conmemorativa de Marduk y Glimmerstone',
        category: 'materials',
        count: 1,
        icon: '/assets/portraits/chispo_deez_icono.webp',
        rarity: 'UR',
        priceGold: 30000,
        description: 'Jarra de acero enano y oro grabada con el sol de Marduk, testigo del encuentro entre Chispo Deez y Pepe Loux en la taberna de Icespear.',
      });
      return;
    }

    if (isHobgoblinBossEpilogue) {
      completeQuestMission('m10_hobgoblin_boss', 3);
      addGold(60000);
      addCrystals(2500);
      addShelfItem({
        id: `trabuco_oro_capataz_${Date.now()}`,
        name: 'Trabuco de Fuego de Ébano y Oro de Ferton',
        category: 'materials',
        count: 1,
        icon: '/assets/portraits/hobgoblin_capataz_thumb.webp',
        rarity: 'UR',
        priceGold: 45000,
        description: 'Arma de fuego artesanal con boca de bronce acampanada y recámara de oro requisada al Capataz de Ferton.',
      });
      addShelfItem({
        id: `salvoconducto_mercado_negro_${Date.now()}`,
        name: 'Salvoconducto Real del Mercado Negro',
        category: 'materials',
        count: 1,
        icon: '/assets/portraits/hobgoblin_capataz_thumb.webp',
        rarity: 'UR',
        priceGold: 50000,
        description: 'Pase maestro con el sello del halcón y la cadena de oro de Ferton para comerciar sin restricciones en el Mercado Negro.',
      });
      return;
    }

    if (isFertonEpilogue) {
      completeQuestMission('m9_emboscada_ferton', 3);
      addGold(40000);
      addCrystals(1500);
      addShelfItem({
        id: `manuscrito_ordenes_ferton_${Date.now()}`,
        name: 'Órdenes Selladas y Blasón de Ferton',
        category: 'materials',
        count: 1,
        icon: '/assets/portraits/guarda_negro_espada_thumb.webp',
        rarity: 'UR',
        priceGold: 35000,
        description: 'Manifiesto confidencial requisado del carromato con la firma de Ferton y la ruta secreta hacia los puestos de avanzada del Mercado Negro.',
      });
      return;
    }

    if (isCapitulo3IntroMission) {
      completeQuestMission('m8_intro_capitulo3', 3);
      addGold(25000);
      addCrystals(1000);
      addShelfItem({
        id: `efigie_ilusion_arlem_${Date.now()}`,
        name: 'Efigie Ilusoria de Arlem Orco',
        category: 'materials',
        count: 1,
        icon: '/assets/portraits/arlem_orco_thumb.webp',
        rarity: 'UR',
        priceGold: 25000,
        description: 'Tótem arcano imbuido con magia de alteración e ilusión menor. Conmemora el brillante engaño que desalojó el campamento orco del bosque sin derramar una sola gota de sangre.',
      });
      return;
    }

    if (isAldeaEpilogue) {
      completeQuestMission('m7_epilogo_aldea', 3);
      addGold(20000);
      addCrystals(800);
      addShelfItem({
        id: `emblema_glimmerstone_${Date.now()}`,
        name: 'Emblema de Glimmerstone y Sombra del Laberinto',
        category: 'materials',
        count: 1,
        icon: '/assets/items/llave_laberinto_desactivada.webp',
        rarity: 'UR',
        priceGold: 20000,
        description: 'Insignia de gratitud del clan enano de Glimmerstone y vestigio sombrío del titiritero que selló el destino de Lord Vaelas.',
      });
      return;
    }

    if (isLaberintoMission) {
      completeQuestMission('m6_puerta_laberinto', 3);
      addGold(15000);
      addCrystals(500);
      addShelfItem({
        id: `llave_desactivada_lloth_${Date.now()}`,
        name: 'Llave Inerte del Laberinto de Lloth',
        category: 'materials',
        count: 1,
        icon: '/assets/items/llave_laberinto_desactivada.webp',
        rarity: 'UR',
        priceGold: 15000,
        description: 'Llave de obsidiana con forma de araña arrojada tras el sellado del laberinto. Su amatista central está apagada y sus runas inertes: símbolo de la traición y perdición eterna de Lord Vaelas.',
      });
      return;
    }

    if (isTitanEpilogue) {
      completeQuestMission('m6_cuevas_titan', 3);
      addGold(12000);
      addCrystals(400);
      addShelfItem({
        id: `pelaje_electrico_titan_${Date.now()}`,
        name: 'Pelaje Electrificado de Titán',
        category: 'materials',
        count: 1,
        icon: '/assets/items/cuero.webp',
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
        icon: '/assets/items/fragmento_de_quitina.webp',
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
        icon: '/assets/items/fragmento_de_quitina.webp',
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
        icon: '/assets/items/fragmento_de_quitina.webp',
        rarity: 'SSR',
        priceGold: 5000,
        description: 'Huevo mutante petrificado de la cámara de cría tras la purga de Edacorn. Reliquia repleta de maná primigenio.',
      });
      addShelfItem({
        id: `ing_huevos_araknoide_${Date.now()}`,
        name: 'Huevos de Araknoide',
        category: 'materials',
        count: 4,
        icon: '/assets/items/ing_huevos_araknoide.webp',
        rarity: 'SR',
        priceGold: 160,
        description: 'Huevos translúcidos recolectados en los nidos carmesíes de la colonia. Ingrediente exótico con suave luminiscencia nutritiva.',
      });
      addShelfItem({
        id: `ing_larvas_araknoide_${Date.now()}`,
        name: 'Larvas de Araknoide',
        category: 'materials',
        count: 4,
        icon: '/assets/items/ing_larvas_araknoide.webp',
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
        icon: '/assets/items/lingote_de_plata.webp',
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
        icon: '/assets/items/kebab.webp',
        rarity: 'SR',
        priceGold: 800,
        description: 'Suculenta porción de carne asada con hierbas de montaña entregada como muestra de agradecimiento por la caravana rescatada.',
      });
      addShelfItem({
        id: `tortilla_recompensa_${Date.now()}`,
        name: 'Tortilla de Patatas de la Caravana',
        category: 'food',
        count: 1,
        icon: '/assets/items/tortilla_patata.webp',
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
        icon: '/assets/items/fragmento_de_quitina.webp',
        rarity: 'SSR',
        priceGold: 6000,
        description: 'Placas titánicas de quitina adamantina arrancadas del Devorador Quitinoso en las Puertas de Glimmerstone.',
      });
      addShelfItem({
        id: `ing_carne_devorador_${Date.now()}`,
        name: 'Carne de Devorador',
        category: 'materials',
        count: 3,
        icon: '/assets/items/ing_carne_devorador.webp',
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
      icon: '/assets/items/escamas_de_cryovain.webp',
      rarity: 'SSR',
      priceGold: 2000,
      description: 'Gélidas escamas desprendidas del dragón blanco Cryovain tras su ataque a Icespear.',
    });
  };

  const handleSkipStory = () => {
    setIsSkipConfirmOpen(false);
    if (isKitchenIntro) {
      finishKitchenIntro();
      return;
    }
    if (isKitchenMonstersIntro) {
      finishKitchenMonstersIntro();
      return;
    }
    if (isForgeIntro) {
      finishForgeIntro();
      return;
    }
    if (isBoticaIntro) {
      finishBoticaIntro();
      return;
    }
    if (isOrderHqIntro) {
      finishOrderHqIntro();
      return;
    }
    if (isTome2Ch1CidMission || isCh6VerdadGabrielMission || isCh6ForzarPuertaEpilogue || isCh6CasaGabrielMission || isEventoColiseoEpilogue || isColiseoSuenosMission) {
      handleCompleteStory();
      return;
    }
    if (isBulezauMazmorraEpilogue) {
      handleCompleteStory();
      return;
    }
    if (isBulezauMazmorraMission) {
      handleStartCombatAfterStory();
      return;
    }
    if (isAireMazmorraEpilogue) {
      handleCompleteStory();
      return;
    }
    if (isAireMazmorraMission) {
      handleStartCombatAfterStory();
      return;
    }
    if (isGorgonMazmorraEpilogue) {
      handleCompleteStory();
      return;
    }
    if (isGorgonMazmorraMission) {
      handleStartCombatAfterStory();
      return;
    }
    if (isDespertarSuenosMission) {
      handleCompleteStory();
      return;
    }
    if (isAudienciaBaronMission) {
      handleCompleteStory();
      return;
    }
    if (isDespachoFertonMission) {
      handleCompleteStory();
      return;
    }
    if (isPlantaIntermediaMansionEpilogue) {
      handleCompleteStory();
      return;
    }
    if (isPlantaIntermediaMansionMission) {
      handleStartCombatAfterStory();
      return;
    }
    if (isDurnikEscalerasEpilogue) {
      handleCompleteStory();
      return;
    }
    if (isDurnikEscalerasMission) {
      handleStartCombatAfterStory();
      return;
    }
    if (isRecibidorMansionEpilogue) {
      handleCompleteStory();
      return;
    }
    if (isRecibidorMansionMission) {
      handleStartCombatAfterStory();
      return;
    }
    if (isMansionFertonLlegadaMission || isTabernaDuergarEpilogue) {
      handleCompleteStory();
      return;
    }
    if (isTabernaDuergarMission) {
      handleStartDrinkingContest();
      return;
    }
    if (isMidasEasyEpilogue) {
      handleCompleteStory();
      return;
    }
    if (isMidasEasyMission) {
      handleStartCombatAfterStory();
      return;
    }
    if (isLaberintoMission || isTitanEpilogue || isZancudoEpilogue || isCavernaAzulEpilogue || isFuriaCarmesiEpilogue || isMinasHistoriaMission || isEmboscadaEpilogue || isRoboEpilogue || isBosqueEpilogue || isPuertasEpilogue || isAsaltoOrcoEpilogue) {
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
    setIsAutoPlay((prev) => !prev);
  };

  const handleOpenBacklog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBacklogOpen(true);
  };

  const handleStartDrinkingContest = () => {
    setSelectedCombatMissionId('m10e_taberna_duergar');
    setPendingMissionLaunch({
      missionId: 'm10e_taberna_duergar',
      destination: 'drinking_contest',
    });
    navigateTo('party', true);
  };

  const handleStartCombatAfterStory = () => {
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
    } else if (isBulezauMazmorraMission) {
      setSelectedCombatMissionId('m20_tercera_camara_bulezau');
    } else if (isAireMazmorraMission) {
      setSelectedCombatMissionId('m19_segunda_camara_aire');
    } else if (isGorgonMazmorraMission) {
      setSelectedCombatMissionId('m18_primera_camara_gorgon');
    } else if (isPlantaIntermediaMansionMission) {
      setSelectedCombatMissionId('m14_planta_intermedia_ferton');
    } else if (isDurnikEscalerasMission) {
      setSelectedCombatMissionId('m13_escaleras_durnik');
    } else if (isRecibidorMansionMission) {
      setSelectedCombatMissionId('m12_recibidor_mansion_ferton');
    } else if (isCallejonHoggoblinsMission) {
      setSelectedCombatMissionId('m10c_callejon_hoggoblins');
    } else if (isHobgoblinBossMission) {
      setSelectedCombatMissionId('m10_hobgoblin_boss');
    } else if (isFertonMission) {
      setSelectedCombatMissionId('m9_emboscada_ferton');
    } else if (isRoboMission) {
      setSelectedCombatMissionId('m2_robo');
    } else if (isTome2Ch1AranaMission) {
      setSelectedCombatMissionId('t2_c1_m4_arana_acorazada');
    } else if (isTome2Ch1ArmaduraMission) {
      setSelectedCombatMissionId('t2_c1_m3_custodios_anillo');
    } else if (isTome2Ch1JauriaMission) {
      setSelectedCombatMissionId('t2_c1_m2_jauria_salas');
    } else if (isMidasEasyMission) {
      setSelectedCombatMissionId('midas_dungeon_easy');
    } else if (isTome2Ch1BarraconMission) {
      setSelectedCombatMissionId('t2_c1_m1_trincheras_nomuertos');
    } else {
      setSelectedCombatMissionId('m1_tirano');
    }
    if (onLaunchCombat) {
      onLaunchCombat();
    } else {
      navigateTo('combat');
    }
  };

  // La bienvenida de Paco no es una misión: al terminar se vuelve directo al fogón.
  const finishKitchenIntro = () => {
    if (onFinish) {
      onFinish();
    } else {
      navigateTo('cooking');
    }
  };

  // La charla de la cocina exótica tampoco es una misión: vuelve al Fogón.
  const finishKitchenMonstersIntro = () => {
    if (onFinish) {
      onFinish();
    } else {
      navigateTo('cooking');
    }
  };

  // La bienvenida de Goryn tampoco es una misión: al terminar se vuelve a la forja.
  const finishForgeIntro = () => {
    if (onFinish) {
      onFinish();
    } else {
      navigateTo('forge');
    }
  };

  // La bienvenida de Raxxar tampoco es una misión: al terminar se vuelve a la botica.
  const finishBoticaIntro = () => {
    if (onFinish) {
      onFinish();
    } else {
      navigateTo('potions');
    }
  };

  // La presentación de Nala tampoco es una misión: al terminar se vuelve a la Sede de Orden.
  const finishOrderHqIntro = () => {
    if (onFinish) {
      onFinish();
    } else {
      navigateTo('order');
    }
  };

  const handleReturnToQuests = () => {
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
              : screenFlash === 'pink'
              ? 'bg-pink-400/45 shadow-[inset_0_0_110px_rgba(244,114,182,0.85)]'
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
          const exitPoseUrl = resolveStoryPoseUrl(
            exitingSpeaker.characterId,
            exitingSpeaker.pose,
            exitProf
          );
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
              {exitingSpeaker.characterId === 'midas' ? (
                <img
                  src={exitPoseUrl}
                  alt={exitProf.name}
                  style={{
                    filter: 'sepia(0.92) saturate(2.35) brightness(1.06) contrast(1.06) drop-shadow(0 0 18px rgba(251,191,36,0.72))',
                    transformOrigin: 'bottom center',
                  }}
                  onError={(event) => {
                    event.currentTarget.style.visibility = 'hidden';
                  }}
                  className={`${exitProf.framing.height} w-auto max-w-none object-contain opacity-90 transition-all ${exitProf.framing.translateY}`}
                />
              ) : (
                <img
                  src={exitPoseUrl}
                  alt={exitProf.name}
                  style={{
                    scale: String(SPRITE_POSE_SCALE[exitPoseUrl] ?? 1),
                    transformOrigin: 'bottom center',
                  }}
                  onError={(event) => {
                    event.currentTarget.style.visibility = 'hidden';
                  }}
                  className={`${exitProf.framing.height} w-auto max-w-none object-contain brightness-90 transition-all ${exitProf.framing.translateY}`}
                />
              )}
            </div>
          );
        })()}

        {/* Active Speaker (Sliding In From Offscreen or Hopping in Focus) */}
        {activeSpeaker && (() => {
          const activeProf = CHARACTER_PROFILES[activeSpeaker.characterId];
          const activePoseUrl = resolveStoryPoseUrl(
            activeSpeaker.characterId,
            activeSpeaker.pose,
            activeProf
          );
          const isTitanSleeping =
            activeSpeaker.characterId === 'titan' && activeSpeaker.pose === 'durmiendo';
          // En las cinemáticas del Tomo II todos los personajes se colocan siempre en el centro.
          const activeSide = isTome2Ch1Story ? 'center' : activeSpeaker.side;
          const enterAnim =
            activeSide === 'left'
              ? activeSpeaker.animType === 'enter'
                ? 'animate-fgo-enter-left'
                : 'animate-fgo-hop'
              : activeSide === 'right'
              ? activeSpeaker.animType === 'enter'
                ? 'animate-fgo-enter-right'
                : 'animate-fgo-hop'
              : activeSpeaker.animType === 'enter'
              ? 'animate-fgo-enter-center'
              : '-translate-x-1/2 animate-fgo-hop';
          const activePos =
            activeSide === 'left'
              ? 'left-[3%] sm:left-[8%]'
              : activeSide === 'right'
              ? 'right-[3%] sm:right-[8%]'
              : 'left-1/2';

          return (
            <div
              key={activeSpeaker.id}
              className={`absolute bottom-0 ${isTitanSleeping ? 'left-1/2 -translate-x-1/2' : activePos} ${enterAnim} z-20 flex flex-col items-center pointer-events-none select-none`}
            >
              {isTitanSleeping && (
                <div className="absolute top-[20%] left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-slate-950/90 px-3.5 py-1.5 rounded-full border border-cyan-400 shadow-[0_0_24px_rgba(56,189,248,0.7)] animate-bounce">
                  <span className="text-xl">💤</span>
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-200 font-mono">
                    ROOOOOONC... ZZZ... (Tumbado en el suelo)
                  </span>
                  <span className="text-sm animate-pulse text-yellow-300">⚡</span>
                </div>
              )}
              {/* Character Standing / Sleeping Sprite */}
              {activeSpeaker.characterId === 'midas' ? (
                <div className={`relative flex items-center justify-center ${activeProf.framing.translateY}`}>
                  {/* Shimmering gold-dust aura & particles for Midas animated statue vision */}
                  <div
                    aria-hidden="true"
                    className="absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.52)_0%,rgba(245,158,11,0.2)_45%,transparent_75%)] blur-xl animate-pulse pointer-events-none"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none overflow-visible z-20"
                  >
                    <span className="absolute left-[14%] top-[14%] w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_10px_#fde047] animate-ping" />
                    <span className="absolute right-[12%] top-[28%] w-1.5 h-1.5 rounded-full bg-yellow-300 shadow-[0_0_8px_#fbbf24] animate-bounce" />
                    <span className="absolute left-[22%] bottom-[24%] w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_#f59e0b] animate-pulse" />
                    <span className="absolute right-[18%] bottom-[16%] w-2 h-2 rounded-full bg-yellow-200 shadow-[0_0_10px_#fde047] animate-ping" />
                  </div>
                  <img
                    src={activePoseUrl}
                    alt={activeProf.name}
                    style={{
                      filter: 'sepia(0.92) saturate(2.35) brightness(1.1) contrast(1.06) drop-shadow(0 0 22px rgba(251,191,36,0.88))',
                      transformOrigin: 'bottom center',
                    }}
                    onError={(event) => {
                      event.currentTarget.style.visibility = 'hidden';
                    }}
                    className={`${activeProf.framing.height} w-auto max-w-none object-contain animate-[combatSpriteBreath_3.6s_ease-in-out_infinite]`}
                  />
                </div>
              ) : (
                <img
                  src={activePoseUrl}
                  alt={activeProf.name}
                  style={
                    !isTitanSleeping
                      ? {
                          scale: String(SPRITE_POSE_SCALE[activePoseUrl] ?? 1),
                          transformOrigin: 'bottom center',
                        }
                      : undefined
                  }
                  onError={(event) => {
                    event.currentTarget.style.visibility = 'hidden';
                  }}
                  className={`${activeProf.framing.height} w-auto max-w-none object-contain brightness-110 drop-shadow-[0_0_24px_rgba(251,191,36,0.35)] transition-all ${
                    isTitanSleeping
                      ? 'rotate-[-85deg] translate-y-[28%] scale-[0.80] filter saturate-80'
                      : activeProf.framing.translateY
                  }`}
                />
              )}
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
            src="/assets/items/panel_dialogo_idl.webp"
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
                      src={resolveStoryAvatarUrl(line, charProf)}
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
              {isCh6VerdadGabrielMission
                ? '¿Saltar la Revelación de Cryovain?'
                : isCh6ForzarPuertaEpilogue
                ? '¿Saltar Desenlace de la Casa de Gabriel?'
                : isCh6CasaGabrielMission
                ? '¿Saltar Regreso a Icespear?'
                : isAireMazmorraEpilogue
                ? '¿Saltar Epílogo de la Segunda Cámara?'
                : isAireMazmorraMission
                ? '¿Saltar Escena e Iniciar Bossfight?'
                : isGorgonMazmorraEpilogue
                ? '¿Saltar Epílogo de la Primera Cámara?'
                : isGorgonMazmorraMission
                ? '¿Saltar Escena e Iniciar Bossfight?'
                : isDespertarSuenosMission
                ? '¿Saltar Apertura de El Reino de los Sueños?'
                : isAudienciaBaronMission
                ? '¿Saltar Audiencia con el Barón?'
                : isDespachoFertonMission
                ? '¿Saltar Cinemática de la Mansión?'
                : isPlantaIntermediaMansionEpilogue
                ? '¿Saltar Epílogo de la Planta Intermedia?'
                : isPlantaIntermediaMansionMission
                ? '¿Saltar Escena del Alcohol en Gas?'
                : isDurnikEscalerasEpilogue
                ? '¿Saltar Epílogo de Durnik?'
                : isDurnikEscalerasMission
                ? '¿Saltar Escena e Iniciar Bossfight?'
                : isRecibidorMansionEpilogue
                ? '¿Saltar Epílogo del Recibidor?'
                : isRecibidorMansionMission
                ? '¿Saltar Escena e Iniciar Combate?'
                : isMansionFertonLlegadaMission
                ? '¿Saltar Llegada a la Mansión?'
                : isTabernaDuergarEpilogue
                ? '¿Saltar Epílogo de Victoria?'
                : isTabernaDuergarMission
                ? '¿Saltar Diálogo e Ir al Concurso?'
                : isKitchenMonstersIntro
                ? '¿Saltar la charla de Paco?'
                : isKitchenIntro
                ? '¿Saltar la bienvenida de Paco?'
                : isForgeIntro
                ? '¿Saltar la bienvenida de Goryn?'
                : isBoticaIntro
                ? '¿Saltar la bienvenida de Raxxar?'
                : isOrderHqIntro
                ? '¿Saltar la presentación de Nala?'
                : isRoboMission
                ? '¿Saltar Diálogo e Iniciar Combate?'
                : isMidasEasyEpilogue
                ? '¿Saltar Epílogo de la Bóveda?'
                : '¿Saltar Prólogo de Historia?'}
            </h4>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              {isCh6VerdadGabrielMission
                ? 'Saltarás el hallazgo del verdadero Capitán Gabriel congelado junto a sus hombres, la confesión de Cryovain sobre sus «Maestros» y su transformación en el Dragón Blanco.'
                : isCh6ForzarPuertaEpilogue
                ? 'Saltarás el hallazgo de la casa destrozada, el círculo arcano de sangre congelada y la aparición del Capitán Gabriel en la cueva de Cryovain.'
                : isCh6CasaGabrielMission
                ? 'Saltarás el regreso de Caldo de Dragón y Chispo Deez a Icespear ante la puerta cerrada del Capitán Gabriel.'
                : isAireMazmorraEpilogue
                ? 'Saltarás el final de la Segunda Cámara tras disipar al Elemental de Aire y pasarás al resumen de recompensas.'
                : isAireMazmorraMission
                ? 'Saltarás la entrada a la Segunda Cámara y la aparición del Elemental de Aire para comenzar directamente su bossfight.'
                : isGorgonMazmorraEpilogue
                ? 'Saltarás la caída del Gorgon de Hierro en la Primera Cámara y pasarás al resumen de recompensas.'
                : isGorgonMazmorraMission
                ? 'Saltarás la apertura rosada de la puerta y el encuentro con el Gorgon de Hierro para comenzar directamente su bossfight.'
                : isDespertarSuenosMission
                ? 'Saltarás el despertar en la taberna tras desaparecer Chispo Deez y la revelación del Barón sobre el portal de los pozos de pelea.'
                : isAudienciaBaronMission
                ? 'Saltarás la reunión de Caldo de Dragón con el Barón tras el incendio de la mansión y pasarás al resumen final del Capítulo IV.'
                : isDespachoFertonMission
                ? 'Saltarás el desenlace contra Durnik y Ferton en su despacho, la bola de fuego sobre el alcohol en gas y el incendio de la mansión.'
                : isPlantaIntermediaMansionEpilogue
                ? 'Saltarás el final de la planta intermedia, cuando Caldo de Dragón se quita las telas tras barrer las 4 oleadas borrachas.'
                : isPlantaIntermediaMansionMission
                ? 'Saltarás el final de la ilusión y el momento en que os tapáis con telas para liberar el alcohol en gas, e iniciarás las 4 oleadas borrachas.'
                : isDurnikEscalerasEpilogue
                ? 'Saltarás la escena en la que dejáis a Durnik noqueado y atado en el rellano y pasarás al resumen antes de entrar en la planta intermedia.'
                : isDurnikEscalerasMission
                ? 'Saltarás el encuentro en las escaleras de Ferton y comenzarás directamente la bossfight contra Durnik.'
                : isRecibidorMansionEpilogue
                ? 'Saltarás el hallazgo de las marcas de esclavitud en los bugbears noqueados y pasarás directamente al resumen para subir a la planta intermedia.'
                : isRecibidorMansionMission
                ? 'Saltarás la sorpresa en el recibidor de Ferton y comenzarás de inmediato el combate contra los bugbears criados de traje negro y oro.'
                : isMansionFertonLlegadaMission
                ? 'Saltarás la llegada ante la mansión de Ferton y la distracción del elemental de fuego ilusorio.'
                : isTabernaDuergarEpilogue
                ? 'Saltarás la celebración del grupo tras ganar el concurso de Ultrak y pasarás directamente al resumen rumbo a la Mansión de Ferton.'
                : isTabernaDuergarMission
                ? 'Saltarás la escena en la taberna duergar de Ultrak e iniciarás directamente la cuenta atrás del concurso de bebida.'
                : isKitchenMonstersIntro
                ? 'Pasarás directamente a la rueda de Monstruos, con los componentes exóticos que se pueden cocinar.'
                : isKitchenIntro
                ? 'Pasarás directamente al tutorial de cocina: Paco te dejará los ingredientes del asado del día y te señalará cuál tocar.'
                : isForgeIntro
                ? 'Pasarás directamente al tutorial de forja: Goryn te dejará el material y el oro para la Espada de Hierro y te señalará qué tocar.'
                : isBoticaIntro
                ? 'Pasarás directamente al tutorial de la botica: Raxxar te dejará los materiales y el oro para la Poción de Vida Menor y te señalará qué tocar.'
                : isOrderHqIntro
                ? 'Pasarás directamente a la Sede de Orden, donde Nala te señalará qué pestaña tocar para aprender a usar la sede.'
                : isRoboMission
                ? 'Saltarás la escena cómica del asalto a la mansión y comenzarás de inmediato el combate contra las 4 oleadas de la guardia urbana en el callejón.'
                : isMidasEasyEpilogue
                ? 'Saltarás la huida de los Guinbang tras el ruido del combate y la aparición del Monstruo del Óxido dorado.'
                : isMidasEasyMission
                ? 'Saltarás la visión de la estatua de polvo de oro de Midas en Icespear y entrarás directo al semiplano contra los Guinbang.'
                : isTome2Ch1Story
                ? 'Darás por vista la escena del barracón y pasarás directamente al combate de la misión.'
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
                {isMidasEasyEpilogue || isCh6VerdadGabrielMission || isCh6ForzarPuertaEpilogue || isCh6CasaGabrielMission || isAireMazmorraEpilogue || isGorgonMazmorraEpilogue || isDespertarSuenosMission || isAudienciaBaronMission || isDespachoFertonMission || isPlantaIntermediaMansionEpilogue || isDurnikEscalerasEpilogue || isRecibidorMansionEpilogue || isMansionFertonLlegadaMission || isTabernaDuergarEpilogue ? 'Finalizar' : isMidasEasyMission ? '¡Al Semiplano!' : isAireMazmorraMission || isGorgonMazmorraMission || isPlantaIntermediaMansionMission || isDurnikEscalerasMission || isRecibidorMansionMission ? '¡Al Combate!' : isTabernaDuergarMission ? '¡Elegir Héroe!' : isKitchenMonstersIntro ? 'Ver Monstruos' : isKitchenIntro ? 'Al Tutorial' : isForgeIntro ? 'Al Yunque' : isBoticaIntro ? 'Al Alambique' : isRoboMission ? '¡A las Armas!' : 'Saltar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATTLE TRANSITION ALERT OVERLAY (IMMEDIATE CUTSCENE TO COMBAT / MINIGAME TRANSITION) */}
      {battleTransitionAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 select-none animate-in fade-in zoom-in-95">
          <div className="relative w-full max-w-xs p-5 bg-gradient-to-b from-red-950 via-[#1f0704] to-black border-2 border-red-500 rounded-2xl text-center space-y-2.5 shadow-[0_0_35px_rgba(239,68,68,0.8)]">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-600/30 border border-red-500 flex items-center justify-center animate-pulse">
              <Swords className="w-6 h-6 text-red-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-red-400 block animate-pulse">
              {isMidasEasyMission
                ? '¡TRANSPORTE AL SEMIPLANO DE MIDAS!'
                : isAireMazmorraMission
                ? '¡TORBELLINO EN LA SEGUNDA CÁMARA! ¡JEFE!'
                : isGorgonMazmorraMission
                ? '¡LA PUERTA ROSADA SE ABRE! ¡JEFE DE CÁMARA!'
                : isPlantaIntermediaMansionMission
                ? '¡SE ACABÓ LA ILUSIÓN! ¡ALCOHOL EN GAS!'
                : isDurnikEscalerasMission
                ? '¡COMBATE DE JEFE EN LAS ESCALERAS!'
                : isRecibidorMansionMission
                ? '¡EMBOSCADA EN EL RECIBIDOR!'
                : isTabernaDuergarMission
                ? '¡CONCURSO EN LA BARRA DE ULTRAK!'
                : isCallejonHoggoblinsMission
                ? '¡EMBOSCADA TRAS LA TABERNA!'
                : isTitanMission
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
              {isMidasEasyMission
                ? '¡Los Guinbang Custodian el Tesoro!'
                : isAireMazmorraMission
                ? '¡El Elemental de Aire!'
                : isGorgonMazmorraMission
                ? '¡El Gorgon de Hierro!'
                : isPlantaIntermediaMansionMission
                ? '¡4 Oleadas de Guardias y Hoggoblins Borrachos!'
                : isDurnikEscalerasMission
                ? '¡Durnik, el Guardaespaldas de Ferton!'
                : isRecibidorMansionMission
                ? '¡Bugbears Criados de Ferton!'
                : isTabernaDuergarMission
                ? '¡Elige 1 Campeón para Beber!'
                : isCallejonHoggoblinsMission
                ? '¡Hoggoblins Encapuchados!'
                : isTitanMission
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
              {isMidasEasyMission
                ? 'La estatua de polvo de oro de Midas os ha transportado desde Icespear a una cámara de piedra en su semiplano repleta de riquezas. ¡Supera 4 salas frente a tres variantes de Guinbang armados con botín dorado!'
                : isAireMazmorraMission
                ? 'En la Segunda Cámara os aguarda un voraz Elemental de Aire. ¡Cuidado con sus tajos de vendaval, sus ráfagas de cuchillas y su vórtice capaz de inmovilizar a un héroe!'
                : isGorgonMazmorraMission
                ? 'En la Primera Cámara os aguarda un colosal toro de metal. ¡Cuidado con sus devastadoras cornadas perforantes y su aliento de niebla petrificante!'
                : isPlantaIntermediaMansionMission
                ? 'Caldo de Dragón se tapa con telas y suelta el alcohol en gas. ¡Barre 4 oleadas de entre 3 y 4 guardias áureos y hoggoblins tambaleantes y debilitados!'
                : isDurnikEscalerasMission
                ? '¡El guardaespaldas enano de Ferton bloquea el rellano con armadura pesada y su enorme martillo de guerra! ¡Noquéalo para atarlo!'
                : isRecibidorMansionMission
                ? '¡Criados bugbear con traje negro y detalles dorados os esperan dentro del recibidor! ¡Esquiva sus bandejas de plata y vajilla en 2 rondas!'
                : isTabernaDuergarMission
                ? 'Solo puede participar 1 héroe (cuanta más Suerte tenga, más fácil será). Supera 10, 12 o 18 aciertos en 20s para ganar el Alcohol en Gas.'
                : isCallejonHoggoblinsMission
                ? '¡Sicarios de Ferton con túnicas negras y doradas bloquean la puerta trasera de la taberna! ¡Sobrevive a 2 rondas contra dagas y ballestas!'
                : isTitanMission
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
                {isMidasEasyEpilogue
                  ? 'EPÍLOGO: LA BÓVEDA DE MIDAS'
                  : isCh6VerdadGabrielMission
                  ? 'CAPÍTULO VI • REVELACIÓN FINAL: EL FALSO CAPITÁN'
                  : isCh6ForzarPuertaEpilogue
                  ? 'CAPÍTULO VI • EPÍLOGO: LA TRAICIÓN EN LA CIMA'
                  : isCh6CasaGabrielMission
                  ? 'CAPÍTULO VI • HISTORIA: REGRESO A ICESPEAR'
                  : isEventoColiseoEpilogue
                  ? 'EVENTO COMPLETADO • EL COLISEO DE LOS SUEÑOS'
                  : isColiseoSuenosMission
                  ? 'CAPÍTULO V • NUEVO PLANO Y EVENTO DESBLOQUEADOS'
                  : isBulezauMazmorraEpilogue
                  ? 'EPÍLOGO: TERCERA CÁMARA • PORTAL ABIERTO'
                  : isAireMazmorraEpilogue
                  ? 'EPÍLOGO: SEGUNDA CÁMARA DE LA MAZMORRA'
                  : isGorgonMazmorraEpilogue
                  ? 'EPÍLOGO: PRIMERA CÁMARA DE LA MAZMORRA'
                  : isDespertarSuenosMission
                  ? 'HISTORIA: CAPÍTULO V • EL REINO DE LOS SUEÑOS'
                  : isAudienciaBaronMission
                  ? '¡CAPÍTULO IV COMPLETADO • CAPÍTULO V DESBLOQUEADO!'
                  : isDespachoFertonMission
                  ? 'HISTORIA: CAPÍTULO IV • MANSIÓN EN CENIZAS'
                  : isPlantaIntermediaMansionEpilogue
                  ? 'EPÍLOGO: PLANTA INTERMEDIA DESPEJADA'
                  : isDurnikEscalerasEpilogue
                  ? 'EPÍLOGO: ESCALERAS DE LA MANSIÓN'
                  : isRecibidorMansionEpilogue
                  ? 'EPÍLOGO: EL RECIBIDOR DE LA MANSIÓN'
                  : isMansionFertonLlegadaMission
                  ? 'HISTORIA: CAPÍTULO IV • MANSIÓN FERTON'
                  : isTabernaDuergarEpilogue
                  ? 'EPÍLOGO: EL CONCURSO DE ULTRAK'
                  : isBaronMansionMission
                  ? 'HISTORIA: CAPÍTULO III • EL REY DE NEGRO'
                  : isCapitulo3IntroMission
                  ? 'HISTORIA: CAPÍTULO III • EL CAMPAMENTO ORCO'
                  : isAldeaEpilogue
                  ? '¡CAPÍTULO II: LAS MINAS DE GLIMMERSTONE COMPLETADO!'
                  : isLaberintoMission
                  ? '¡EL LABERINTO DE LLOTH SELLADO PARA SIEMPRE!'
                  : isZancudoEpilogue
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
                  : isTome2Ch1Story
                  ? 'HISTORIA: TOMO II • EL BARRACÓN ABANDONADO'
                  : 'PRÓLOGO DE HISTORIA SUPERADO'}
              </span>
              <h3 className="font-serif font-black text-lg sm:text-xl uppercase text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {isMidasEasyEpilogue
                  ? '¡EL DEVORADOR DE HIERRO DESPIERTA!'
                  : isCh6VerdadGabrielMission
                  ? '¡CRYOVAIN SE TRANSFORMA ANTE VOSOTROS!'
                  : isCh6ForzarPuertaEpilogue
                  ? '¡TRAMPA EN LA CUEVA DE CRYOVAIN!'
                  : isCh6CasaGabrielMission
                  ? '¡NADIE ABRE EN CASA DE GABRIEL!'
                  : isEventoColiseoEpilogue
                  ? '¡CAMPEONES DEL COLISEO DE LOS SUEÑOS!'
                  : isColiseoSuenosMission
                  ? '¡VARIANTHEL Y EL COLISEO DE LOS SUEÑOS!'
                  : isBulezauMazmorraEpilogue
                  ? '¡BULEZAU ABATIDO • PORTAL AL REINO DE LOS SUEÑOS!'
                  : isAireMazmorraEpilogue
                  ? '¡ELEMENTAL DE AIRE DISIPADO!'
                  : isGorgonMazmorraEpilogue
                  ? '¡GORGON DE HIERRO DERROTADO!'
                  : isDespertarSuenosMission
                  ? '¡HACIA LOS POZOS DE PELEA!'
                  : isAudienciaBaronMission
                  ? '¡LIBERTAD TOTAL EN EL MERCADO NEGRO!'
                  : isDespachoFertonMission
                  ? '¡EL FIN DE FERTON Y SU MANSIÓN!'
                  : isPlantaIntermediaMansionEpilogue
                  ? '¡4 OLEADAS BORRACHAS BARRIDAS CON ÉXITO!'
                  : isDurnikEscalerasEpilogue
                  ? '¡DURNIK NOQUEADO Y ATADO EN LAS ESCALERAS!'
                  : isRecibidorMansionEpilogue
                  ? '¡SERVIDUMBRE NOQUEADA EN EL RECIBIDOR!'
                  : isMansionFertonLlegadaMission
                  ? '¡DISTRACCIÓN EN LA MANSIÓN DE FERTON!'
                  : isTabernaDuergarEpilogue
                  ? '¡ALCOHOL EN GAS CONSEGUIDO!'
                  : isBaronMansionMission
                  ? '¡PACTO SELLADO CON ALISTAR VANDIMERE!'
                  : isCapitulo3IntroMission
                  ? '¡LA GRAN FARSA DEL BARDO ILUSIONISTA!'
                  : isAldeaEpilogue
                  ? '¡LA ALDEA ENANA A SALVO Y EL PEÓN ENCADENADO!'
                  : isLaberintoMission
                  ? '¡LA TRAICIÓN DEL DROW CASTIGADA Y MINAS A SALVO!'
                  : isZancudoEpilogue
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
                  : isTome2Ch1Story
                  ? tome2Ch1SkipTitle
                  : '¡Contrato de Cryovain Aceptado!'}
              </h3>
              <p className="text-[11px] text-stone-300 leading-snug mt-1">
                {isMidasEasyEpilogue
                  ? 'Los Guinbang salieron huyendo a toda velocidad al escuchar que el estruendo de vuestro combate había atraído a una bestia metálica. ¡Un Monstruo del Óxido dorado ha irrumpido en la bóveda para devorar vuestro acero!'
                  : isCh6VerdadGabrielMission
                  ? 'Caldo de Dragón descubrió al verdadero Capitán Gabriel muerto y congelado junto a sus hombres antes siquiera de haberlos reclutado. El impostor confesó que Cryovain fingió ser Gabriel todo este tiempo bajo órdenes de sus «Maestros» y se transformó en el Dragón Blanco para matarlos.'
                  : isCh6ForzarPuertaEpilogue
                  ? 'Al entrar en la casa completamente destrozada, Caldo de Dragón y Chispo Deez hallaron un círculo arcano trazado con sangre congelada. Al acercarse a investigarlo, el hechizo los teletransportó directamente a la cueva de Cryovain... ¡con el Capitán Gabriel sonriendo delante de ellos!'
                  : isCh6CasaGabrielMission
                  ? 'Caldo de Dragón ha regresado a Icespear junto a Chispo Deez, listos para dar caza a Cryovain. Como nadie abre la puerta de la casa del Capitán Gabriel, el grupo decide forzar la entrada.'
                  : isEventoColiseoEpilogue
                  ? 'Caldo de Dragón ha arrasado las rondas del Coliseo de los Sueños ante la atenta mirada del Príncipe Varianthel. Todo el estadio onírico celebra vuestra victoria mientras Chispo Deez aguarda el duelo decisivo.'
                  : isColiseoSuenosMission
                  ? 'Varianthel, Príncipe de los Sueños, ha confesado que Chispo Deez es su nuevo campeón favorito y solo lo liberará si ganáis su torneo. Se ha desbloqueado el evento «El Coliseo de los Sueños» y el nuevo plano «Plano de los Sueños» en el Mapa del Mundo (Rosa de los Vientos).'
                  : isBulezauMazmorraEpilogue
                  ? 'Caldo de Dragón venció al Bulezau en la Tercera Cámara. Edacorn le arrancó la calavera al demonio y se la incrustó sobre su propio yelmo como su nuevo casco permanente en cinemáticas. Al disiparse la peste, el sello del fondo se rompió abriendo de par en par el Portal al Reino de los Sueños.'
                  : isAireMazmorraEpilogue
                  ? 'Tras abrir el sello posterior de la Primera Cámara, Caldo de Dragón se adentró en la sala ciclónea de la Segunda Cámara. Esquivando los tajos de vendaval, las ráfagas de cuchillas de aire y las prisiones de torbellino, lograron disipar al Elemental de Aire y despejar la vía hacia las siguientes cámaras.'
                  : isGorgonMazmorraEpilogue
                  ? 'Tras abrirse la puerta con un resplandor rosado, Caldo de Dragón se enfrentó al Gorgon de Hierro en la Primera Cámara. Esquivando sus brutales cornadas metálicas y su espesa niebla petrificante, lograron tumbar al toro de acero y despejar el paso hacia las profundidades.'
                  : isDespertarSuenosMission
                  ? 'Caldo de Dragón despertó en la taberna del Mercado Negro descubriendo que Chispo Deez había desaparecido. Warthion los condujo ante el Barón, quien reveló que las antiguas runas de la mazmorra subterránea se han activado y que Chispo estaría en el Reino de los Sueños. Para rescatarlo, el grupo acepta completar la mazmorra que resguarda el portal oculto tras los pozos de pelea.'
                  : isAudienciaBaronMission
                  ? 'Alistar Vandimere felicitó a Caldo de Dragón tras enterarse de que quemaron la mansión de Ferton, erradicaron su legado y acabaron con todos sus seguidores, concediéndoles libertad total por todo el Mercado Negro. Al marcharse el grupo, el misterioso encapuchado apareció ante el Barón para confirmar que todo marcha según lo previsto... y dio inicio la Fase I.'
                  : isDespachoFertonMission
                  ? 'Pepe Loux acabó al instante con Durnik clavándole su propio martillo en el ojo. En el despacho, mientras Ferton suplicaba hecho un ovillo, Magordito lanzó una bola de fuego que prendió el alcohol en gas: Caldo de Dragón escapó a duras penas y la mansión quedó reducida a cenizas.'
                  : isPlantaIntermediaMansionEpilogue
                  ? 'Cuando se disipó la ilusión del elemental y los guardias y hoggoblins irrumpieron en tromba, Caldo de Dragón se protegió con telas y descorchó el alcohol en gas. Todos los invasores acabaron borrachos, tambaleándose y rendidos en la planta intermedia.'
                  : isDurnikEscalerasEpilogue
                  ? 'Caldo de Dragón derrotó a Durnik, el guardaespaldas enano de Ferton, en el rellano de las escaleras. Tras dejarlo noqueado y fuertemente atado con cuerda, la puerta hacia la planta intermedia queda abierta.'
                  : isRecibidorMansionEpilogue
                  ? 'Caldo de Dragón dejó noqueados a los bugbears criados del recibidor tras esquivar sus bandejas de plata y vajilla. Al descubrir que llevaban marcas de esclavitud grabadas, el grupo decide subir ya a la planta intermedia para liberar el Alcohol en Gas.'
                  : isMansionFertonLlegadaMission
                  ? 'Caldo de Dragón llegó ante la mansión de Ferton y la vio atestada de guardias hoggoblin y de la Guardia Áurea. Con una ilusión arcana de Elemental de Fuego, Arlem Díaz sembró el pánico y los alejó del portón, abriendo el camino al interior.'
                  : isTabernaDuergarEpilogue
                  ? 'Ultrak ha proclamado campeón a Caldo de Dragón y les ha entregado el codiciado frasco de Alcohol en Gas. Tras celebrar la hazaña en la taberna duergar, el grupo pone rumbo decidido hacia la mansión de Ferton para emborrachar a sus guardias.'
                  : isBaronMansionMission
                  ? 'Warthion guió a Caldo de Dragón desde su mesa de la taberna por la puerta secreta hasta la antigua mazmorra del Mercado Negro. En su mansión, Alistar Vandimere —el Rey de Negro y Rey del Mercado Negro— os ha encomendado exterminar a Ferton con la máxima brutalidad para enviar una advertencia ejemplar.'
                  : isCapitulo3IntroMission
                  ? '¡Arlem Díaz ha embaucado a los orcos de élite haciéndose pasar por uno de ellos con magia de ilusión! Convencidos de que las minas están calientes y vacías de enanos, los orcos han trasladado todo su campamento al interior mientras esperan a Gromock, dejando libre el paso hacia el Mercado Negro.'
                  : isAldeaEpilogue
                  ? '¡Caldo de Dragón ha devuelto la paz a la aldea subterránea! Las familias enanas eligen quedarse en su verdadero hogar bajo la montaña con las puertas abiertas. Mientras tanto, en las tinieblas del laberinto, la figura encapuchada ha cobrado a su nuevo peón... ¡El engranaje del destino avanza!'
                  : isLaberintoMission
                  ? '¡Lord Vaelas ha quedado sepultado en su propio laberinto de pruebas por la eternidad! Las compuertas de Lloth se cerraron de golpe tras él, la plaga de araknoides ha cesado y cada miembro de Caldo de Dragón porta una llave inerte. ¡Descended a la aldea para presenciar el epílogo!'
                  : isZancudoEpilogue
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
                  : isTome2Ch1Story
                  ? tome2Ch1SkipText
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
                    {isMidasEasyEpilogue
                      ? 'GANADO'
                      : isCh6VerdadGabrielMission
                      ? '+225,000'
                      : isCh6ForzarPuertaEpilogue
                      ? 'GANADO'
                      : isCh6CasaGabrielMission
                      ? '+200,000'
                      : isEventoColiseoEpilogue
                      ? 'GANADO'
                      : isColiseoSuenosMission
                      ? '+190,000'
                      : isBulezauMazmorraEpilogue
                      ? '+175,000'
                      : isAireMazmorraEpilogue
                      ? '+160,000'
                      : isGorgonMazmorraEpilogue
                      ? '+145,000'
                      : isDespertarSuenosMission
                      ? '+130,000'
                      : isAudienciaBaronMission
                      ? '+120,000'
                      : isDespachoFertonMission
                      ? '+100,000'
                      : isPlantaIntermediaMansionEpilogue
                      ? '+70,000'
                      : isDurnikEscalerasEpilogue
                      ? '+60,000'
                      : isRecibidorMansionEpilogue
                      ? '+55,000'
                      : isMansionFertonLlegadaMission
                      ? '+50,000'
                      : isTabernaDuergarEpilogue
                      ? 'GANADO'
                      : isBaronMansionMission
                      ? '+75,000'
                      : isCapitulo3IntroMission
                      ? '+25,000'
                      : isAldeaEpilogue
                      ? '+20,000'
                      : isLaberintoMission
                      ? '+15,000'
                      : isZancudoEpilogue
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
                    {isMidasEasyEpilogue
                      ? 'JEFE'
                      : isCh6VerdadGabrielMission
                      ? '+9,500'
                      : isCh6ForzarPuertaEpilogue
                      ? 'GANADO'
                      : isCh6CasaGabrielMission
                      ? '+8,500'
                      : isEventoColiseoEpilogue
                      ? 'GANADO'
                      : isColiseoSuenosMission
                      ? '+8,000'
                      : isBulezauMazmorraEpilogue
                      ? '+7,000'
                      : isAireMazmorraEpilogue
                      ? '+6,500'
                      : isGorgonMazmorraEpilogue
                      ? '+6,000'
                      : isDespertarSuenosMission
                      ? '+5,500'
                      : isAudienciaBaronMission
                      ? '+5,000'
                      : isDespachoFertonMission
                      ? '+4,000'
                      : isPlantaIntermediaMansionEpilogue
                      ? '+2,800'
                      : isDurnikEscalerasEpilogue
                      ? '+2,500'
                      : isRecibidorMansionEpilogue
                      ? '+2,200'
                      : isMansionFertonLlegadaMission
                      ? '+2,000'
                      : isTabernaDuergarEpilogue
                      ? 'GANADO'
                      : isBaronMansionMission
                      ? '+3,000'
                      : isCapitulo3IntroMission
                      ? '+1,000'
                      : isAldeaEpilogue
                      ? '+800'
                      : isLaberintoMission
                      ? '+500'
                      : isZancudoEpilogue
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
                  <span className="text-[8px] font-bold uppercase text-sky-200">{isMidasEasyEpilogue ? 'NUEVO RETO' : 'GEMAS'}</span>
                </div>
                {/* Reward 3 */}
                <div className="flex flex-col items-center p-1.5 rounded-lg bg-[#240c04] border border-[#6b2507]">
                  <img
                    src={
                      isMidasEasyEpilogue
                        ? '/assets/portraits/devorador_hierro_thumb.webp'
                        : isCh6VerdadGabrielMission
                        ? '/assets/portraits/verdad_gabriel_thumb.webp'
                        : isCh6ForzarPuertaEpilogue
                        ? '/assets/portraits/puerta_gabriel_thumb.webp'
                        : isCh6CasaGabrielMission
                        ? '/assets/portraits/casa_gabriel_thumb.webp'
                        : isEventoColiseoEpilogue
                        ? '/assets/portraits/coliseo_onirico_thumb.webp'
                        : isColiseoSuenosMission
                        ? '/assets/portraits/varianthel_thumb.webp'
                        : isBulezauMazmorraEpilogue
                        ? '/assets/portraits/bulezau_thumb.webp'
                        : isAireMazmorraEpilogue
                        ? '/assets/portraits/elemental_aire_thumb.webp'
                        : isGorgonMazmorraEpilogue
                        ? '/assets/portraits/gorgon_thumb.webp'
                        : isDespertarSuenosMission
                        ? '/assets/portraits/chispo_deez_icono.webp'
                        : isAudienciaBaronMission
                        ? '/assets/portraits/el_baron_icono.webp'
                        : isDespachoFertonMission
                        ? '/assets/portraits/ferton_icono.webp'
                        : isPlantaIntermediaMansionEpilogue
                        ? '/assets/items/alcohol_en_gas.webp'
                        : isDurnikEscalerasEpilogue
                        ? '/assets/portraits/durnik_thumb.webp'
                        : isRecibidorMansionEpilogue
                        ? '/assets/portraits/bugbear_criado_thumb.webp'
                        : isMansionFertonLlegadaMission
                        ? '/assets/portraits/elemental_fuego_icono.webp'
                        : isTabernaDuergarEpilogue
                        ? '/assets/items/alcohol_en_gas.webp'
                        : isBaronMansionMission
                        ? '/assets/items/insignia_mercado_negro_app.webp'
                        : isCapitulo3IntroMission
                        ? '/assets/portraits/arlem_orco_thumb.webp'
                        : isAldeaEpilogue || isLaberintoMission
                        ? '/assets/items/llave_laberinto_desactivada.webp'
                        : isZancudoEpilogue
                        ? '/assets/combat/semiboss_zancudo_thumb.webp'
                        : isCavernaAzulEpilogue
                        ? '/assets/portraits/enano_infectado_thumb.webp'
                        : isFuriaCarmesiEpilogue
                        ? '/assets/portraits/edacorn_alas_thumb.webp'
                        : isMinasHistoriaMission
                        ? '/assets/portraits/enanos_mineros_thumb.webp'
                        : isAsaltoOrcoEpilogue || isAsaltoOrcoMission
                        ? '/assets/combat/orco_caudillo_thumb.webp'
                        : isPuertasEpilogue || isPuertasMission
                        ? '/assets/combat/bestia_jaula_clean.webp'
                        : isRoboEpilogue
                        ? '/assets/items/cofre_sellado_mansion.webp'
                        : isBosqueEpilogue
                        ? '/assets/portraits/bestia_jaula_thumb.webp'
                        : isRoboMission
                        ? '/assets/combat/guardia_lanza_thumb.webp'
                        : isBosqueMission
                        ? '/assets/combat/goblin_garrote_thumb.webp'
                        : isTome2Ch1Story
                        ? tome2Ch1SkipIcon
                        : '/assets/items/escamas_de_cryovain.webp'
                    }
                    alt="Recompensa"
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 object-contain"
                  />
                  <span className="text-[8px] font-bold uppercase text-amber-300 mt-0.5 truncate max-w-[80px]">
                    {isMidasEasyEpilogue
                      ? 'JEFE ÁUREO'
                      : isCh6VerdadGabrielMission
                      ? 'INSIGNIA UR'
                      : isCh6ForzarPuertaEpilogue
                      ? 'CERROJO UR'
                      : isCh6CasaGabrielMission
                      ? 'ALDABA UR'
                      : isEventoColiseoEpilogue
                      ? 'LAUREL ONÍRICO'
                      : isColiseoSuenosMission
                      ? 'SELLO VARIANTHEL'
                      : isBulezauMazmorraEpilogue
                      ? 'GLÁNDULA UR'
                      : isAireMazmorraEpilogue
                      ? 'NÚCLEO AIRE UR'
                      : isGorgonMazmorraEpilogue
                      ? 'PLACA GORGON UR'
                      : isDespertarSuenosMission
                      ? 'SELLO RÚNICO UR'
                      : isAudienciaBaronMission
                      ? 'PASE BARÓN UR'
                      : isDespachoFertonMission
                      ? 'CENIZAS UR'
                      : isPlantaIntermediaMansionEpilogue
                      ? 'GAS ETÍLICO UR'
                      : isDurnikEscalerasEpilogue
                      ? 'MARTILLO UR'
                      : isRecibidorMansionEpilogue
                      ? 'BANDEJA UR'
                      : isMansionFertonLlegadaMission
                      ? 'ILUSIÓN UR'
                      : isTabernaDuergarEpilogue
                      ? 'ALCOHOL EN GAS'
                      : isBaronMansionMission
                      ? 'SELLO NEGRO'
                      : isCapitulo3IntroMission
                      ? 'EFIGIE UR'
                      : isAldeaEpilogue
                      ? 'EMBLEMA UR'
                      : isLaberintoMission
                      ? 'LLAVE INERTE'
                      : isZancudoEpilogue
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
                      : isTome2Ch1Story
                      ? 'RELATO II'
                      : 'x2 ESCAMAS'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {!isMidasEasyEpilogue && !isCh6VerdadGabrielMission && !isCh6ForzarPuertaEpilogue && !isCh6CasaGabrielMission && !isEventoColiseoEpilogue && !isColiseoSuenosMission && !isBulezauMazmorraEpilogue && !isAireMazmorraEpilogue && !isGorgonMazmorraEpilogue && !isDespertarSuenosMission && !isAudienciaBaronMission && !isDespachoFertonMission && !isPlantaIntermediaMansionEpilogue && !isDurnikEscalerasEpilogue && !isRecibidorMansionEpilogue && !isMansionFertonLlegadaMission && !isTabernaDuergarEpilogue && !isBaronMansionMission && !isCallejonHoggoblinsEpilogue && !isChispoEncuentroMission && !isFertonEpilogue && !isCapitulo3IntroMission && !isAldeaEpilogue && !isLaberintoMission && !isRoboEpilogue && !isBosqueEpilogue && !isPuertasEpilogue && !isEmboscadaEpilogue && !isAsaltoOrcoEpilogue && !isFuriaCarmesiEpilogue && !isCavernaAzulEpilogue && !isZancudoEpilogue && (
                <button
                  type="button"
                  onClick={handleStartCombatAfterStory}
                  className="w-full py-2.5 bg-gradient-to-r from-red-600 via-amber-600 to-orange-600 hover:brightness-110 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(234,88,12,0.6)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Swords className="w-4 h-4" />
                  <span>
                    {isBulezauMazmorraMission
                      ? '¡Enfrentar al Bulezau!'
                      : isAireMazmorraMission
                      ? '¡Enfrentar al Elemental de Aire!'
                      : isGorgonMazmorraMission
                      ? '¡Enfrentar al Gorgon de Hierro!'
                      : isPlantaIntermediaMansionMission
                      ? '¡Barrer las 4 Oleadas Borrachas! (3-4 Enemigos)'
                      : isDurnikEscalerasMission
                      ? '¡Enfrentar a Durnik, Guardaespaldas de Ferton!'
                      : isRecibidorMansionMission
                      ? '¡Enfrentar a los Bugbears Criados! (2 Rondas)'
                      : isCallejonHoggoblinsMission
                      ? '¡Enfrentar a los Hoggoblins Encapuchados! (2 Rondas)'
                      : isFertonMission
                      ? '¡Enfrentar a la Guardia Áurea! (3 Oleadas)'
                      : isMinasHistoriaMission
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
                      : isTome2Ch1Story
                      ? '¡Entrar en el Barracón!'
                      : '¡Ir al Combate contra Cryovain!'}
                  </span>
                </button>
              )}

              {isMidasEasyEpilogue && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playSFX('click');
                    setPendingMissionLaunch({
                      missionId: 'midas_dungeon_boss_devorador',
                      destination: 'combat',
                      difficultyTier: 1,
                    });
                    setSelectedCombatMissionId('midas_dungeon_boss_devorador');
                    navigateTo('party', true);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:brightness-110 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_18px_rgba(245,158,11,0.65)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Swords className="w-4 h-4 text-amber-200" />
                  <span>¡Enfrentar al Jefe: Devorador de Hierro!</span>
                </button>
              )}

              {(isColiseoSuenosMission || isEventoColiseoEpilogue) && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playSFX('click');
                    setActiveWorldPlane('plano_suenos');
                    navigateTo('world');
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-700 via-fuchsia-600 to-cyan-600 hover:brightness-110 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_18px_rgba(192,132,252,0.7)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>¡Viajar al Plano de los Sueños!</span>
                </button>
              )}

              {isLaberintoMission && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCombatMissionId('m7_epilogo_aldea');
                    setCurrentLineIndex(0);
                    setIsStoryCompleted(false);
                    setIsAutoPlay(false);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-700 via-indigo-700 to-amber-600 hover:brightness-110 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.6)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Trophy className="w-4 h-4 text-amber-300" />
                  <span>¡Ver Epílogo: El Retorno a Glimmerstone!</span>
                </button>
              )}

              {isCh6CasaGabrielMission && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playSFX('click');
                    setPendingMissionLaunch({
                      missionId: 'm21c_forzar_puerta',
                      destination: 'door_breach',
                    });
                    setSelectedCombatMissionId('m21c_forzar_puerta');
                    navigateTo('party', true);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:brightness-110 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_18px_rgba(34,211,238,0.55)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>¡Forzar la Puerta de Gabriel!</span>
                </button>
              )}

              {isCh6ForzarPuertaEpilogue && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playSFX('click');
                    setSelectedCombatMissionId('m21d_verdad_gabriel');
                    setCurrentLineIndex(0);
                    setIsStoryCompleted(false);
                    setIsAutoPlay(false);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-sky-700 via-cyan-600 to-indigo-700 hover:brightness-110 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_18px_rgba(34,211,238,0.55)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>¡Continuar: La Verdad Bajo el Hielo!</span>
                </button>
              )}

              {isCh6VerdadGabrielMission && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playSFX('click');
                    setPendingMissionLaunch({
                      missionId: 'm22_cryovain_final',
                      destination: 'combat',
                    });
                    setSelectedCombatMissionId('m22_cryovain_final');
                    navigateTo('party', true);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-red-700 via-orange-600 to-amber-600 hover:brightness-110 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_18px_rgba(239,68,68,0.65)] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Swords className="w-4 h-4 text-amber-200" />
                  <span>¡Enfrentar a Cryovain, El Tirano Blanco!</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (isEventoColiseoEpilogue) {
                    setActiveWorldPlane('plano_suenos');
                    navigateTo('world');
                  } else if (isCh6VerdadGabrielMission || isCh6ForzarPuertaEpilogue || isCh6CasaGabrielMission) {
                    setActiveQuestChapter(6);
                    handleReturnToQuests();
                  } else if (isColiseoSuenosMission || isBulezauMazmorraEpilogue || isAireMazmorraMission || isGorgonMazmorraMission || isDespertarSuenosMission) {
                    setActiveQuestChapter(5);
                    handleReturnToQuests();
                  } else if (isAudienciaBaronMission || isDespachoFertonMission || isPlantaIntermediaMansionMission || isDurnikEscalerasMission || isRecibidorMansionMission || isMansionFertonLlegadaMission || isTabernaDuergarEpilogue) {
                    setActiveQuestChapter(4);
                    handleReturnToQuests();
                  } else if (isBaronMansionMission) {
                    setActiveQuestChapter(3);
                    handleReturnToQuests();
                  } else if (isCallejonHoggoblinsMission || isChispoEncuentroMission || isCapitulo3IntroMission || isFertonMission || isHobgoblinBossMission) {
                    setActiveQuestChapter(3);
                    handleReturnToQuests();
                  } else if (isAldeaEpilogue) {
                    setActiveQuestChapter(3);
                    handleReturnToQuests();
                  } else if (isBosqueEpilogue) {
                    setSelectedCombatMissionId('m4_puertas_selladas');
                  } else if (isPuertasEpilogue) {
                    setActiveQuestChapter(2);
                    handleReturnToQuests();
                  } else {
                    handleReturnToQuests();
                  }
                }}
                className={`w-full py-2.5 bg-gradient-to-r ${
                  isCh6VerdadGabrielMission || isCh6ForzarPuertaEpilogue || isCh6CasaGabrielMission || isEventoColiseoEpilogue || isColiseoSuenosMission || isBulezauMazmorraEpilogue || isAireMazmorraEpilogue || isGorgonMazmorraEpilogue || isDespertarSuenosMission || isAudienciaBaronMission || isDespachoFertonMission || isPlantaIntermediaMansionEpilogue || isDurnikEscalerasEpilogue || isRecibidorMansionEpilogue || isMansionFertonLlegadaMission || isTabernaDuergarEpilogue || isBaronMansionMission || isCapitulo3IntroMission || isAldeaEpilogue || isLaberintoMission || isFuriaCarmesiEpilogue || isPuertasEpilogue
                    ? 'from-amber-500 via-yellow-400 to-amber-500 text-stone-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.7)] ring-2 ring-yellow-400/60'
                    : 'from-amber-700 via-amber-600 to-yellow-600 text-stone-950 font-black shadow-md'
                } hover:brightness-110 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all active:scale-95`}
              >
                {isCh6VerdadGabrielMission || isCh6ForzarPuertaEpilogue || isCh6CasaGabrielMission
                  ? 'Volver a Misiones (Capítulo VI)'
                  : isEventoColiseoEpilogue
                  ? 'Volver al Coliseo (Mapa del Mundo)'
                  : isColiseoSuenosMission
                  ? '¡Torneo y Plano Desbloqueados! Volver a Misiones'
                  : isBulezauMazmorraEpilogue
                  ? '¡Portal Abierto! Ir a Misiones'
                  : isAireMazmorraEpilogue
                  ? '¡Segunda Cámara Despejada! Volver a Misiones'
                  : isGorgonMazmorraEpilogue
                  ? '¡Primera Cámara Despejada! Volver a Misiones'
                  : isDespertarSuenosMission
                  ? '¡Rumbo a los Pozos de Pelea! Volver a Misiones'
                  : isAudienciaBaronMission
                  ? '¡Capítulo IV Finalizado! Volver a Misiones'
                  : isDespachoFertonMission
                  ? '¡Reunirse con el Barón! Volver a Misiones'
                  : isPlantaIntermediaMansionEpilogue
                  ? '¡Planta Intermedia Despejada! Volver a Misiones'
                  : isDurnikEscalerasEpilogue || isRecibidorMansionEpilogue
                  ? '¡Subir a la Planta Intermedia! Volver a Misiones'
                  : isMansionFertonLlegadaMission
                  ? '¡Adentro de la Mansión! Volver a Misiones'
                  : isTabernaDuergarEpilogue
                  ? '¡Rumbo a la Mansión de Ferton! Volver a Misiones'
                  : isBaronMansionMission
                  ? '¡Trato Sellado! Volver a Misiones'
                  : isCallejonHoggoblinsEpilogue
                  ? '¡Callejón Despejado! Volver a Misiones'
                  : isChispoEncuentroMission
                  ? '¡Brindis Celebrado! Volver a Misiones'
                  : isCapitulo3IntroMission
                  ? '¡Capítulo III Desbloqueado! Volver a Misiones'
                  : isAldeaEpilogue
                  ? '¡Capítulo II Finalizado! Volver a Misiones'
                  : isLaberintoMission
                  ? 'Volver al Menú de Misiones'
                  : isFuriaCarmesiEpilogue
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
