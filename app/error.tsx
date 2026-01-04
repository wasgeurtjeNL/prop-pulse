'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-4">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-primary">500</h1>
        <h2 className="text-2xl font-semibold text-dark dark:text-white">
          Something went wrong
        </h2>
        <p className="text-black/60 dark:text-white/60 max-w-md">
          We're sorry, but something unexpected happened. Please try again or contact us if the problem persists.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-primary text-primary rounded-full font-medium hover:bg-primary hover:text-white transition-colors"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

