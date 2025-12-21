'use client';

import { Icon } from '@iconify/react';

interface ContactButtonsProps {
  phoneNumber?: string;
  propertyTitle?: string;
}

export default function ContactButtons({ 
  phoneNumber = '+66 (0)98 626 1646',
  propertyTitle = 'this property'
}: ContactButtonsProps) {
  
  const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
  const whatsappMessage = encodeURIComponent(`Hello, I'm interested in ${propertyTitle}. Please send me more details.`);
  
  return (
    <div className="w-full space-y-3">
      {/* Phone */}
      <a
        href={`tel:${cleanPhone}`}
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 sm:py-4 rounded-lg sm:rounded-xl border-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium"
      >
        <Icon icon="ph:phone-fill" className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="text-sm sm:text-base">{phoneNumber}</span>
      </a>

      {/* WhatsApp */}
      <a
        href={`https://wa.me/${cleanPhone}?text=${whatsappMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-200 text-gray-700 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all duration-200 font-medium"
      >
        <Icon icon="ic:baseline-whatsapp" className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
        <span className="text-sm sm:text-base">Contact with WhatsApp</span>
      </a>

      {/* Line */}
      <a
        href={`https://line.me/ti/p/${cleanPhone}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-200 text-gray-700 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all duration-200 font-medium"
      >
        <Icon icon="bi:line" className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
        <span className="text-sm sm:text-base">Contact with Line</span>
      </a>

      {/* Messenger */}
      <a
        href={`https://m.me/psmphuketestate`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 sm:py-4 rounded-lg sm:rounded-xl border-2 border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium"
      >
        <Icon icon="ic:baseline-facebook" className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
        <span className="text-sm sm:text-base">Contact with Messenger</span>
      </a>
    </div>
  );
}







