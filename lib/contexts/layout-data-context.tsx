"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NavSubLink {
  label: string;
  href: string;
  description?: string;
  icon?: string;
}

interface NavLink {
  label: string;
  href: string;
  highlight?: boolean;
  icon?: string;
  children?: NavSubLink[];
}

interface FooterLink {
  label: string;
  href: string;
}

interface LayoutData {
  navLinks: NavLink[];
  footerLinks: FooterLink[];
}

interface LayoutDataContextType {
  data: LayoutData | null;
  isLoading: boolean;
}

const LayoutDataContext = createContext<LayoutDataContextType | undefined>(undefined);

// Cache the layout data globally to avoid re-fetching on navigation
let cachedData: LayoutData | null = null;

export function LayoutDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LayoutData | null>(cachedData);
  const [isLoading, setIsLoading] = useState(!cachedData);

  useEffect(() => {
    // If we already have cached data, don't fetch again
    if (cachedData) {
      setData(cachedData);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch('/api/layout-data');
        if (!res.ok) throw new Error('Failed to fetch layout data');
        const result = await res.json();
        cachedData = result;
        setData(result);
      } catch (error) {
        console.error('Error fetching layout data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <LayoutDataContext.Provider value={{ data, isLoading }}>
      {children}
    </LayoutDataContext.Provider>
  );
}

export function useLayoutData() {
  const context = useContext(LayoutDataContext);
  if (context === undefined) {
    throw new Error('useLayoutData must be used within a LayoutDataProvider');
  }
  return context;
}

