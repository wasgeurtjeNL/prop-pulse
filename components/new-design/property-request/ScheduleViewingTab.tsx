'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Icon } from '@iconify/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ContactButtons from './ContactButtons';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(8, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email address'),
  offerAmount: z.string().min(1, 'Please enter your offer amount'),
  language: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type FormData = z.infer<typeof formSchema>;

interface ScheduleViewingTabProps {
  propertyTitle: string;
  propertySlug: string;
  phoneNumber?: string;
  onSubmit: (data: FormData & { type: 'offer'; offerAmount: string }) => Promise<void>;
}

export default function ScheduleViewingTab({ 
  propertyTitle, 
  propertySlug,
  phoneNumber,
  onSubmit 
}: ScheduleViewingTabProps) {
  const [phone, setPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: `I am interested in buying this house at ${propertyTitle}. Please send me more details.`,
    },
  });

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({ ...data, type: 'offer' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6 py-4 sm:py-6">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 sm:space-y-5">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="sr-only">Name</Label>
          <div className="relative">
            <Icon icon="ph:user" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="name"
              placeholder="Name"
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
          <Label htmlFor="phone" className="sr-only">Phone</Label>
          <div className="relative flex items-center gap-2 border-2 border-gray-200 rounded-lg sm:rounded-xl h-12 sm:h-14 px-3 focus-within:border-blue-500">
            <div className="flex items-center gap-2 min-w-[80px]">
              <span className="text-2xl">🇹🇭</span>
              <span className="text-base font-medium text-gray-700">+66</span>
            </div>
            <Input
              id="phone"
              type="tel"
              placeholder="Phone"
              className="flex-1 h-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
              {...register('phone')}
              onChange={(e) => {
                setValue('phone', e.target.value);
                setPhone(e.target.value);
              }}
            />
          </div>
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="sr-only">Email</Label>
          <div className="relative">
            <Icon icon="ph:envelope" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="Email"
              className="pl-12 h-12 sm:h-14 text-base rounded-lg sm:rounded-xl border-2 border-gray-200 focus:border-blue-500"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Offer Amount */}
        <div className="space-y-2">
          <Label htmlFor="offerAmount" className="text-sm sm:text-base font-medium text-gray-700">
            Your Offer Amount (THB)
          </Label>
          <div className="relative">
            <Icon icon="ph:currency-circle-dollar" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="offerAmount"
              type="text"
              placeholder="e.g. 15,500,000"
              className="pl-12 h-12 sm:h-14 text-base rounded-lg sm:rounded-xl border-2 border-gray-200 focus:border-blue-500"
              {...register('offerAmount')}
            />
          </div>
          {errors.offerAmount && (
            <p className="text-sm text-red-500">{errors.offerAmount.message}</p>
          )}
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label htmlFor="language" className="text-sm sm:text-base font-medium text-gray-700">
            What is your preferred Language?
          </Label>
          <div className="relative">
            <Icon icon="ph:globe" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <Select onValueChange={(value) => setValue('language', value)}>
              <SelectTrigger className="pl-12 h-12 sm:h-14 text-base rounded-lg sm:rounded-xl border-2 border-gray-200">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="thai">ไทย (Thai)</SelectItem>
                <SelectItem value="chinese">中文 (Chinese)</SelectItem>
                <SelectItem value="russian">Русский (Russian)</SelectItem>
                <SelectItem value="dutch">Nederlands (Dutch)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {errors.language && (
            <p className="text-sm text-red-500">{errors.language.message}</p>
          )}
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message" className="sr-only">Message</Label>
          <Textarea
            id="message"
            placeholder="Your message..."
            rows={5}
            className="text-base rounded-lg sm:rounded-xl border-2 border-gray-200 focus:border-blue-500 resize-none"
            {...register('message')}
          />
          {errors.message && (
            <p className="text-sm text-red-500">{errors.message.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            w-full py-4 sm:py-5 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg uppercase tracking-wider
            transition-all duration-200 shadow-md hover:shadow-lg
            ${isSubmitting
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer'
            }
          `}
        >
          {isSubmitting ? 'Sending...' : 'Send Now'}
        </button>
      </form>

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

      {/* Contact Buttons */}
      <ContactButtons 
        phoneNumber={phoneNumber}
        propertyTitle={propertyTitle}
      />
    </div>
  );
}







