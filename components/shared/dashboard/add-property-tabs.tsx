"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Download } from "lucide-react";

export function AddPropertyTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "add";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`/dashboard/add?${params.toString()}`);
  };

  const tabs = [
    { 
      value: "add", 
      label: "Add Manually", 
      icon: PlusCircle 
    },
    { 
      value: "import", 
      label: "Import Property", 
      icon: Download 
    },
  ];

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger 
              key={tab.value}
              value={tab.value} 
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}


