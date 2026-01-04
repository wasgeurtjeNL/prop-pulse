"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

interface FavoritesContextType {
  favorites: string[]; // Array of property IDs
  isLoading: boolean;
  isFavorite: (propertyId: string) => boolean;
  toggleFavorite: (propertyId: string) => Promise<void>;
  favoritesCount: number;
  // For anonymous users, we use localStorage
  // For logged-in users, we sync with the database
}

const STORAGE_KEY = 'propertyFavorites';

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, isPending: sessionPending } = authClient.useSession();
  
  const userId = session?.user?.id || null;

  // Load favorites when session is ready
  useEffect(() => {
    // Wait for session to be loaded
    if (sessionPending) return;

    const loadFavorites = async () => {
      setIsLoading(true);
      try {
        if (userId) {
          // Load from database for logged-in users
          const res = await fetch('/api/favorites');
          if (res.ok) {
            const data = await res.json();
            setFavorites(data.favorites || []);
          }
        } else {
          // Load from localStorage for anonymous users
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            try {
              setFavorites(JSON.parse(stored));
            } catch {
              setFavorites([]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
        // Fallback to localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            setFavorites(JSON.parse(stored));
          } catch {
            setFavorites([]);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, [userId, sessionPending]);

  // Check if a property is favorited
  const isFavorite = useCallback((propertyId: string) => {
    return favorites.includes(propertyId);
  }, [favorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (propertyId: string) => {
    const isCurrentlyFavorite = favorites.includes(propertyId);
    
    // Optimistic update
    if (isCurrentlyFavorite) {
      setFavorites(prev => prev.filter(id => id !== propertyId));
    } else {
      setFavorites(prev => [...prev, propertyId]);
    }

    try {
      if (userId) {
        // Sync with database for logged-in users
        const res = await fetch('/api/favorites', {
          method: isCurrentlyFavorite ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId }),
        });

        if (!res.ok) {
          // Revert on error
          if (isCurrentlyFavorite) {
            setFavorites(prev => [...prev, propertyId]);
          } else {
            setFavorites(prev => prev.filter(id => id !== propertyId));
          }
        }
      } else {
        // Save to localStorage for anonymous users
        const newFavorites = isCurrentlyFavorite
          ? favorites.filter(id => id !== propertyId)
          : [...favorites, propertyId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert on error
      if (isCurrentlyFavorite) {
        setFavorites(prev => [...prev, propertyId]);
      } else {
        setFavorites(prev => prev.filter(id => id !== propertyId));
      }
    }
  }, [favorites, userId]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isLoading,
        isFavorite,
        toggleFavorite,
        favoritesCount: favorites.length,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}
