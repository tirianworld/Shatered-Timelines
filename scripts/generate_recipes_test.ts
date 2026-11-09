import fs from 'fs';
import path from 'path';

// All 7 categories
const CATEGORIES = [
  'carnes',
  'verduras',
  'harinas',
  'lacteos',
  'especias',
  'pescados',
  'monstruos',
] as const;

type IngredientCategory = typeof CATEGORIES[number];

interface RecipeDef {
  id: string;
  name: string;
  icon: string;
  rarity: 'R' | 'SR' | 'SSR' | 'UR';
  buffBadge: string;
  buffDescription: string;
  lore: string;
  requiredCategories: [IngredientCategory, IngredientCategory, IngredientCategory];
  specificIngredientIds?: string[];
  shelfItemId: string;
}

// Generate all 84 combinations
const allCombinations: [IngredientCategory, IngredientCategory, IngredientCategory][] = [];
for (let i = 0; i < CATEGORIES.length; i++) {
  for (let j = i; j < CATEGORIES.length; j++) {
    for (let k = j; k < CATEGORIES.length; k++) {
      allCombinations.push([CATEGORIES[i], CATEGORIES[j], CATEGORIES[k]]);
    }
  }
}

console.log('Total combinations generated:', allCombinations.length);
