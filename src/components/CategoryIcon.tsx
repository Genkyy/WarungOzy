import React from 'react';
import { Utensils, Coffee, Package, Zap, Flame, HeartPulse, Sparkles, Layers } from 'lucide-react';

interface CategoryIconProps {
  iconName?: string;
  categoryName?: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, categoryName, className = "w-4 h-4" }) => {
  const iconStr = (iconName || categoryName || '').toLowerCase();

  if (iconStr.includes('makanan') || iconStr === 'utensils' || iconStr.includes('🍜')) {
    return <Utensils className={className} />;
  }
  if (iconStr.includes('minuman') || iconStr === 'coffee' || iconStr.includes('🥤')) {
    return <Coffee className={className} />;
  }
  if (iconStr.includes('sembako') || iconStr.includes('dapur') || iconStr === 'package' || iconStr.includes('🌾')) {
    return <Package className={className} />;
  }
  if (iconStr.includes('kesehatan') || iconStr.includes('perawatan') || iconStr === 'heartpulse' || iconStr.includes('🩺') || iconStr.includes('butan') || iconStr.includes('autan')) {
    return <HeartPulse className={className} />;
  }
  if (iconStr.includes('kebersihan') || iconStr.includes('rumah') || iconStr === 'sparkles' || iconStr.includes('🧼')) {
    return <Sparkles className={className} />;
  }
  if (iconStr.includes('top up') || iconStr.includes('topup') || iconStr.includes('digital') || iconStr === 'zap' || iconStr.includes('⚡')) {
    return <Zap className={className} />;
  }
  if (iconStr.includes('rokok') || iconStr.includes('tembakau') || iconStr === 'flame' || iconStr.includes('🚬')) {
    return <Flame className={className} />;
  }

  return <Layers className={className} />;
};
