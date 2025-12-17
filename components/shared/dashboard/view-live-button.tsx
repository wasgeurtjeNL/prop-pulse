'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';

interface ViewLiveButtonProps {
  /** The URL of the live page */
  href: string;
  /** Optional variant for the button */
  variant?: 'default' | 'ghost' | 'outline' | 'icon';
  /** Show label or just icon */
  showLabel?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * A button to view the live page from the dashboard
 * Opens in a new tab
 */
export default function ViewLiveButton({ 
  href, 
  variant = 'outline',
  showLabel = true,
  className = '' 
}: ViewLiveButtonProps) {
  if (variant === 'icon') {
    return (
      <Link href={href} target="_blank" rel="noopener noreferrer">
        <Button variant="ghost" size="icon" className={className} title="View Live Page">
          <Icon icon="ph:arrow-square-out" className="h-4 w-4" />
        </Button>
      </Link>
    );
  }

  return (
    <Link href={href} target="_blank" rel="noopener noreferrer">
      <Button variant={variant} size="sm" className={`gap-2 ${className}`}>
        <Icon icon="ph:arrow-square-out" className="h-4 w-4" />
        {showLabel && <span>View Live</span>}
      </Button>
    </Link>
  );
}



