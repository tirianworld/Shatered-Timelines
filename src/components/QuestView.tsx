import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { sound } from '../services/soundService';
import { safeStorage } from '../utils/storage';
import { X, CheckCircle2, Sparkles, BookOpen, ChevronLeft } from 'lucide-react';
import { AutoRepeatModal } from './AutoRepeatModal';
import { QuestLibraryView } from './QuestLibraryView';

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
  const { activeQuestTome, setActiveQuestTome } = useGame();

  if (!activeQuestTome) {
    return (
      <QuestLibraryView
        onSelectTome={(tomeId) => {
          setActiveQuestTome(tomeId);
        }}
      />
    );
  }

  return <QuestTomeContent onBackToLibrary={() => setActiveQuestTome(null)} />;
};

const QuestTomeContent: React.FC<{ onBackToLibrary: () => void }> = ({ onBackToLibrary }) => {
  const {
    questProgress,
    isMissionCompleted,
    activeQuestTome,
    activeQuestChapter,
    setActiveQuestChapter,
    setPendingMissionLaunch,
    setSelectedCombatMissionId,
    navigateTo,
    addGold,
    addCrystals,
    addShelfItem,
  } = useGame();

  const isTome2 = activeQuestTome === 'tome_2_boletaria';

  const isChapter2Unlocked =
    questProgress.allMissionsCompleted ||
    questProgress.completedMissions.includes('m4_puertas_selladas') ||
    questProgress.chapter >= 2;

  const isChapter3Unlocked =
    questProgress.allMissionsCompleted ||
    questProgress.completedMissions.includes('m7_epilogo_aldea') ||
    questProgress.completedMissions.includes('m6_puerta_laberinto') ||
    questProgress.chapter >= 3;

  const isChapter4Unlocked =
    questProgress.allMissionsCompleted ||
    questProgress.completedMissions.includes('m10e_taberna_duergar') ||
    questProgress.chapter >= 4;

  const isChapter5Unlocked =
    questProgress.allMissionsCompleted ||
    questProgress.completedMissions.includes('m16_audiencia_baron') ||
    questProgress.chapter >= 5;

  const isChapter6Unlocked =
    questProgress.allMissionsCompleted ||
    questProgress.completedMissions.includes('m21_coliseo_suenos') ||
    questProgress.chapter >= 6;


  // Chapter 1 missions - Exclusively Icespear story & boss (no cave missions)
  const chapter1Missions: QuestMission[] = [
    {
      id: 'm1_tirano',
      title: 'Tirano de Escarcha',
      iconType: 'boss',
      difficulty: 'Facil',
      description:
        'El Capitán Gabriel odia a los aventureros, pero la bestia Cryovain ha masacrado a su guardia.',
      portrait: '/assets/portraits/capitan_gabriel_clean.webp',
      portraitClass: 'scale-[1.12] translate-y-1 object-center',
      stageId: 'stage_1',
      isStory: true,
    },
    {
      id: 'm2_robo',
      title: 'Botín de Sangre',
      iconType: 'swords',
      difficulty: 'Facil',
      description:
        '¡El asalto a la mansión ha salido a la luz! Supera las 4 oleadas de la guardia urbana en el callejón y derrota al Sargento Acorazado.',
      portrait: '/assets/combat/guardia_pesado_clean.webp',
      portraitClass: 'scale-[1.88] origin-top translate-y-[2px]',
      stageId: 'stage_2',
      isStory: false,
    },
    {
      id: 'm3_bosque',
      title: 'Susurros de Nieve',
      iconType: 'swords',
      difficulty: 'Normal',
      description:
        '¡Caldo de Dragón huye al bosque invernal! Un viejo vagabundo revela el secreto de la antigua colonia minera de plata de Glimmerstone... ¡emboscada goblin!',
      portrait: '/assets/combat/goblin_garrote_clean.webp',
      portraitClass: 'scale-[1.95] origin-top translate-y-[8px]',
      stageId: 'stage_3_bosque',
      isStory: false,
    },
    {
      id: 'm4_puertas_selladas',
      title: 'Puertas de Escarcha',
      iconType: 'boss',
      difficulty: 'Dificil',
      description:
        '¡Las colosales puertas enanas de Glimmerstone están selladas bajo el hielo! Enfréntate al Devorador Quitinoso en 2 fases para obtener su Coraza y codiciada Carne de Devorador para la cocina.',
      portrait: '/assets/combat/devorador_quitinoso_clean.webp',
      portraitClass: 'scale-[1.5] origin-top translate-y-[2px]',
      stageId: 'stage_puertas_selladas',
      isStory: false,
    },
  ];

  // Chapter 2 missions - The subterranean depths of Las Minas de Glimmerstone
  const chapter2Missions: QuestMission[] = [
    {
      id: 'm5_minas_historia',
      title: 'Minas de Glimmerstone',
      iconType: 'boss',
      difficulty: 'Facil',
      description:
        'Caldo de Dragón cruza las Puertas Selladas descubriendo signos de actividad, una colonia enana aislada y un altivo emisario drow.',
      portrait: '/assets/portraits/enanos_mineros_thumb.webp',
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
      portrait: '/assets/portraits/edacorn_alas_thumb.webp',
      portraitClass: 'scale-[1.12] translate-y-0.5 object-center',
      stageId: 'stage_cuevas_rojo',
      isStory: true,
    },
    {
      id: 'm4_cuevas_azul',
      title: 'Plaga de Escarcha',
      iconType: 'boss',
      difficulty: 'Dificil',
      description:
        'Pepe Loux llega a una caverna congelada y halla a un enano semicongelado mutando por un virus parásito en la roca. ¡Erradica a los 4 acechadores gélidos!',
      portrait: '/assets/portraits/enano_infectado_thumb.webp',
      portraitClass: 'scale-[1.12] translate-y-0.5 object-center',
      stageId: 'stage_cuevas_azul',
      isStory: true,
    },
    {
      id: 'm5_cuevas_zancudo',
      title: 'Zancudo Espectral',
      iconType: 'boss',
      difficulty: 'Dificil',
      description:
        'El grupo se reúne ante la entrada prohibida al corazón de la colonia en el Underdark. Un pacto obligado con el drow y una emboscada con invocaciones os aguardan.',
      portrait: '/assets/combat/semiboss_zancudo_clean.webp',
      portraitClass: 'scale-[1.8] origin-top translate-y-[10px]',
      stageId: 'stage_cuevas_zancudo',
      isStory: true,
    },
    {
      id: 'm6_puerta_laberinto',
      title: 'Laberinto de Lloth',
      iconType: 'skull',
      difficulty: 'Pesadilla',
      description:
        '¡Penúltima Cinemática de Capítulo! Ante las monumentales puertas arácnidas, Lord Vaelas revela la oscura verdad del artefacto y desata su traición.',
      portrait: '/assets/portraits/drow_vaelas_llave_thumb.webp',
      portraitClass: 'scale-[1.25] translate-y-0.5 object-center',
      stageId: 'stage_puerta_laberinto',
      isStory: true,
    },
    {
      id: 'm7_epilogo_aldea',
      title: 'Regreso a Glimmerstone',
      iconType: 'boss',
      difficulty: 'Pesadilla',
      description:
        '¡Cinemática Final y Epílogo del Capítulo 2! Caldo de Dragón llega a la aldea enana para anunciar la verdad y la apertura de las minas. Tras ello, en el laberinto, una misteriosa figura acecha...',
      portrait: '/assets/portraits/drow_vaelas_despeinado_thumb.webp',
      portraitClass: 'scale-[1.25] translate-y-0.5 object-center',
      stageId: 'stage_epilogo_aldea',
      isStory: true,
    },
  ];

  // Chapter 3 missions - The path through the snowy forest towards El Mercado Negro
  const chapter3Missions: QuestMission[] = [
    {
      id: 'm8_intro_capitulo3',
      title: 'Tambores de Guerra',
      iconType: 'boss',
      difficulty: 'Facil',
      description:
        '¡Cinemática de Apertura del Capítulo 3! Caldo de Dragón sale de las minas al bosque nevado y divisa un campamento de orcos de élite. Arlem urde una desternillante estratagema con magia de ilusión...',
      portrait: '/assets/portraits/arlem_orco_thumb.webp',
      portraitClass: 'scale-[1.25] translate-y-0.5 object-center',
      stageId: 'stage_intro_capitulo3',
      isStory: true,
    },
    {
      id: 'm9_emboscada_ferton',
      title: 'Lanzas de Oro',
      iconType: 'skull',
      difficulty: 'Pesadilla',
      description:
        '¡Combate en el Camino Nevado! Una comitiva clandestina con armaduras de ébano y oro carga suministros por orden de un Capataz Hobgoblin: "¡Cargadlas muchachos, Ferton no espera!". ¡Sobrevive a 3 oleadas de lanceros, ballesteros y caballeros acorazados!',
      portrait: '/assets/portraits/guarda_negro_espada_thumb.webp',
      portraitClass: 'scale-[1.25] translate-y-0.5 object-center',
      stageId: 'stage_camino_ferton',
      isStory: true,
    },
    {
      id: 'm10_hobgoblin_boss',
      title: 'Látigo del Capataz',
      iconType: 'boss',
      difficulty: 'Pesadilla',
      description:
        '¡Duelo a Muerte contra el Capataz Hobgoblin! Tras la caída de su guardia, el furioso comandante insulta a sus soldados y se encara con Caldo de Dragón. ¡Una encarnizada boss fight en 3 fases: cuerpo a cuerpo, granadas alquímicas y su letal arma de fuego!',
      portrait: '/assets/portraits/hobgoblin_capataz_thumb.webp',
      portraitClass: 'scale-[1.25] translate-y-0.5 object-center',
      stageId: 'stage_duelo_hobgoblin',
      isStory: true,
    },
    {
      id: 'm10b_encuentro_chispo',
      title: 'Luz del Paladín',
      iconType: 'boss',
      difficulty: 'Facil',
      description:
        '¡Cinemática de Regreso a Icespear! Al acercarse a la taberna, Caldo de Dragón se encuentra en mitad de la calle con Chispo Deez, un paladín de Marduk de Glimmerstone reclutado por el Capitán Gabriel. Tras presentarse Pepe Loux, ¡todos celebran en la taberna!',
      portrait: '/assets/portraits/chispo_deez_icono.webp',
      portraitClass: 'scale-[1.12] translate-y-0.5 object-center',
      stageId: 'stage_encuentro_chispo',
      isStory: true,
    },
    {
      id: 'm10c_callejon_hoggoblins',
      title: 'Susurros del Callejón',
      iconType: 'swords',
      difficulty: 'Pesadilla',
      description:
        '¡Emboscada tras la taberna! En mitad del brindis, a Arlem le da un amarillo por el polvo de hada y sale al callejón trasero con Pepe Loux a vomitar arcoíris líquido. ¡Dos rondas contra hoggoblins encapuchados con dagas y ballestas que traen saludos de Ferton!',
      portrait: '/assets/portraits/hoggoblin_daga_thumb.webp',
      portraitClass: 'scale-[1.2] translate-y-0.5 object-center',
      stageId: 'stage_callejon_hoggoblins',
      isStory: true,
    },
    {
      id: 'm10d_mansion_baron',
      title: 'Máscara del Barón',
      iconType: 'boss',
      difficulty: 'Dificil',
      description:
        '¡Cinemática del Mercado Negro! Al volver a la mesa de la taberna, el dragonborn negro Warthion guía a Caldo de Dragón por la puerta secreta hacia la antigua mazmorra subterránea y la mansión de Alistar Vandimere, Rey de Negro, quien ordena exterminar brutalmente a Ferton.',
      portrait: '/assets/portraits/warthion_thumb.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_mansion_baron',
      isStory: true,
    },
    {
      id: 'm10e_taberna_duergar',
      title: 'Barriles de Ultrak',
      iconType: 'boss',
      difficulty: 'Normal',
      description:
        '¡Minijuego de Habilidad! Caldo de Dragón acude a la taberna duergar del Mercado Negro para trazar un plan contra Ferton. Ultrak inicia un concurso de bebida cuyo premio es Alcohol en Gas: elige 1 héroe (cuanta más Suerte tenga, más fácil será) y supera las ruedas durante 20 segundos.',
      portrait: '/assets/portraits/ultrak_duergar_icono.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_taberna_duergar',
      isStory: true,
    },
  ];

  // Chapter 4 missions - Mansión Ferton
  const chapter4Missions: QuestMission[] = [
    {
      id: 'm11_llegada_mansion_ferton',
      title: 'Sombras de Ferton',
      iconType: 'boss',
      difficulty: 'Normal',
      description:
        '¡Cinemática de Apertura del Capítulo IV! Caldo de Dragón llega a la mansión de Ferton y la ve repleta de guardias hoggoblin y de la Guardia Áurea. ¡Arlem idea la ilusión de un elemental de fuego para distraerlos y poder entrar!',
      portrait: '/assets/portraits/elemental_fuego_icono.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_llegada_mansion_ferton',
      isStory: true,
    },
    {
      id: 'm12_recibidor_mansion_ferton',
      title: 'Recibidor Maldito',
      iconType: 'boss',
      difficulty: 'Dificil',
      description:
        'Al acercarse a la puerta pensando que todos salieron tras el elemental, unos bugbears con traje negro de criados y detalles dorados aguardan en el recibidor armados con bandejas de plata y vajilla arrojadiza.',
      portrait: '/assets/portraits/bugbear_criado_thumb.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_recibidor_mansion_ferton',
      isStory: true,
    },
    {
      id: 'm13_escaleras_durnik',
      title: 'Escaleras de Sangre',
      iconType: 'boss',
      difficulty: 'Extremo',
      description:
        'Al subir las escaleras hacia la planta intermedia, el grupo se topa con Durnik, el guardaespaldas enano de Ferton. ¡Derrótalo en un combate de jefe y déjalo noqueado y atado!',
      portrait: '/assets/portraits/durnik_thumb.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_escaleras_durnik',
      isStory: true,
    },
    {
      id: 'm14_planta_intermedia_ferton',
      title: 'Botellas y Llamas',
      iconType: 'boss',
      difficulty: 'Dificil',
      description:
        'La ilusión del elemental se acaba y la Guardia Áurea y los hoggoblins en túnicas de Ferton irrumpen en tromba en la planta intermedia. Caldo de Dragón se tapa con telas y destapa el alcohol en gas: ¡barre 4 oleadas de enemigos completamente borrachos y debilitados!',
      portrait: '/assets/items/alcohol_en_gas.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_planta_intermedia_ferton',
      isStory: true,
    },
    {
      id: 'm15_despacho_ferton',
      title: 'Cenizas de Ferton',
      iconType: 'boss',
      difficulty: 'Extremo',
      description:
        '¡Cinemática Final del Capítulo IV! Un hoggoblin moribundo desata a Durnik, pero Pepe Loux le clava su propio martillo en el ojo. En el despacho, Ferton suplica hecho un ovillo hasta que la bola de fuego de Magordito incendia el alcohol en gas y reduce la mansión a cenizas.',
      portrait: '/assets/portraits/ferton_icono.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_despacho_ferton',
      isStory: true,
    },
    {
      id: 'm16_audiencia_baron',
      title: 'Invitados del Barón',
      iconType: 'boss',
      difficulty: 'Normal',
      description:
        '¡Cinemática Final del Capítulo IV! Caldo de Dragón se reúne con Alistar Vandimere. El Barón los felicita sorprendido por haber quemado la mansión y erradicado el legado y seguidores de Ferton, y les concede total libertad por todo el Mercado Negro como sus invitados.',
      portrait: '/assets/portraits/el_baron_icono.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_audiencia_baron',
      isStory: true,
    },
  ];

  // Chapter 5 missions - El Reino de los Sueños
  const chapter5Missions: QuestMission[] = [
    {
      id: 'm17_despertar_suenos',
      title: 'Despertar en Cenizas',
      iconType: 'boss',
      difficulty: 'Normal',
      description:
        '¡Cinemática de Apertura del Capítulo V! Caldo de Dragón despierta en la taberna del Mercado Negro y descubre que Chispo Deez ha desaparecido. Warthion los lleva ante el Barón, quien revela el despertar de la antigua mazmorra y un portal oculto tras los pozos de pelea.',
      portrait: '/assets/portraits/chispo_deez_icono.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_despertar_suenos',
      isStory: true,
    },
    {
      id: 'm18_primera_camara_gorgon',
      title: 'Mirada de Hierro',
      iconType: 'boss',
      difficulty: 'Dificil',
      description:
        '¡Primera Cámara de la Mazmorra! Al llegar ante el portón tras los pozos de pelea, la piedra brilla con un fulgor rosado y se abre ante Caldo de Dragón. Dentro aguarda un colosal Gorgon, un toro de metal capaz de embestir con cornadas perforantes y exhalar aliento de niebla petrificante.',
      portrait: '/assets/portraits/gorgon_thumb.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_primera_camara_gorgon',
      isStory: true,
    },
    {
      id: 'm19_segunda_camara_aire',
      title: 'Suspiro del Viento',
      iconType: 'boss',
      difficulty: 'Dificil',
      description:
        '¡Segunda Cámara de la Mazmorra! Al cruzar el sello posterior de la sala del Gorgon, un ciclón viviente bloquea el paso. Este Elemental de Aire desata tajos de vendaval, lanza ráfagas de cuchillas cortantes y puede atrapar a un héroe en una prisión de torbellino.',
      portrait: '/assets/portraits/elemental_aire_thumb.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_segunda_camara_aire',
      isStory: true,
    },
    {
      id: 'm20_tercera_camara_bulezau',
      title: 'Colmillos del Bulezau',
      iconType: 'boss',
      difficulty: 'Dificil',
      description:
        '¡Tercera Cámara de la Mazmorra! Tras cruzar el portal rosado de la sala del viento, un demonio caprino de piel enfermiza resguarda el sello del portal al Reino de los Sueños. Su toque exuda humo verde amarillento con moscas y lanza bolas ardientes de esa misma magia infecta.',
      portrait: '/assets/portraits/bulezau_thumb.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_tercera_camara_bulezau',
      isStory: true,
    },
    {
      id: 'm21_coliseo_suenos',
      title: 'Ecos del Coliseo',
      iconType: 'boss',
      difficulty: 'Dificil',
      description:
        '¡Cinemática en el Reino de los Sueños! Al cruzar el portal abierto tras la Tercera Cámara, Caldo de Dragón llega al imponente Coliseo de los Sueños. Allí les recibe Varianthel, alto elfo eladrin y Príncipe de los Sueños, quien revela tener a Chispo Deez como su nuevo campeón favorito. Desbloquea el evento El Coliseo de los Sueños y el Plano de los Sueños en el Mapa del Mundo.',
      portrait: '/assets/portraits/coliseo_onirico_thumb.webp',
      portraitClass: 'scale-[1.08] object-center',
      stageId: 'stage_coliseo_suenos',
      isStory: true,
    },
  ];

  // Chapter 6 missions - Sangre y Hielo
  const chapter6Missions: QuestMission[] = [
    {
      id: 'm21b_casa_gabriel',
      title: 'Casa Sin Voces',
      iconType: 'swords',
      difficulty: 'Normal',
      description:
        'Caldo de Dragón regresa a Icespear con Chispo Deez, convencidos de estar listos para dar caza a Cryovain. Pero al llamar a la casa del Capitán Gabriel, nadie responde...',
      portrait: '/assets/portraits/casa_gabriel_thumb.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_casa_gabriel',
      isStory: true,
    },
    {
      id: 'm21c_forzar_puerta',
      title: 'Puerta de Hielo',
      iconType: 'swords',
      difficulty: 'Dificil',
      description:
        'El portón de roble y hierro del Capitán Gabriel está atrancado por el hielo. Supera el minijuego de skillchecks para reventar la cerradura y entrar en la casa.',
      portrait: '/assets/portraits/puerta_gabriel_thumb.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_forzar_puerta',
      isStory: true,
    },
    {
      id: 'm21d_verdad_gabriel',
      title: 'Máscara de Hielo',
      iconType: 'skull',
      difficulty: 'Extremo',
      description:
        '¡Cinemática de revelación! En la cueva descubren al verdadero Capitán Gabriel muerto y congelado junto a sus hombres antes siquiera de reclutarlos. El impostor confiesa ser Cryovain bajo órdenes de sus «Maestros» y se transforma en el Dragón Blanco.',
      portrait: '/assets/portraits/verdad_gabriel_thumb.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_verdad_gabriel',
      isStory: true,
    },
    {
      id: 'm22_cryovain_final',
      title: 'Cryovain de Escarcha',
      iconType: 'boss',
      difficulty: 'Pesadilla',
      description:
        '¡Batalla Final de Sangre y Hielo! En la caverna de la cima montañosa, el colosal dragón blanco Cryovain desata zarpazos glaciales, desciende para morder y concentra un aliento helado mortal.',
      portrait: '/assets/portraits/cryovain_boss_thumb.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_cryovain_final',
      isStory: false,
    },
  ];

  // Tomo II - Capítulo I: Barracón Abandonado
  const tome2Chapter1Missions: QuestMission[] = [
    {
      id: 't2_c1_m1_trincheras_nomuertos',
      title: 'Trincheras Malditas',
      iconType: 'swords',
      difficulty: 'Facil',
      description:
        'Adéntrate en las trincheras de tierra batida a la entrada del barracón y despeja a los primeros no muertos que vagan entre las sombras.',
      portrait: '/assets/portraits/no_muerto_thumb.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_t2_c1_m1',
      isStory: true,
    },
    {
      id: 't2_c1_m2_jauria_salas',
      title: 'Jauría Hueca',
      iconType: 'swords',
      difficulty: 'Normal',
      description:
        'Cruza las dependencias en ruinas evitando los derrumbes mientras rechazas las embestidas de perros asalvajados y soldados no muertos.',
      portrait: '/assets/portraits/soldado_no_muerto_thumb.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_t2_c1_m2',
      isStory: true,
    },
    {
      id: 't2_c1_m3_custodios_anillo',
      title: 'Armadura Viva',
      iconType: 'swords',
      difficulty: 'Dificil',
      description:
        'Alcanza el pasillo de la trampilla secreta y derrota a los últimos soldados no muertos y a la Armadura Reanimada que guarda el Anillo de Ladrón.',
      portrait: '/assets/portraits/armadura_reanimada_thumb.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_t2_c1_m3',
      isStory: true,
    },
    {
      id: 't2_c1_m4_arana_acorazada',
      title: 'Telar de Acero',
      iconType: 'boss',
      difficulty: 'Pesadilla',
      description:
        'En la cámara hexagonal bajo el barracón aguarda una colosal Araña Acorazada. Resiste sus barridos, telarañas y su Aliento de Fuego.',
      portrait: '/assets/portraits/arana_acorazada_thumb.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_t2_c1_m4',
      isStory: true,
    },
    {
      id: 't2_c1_m5_carreta_cid',
      title: 'Camino al Santuario',
      iconType: 'boss',
      difficulty: 'Facil',
      description:
        'Tras el colapso entre piedra negra incandescente, el misterioso caballero esclavo Cid os recoge en su carreta rumbo al Santuario de Kaliria.',
      portrait: '/assets/portraits/cid_icono.webp',
      portraitClass: 'scale-[1.12] object-center',
      stageId: 'stage_t2_c1_m5',
      isStory: true,
    },
  ];

  // Active missions list based on selected tome and chapter
  const missions = isTome2
    ? tome2Chapter1Missions
    : activeQuestChapter === 6 && isChapter6Unlocked
    ? chapter6Missions
    : activeQuestChapter === 5 && isChapter5Unlocked
    ? chapter5Missions
    : activeQuestChapter === 4 && isChapter4Unlocked
    ? chapter4Missions
    : activeQuestChapter === 3 && isChapter3Unlocked
    ? chapter3Missions
    : activeQuestChapter === 2 && isChapter2Unlocked
    ? chapter2Missions
    : chapter1Missions;
  const currentChapter = isTome2
    ? 1
    : activeQuestChapter === 6 && isChapter6Unlocked
    ? 6
    : activeQuestChapter === 5 && isChapter5Unlocked
    ? 5
    : activeQuestChapter === 4 && isChapter4Unlocked
    ? 4
    : activeQuestChapter === 3 && isChapter3Unlocked
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
  const [chestClaimedCh4, setChestClaimedCh4] = useState<boolean>(() => {
    return safeStorage.getItem('cdd_quest_chest_ch4_claimed') === 'true';
  });
  const [chestClaimedCh5, setChestClaimedCh5] = useState<boolean>(() => {
    return safeStorage.getItem('cdd_quest_chest_ch5_claimed') === 'true';
  });
  const [chestClaimedCh6, setChestClaimedCh6] = useState<boolean>(() => {
    return safeStorage.getItem('cdd_quest_chest_ch6_claimed') === 'true';
  });
  const [chestClaimedT2Ch1, setChestClaimedT2Ch1] = useState<boolean>(() => {
    return safeStorage.getItem('cdd_quest_chest_t2_ch1_claimed') === 'true';
  });
  const [showChestModal, setShowChestModal] = useState(false);
  const [autoRepeatMission, setAutoRepeatMission] = useState<QuestMission | null>(null);

  // Horizontal press-and-drag chapter tabs bar
  const chapterTabsRef = useRef<HTMLDivElement>(null);
  const isChapterTabsDragging = useRef(false);
  const didDragChapterTabs = useRef(false);
  const chapterTabsStartX = useRef(0);
  const chapterTabsStartScroll = useRef(0);
  const [canScrollChaptersLeft, setCanScrollChaptersLeft] = useState(false);
  const [canScrollChaptersRight, setCanScrollChaptersRight] = useState(true);

  const updateChapterTabsScrollState = () => {
    const el = chapterTabsRef.current;
    if (!el) return;
    setCanScrollChaptersLeft(el.scrollLeft > 4);
    setCanScrollChaptersRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateChapterTabsScrollState();
    const handleResize = () => updateChapterTabsScrollState();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const el = chapterTabsRef.current;
    if (!el) return;
    if (currentChapter === 5 || currentChapter === 6) {
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    } else if (currentChapter === 1) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    }
    const timer = window.setTimeout(updateChapterTabsScrollState, 320);
    return () => window.clearTimeout(timer);
  }, [currentChapter]);

  useEffect(() => {
    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!isChapterTabsDragging.current || !chapterTabsRef.current) return;
      const deltaX = e.clientX - chapterTabsStartX.current;
      if (Math.abs(deltaX) > 5) {
        didDragChapterTabs.current = true;
      }
      chapterTabsRef.current.scrollLeft = chapterTabsStartScroll.current - deltaX;
      updateChapterTabsScrollState();
    };

    const handleWindowPointerUp = () => {
      if (!isChapterTabsDragging.current) return;
      isChapterTabsDragging.current = false;
      window.setTimeout(() => {
        didDragChapterTabs.current = false;
      }, 40);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, []);

  const handleChapterTabsPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    if (e.button !== 0) return;
    isChapterTabsDragging.current = true;
    didDragChapterTabs.current = false;
    chapterTabsStartX.current = e.clientX;
    chapterTabsStartScroll.current = chapterTabsRef.current?.scrollLeft || 0;
  };

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
    isMissionCompleted(m.id)
  ).length;

  const totalCount = missions.length;
  const isChapterFullyCompleted =
    totalCount > 0 && (questProgress.allMissionsCompleted || completedCount >= totalCount);

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

  const handleLaunchMission = (mission: QuestMission, forceStory = false, difficultyTier: 1 | 2 | 3 = 1) => {
    sound.playSFX('click');

    if (difficultyTier > 1) {
      setPendingMissionLaunch({ missionId: mission.id, destination: 'combat', difficultyTier });
      navigateTo('party');
      return;
    }

    if (mission.id === 'm10e_taberna_duergar') {
      setSelectedCombatMissionId('m10e_taberna_duergar');
      navigateTo('story');
      return;
    }

    if (mission.id === 'm21c_forzar_puerta') {
      if (forceStory) {
        setSelectedCombatMissionId('m21c_forzar_puerta_epilogo');
        navigateTo('story');
        return;
      }
      setPendingMissionLaunch({ missionId: 'm21c_forzar_puerta', destination: 'door_breach' });
      navigateTo('party');
      return;
    }

    const playsStory =
      (mission.id === 'm1_tirano' ||
        mission.id === 'm2_robo' ||
        mission.id === 'm3_bosque' ||
        mission.id === 'm4_puertas_selladas' ||
        mission.id === 'm5_minas_historia' ||
        mission.id === 'm8_intro_capitulo3' ||
        mission.id === 'm9_emboscada_ferton' ||
        mission.id === 'm10_hobgoblin_boss' ||
        mission.id === 'm10b_encuentro_chispo' ||
        mission.id === 'm10c_callejon_hoggoblins' ||
        mission.id === 'm10d_mansion_baron' ||
        mission.id === 'm11_llegada_mansion_ferton' ||
        mission.id === 'm12_recibidor_mansion_ferton' ||
        mission.id === 'm13_escaleras_durnik' ||
        mission.id === 'm14_planta_intermedia_ferton' ||
        mission.id === 'm15_despacho_ferton' ||
        mission.id === 'm16_audiencia_baron' ||
        mission.id === 'm17_despertar_suenos' ||
        mission.id === 'm18_primera_camara_gorgon' ||
        mission.id === 'm19_segunda_camara_aire' ||
        mission.id === 'm20_tercera_camara_bulezau' ||
        mission.id === 'm21_coliseo_suenos' ||
        mission.id === 'm21b_casa_gabriel' ||
        mission.id === 'm21d_verdad_gabriel' ||
        mission.isStory) &&
      (!questProgress.completedMissions.includes(mission.id) || forceStory || mission.isStory);

    // Misiones ya vistas que se repiten pasan a su versión epílogo.
    let missionId = mission.id;
    if (playsStory && forceStory && questProgress.completedMissions.includes(mission.id)) {
      const epilogues: Record<string, string> = {
        t2_c1_m1_trincheras_nomuertos: 't2_c1_m1_trincheras_nomuertos_epilogo',
        m20_tercera_camara_bulezau: 'm20_tercera_camara_bulezau_epilogo',
        m19_segunda_camara_aire: 'm19_segunda_camara_aire_epilogo',
        m18_primera_camara_gorgon: 'm18_primera_camara_gorgon_epilogo',
        m14_planta_intermedia_ferton: 'm14_planta_intermedia_ferton_epilogo',
        m13_escaleras_durnik: 'm13_escaleras_durnik_epilogo',
        m12_recibidor_mansion_ferton: 'm12_recibidor_mansion_ferton_epilogo',
        m10c_callejon_hoggoblins: 'm10c_callejon_hoggoblins_epilogo',
        m10_hobgoblin_boss: 'm10_hobgoblin_boss_epilogo',
        m9_emboscada_ferton: 'm9_emboscada_ferton_epilogo',
        m2_robo: 'm2_robo_epilogo',
        m3_bosque: 'm3_bosque_epilogo',
        m4_puertas_selladas: 'm4_puertas_selladas_epilogo',
        m3_cuevas_rojo: 'm3_cuevas_rojo_epilogo',
        m4_cuevas_azul: 'm4_cuevas_azul_epilogo',
        m5_cuevas_zancudo: 'm5_cuevas_zancudo_epilogo',
      };
      missionId = epilogues[mission.id] ?? mission.id;
    }

    // Toda misión pasa primero por el selector de héroes.
    setPendingMissionLaunch({ missionId, destination: playsStory ? 'story' : 'combat' });
    navigateTo('party');
  };

  const handleClaimChest = () => {
    sound.playSFX('victory');
    if (isTome2) {
      if (!chestClaimedT2Ch1 && isChapterFullyCompleted) {
        addGold(25000);
        addCrystals(1000);
        addShelfItem({
          id: 'recompensa_barracon_abandonado_telarana',
          name: 'Reliquia del Barracón Abandonado',
          category: 'materials',
          count: 1,
          icon: '/assets/portraits/arana_acorazada_thumb.webp',
          rarity: 'UR',
          priceGold: 15000,
          description:
            'Trofeo del Barracón Abandonado con seda de la Araña Acorazada y esquirlas de piedra negra incandescente.',
        });
        setChestClaimedT2Ch1(true);
        safeStorage.setItem('cdd_quest_chest_t2_ch1_claimed', 'true');
      }
      setShowChestModal(true);
      return;
    }
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
          icon: '/assets/items/lingote_plata_app.webp',
          rarity: 'SSR',
          priceGold: 5000,
          description: 'Lingotes de plata pura extraídos de las profundidades de Glimmerstone.',
        });
        setChestClaimedCh2(true);
        safeStorage.setItem('cdd_quest_chest_ch2_claimed', 'true');
      }
    } else if (currentChapter === 3) {
      if (!chestClaimedCh3 && isChapterFullyCompleted) {
        addGold(35000);
        addCrystals(1200);
        addShelfItem({
          id: 'recompensa_bosque_orcos',
          name: 'Estandarte del Clan Colmillo y Vino Especiado',
          category: 'materials',
          count: 1,
          icon: '/assets/portraits/gromock_icono.webp',
          rarity: 'UR',
          priceGold: 10000,
          description: 'Trofeos reclamados tras el despeje pacífico del campamento orco en los bosques de Icespear.',
        });
        setChestClaimedCh3(true);
        safeStorage.setItem('cdd_quest_chest_ch3_claimed', 'true');
      }
    } else if (currentChapter === 4) {
      if (!chestClaimedCh4 && isChapterFullyCompleted) {
        addGold(45000);
        addCrystals(1500);
        addShelfItem({
          id: 'recompensa_mansion_ferton_lacre',
          name: 'Lacre Dorado de la Mansión de Ferton',
          category: 'materials',
          count: 1,
          icon: '/assets/portraits/elemental_fuego_icono.webp',
          rarity: 'UR',
          priceGold: 15000,
          description: 'Sello aurífero arrebatado del vestíbulo principal de la Mansión de Ferton tras la distracción del elemental ilusorio.',
        });
        setChestClaimedCh4(true);
        safeStorage.setItem('cdd_quest_chest_ch4_claimed', 'true');
      }
    } else if (currentChapter === 5) {
      if (!chestClaimedCh5 && isChapterFullyCompleted) {
        addGold(60000);
        addCrystals(2000);
        setChestClaimedCh5(true);
        safeStorage.setItem('cdd_quest_chest_ch5_claimed', 'true');
      }
    } else if (currentChapter === 6) {
      if (!chestClaimedCh6 && isChapterFullyCompleted) {
        addGold(100000);
        addCrystals(3000);
        addShelfItem({
          id: 'recompensa_sangre_hielo_cryovain',
          name: 'Escamas de Cryovain',
          category: 'materials',
          count: 5,
          icon: '/assets/items/Escamas de Cryovain.webp',
          rarity: 'UR',
          priceGold: 25000,
          description: 'Escamas dracónicas blancas gélidas arrancadas a Cryovain en la cima helada.',
        });
        setChestClaimedCh6(true);
        safeStorage.setItem('cdd_quest_chest_ch6_claimed', 'true');
      }
    }
    setShowChestModal(true);
  };

  const handleSelectChapter = (chapterNum: number) => {
    if (didDragChapterTabs.current) return;
    if (isTome2) {
      if (chapterNum !== 1) return;
      sound.playSFX('click');
      return;
    }
    // Capítulos bloqueados: pulsar no hace nada (ni sonido ni aviso).
    if (chapterNum === 2 && !isChapter2Unlocked) return;
    if (chapterNum === 3 && !isChapter3Unlocked) return;
    if (chapterNum === 4 && !isChapter4Unlocked) return;
    if (chapterNum === 5 && !isChapter5Unlocked) return;
    if (chapterNum === 6 && !isChapter6Unlocked) return;
    sound.playSFX('click');
    setActiveQuestChapter(chapterNum);
  };

  // Franja vertical que ocupa el tablón de madera en cada fondo, medida en % del ancho de la
  // imagen (así es como escala con object-cover). Sirve para centrar en él la tira de capítulos.
  const CHAPTER_TABS_BAND: Record<number, { top: string; height: string }> = {
    1: { top: '1.3%', height: '16.8%' },
    2: { top: '1.3%', height: '16.8%' },
    3: { top: '0.9%', height: '16.0%' },
    4: { top: '1.3%', height: '16.8%' },
    5: { top: '1.3%', height: '16.8%' },
    6: { top: '1.3%', height: '16.8%' },
  };
  const chapterTabsBand = isTome2
    ? CHAPTER_TABS_BAND[1]
    : CHAPTER_TABS_BAND[currentChapter] ?? CHAPTER_TABS_BAND[1];

  return (
    <div className="relative w-full h-full flex flex-col justify-start bg-transparent select-none overflow-hidden">
      {/* 1. AUTHENTIC FULL-BLEED BACKGROUND */}
      <img
        src={
          isTome2
            ? '/assets/backgrounds/tablon_barracon_abandonado_ch1.webp'
            : currentChapter === 6
            ? '/assets/backgrounds/tablon_sangre_hielo_ch6.webp'
            : currentChapter === 5
            ? '/assets/backgrounds/tablon_reino_suenos_ch5.webp'
            : currentChapter === 4
            ? '/assets/backgrounds/tablon_mansion_ferton_ch4.webp'
            : currentChapter === 3
            ? '/assets/aistudio/image_0fed218e.webp'
            : currentChapter === 2
            ? '/assets/aistudio/image_5518948d.webp'
            : '/assets/backgrounds/fondo_icespear_1.webp'
        }
        alt={
          isTome2
            ? 'Tablón de Misiones del Barracón Abandonado'
            : currentChapter === 6
            ? 'Tablón de Misiones de Sangre y Hielo'
            : currentChapter === 5
            ? 'Tablón de Misiones de El Reino de los Sueños'
            : currentChapter === 4
            ? 'Tablón de Misiones de la Mansión Ferton'
            : currentChapter === 3
            ? 'Tablón de Misiones del Mercado Negro'
            : currentChapter === 2
            ? 'Las Minas de Glimmerstone'
            : 'Fondo Icespear'
        }
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none z-0"
      />


      {/* 2. TOP CHAPTER TABS (Horizontal press-and-drag slider on the top wooden plank) */}
      <div className="relative z-20 w-full px-[4.5%] shrink-0">
        {/* El tablon de madera del fondo ocupa del 0,6 % al 17,4 % del ancho de la imagen:
            con object-cover el alto del tablon es un porcentaje del ancho, así que la tira de
            capítulos se centra en ese eje Y con padding-top porcentual y flex. */}
        <div className="w-full" style={{ paddingTop: chapterTabsBand.top }}>
          <div className="relative w-full" style={{ paddingTop: chapterTabsBand.height }}>
            <div className="absolute inset-0 flex items-center">
              <div className="relative w-full">
          <div
            ref={chapterTabsRef}
            onPointerDown={handleChapterTabsPointerDown}
            onScroll={updateChapterTabsScrollState}
            onWheel={(e) => {
              if (!chapterTabsRef.current) return;
              if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                chapterTabsRef.current.scrollLeft += e.deltaY;
                updateChapterTabsScrollState();
              }
            }}
            className="flex items-center gap-1.5 h-10 sm:h-11 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none touch-pan-x"
            title="Pulsa y arrastra para deslizar entre capítulos"
          >
            {isTome2 ? (
              <>
                {/* TOMO 2 TAB 1: CAPITULO I BARRACÓN */}
                <button
                  type="button"
                  onClick={() => handleSelectChapter(1)}
                  className="relative w-[calc((100%-26px)/4)] shrink-0 h-full rounded-md flex flex-col items-center justify-center cursor-pointer transition-all brightness-110 scale-[1.03] drop-shadow-[0_0_10px_rgba(245,158,11,0.95)]"
                >
                  <img
                    src="/assets/items/boton_historia.webp"
                    alt="Capitulo I"
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
                  />
                  <span className="relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase leading-tight text-amber-100 drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                    CAPITULO I
                  </span>
                  <span className="relative z-10 text-[7px] sm:text-[8px] font-bold uppercase leading-tight tracking-wider text-amber-200 drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                    BARRACÓN
                  </span>
                </button>

                {/* TOMO 2 TAB 2: CAPITULO II SANTUARIO (Bloqueado) */}
                <button
                  type="button"
                  onClick={() => handleSelectChapter(2)}
                  className="relative w-[calc((100%-26px)/4)] shrink-0 h-full rounded-md flex flex-col items-center justify-center cursor-pointer filter brightness-75 hover:brightness-90 transition-all"
                  title="Capítulo II: Santuario (Próximamente)"
                >
                  <img
                    src="/assets/items/boton_historia.webp"
                    alt="Capitulo II Bloqueado"
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
                  />
                  <span className="relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase text-stone-300 leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                    CAPITULO II
                  </span>
                  <span className="relative z-10 text-[7px] sm:text-[8px] font-bold uppercase text-stone-400 leading-tight tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                    SANTUARIO
                  </span>
                  <img
                    src="/assets/items/CANDADO.webp"
                    alt="Bloqueado"
                    draggable={false}
                    className="absolute -bottom-1.5 w-4 h-4.5 object-contain z-20 drop-shadow-md pointer-events-none"
                  />
                </button>

                {/* TOMO 2 TAB 3: CAPITULO III BOLETARIA (Bloqueado) */}
                <button
                  type="button"
                  onClick={() => handleSelectChapter(3)}
                  className="relative w-[calc((100%-26px)/4)] shrink-0 h-full rounded-md flex flex-col items-center justify-center cursor-pointer filter brightness-75 hover:brightness-90 transition-all"
                  title="Capítulo III: Boletaria (Próximamente)"
                >
                  <img
                    src="/assets/items/boton_historia.webp"
                    alt="Capitulo III Bloqueado"
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
                  />
                  <span className="relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase text-stone-300 leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                    CAPITULO III
                  </span>
                  <span className="relative z-10 text-[7px] sm:text-[8px] font-bold uppercase text-stone-400 leading-tight tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                    BOLETARIA
                  </span>
                  <img
                    src="/assets/items/CANDADO.webp"
                    alt="Bloqueado"
                    draggable={false}
                    className="absolute -bottom-1.5 w-4 h-4.5 object-contain z-20 drop-shadow-md pointer-events-none"
                  />
                </button>
              </>
            ) : (
              <>
            {/* TAB 1: CAPITULO I ICESPEAR */}
            <button
              type="button"
              onClick={() => handleSelectChapter(1)}
              className={`relative w-[calc((100%-26px)/4)] shrink-0 h-full rounded-md flex flex-col items-center justify-center cursor-pointer transition-all ${
                currentChapter === 1
                  ? 'brightness-110 scale-[1.03] drop-shadow-[0_0_10px_rgba(96,165,250,0.95)]'
                  : 'brightness-95 hover:brightness-110 drop-shadow-[0_0_6px_rgba(96,165,250,0.5)]'
              }`}
            >
              <img
                src="/assets/items/boton_historia.webp"
                alt="Capitulo I"
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
              />
              <span
                className={`relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)] ${
                  currentChapter === 1 ? 'text-sky-100' : 'text-[#d6c2a5]'
                }`}
              >
                CAPITULO I
              </span>
              <span
                className={`relative z-10 text-[7.5px] sm:text-[8.5px] font-bold uppercase leading-tight tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)] ${
                  currentChapter === 1 ? 'text-sky-200' : 'text-stone-300'
                }`}
              >
                ICESPEAR
              </span>
            </button>

            {/* TAB 2: CAPITULO II LAS MINAS */}
            {isChapter2Unlocked ? (
              <button
                type="button"
                onClick={() => handleSelectChapter(2)}
                className={`relative w-[calc((100%-26px)/4)] shrink-0 h-full rounded-md flex flex-col items-center justify-center cursor-pointer transition-all ${
                  currentChapter === 2
                    ? 'brightness-110 scale-[1.03] drop-shadow-[0_0_10px_rgba(45,212,191,0.95)]'
                    : 'brightness-95 hover:brightness-110 drop-shadow-[0_0_6px_rgba(45,212,191,0.5)]'
                }`}
              >
                <img
                  src="/assets/items/boton_historia.webp"
                  alt="Capitulo II"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
                />
                <span
                  className={`relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)] ${
                    currentChapter === 2 ? 'text-teal-100' : 'text-[#d6c2a5]'
                  }`}
                >
                  CAPITULO II
                </span>
                <span
                  className={`relative z-10 text-[7.5px] sm:text-[8.5px] font-bold uppercase leading-tight tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)] ${
                    currentChapter === 2 ? 'text-teal-200' : 'text-stone-300'
                  }`}
                >
                  LAS MINAS
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectChapter(2)}
                className="relative w-[calc((100%-26px)/4)] shrink-0 h-full rounded-md flex flex-col items-center justify-center cursor-pointer filter brightness-75 hover:brightness-90 transition-all"
              >
                <img
                  src="/assets/items/boton_historia.webp"
                  alt="Capitulo II Bloqueado"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
                />
                <span className="relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase text-stone-300 leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                  CAPITULO II
                </span>
                <span className="relative z-10 text-[7px] sm:text-[8px] font-bold uppercase text-stone-400 leading-tight tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                  LAS MINAS
                </span>
                <img
                  src="/assets/items/CANDADO.webp"
                  alt="Bloqueado"
                  draggable={false}
                  className="absolute -bottom-1.5 w-4 h-4.5 object-contain z-20 drop-shadow-md pointer-events-none"
                />
              </button>
            )}

            {/* TAB 3: CAPITULO III EL MERCADO NEGRO */}
            {isChapter3Unlocked ? (
              <button
                type="button"
                onClick={() => handleSelectChapter(3)}
                className={`relative w-[calc((100%-26px)/4)] shrink-0 h-full rounded-md flex flex-col items-center justify-center cursor-pointer transition-all ${
                  currentChapter === 3
                    ? 'brightness-110 scale-[1.03] drop-shadow-[0_0_10px_rgba(168,85,247,0.95)]'
                    : 'brightness-95 hover:brightness-110 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]'
                }`}
              >
                <img
                  src="/assets/items/boton_historia.webp"
                  alt="Capitulo III"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
                />
                <span
                  className={`relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)] ${
                    currentChapter === 3 ? 'text-purple-100' : 'text-[#d6c2a5]'
                  }`}
                >
                  CAPITULO III
                </span>
                <span
                  className={`relative z-10 text-[6.5px] sm:text-[7.5px] font-bold uppercase leading-tight tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)] ${
                    currentChapter === 3 ? 'text-purple-200' : 'text-stone-300'
                  }`}
                >
                  MERCADO NEGRO
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectChapter(3)}
                className="relative w-[calc((100%-26px)/4)] shrink-0 h-full rounded-md flex flex-col items-center justify-center cursor-pointer filter brightness-75 hover:brightness-90 transition-all"
                title="Capítulo III: El Mercado Negro (Bloqueado)"
              >
                <img
                  src="/assets/items/boton_historia.webp"
                  alt="Capitulo III Bloqueado"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
                />
                <span className="relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase text-stone-300 leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                  CAPITULO III
                </span>
                <span className="relative z-10 text-[6.5px] sm:text-[7.5px] font-bold uppercase text-stone-400 leading-tight tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                  MERCADO NEGRO
                </span>
                <img
                  src="/assets/items/CANDADO.webp"
                  alt="Bloqueado"
                  draggable={false}
                  className="absolute -bottom-1.5 w-4 h-4.5 object-contain z-20 drop-shadow-md pointer-events-none"
                />
              </button>
            )}

            {/* TAB 4: CAPITULO IV MANSIÓN FERTON */}
            {isChapter4Unlocked ? (
              <button
                type="button"
                onClick={() => handleSelectChapter(4)}
                className={`relative w-[calc((100%-26px)/4)] shrink-0 h-full rounded-md flex flex-col items-center justify-center cursor-pointer transition-all ${
                  currentChapter === 4
                    ? 'brightness-110 scale-[1.03] drop-shadow-[0_0_10px_rgba(245,158,11,0.95)]'
                    : 'brightness-95 hover:brightness-110 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                }`}
                title="Capítulo IV: Mansión Ferton"
              >
                <img
                  src="/assets/items/boton_historia.webp"
                  alt="Capitulo IV"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
                />
                <span
                  className={`relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)] ${
                    currentChapter === 4 ? 'text-amber-100 font-black' : 'text-[#d6c2a5]'
                  }`}
                >
                  CAPITULO IV
                </span>
                <span
                  className={`relative z-10 text-[6px] sm:text-[7px] font-bold uppercase leading-tight tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)] ${
                    currentChapter === 4 ? 'text-amber-200' : 'text-stone-300'
                  }`}
                >
                  MANSIÓN FERTON
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectChapter(4)}
                className="relative w-[calc((100%-26px)/4)] shrink-0 h-full rounded-md flex flex-col items-center justify-center cursor-pointer filter brightness-75 hover:brightness-90 transition-all"
                title="Capítulo IV: Mansión Ferton (Bloqueado)"
              >
                <img
                  src="/assets/items/boton_historia.webp"
                  alt="Capitulo IV Bloqueado"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
                />
                <span className="relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase text-stone-300 leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                  CAPITULO IV
                </span>
                <span className="relative z-10 text-[6px] sm:text-[7px] font-bold uppercase text-stone-400 leading-tight tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                  MANSIÓN FERTON
                </span>
                <img
                  src="/assets/items/CANDADO.webp"
                  alt="Bloqueado"
                  draggable={false}
                  className="absolute -bottom-1.5 w-4 h-4.5 object-contain z-20 drop-shadow-md pointer-events-none"
                />
              </button>
            )}

            {/* TAB 5: CAPITULO V EL REINO DE LOS SUEÑOS */}
            {isChapter5Unlocked ? (
              <button
                type="button"
                onClick={() => handleSelectChapter(5)}
                className={`relative w-[calc((100%-26px)/4)] shrink-0 h-full rounded-md flex flex-col items-center justify-center cursor-pointer transition-all px-1 ${
                  currentChapter === 5
                    ? 'brightness-110 scale-[1.03] drop-shadow-[0_0_10px_rgba(236,72,153,0.95)]'
                    : 'brightness-95 hover:brightness-110 drop-shadow-[0_0_6px_rgba(236,72,153,0.5)]'
                }`}
                title="Capítulo V: El Reino de los Sueños"
              >
                <img
                  src="/assets/items/boton_historia.webp"
                  alt="Capitulo V"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
                />
                <span
                  className={`relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)] ${
                    currentChapter === 5 ? 'text-pink-100 font-black' : 'text-[#d6c2a5]'
                  }`}
                >
                  CAPITULO V
                </span>
                <span
                  className={`relative z-10 text-[5.5px] sm:text-[6.5px] font-bold uppercase leading-tight tracking-tight text-center truncate max-w-full drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)] ${
                    currentChapter === 5 ? 'text-pink-200' : 'text-stone-300'
                  }`}
                >
                  REINO DE LOS SUEÑOS
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectChapter(5)}
                className="relative w-[calc((100%-26px)/4)] shrink-0 h-full rounded-md flex flex-col items-center justify-center cursor-pointer filter brightness-75 hover:brightness-90 transition-all px-1"
                title="Capítulo V: El Reino de los Sueños (Bloqueado)"
              >
                <img
                  src="/assets/items/boton_historia.webp"
                  alt="Capitulo V Bloqueado"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
                />
                <span className="relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase text-stone-300 leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                  CAPITULO V
                </span>
                <span className="relative z-10 text-[5.5px] sm:text-[6.5px] font-bold uppercase text-stone-400 leading-tight tracking-tight text-center truncate max-w-full drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                  REINO DE LOS SUEÑOS
                </span>
                <img
                  src="/assets/items/CANDADO.webp"
                  alt="Bloqueado"
                  draggable={false}
                  className="absolute -bottom-1.5 w-4 h-4.5 object-contain z-20 drop-shadow-md pointer-events-none"
                />
              </button>
            )}

            {/* TAB 6: CAPITULO VI SANGRE Y HIELO */}
            {isChapter6Unlocked ? (
              <button
                type="button"
                onClick={() => handleSelectChapter(6)}
                className={`relative w-[calc((100%-26px)/4)] shrink-0 h-full rounded-md flex flex-col items-center justify-center cursor-pointer transition-all px-1 ${
                  currentChapter === 6
                    ? 'brightness-110 scale-[1.03] drop-shadow-[0_0_10px_rgba(56,189,248,0.95)]'
                    : 'brightness-95 hover:brightness-110 drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]'
                }`}
                title="Capítulo VI: Sangre y Hielo"
              >
                <img
                  src="/assets/items/boton_historia.webp"
                  alt="Capitulo VI"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
                />
                <span
                  className={`relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)] ${
                    currentChapter === 6 ? 'text-cyan-100 font-black' : 'text-[#d6c2a5]'
                  }`}
                >
                  CAPITULO VI
                </span>
                <span
                  className={`relative z-10 text-[5.5px] sm:text-[6.5px] font-bold uppercase leading-tight tracking-tight text-center truncate max-w-full drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)] ${
                    currentChapter === 6 ? 'text-rose-200' : 'text-stone-300'
                  }`}
                >
                  SANGRE Y HIELO
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectChapter(6)}
                className="relative w-[calc((100%-26px)/4)] shrink-0 h-full rounded-md flex flex-col items-center justify-center cursor-pointer filter brightness-75 hover:brightness-90 transition-all px-1"
                title="Capítulo VI: Sangre y Hielo (Bloqueado)"
              >
                <img
                  src="/assets/items/boton_historia.webp"
                  alt="Capitulo VI Bloqueado"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover rounded-md pointer-events-none"
                />
                <span className="relative z-10 text-[8.5px] sm:text-[9.5px] font-black uppercase text-stone-300 leading-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                  CAPITULO VI
                </span>
                <span className="relative z-10 text-[5.5px] sm:text-[6.5px] font-bold uppercase text-stone-400 leading-tight tracking-tight text-center truncate max-w-full drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                  SANGRE Y HIELO
                </span>
                <img
                  src="/assets/items/CANDADO.webp"
                  alt="Bloqueado"
                  draggable={false}
                  className="absolute -bottom-1.5 w-4 h-4.5 object-contain z-20 drop-shadow-md pointer-events-none"
                />
              </button>
            )}
              </>
            )}
          </div>

              </div>
            </div>
          </div>
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
                {isTome2
                  ? 'PROGRESO CAPÍTULO I • BARRACÓN ABANDONADO'
                  : currentChapter === 6
                  ? 'PROGRESO CAPÍTULO VI • SANGRE Y HIELO'
                  : currentChapter === 5
                  ? 'PROGRESO CAPÍTULO V • EL REINO DE LOS SUEÑOS'
                  : currentChapter === 4
                  ? 'PROGRESO CAPÍTULO IV • MANSIÓN FERTON'
                  : currentChapter === 3
                  ? 'PROGRESO CAPÍTULO III • MERCADO NEGRO'
                  : currentChapter === 2
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
                  isTome2
                    ? 'bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                    : currentChapter === 6
                    ? 'bg-gradient-to-r from-[#991b1b] via-[#38bdf8] to-[#e0f2fe] shadow-[0_0_10px_rgba(56,189,248,0.85)]'
                    : currentChapter === 5
                    ? 'bg-gradient-to-r from-[#4f46e5] via-[#9333ea] to-[#ec4899] shadow-[0_0_10px_rgba(168,85,247,0.85)]'
                    : currentChapter === 4
                    ? 'bg-gradient-to-r from-[#f59e0b] via-[#ea580c] to-[#b91c1c] shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                    : currentChapter === 3
                    ? 'bg-gradient-to-r from-[#9333ea] via-[#c026d3] to-[#f59e0b] shadow-[0_0_10px_rgba(192,38,211,0.8)]'
                    : currentChapter === 2
                    ? 'bg-gradient-to-r from-[#0284c7] via-[#06b6d4] to-[#f59e0b] shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                    : 'bg-gradient-to-r from-[#dc2626] via-[#ea580c] to-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                } transition-all duration-500`}
                style={{ width: `${totalCount > 0 ? Math.min(100, (completedCount / totalCount) * 100) : 0}%` }}
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
              isTome2
                ? 'Cofre del Barracón Abandonado'
                : currentChapter === 6
                ? 'Cofre de Sangre y Hielo'
                : currentChapter === 5
                ? 'Cofre del Reino de los Sueños'
                : currentChapter === 4
                ? 'Cofre de la Mansión Ferton'
                : currentChapter === 3
                ? 'Cofre del Mercado Negro de Ferton'
                : currentChapter === 2
                ? 'Cofre de las Minas de Glimmerstone'
                : 'Cofre de Recompensas de Icespear'
            }
          >
            <img
              src="/assets/items/cofre_cerrado.webp"
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
          {missions.length === 0 && (
            <div className="relative w-full rounded-xl overflow-hidden border-2 border-[#3b170c] bg-[#1a0b04]/85 px-4 py-6 text-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.75)] flex flex-col items-center justify-center space-y-2 mt-2">
              <h3 className="font-serif font-black text-sm text-amber-200 tracking-wide">
                Capítulo I · Barracón Abandonado
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed max-w-[260px]">
                Sin misiones disponibles de momento. Las incursiones en el barracón se desbloquearán próximamente.
              </p>
            </div>
          )}
          {missions.map((mission, idx) => {
            const isCompleted = isMissionCompleted(mission.id);
            // In chapter 2/3/4/5, first mission is automatically unlocked once Chapter is opened
            const isUnlocked =
              questProgress.allMissionsCompleted ||
              idx === 0 ||
              isMissionCompleted(missions[idx - 1].id) ||
              (missions[idx - 1].id === 'm6_puerta_laberinto' && isMissionCompleted('m6_cuevas_titan')) ||
              isCompleted;

            const isFertonMission = mission.id === 'm9_emboscada_ferton';
            const isCallejonHoggoblinsMission = mission.id === 'm10c_callejon_hoggoblins';
            const isBaronMansionMission = mission.id === 'm10d_mansion_baron';
            const isTabernaDuergarMission = mission.id === 'm10e_taberna_duergar';
            const isMansionFertonLlegadaMission = mission.id === 'm11_llegada_mansion_ferton';
            const isRecibidorMansionMission = mission.id === 'm12_recibidor_mansion_ferton';
            const isDurnikEscalerasMission = mission.id === 'm13_escaleras_durnik';
            const isPlantaIntermediaMansionMission = mission.id === 'm14_planta_intermedia_ferton';
            const isDespachoFertonMission = mission.id === 'm15_despacho_ferton';
            const isAudienciaBaronMission = mission.id === 'm16_audiencia_baron';
            const isDespertarSuenosMission = mission.id === 'm17_despertar_suenos';
            const isGorgonMazmorraMission = mission.id === 'm18_primera_camara_gorgon';
            const isAireMazmorraMission = mission.id === 'm19_segunda_camara_aire';
            const isBulezauMazmorraMission = mission.id === 'm20_tercera_camara_bulezau';
            const isColiseoSuenosMission = mission.id === 'm21_coliseo_suenos';
            const isCasaGabrielMission = mission.id === 'm21b_casa_gabriel';
            const isForzarPuertaMission = mission.id === 'm21c_forzar_puerta';
            const isVerdadGabrielMission = mission.id === 'm21d_verdad_gabriel';
            const isStoryMission =
              ((mission.isStory &&
                !isFertonMission &&
                !isCallejonHoggoblinsMission &&
                !isTabernaDuergarMission &&
                !isForzarPuertaMission &&
                !isRecibidorMansionMission &&
                !isDurnikEscalerasMission &&
                !isPlantaIntermediaMansionMission &&
                !isGorgonMazmorraMission &&
                !isAireMazmorraMission &&
                !isBulezauMazmorraMission) ||
                mission.id === 'm1_tirano' ||
                mission.id === 'm5_minas_historia');
            const earnedMissionStars = isCompleted
              ? Math.max(0, Math.min(3, questProgress.stars?.[mission.id] ?? 3))
              : 0;
            const isRoboMission = mission.id === 'm2_robo';
            const isBosqueMission = mission.id === 'm3_bosque';
            const isPuertasMission = mission.id === 'm4_puertas_selladas';
            const isLaberintoMission = mission.id === 'm6_puerta_laberinto';
            const isAldeaEpilogueMission = mission.id === 'm7_epilogo_aldea';

            // Una sola etiqueta por misión: Combate / Jefe / Historia / Minijuego.
            const isBossMission =
              mission.id === 'm1_tirano' ||
              mission.id === 'm4_puertas_selladas' ||
              mission.id === 'm10_hobgoblin_boss' ||
              mission.id === 'm13_escaleras_durnik' ||
              mission.id === 'm18_primera_camara_gorgon' ||
              mission.id === 'm19_segunda_camara_aire' ||
              mission.id === 'm20_tercera_camara_bulezau' ||
              mission.id === 'm22_cryovain_final' ||
              mission.id === 't2_c1_m4_arana_acorazada';
            // Misiones que son escena narrativa (cinemática) y no un combate.
            const isCinematicMission =
              isLaberintoMission ||
              isBaronMansionMission ||
              isMansionFertonLlegadaMission ||
              isDespachoFertonMission ||
              isAudienciaBaronMission ||
              isDespertarSuenosMission ||
              isColiseoSuenosMission ||
              isCasaGabrielMission ||
              isVerdadGabrielMission ||
              isAldeaEpilogueMission ||
              mission.id === 'm10b_encuentro_chispo' ||
              mission.id === 't2_c1_m5_carreta_cid';
            const missionTypeLabel: 'Combate' | 'Jefe' | 'Historia' | 'Minijuego' =
              isTabernaDuergarMission || isForzarPuertaMission
                ? 'Minijuego'
                : isBossMission
                ? 'Jefe'
                : isCinematicMission
                ? 'Historia'
                : 'Combate';

            if (isCompleted || isUnlocked) {
              return (
                <div
                  key={mission.id}
                  onClick={() => handleLaunchMission(mission, false)}
                  className="relative w-full h-[98px] sm:h-[102px] rounded-xl overflow-hidden flex items-center px-3 sm:px-3.5 py-2 sm:py-2.5 shadow-md shrink-0 border border-transparent cursor-pointer hover:brightness-105 active:scale-[0.99] transition-all"
                >
                  <img
                    src="/assets/items/HISTORIA NIVEL BOTON.webp"
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
                    <div className="flex flex-col items-start gap-1">
                      <h4 className="max-w-full font-serif font-black text-xs sm:text-[13px] text-[#3d1908] truncate drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
                        {mission.title}
                      </h4>
                      <span
                        className={`px-1.5 py-0.2 rounded-full font-sans font-black text-[7px] uppercase tracking-wide ${
                          missionTypeLabel === 'Jefe'
                            ? 'bg-red-900/95 text-amber-200 border border-amber-400/60'
                            : missionTypeLabel === 'Historia'
                            ? 'bg-purple-700/90 text-purple-100'
                            : missionTypeLabel === 'Minijuego'
                            ? 'bg-emerald-800/95 text-emerald-100'
                            : 'bg-amber-700/90 text-amber-100'
                        }`}
                      >
                        {missionTypeLabel}
                      </span>
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
                      title={
                        isForzarPuertaMission
                          ? 'Forzar la puerta'
                          : isTabernaDuergarMission
                          ? 'Entrar al concurso'
                          : 'Entrar a combate'
                      }
                    >
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((starIdx) => (
                          <img
                            key={starIdx}
                            src={
                              earnedMissionStars >= starIdx
                                ? '/assets/items/estrella_mejora.webp'
                                : '/assets/items/estrella_bronce.webp'
                            }
                            alt=""
                            className="w-3 h-3 sm:w-3.5 sm:h-3.5 object-contain drop-shadow"
                          />
                        ))}
                      </div>
                      <span className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] leading-tight">
                        {isForzarPuertaMission
                          ? 'FORZAR'
                          : isTabernaDuergarMission
                          ? 'CONCURSO'
                          : isStoryMission
                          ? 'HISTORIA'
                          : 'COMBATE'}
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
                        mission.id === 'm5_minas_historia' ||
                        mission.id === 'm8_intro_capitulo3' ||
                        mission.id === 'm9_emboscada_ferton' ||
                        mission.id === 'm10_hobgoblin_boss' ||
                        mission.id === 'm10b_encuentro_chispo' ||
                        mission.id === 'm10c_callejon_hoggoblins' ||
                        mission.id === 'm10d_mansion_baron' ||
                        mission.id === 'm10e_taberna_duergar' ||
                        mission.id === 'm11_llegada_mansion_ferton' ||
                        mission.id === 'm12_recibidor_mansion_ferton' ||
                        mission.id === 'm13_escaleras_durnik' ||
                        mission.id === 'm14_planta_intermedia_ferton' ||
                        mission.id === 'm15_despacho_ferton' ||
                        mission.id === 'm16_audiencia_baron' ||
                        mission.id === 'm17_despertar_suenos' ||
                        mission.id === 'm18_primera_camara_gorgon' ||
                        mission.id === 'm19_segunda_camara_aire' ||
                        mission.id === 'm20_tercera_camara_bulezau' ||
                        mission.id === 'm21_coliseo_suenos' ||
                        mission.id === 'm21b_casa_gabriel' ||
                        mission.id === 'm21c_forzar_puerta' ||
                        mission.id === 'm21d_verdad_gabriel';

                      if (
                        hasStoryBtn &&
                        isCompleted &&
                        (mission.id === 'm10d_mansion_baron' ||
                          mission.id === 'm10e_taberna_duergar' ||
                          mission.id === 'm11_llegada_mansion_ferton' ||
                          mission.id === 'm15_despacho_ferton' ||
                          mission.id === 'm16_audiencia_baron' ||
                          mission.id === 'm17_despertar_suenos' ||
                          mission.id === 'm21_coliseo_suenos' ||
                          mission.id === 'm21b_casa_gabriel' ||
                          mission.id === 'm21c_forzar_puerta' ||
                          mission.id === 'm21d_verdad_gabriel' ||
                          mission.id === 't2_c1_m5_carreta_cid')
                      ) {
                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLaunchMission(mission, true);
                            }}
                            className="w-[86px] sm:w-[92px] py-1 px-2 rounded-md border border-amber-600/70 bg-[#2b1007] hover:bg-[#3d180c] text-amber-200 hover:text-white text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider shadow active:scale-95 transition-all cursor-pointer text-center"
                            title="Volver a ver cinemática"
                          >
                            VER
                          </button>
                        );
                      }

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
                                src="/assets/items/fragmento_astral.webp"
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
                              src="/assets/items/fragmento_astral.webp"
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
                    src="/assets/items/CANDADO.webp"
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
                    src="/assets/items/CANDADO.webp"
                    alt="Bloqueado"
                    className="w-4 h-4.5 object-contain drop-shadow"
                  />
                </div>
              </div>
            );
          })}

          {/* REJUGABILIDAD DE CAPÍTULO: dificultad Normal y Difícil */}
          {(() => {
            const replayableIds = new Set([
              'm2_robo', 'm3_bosque', 'm4_puertas_selladas', 'm3_cuevas_rojo',
              'm4_cuevas_azul', 'm5_cuevas_zancudo', 'm9_emboscada_ferton',
              'm10_hobgoblin_boss', 'm10c_callejon_hoggoblins',
              'm12_recibidor_mansion_ferton', 'm13_escaleras_durnik',
              'm14_planta_intermedia_ferton', 'm18_primera_camara_gorgon',
              'm19_segunda_camara_aire', 'm20_tercera_camara_bulezau',
              'm22_cryovain_final', 't2_c1_m1_trincheras_nomuertos',
              't2_c1_m2_jauria_salas', 't2_c1_m3_custodios_anillo',
              't2_c1_m4_arana_acorazada',
            ]);
            const replayMissions = missions.filter((mission) => replayableIds.has(mission.id));
            const tierDone = (tier: 2 | 3) => replayMissions.length > 0 && replayMissions.every((mission) =>
              questProgress.completedMissions.includes(tier === 2 ? `${mission.id}__normal` : `${mission.id}__hard`)
            );
            const showNormal = isChapterFullyCompleted && replayMissions.length > 0;
            const showHard = showNormal && tierDone(2);
            const renderTier = (tier: 2 | 3) => (
              <section key={tier} className={`mt-3 rounded-xl border ${tier === 2 ? 'border-sky-700/70 bg-sky-950/20' : 'border-purple-700/70 bg-purple-950/20'} p-2.5 flex flex-col gap-2`}>
                <div className="flex items-center justify-between px-1">
                  <h3 className={`font-serif font-black text-sm uppercase tracking-wider ${tier === 2 ? 'text-sky-300' : 'text-purple-300'}`}>
                    {tier === 2 ? 'Nueva dificultad · Normal' : 'Nueva dificultad · Difícil'}
                  </h3>
                  <span className="text-[9px] font-mono text-stone-400">{tier === 2 ? '150% PV · 125% ATQ · 120% DEF' : '200% PV · 150% ATQ · 140% DEF'}</span>
                </div>
                {replayMissions.map((mission) => {
                  const progressId = tier === 2 ? `${mission.id}__normal` : `${mission.id}__hard`;
                  const done = questProgress.completedMissions.includes(progressId);
                  return (
                    <button key={progressId} type="button" onClick={() => handleLaunchMission(mission, false, tier)}
                      className="w-full rounded-lg border border-stone-700/80 bg-black/50 p-2 flex items-center gap-2 text-left hover:bg-black/70 active:scale-[0.99]">
                      <img src={mission.portrait} alt="" className="w-11 h-11 rounded-md object-contain bg-black/40" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-black text-stone-100 truncate">{mission.title}</span>
                        <span className="block text-[9px] text-stone-400">{done ? 'Completada · Repetir misión' : 'Pendiente · Entrar al combate'}</span>
                      </span>
                      <span className={`text-[9px] font-black uppercase ${done ? 'text-emerald-400' : tier === 2 ? 'text-sky-300' : 'text-purple-300'}`}>{done ? '✓' : 'JUGAR'}</span>
                    </button>
                  );
                })}
              </section>
            );
            return <>{showNormal && renderTier(2)}{showHard && renderTier(3)}</>;
          })()}
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
                src="/assets/items/cofre_abierto.webp"
                alt="Cofre de Recompensas"
                className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.9)]"
              />
            </div>

            <h3 className="font-serif font-black text-base uppercase text-amber-300 drop-shadow">
              {isTome2
                ? '¡Cofre del Barracón Abandonado!'
                : currentChapter === 6
                ? '¡Cofre de Sangre y Hielo!'
                : currentChapter === 5
                ? '¡Cofre del Reino de los Sueños!'
                : currentChapter === 4
                ? '¡Cofre de la Mansión Ferton!'
                : currentChapter === 3
                ? '¡Cofre del Campamento Orco en el Bosque!'
                : currentChapter === 2
                ? '¡Cofre de Las Minas de Glimmerstone!'
                : '¡Cofre de Icespear Reclamado!'}
            </h3>

            <p className="text-xs text-stone-300">
              {isTome2 && totalCount === 0
                ? 'Las misiones del Capítulo I: Barracón Abandonado estarán disponibles próximamente. ¡Completa el capítulo cuando lleguen para abrir este cofre!'
                : currentChapter === 5 && totalCount === 0
                ? 'Las misiones del Capítulo V: El Reino de los Sueños estarán disponibles próximamente. ¡Completa el capítulo cuando lleguen para abrir este cofre!'
                : isChapterFullyCompleted
                ? `¡Has completado con éxito todas las misiones del Capítulo ${
                    currentChapter === 6
                      ? 'VI'
                      : currentChapter === 5
                      ? 'V'
                      : currentChapter === 4
                      ? 'IV'
                      : currentChapter === 3
                      ? 'III'
                      : currentChapter === 2
                      ? 'II'
                      : 'I'
                  }! Recompensas entregadas a tu bastión:`
                : `Avanza y supera las misiones del Capítulo ${
                    currentChapter === 6
                      ? 'VI'
                      : currentChapter === 5
                      ? 'V'
                      : currentChapter === 4
                      ? 'IV'
                      : currentChapter === 3
                      ? 'III'
                      : currentChapter === 2
                      ? 'II'
                      : 'I'
                  } para reclamar el botín completo (${completedCount}/${totalCount}).`}
            </p>

            {isChapterFullyCompleted ? (
              <div className="flex items-center justify-center gap-4 py-2 bg-[#140602] rounded-lg border border-amber-900/60">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 font-mono">
                  <span>
                    +{isTome2 ? '25,000' : currentChapter === 6 ? '100,000' : currentChapter === 5 ? '60,000' : currentChapter === 4 ? '45,000' : currentChapter === 3 ? '35,000' : currentChapter === 2 ? '25,000' : '15,000'}
                  </span>
                  <img src="/assets/items/moneda_de_moonhaven.webp" alt="Oro" className="w-3.5 h-3.5 object-contain" />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-black text-sky-400 font-mono">
                  <span>+{isTome2 ? '1,000' : currentChapter === 6 ? '3,000' : currentChapter === 5 ? '2,000' : currentChapter === 4 ? '1,500' : currentChapter === 3 ? '1,200' : currentChapter === 2 ? '800' : '500'}</span>
                  <img src="/assets/items/gema_del_recuerdo.webp" alt="Gemas" className="w-3.5 h-3.5 object-contain" />
                </div>
              </div>
            ) : (
              <div className="py-2 px-3 rounded-lg bg-black/50 border border-stone-800 text-[11px] text-amber-200/90 font-mono">
                {isTome2
                  ? 'Recompensa final: +25,000 Oro, +1,000 Gemas y Reliquia del Barracón'
                  : currentChapter === 6
                  ? 'Recompensa final: +100,000 Oro, +3,000 Gemas y 5x Escamas de Cryovain'
                  : currentChapter === 5
                  ? 'Recompensa final: +60,000 Oro y +2,000 Gemas'
                  : currentChapter === 4
                  ? 'Recompensa final: +45,000 Oro, +1,500 Gemas y Lacre Dorado'
                  : currentChapter === 3
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
