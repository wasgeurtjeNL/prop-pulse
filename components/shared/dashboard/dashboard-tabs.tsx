"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  AlertTriangle, 
  CalendarCheck, 
  Inbox, 
  Calendar, 
  Key, 
  TrendingUp, 
  DollarSign,
  Facebook
} from "lucide-react";

interface DashboardTabsProps {
  missingContactsCount: number;
  pendingBookingsCount?: number;
  pendingSubmissionsCount?: number;
  pendingViewingRequestsCount?: number;
  pendingRentalLeadsCount?: number;
  pendingInvestorLeadsCount?: number;
  pendingFbMarketplaceLeadsCount?: number;
}

export function DashboardTabs({ 
  missingContactsCount, 
  pendingBookingsCount = 0,
  pendingSubmissionsCount = 0,
  pendingViewingRequestsCount = 0,
  pendingRentalLeadsCount = 0,
  pendingInvestorLeadsCount = 0,
  pendingFbMarketplaceLeadsCount = 0,
}: DashboardTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "properties";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    // Reset page when switching tabs
    params.delete("page");
    router.push(`/dashboard?${params.toString()}`);
  };

  const tabs = [
    { 
      value: "properties", 
      label: "Properties", 
      icon: Building2,
      count: 0 
    },
    { 
      value: "submissions", 
      label: "Submissions", 
      icon: Inbox,
      count: pendingSubmissionsCount 
    },
    { 
      value: "viewing-requests", 
      label: "Viewing Requests", 
      icon: Calendar,
      count: pendingViewingRequestsCount 
    },
    { 
      value: "rental-leads", 
      label: "Rental Leads", 
      icon: Key,
      count: pendingRentalLeadsCount 
    },
    { 
      value: "investor-leads", 
      label: "Investor Leads", 
      icon: TrendingUp,
      count: pendingInvestorLeadsCount 
    },
    { 
      value: "fb-marketplace-leads", 
      label: "FB Marketplace", 
      icon: Facebook,
      count: pendingFbMarketplaceLeadsCount 
    },
    { 
      value: "bookings", 
      label: "Rental Bookings", 
      icon: CalendarCheck,
      count: pendingBookingsCount 
    },
    { 
      value: "rental-pricing", 
      label: "Rental Pricing", 
      icon: DollarSign,
      count: 0 
    },
    { 
      value: "missing-contacts", 
      label: "Missing Contacts", 
      icon: AlertTriangle,
      count: missingContactsCount 
    },
  ];

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger 
              key={tab.value}
              value={tab.value} 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-medium text-white ${
                  tab.value === "missing-contacts" ? "bg-amber-500" : "bg-green-500"
                }`}>
                  {tab.count}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
