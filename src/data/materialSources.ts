/**
 * De dónde salen los materiales de fabricación y cocina.
 * Se usa al pulsar un material que falta, para decir al jugador dónde conseguirlo.
 */
export interface MaterialSource {
  /** Nombre corto del sitio. */
  title: string;
  /** Qué hacer exactamente. */
  detail: string;
  /** Pestaña a la que lleva el botón "Ir". */
  tab?: string;
  /** Etiqueta del botón, por defecto "Ir". */
  action?: string;
}

const MINERALS = ['cobre', 'plata', 'oro', 'gema', 'mineral', 'veta'];
const SMITHY = ['lingote', 'hierro', 'acero', 'mango', 'hilt', 'kit', 'yunque', 'forja', 'esquirla', 'escama', 'nucleo', 'núcleo'];
const COOKING_HINTS = ['carne', 'verdura', 'harina', 'lacteo', 'lácteo', 'especia', 'pescado', 'monstruo', 'tomate', 'queso', 'huevo', 'leche', 'pan', 'sal', 'ajo', 'cebolla', 'patata', 'pimienta', 'miel', 'trigo'];

const DEFAULT_SOURCES: MaterialSource[] = [
  { title: 'Misiones de la historia', detail: 'Los cofres y enemigos de las misiones sueltan materiales.', tab: 'quest', action: 'Misiones' },
  { title: 'Patrullas', detail: 'Envía héroes a patrullar y recoge lo que traigan.', tab: 'patrol', action: 'Patrullas' },
  { title: 'Tienda de Icespear', detail: 'Algunos materiales se compran directamente con oro.', tab: 'shop', action: 'Tienda' },
];

const COOKING_SOURCES: MaterialSource[] = [
  { title: 'Despensa del Fogón', detail: 'Compra el ingrediente con oro en la despensa de la taberna.', tab: 'tavern', action: 'Despensa' },
  { title: 'Raciones gratis', detail: 'El fogón reparte raciones diarias si vuelves a la taberna.', tab: 'tavern', action: 'Taberna' },
  { title: 'Cofres y misiones', detail: 'Algunos ingredientes caen en cofres de misión y patrullas.', tab: 'quest', action: 'Misiones' },
];

const MINERAL_SOURCES: MaterialSource[] = [
  { title: 'Patrullas de Silverpeack', detail: 'Las galerías de la mina pagan cobre, plata, oro y gemas al reclamar.', tab: 'patrol', action: 'Patrullas' },
  { title: 'Laberinto de Lloth', detail: 'Cada cofre y combate del laberinto suelta minerales y gemas.', tab: 'labyrinth', action: 'Laberinto' },
  { title: 'Cofres de combate', detail: 'Los cofres de las misiones también sueltan vetas.', tab: 'quest', action: 'Misiones' },
];

const SMITHY_SOURCES: MaterialSource[] = [
  { title: 'Tienda de Icespear', detail: 'Lingotes, mangos y kits de herrería se compran con oro.', tab: 'shop', action: 'Tienda' },
  { title: 'Patrullas', detail: 'Las expediciones de Icespear devuelven hierro y materiales de forja.', tab: 'patrol', action: 'Patrullas' },
  { title: 'Misiones de la historia', detail: 'Los enemigos acorazados dejan lingotes y piezas.', tab: 'quest', action: 'Misiones' },
];

/** Devuelve las fuentes conocidas para un material, con un respaldo genérico. */
export const getMaterialSources = (name: string, icon?: string): MaterialSource[] => {
  const key = `${name} ${icon ?? ''}`.toLowerCase();

  if (COOKING_HINTS.some((w) => key.includes(w))) return COOKING_SOURCES;
  if (MINERALS.some((w) => key.includes(w))) return MINERAL_SOURCES;
  if (SMITHY.some((w) => key.includes(w))) return SMITHY_SOURCES;
  return DEFAULT_SOURCES;
};

/** Nombres legibles para los iconos de materiales que solo traen imagen. */
const ICON_NAMES: Record<string, string> = {
  'lingote_app.png': 'Lingote de Hierro',
  'LINGOTE ACERO.png': 'Lingote de Acero',
  'lingote cobre app.png': 'Mineral de Cobre',
  'lingote plata app.png': 'Mineral de Plata',
  'lingote oro  app.png': 'Mineral de Oro',
  'lingote_de_plata.png': 'Lingote de Plata',
  'arcano gema app.png': 'Gema Primigenia',
  'amatista app.png': 'Gema Azul',
  'gema.png': 'Gema Común',
  'kit de herreria app.png': 'Kit de Herrería',
  'mango_de_espada_ITEM_80f48554.png': 'Mango de Espada',
};

/** Devuelve un nombre presentable a partir del icono de un material. */
export const materialDisplayName = (icon: string, fallback = 'Material'): string => {
  const file = (icon || '').split('/').pop() ?? '';
  if (ICON_NAMES[file]) return ICON_NAMES[file];
  const pretty = file
    .replace(/\.(png|webp|jpg)$/i, '')
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return pretty ? pretty.charAt(0).toUpperCase() + pretty.slice(1) : fallback;
};
