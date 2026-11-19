import tomeOmegaIcespearImg from '../assets/images/tome_omega_icespear_cartoony_1794928529416.jpg';
import tomeBoletariaImg from '../assets/images/tome_boletaria_cartoony_1794928908362.jpg';
import tomeSealedGrimoireImg from '../assets/images/tome_sealed_cartoony_1794928529931.jpg';

export interface QuestTomeEntry {
  id: string;
  shelfIndex: 1 | 2 | 3;
  tomeNumber: string;
  arcType: string;
  title: string;
  synopsis: string;
  chaptersCount: number;
  missionIds: string[];
  coverImage: string;
  unlocked: boolean;
}

export const OMEGA_ICESPEAR_MISSION_IDS: string[] = [
  // Capítulo I: Icespear
  'm1_tirano',
  'm2_robo',
  'm3_bosque',
  'm4_puertas_selladas',
  // Capítulo II: Las Minas de Glimmerstone
  'm5_minas_historia',
  'm3_cuevas_rojo',
  'm4_cuevas_azul',
  'm5_cuevas_zancudo',
  'm6_puerta_laberinto',
  'm7_epilogo_aldea',
  // Capítulo III: El Mercado Negro
  'm8_intro_capitulo3',
  'm9_emboscada_ferton',
  'm10_hobgoblin_boss',
  'm10b_encuentro_chispo',
  'm10c_callejon_hoggoblins',
  'm10d_mansion_baron',
  'm10e_taberna_duergar',
  // Capítulo IV: Mansión Ferton
  'm11_llegada_mansion_ferton',
  'm12_recibidor_mansion_ferton',
  'm13_escaleras_durnik',
  'm14_planta_intermedia_ferton',
  'm15_despacho_ferton',
  'm16_audiencia_baron',
  // Capítulo V: El Reino de los Sueños
  'm17_despertar_suenos',
  'm18_primera_camara_gorgon',
  'm19_segunda_camara_aire',
  'm20_tercera_camara_bulezau',
  'm21_coliseo_suenos',
  // Capítulo VI: Sangre y Hielo
  'm21b_casa_gabriel',
  'm21c_forzar_puerta',
  'm21d_verdad_gabriel',
  'm22_cryovain_final',
];

export const BOLETARIA_MISSION_IDS: string[] = [
  't2_c1_m1_trincheras_nomuertos',
  't2_c1_m2_jauria_salas',
  't2_c1_m3_custodios_anillo',
  't2_c1_m4_arana_acorazada',
  't2_c1_m5_carreta_cid',
  't2_c2_m1_ten_piedad',
];

export const QUEST_TOMES: QuestTomeEntry[] = [
  {
    id: 'omega_icespear',
    shelfIndex: 1,
    tomeNumber: 'Tomo I',
    arcType: 'Historia Principal',
    title: 'El Resurgir del Consejo Omega: Icespear',
    synopsis:
      'El Dragón Blanco Cryovain azota el norte. Desde las calles nevadas de Icespear hasta Glimmerstone y el Reino de los Sueños, una oscura conspiración mueve los hilos.',
    chaptersCount: 6,
    missionIds: OMEGA_ICESPEAR_MISSION_IDS,
    coverImage: tomeOmegaIcespearImg,
    unlocked: true,
  },
  {
    id: 'training_bastion',
    shelfIndex: 1,
    tomeNumber: 'Tomo de Recursos',
    arcType: 'Entrenamiento',
    title: 'Bastión de Entrenamiento',
    synopsis: 'Pruebas repetibles para obtener oro y botellas de experiencia, con tres niveles de desafío.',
    chaptersCount: 1,
    missionIds: [],
    coverImage: tomeSealedGrimoireImg,
    unlocked: true,
  },
  {
    id: 'tome_2_boletaria',
    shelfIndex: 2,
    tomeNumber: 'Tomo II',
    arcType: 'Historia Principal',
    title: 'Barracón, Santuario y Boletaria',
    synopsis:
      'Una nueva crónica más allá de las tierras heladas: desde un barracón abandonado hasta un santuario olvidado y las murallas de Boletaria.',
    chaptersCount: 2,
    missionIds: BOLETARIA_MISSION_IDS,
    coverImage: tomeBoletariaImg,
    unlocked: true,
  },
  {
    id: 'upcoming_side_1',
    shelfIndex: 3,
    tomeNumber: 'Trama I',
    arcType: 'Trama Paralela',
    title: 'Relatos del Gremio',
    synopsis: 'Aventuras independientes centradas en los orígenes y pactos de Caldo de Dragón.',
    chaptersCount: 0,
    missionIds: [],
    coverImage: tomeSealedGrimoireImg,
    unlocked: false,
  },
  {
    id: 'upcoming_side_2',
    shelfIndex: 3,
    tomeNumber: 'Trama II',
    arcType: 'Trama Oculta',
    title: 'Ecos del Underdark',
    synopsis: 'Expediciones subterráneas y conflictos olvidados bajo las montañas.',
    chaptersCount: 0,
    missionIds: [],
    coverImage: tomeSealedGrimoireImg,
    unlocked: false,
  },
];
