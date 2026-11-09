import React from 'react';
import { CookingIngredient } from '../data/cookingData';

interface CookingIngredientIconProps {
  ingredient: CookingIngredient;
  className?: string;
}

export const CookingIngredientIcon: React.FC<CookingIngredientIconProps> = ({
  ingredient,
  className = 'w-10 h-10',
}) => {
  if (ingredient.icon && ingredient.icon.trim() !== '') {
    return (
      <img
        src={ingredient.icon}
        alt={ingredient.name}
        className={`${className} object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]`}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`${className} flex items-center justify-center text-xl`}>
      🍲
    </div>
  );
};
