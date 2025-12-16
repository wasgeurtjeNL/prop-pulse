"use client";

import { useLanguage } from '@/lib/contexts/language-context';
import { Icon } from '@iconify/react';

export default function LanguageToggle() {
  const { language, setLanguage, mounted } = useLanguage();

  // Prevent hydration mismatch - show default state until mounted
  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
          <Icon icon="ph:translate-bold" width={20} height={20} className="sm:w-6 sm:h-6" />
          <span className="text-sm sm:text-base font-semibold uppercase">
            EN
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLanguage(language === 'en' ? 'nl' : 'en')}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
        aria-label="Toggle language"
      >
        <Icon icon="ph:translate-bold" width={20} height={20} className="sm:w-6 sm:h-6" />
        <span className="text-sm sm:text-base font-semibold uppercase">
          {language}
        </span>
      </button>
    </div>
  );
}

