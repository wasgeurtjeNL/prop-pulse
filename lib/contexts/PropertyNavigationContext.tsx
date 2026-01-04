"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';

// Interface for navigation state stored in sessionStorage
export interface PropertyNavigationState {
  filterQueryString: string;  // e.g., "?type=FOR_SALE&amenities=wifi"
  propertyList: Array<{
    slug: string;
    provinceSlug: string;
    areaSlug: string;
  }>;
  currentIndex: number;
  totalCount: number;
}

interface PropertyNavigationContextType {
  // Save navigation state when clicking a property from the list
  saveNavigationState: (
    filterQueryString: string,
    propertyList: Array<{ slug: string; provinceSlug: string; areaSlug: string }>,
    clickedIndex: number
  ) => void;
  // Get current navigation state
  getNavigationState: () => PropertyNavigationState | null;
  // Update current index when navigating
  updateCurrentIndex: (newIndex: number) => void;
  // Clear navigation state
  clearNavigationState: () => void;
  // Check if we have valid navigation context
  hasNavigationContext: boolean;
}

const STORAGE_KEY = 'propertyNavigation';

const PropertyNavigationContext = createContext<PropertyNavigationContextType | null>(null);

export function PropertyNavigationProvider({ children }: { children: React.ReactNode }) {
  const [hasNavigationContext, setHasNavigationContext] = useState(false);

  // Check if we have navigation context on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    setHasNavigationContext(!!stored);
  }, []);

  const saveNavigationState = useCallback((
    filterQueryString: string,
    propertyList: Array<{ slug: string; provinceSlug: string; areaSlug: string }>,
    clickedIndex: number
  ) => {
    const state: PropertyNavigationState = {
      filterQueryString,
      propertyList,
      currentIndex: clickedIndex,
      totalCount: propertyList.length,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setHasNavigationContext(true);
  }, []);

  const getNavigationState = useCallback((): PropertyNavigationState | null => {
    if (typeof window === 'undefined') return null;
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }, []);

  const updateCurrentIndex = useCallback((newIndex: number) => {
    const state = getNavigationState();
    if (state) {
      state.currentIndex = newIndex;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [getNavigationState]);

  const clearNavigationState = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setHasNavigationContext(false);
  }, []);

  return (
    <PropertyNavigationContext.Provider
      value={{
        saveNavigationState,
        getNavigationState,
        updateCurrentIndex,
        clearNavigationState,
        hasNavigationContext,
      }}
    >
      {children}
    </PropertyNavigationContext.Provider>
  );
}

export function usePropertyNavigation() {
  const context = useContext(PropertyNavigationContext);
  if (!context) {
    throw new Error('usePropertyNavigation must be used within PropertyNavigationProvider');
  }
  return context;
}

// Helper hook for property detail page - gets prev/next info
export function usePropertyNavigationInfo(currentSlug: string) {
  const [navInfo, setNavInfo] = useState<{
    hasContext: boolean;
    filterQueryString: string;
    currentIndex: number;
    totalCount: number;
    prevProperty: { slug: string; provinceSlug: string; areaSlug: string } | null;
    nextProperty: { slug: string; provinceSlug: string; areaSlug: string } | null;
  } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setNavInfo(null);
      return;
    }

    try {
      const state: PropertyNavigationState = JSON.parse(stored);
      
      // Find current property in the list
      let currentIndex = state.propertyList.findIndex(p => p.slug === currentSlug);
      
      // If not found, use stored index
      if (currentIndex === -1) {
        currentIndex = state.currentIndex;
      } else {
        // Update stored index if we found the property
        state.currentIndex = currentIndex;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }

      const prevProperty = currentIndex > 0 ? state.propertyList[currentIndex - 1] : null;
      const nextProperty = currentIndex < state.propertyList.length - 1 ? state.propertyList[currentIndex + 1] : null;

      setNavInfo({
        hasContext: true,
        filterQueryString: state.filterQueryString,
        currentIndex,
        totalCount: state.totalCount,
        prevProperty,
        nextProperty,
      });
    } catch {
      setNavInfo(null);
    }
  }, [currentSlug]);

  return navInfo;
}
