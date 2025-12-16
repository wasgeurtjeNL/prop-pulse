'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DateSelector from './DateSelector';
import ContactButtons from './ContactButtons';
import { Icon } from '@iconify/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const viewingFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Please enter a valid phone number'),
});

type ViewingFormData = z.infer<typeof viewingFormSchema>;

interface RequestDetailsTabProps {
  propertyTitle: string;
  phoneNumber?: string;
  onSubmit: (data: { type: 'viewing'; date: Date; contactInfo: ViewingFormData }) => void;
  onMakeOfferClick: () => void;
}

export default function RequestDetailsTab({ 
  propertyTitle, 
  phoneNumber,
  onSubmit,
  onMakeOfferClick
}: RequestDetailsTabProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ViewingFormData>({
    resolver: zodResolver(viewingFormSchema),
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowContactForm(true);
  };

  const handleScheduleViewing = async (formData: ViewingFormData) => {
    if (!selectedDate) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({ type: 'viewing', date: selectedDate, contactInfo: formData });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 py-4 sm:py-6">
      {/* Date Selector */}
      <div className="space-y-3 sm:space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
          Select Your Preferred Viewing Date
        </h3>
        <DateSelector 
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />
      </div>

      {/* Contact Form - Shows after date selection */}
      {showContactForm && selectedDate && (
        <form onSubmit={handleSubmit(handleScheduleViewing)} className="space-y-4 sm:space-y-5">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Your Contact Information
          </h3>
          
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="viewing-name" className="sr-only">Name</Label>
            <div className="relative">
              <Icon icon="ph:user" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="viewing-name"
                placeholder="Your Name"
                className="pl-12 h-12 sm:h-14 text-base rounded-lg sm:rounded-xl border-2 border-gray-200 focus:border-blue-500"
                {...register('name')}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="viewing-phone" className="sr-only">Phone</Label>
            <div className="relative flex items-center gap-2 border-2 border-gray-200 rounded-lg sm:rounded-xl h-12 sm:h-14 px-3 focus-within:border-blue-500">
              <div className="flex items-center gap-2 min-w-[80px]">
                <span className="text-2xl">🇹🇭</span>
                <span className="text-base font-medium text-gray-700">+66</span>
              </div>
              <Input
                id="viewing-phone"
                type="tel"
                placeholder="Phone Number"
                className="flex-1 h-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                {...register('phone')}
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="viewing-email" className="sr-only">Email</Label>
            <div className="relative">
              <Icon icon="ph:envelope" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                id="viewing-email"
                type="email"
                placeholder="Email Address"
                className="pl-12 h-12 sm:h-14 text-base rounded-lg sm:rounded-xl border-2 border-gray-200 focus:border-blue-500"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Schedule Viewing Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              w-full py-4 sm:py-5 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg
              transition-all duration-200 shadow-md hover:shadow-lg
              ${isSubmitting
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white cursor-pointer'
              }
            `}
          >
            {isSubmitting ? 'Submitting...' : 'Confirm Viewing Request'}
          </button>
        </form>
      )}

      {/* Free text */}
      <p className="text-center text-sm sm:text-base text-gray-600">
        no obligations, cancel anytime — it's free.
      </p>

      {/* OR Divider */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-gray-300"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 sm:px-6 text-lg sm:text-xl font-semibold text-gray-400 uppercase tracking-wider">
            OR
          </span>
        </div>
      </div>

      {/* Make an Offer Button */}
      <button
        className="w-full py-4 sm:py-5 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base sm:text-lg transition-all duration-200 shadow-md hover:shadow-lg"
        onClick={onMakeOfferClick}
      >
        Make an Offer
      </button>

      {/* Savings text */}
      <div className="flex items-center justify-center gap-2 text-sm sm:text-base text-gray-600">
        <span>free and non-binding - save up to 25%</span>
        <button className="text-gray-400 hover:text-gray-600">
          <Icon icon="ph:question-fill" className="w-5 h-5" />
        </button>
      </div>

      {/* Links */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 text-sm sm:text-base">
        <button className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
          View previous offers
        </button>
        <span className="text-gray-400">|</span>
        <button className="text-blue-600 hover:text-blue-700 hover:underline font-medium flex items-center gap-1">
          How it works
          <Icon icon="ph:play-circle-fill" className="w-5 h-5 text-red-500" />
        </button>
      </div>

      {/* Contact Buttons */}
      <ContactButtons 
        phoneNumber={phoneNumber}
        propertyTitle={propertyTitle}
      />
    </div>
  );
}

