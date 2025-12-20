'use client';

import { useState } from 'react';
import { addDays, format } from 'date-fns';
import { Icon } from '@iconify/react';

interface DateSelectorProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export default function DateSelector({ onDateSelect, selectedDate }: DateSelectorProps) {
  const [startDate, setStartDate] = useState(new Date());
  
  // Generate 3 dates starting from startDate
  const dates = Array.from({ length: 3 }, (_, i) => addDays(startDate, i));

  const handlePrevious = () => {
    setStartDate(prev => addDays(prev, -3));
  };

  const handleNext = () => {
    setStartDate(prev => addDays(prev, 3));
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center group"
          aria-label="Previous dates"
        >
          <Icon 
            icon="ph:caret-left-bold" 
            className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-blue-500" 
          />
        </button>

        {/* Date Cards */}
        <div className="flex-1 grid grid-cols-3 gap-2 sm:gap-3">
          {dates.map((date, index) => {
            const selected = isSelected(date);
            return (
              <button
                key={index}
                onClick={() => onDateSelect(date)}
                className={`
                  relative flex flex-col items-center justify-center 
                  py-3 sm:py-4 px-2 sm:px-4 rounded-lg sm:rounded-xl 
                  border-2 transition-all duration-200
                  ${selected 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105' 
                    : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700'
                  }
                `}
              >
                <span className={`text-xs sm:text-sm font-medium uppercase tracking-wider ${selected ? 'text-white' : 'text-gray-500'}`}>
                  {format(date, 'EEEE')}
                </span>
                <span className={`text-2xl sm:text-4xl font-bold mt-1 ${selected ? 'text-white' : 'text-gray-900'}`}>
                  {format(date, 'd')}
                </span>
                <span className={`text-xs sm:text-sm font-medium uppercase ${selected ? 'text-white' : 'text-gray-500'}`}>
                  {format(date, 'MMM')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center group"
          aria-label="Next dates"
        >
          <Icon 
            icon="ph:caret-right-bold" 
            className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-blue-500" 
          />
        </button>
      </div>
    </div>
  );
}






