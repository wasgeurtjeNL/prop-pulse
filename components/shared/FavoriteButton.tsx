"use client";

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useFavorites } from '@/lib/contexts/FavoritesContext';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  propertyId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'icon' | 'badge'; // 'icon' = circular button, 'badge' = pill-shaped badge
}

export default function FavoriteButton({ 
  propertyId, 
  className = '',
  size = 'md',
  showLabel = false,
  variant = 'icon'
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, isLoading } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);
  
  const favorite = isFavorite(propertyId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsAnimating(true);
    await toggleFavorite(propertyId);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Badge variant - matches the property detail badges style
  if (variant === 'badge') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition-all duration-200',
          favorite 
            ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60' 
            : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400',
          isAnimating && 'scale-105',
          className
        )}
        aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
        title={favorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Icon 
          icon={favorite ? "ph:heart-fill" : "ph:heart-bold"}
          className={cn(
            'w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200',
            isAnimating && 'scale-125'
          )}
        />
        <span>{favorite ? 'Saved' : 'Save'}</span>
      </button>
    );
  }

  // Icon variant (default) - circular button for property cards
  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'relative flex items-center justify-center rounded-full transition-all duration-200',
        'bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm',
        'hover:bg-white dark:hover:bg-slate-700',
        'shadow-md hover:shadow-lg',
        'border border-slate-200/50 dark:border-slate-700/50',
        'group',
        sizeClasses[size],
        isAnimating && 'scale-110',
        className
      )}
      aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
      title={favorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {/* Background heart (always visible, outline) */}
      <Icon 
        icon="ph:heart-bold"
        className={cn(
          'absolute transition-all duration-200',
          iconSizes[size],
          favorite 
            ? 'text-red-500 opacity-0' 
            : 'text-slate-400 group-hover:text-red-400'
        )}
      />
      
      {/* Filled heart (only when favorited) */}
      <Icon 
        icon="ph:heart-fill"
        className={cn(
          'absolute transition-all duration-200',
          iconSizes[size],
          favorite 
            ? 'text-red-500 opacity-100 scale-100' 
            : 'text-red-500 opacity-0 scale-50',
          isAnimating && favorite && 'animate-pulse'
        )}
      />
      
      {/* Animated burst effect when favoriting */}
      {isAnimating && favorite && (
        <span className="absolute inset-0 rounded-full animate-ping bg-red-400/30" />
      )}
      
      {showLabel && (
        <span className={cn(
          'ml-2 text-sm font-medium transition-colors',
          favorite ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'
        )}>
          {favorite ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  );
}
