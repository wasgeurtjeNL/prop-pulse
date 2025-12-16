'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RequestDetailsTab from './RequestDetailsTab';
import ScheduleViewingTab from './ScheduleViewingTab';
import { toast } from 'sonner';

interface PropertyRequestTabsProps {
  propertyId: string;
  propertyTitle: string;
  propertySlug: string;
  phoneNumber?: string;
}

export default function PropertyRequestTabs({ 
  propertyId, 
  propertyTitle, 
  propertySlug,
  phoneNumber = '+66 (0) 9 862 61646'
}: PropertyRequestTabsProps) {
  const [activeTab, setActiveTab] = useState('schedule-viewing');

  const handleViewingRequest = async (data: { 
    type: 'viewing'; 
    date: Date; 
    contactInfo: { name: string; email: string; phone: string } 
  }) => {
    try {
      const response = await fetch('/api/viewing-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          requestType: 'SCHEDULE_VIEWING',
          viewingDate: data.date.toISOString(),
          name: data.contactInfo.name,
          email: data.contactInfo.email,
          phone: data.contactInfo.phone,
          countryCode: '+66',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to submit viewing request');
      }

      const result = await response.json();
      
      toast.success('Viewing request submitted successfully!', {
        description: `We will contact you at ${data.contactInfo.email} to confirm your viewing.`,
      });
      
      // Optionally switch to the form tab or show a success message
    } catch (error) {
      console.error('Error submitting viewing request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit viewing request';
      toast.error('Failed to submit viewing request', {
        description: errorMessage,
      });
    }
  };

  const handleOfferRequest = async (data: any) => {
    try {
      const response = await fetch('/api/viewing-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          requestType: 'MAKE_OFFER',
          name: data.name,
          email: data.email,
          phone: data.phone,
          language: data.language,
          message: data.message,
          offerAmount: data.offerAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to submit offer request');
      }

      const result = await response.json();
      
      toast.success('Offer request submitted successfully!', {
        description: 'We will review your request and get back to you soon.',
      });
      
      // Optionally reset form or show a success message
    } catch (error) {
      console.error('Error submitting offer request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit offer request';
      toast.error('Failed to submit offer request', {
        description: errorMessage,
      });
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 rounded-none bg-gray-100 h-auto p-0">
          <TabsTrigger 
            value="request-details" 
            className="rounded-none py-4 sm:py-5 text-sm sm:text-base font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-500 transition-all duration-200"
          >
            Request Details
          </TabsTrigger>
          <TabsTrigger 
            value="schedule-viewing"
            className="rounded-none py-4 sm:py-5 text-sm sm:text-base font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=inactive]:text-gray-500 transition-all duration-200"
          >
            Schedule Viewing
          </TabsTrigger>
        </TabsList>

        <div className="px-4 sm:px-6 md:px-8">
          <TabsContent value="schedule-viewing" className="mt-0">
            <RequestDetailsTab 
              propertyTitle={propertyTitle}
              phoneNumber={phoneNumber}
              onSubmit={handleViewingRequest}
              onMakeOfferClick={() => setActiveTab('request-details')}
            />
          </TabsContent>

          <TabsContent value="request-details" className="mt-0">
            <ScheduleViewingTab 
              propertyTitle={propertyTitle}
              propertySlug={propertySlug}
              phoneNumber={phoneNumber}
              onSubmit={handleOfferRequest}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

