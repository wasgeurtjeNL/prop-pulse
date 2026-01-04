"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, Target, UserCheck } from "lucide-react";

export function AnalyticsTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "analytics";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`/dashboard/analytics?${params.toString()}`);
  };

  const tabs = [
    { 
      value: "analytics", 
      label: "Overview", 
      icon: BarChart3 
    },
    { 
      value: "traffic", 
      label: "Traffic Sources", 
      icon: Target 
    },
    { 
      value: "leads", 
      label: "Leads", 
      icon: UserCheck 
    },
    { 
      value: "visitors", 
      label: "Live Visitors", 
      icon: Users 
    },
  ];

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full max-w-2xl grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger 
              key={tab.value}
              value={tab.value} 
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}







