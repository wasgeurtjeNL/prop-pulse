'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { authClient } from '@/lib/auth-client';

interface AdminEditButtonProps {
  /** The type of content being edited */
  editType: 'page' | 'blog' | 'property';
  /** The ID of the content (for pages/blogs) or slug (for properties) */
  editId?: string;
  /** The URL of the landing page (for pages) */
  pageUrl?: string;
  /** Custom className for positioning */
  className?: string;
}

/**
 * A floating edit button that appears for logged-in admins/agents
 * Provides quick access to edit the current page in the dashboard
 */
export default function AdminEditButton({ 
  editType, 
  editId, 
  pageUrl,
  className = '' 
}: AdminEditButtonProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        const role = session?.data?.user?.role;
        // Check if user has admin or agent role
        setIsAdmin(role === 'admin' || role === 'AGENT');
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Don't render anything if not admin or still loading
  if (isLoading || !isAdmin) return null;

  // Determine the edit URL based on type
  const getEditUrl = () => {
    switch (editType) {
      case 'page':
        // For landing pages, we need the page ID
        if (editId) {
          return `/dashboard/pages/edit/${editId}`;
        }
        // Fallback to pages list if no ID
        return '/dashboard/pages';
      case 'blog':
        if (editId) {
          return `/dashboard/blogs/edit/${editId}`;
        }
        return '/dashboard/blogs';
      case 'property':
        if (editId) {
          return `/dashboard/edit/${editId}`;
        }
        return '/dashboard';
      default:
        return '/dashboard';
    }
  };

  const getDashboardUrl = () => {
    switch (editType) {
      case 'page':
        return '/dashboard/pages';
      case 'blog':
        return '/dashboard/blogs';
      case 'property':
        return '/dashboard';
      default:
        return '/dashboard';
    }
  };

  const getLabel = () => {
    switch (editType) {
      case 'page':
        return 'Edit Page';
      case 'blog':
        return 'Edit Blog';
      case 'property':
        return 'Edit Property';
      default:
        return 'Edit';
    }
  };

  return (
    <div 
      className={`fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-2 ${className}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Secondary actions - show when expanded */}
      <div className={`flex flex-col-reverse gap-2 transition-all duration-300 ${
        isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {/* Go to Dashboard */}
        <Link
          href={getDashboardUrl()}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-full shadow-lg transition-all"
        >
          <Icon icon="ph:layout-duotone" className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Main Edit Button */}
      <Link
        href={getEditUrl()}
        className="group flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-full shadow-xl shadow-primary/30 transition-all hover:shadow-primary/50 hover:scale-105"
      >
        <Icon icon="ph:pencil-simple-duotone" className="w-5 h-5" />
        <span>{getLabel()}</span>
        <Icon 
          icon="ph:arrow-right" 
          className="w-4 h-4 transition-transform group-hover:translate-x-1" 
        />
      </Link>
    </div>
  );
}



