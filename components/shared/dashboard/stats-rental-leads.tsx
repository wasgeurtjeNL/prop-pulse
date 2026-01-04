"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StatsRentalLeads() {
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    viewingScheduled: 0,
    rented: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/rental-lead");
        const data = await response.json();

        if (data.success) {
          const leads = data.data;
          setStats({
            total: leads.length,
            new: leads.filter((l: any) => l.status === "NEW").length,
            viewingScheduled: leads.filter((l: any) => l.status === "VIEWING_SCHEDULED").length,
            rented: leads.filter((l: any) => l.status === "RENTED").length,
          });
        }
      } catch (error) {
        console.error("Failed to fetch rental stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Leads",
      value: stats.total,
      icon: "ph:key-bold",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "New Leads",
      value: stats.new,
      icon: "ph:star-bold",
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    },
    {
      title: "Viewing Scheduled",
      value: stats.viewingScheduled,
      icon: "ph:calendar-check-bold",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "Rented",
      value: stats.rented,
      icon: "ph:check-circle-bold",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`h-8 w-8 rounded-full ${stat.bgColor} flex items-center justify-center`}>
              <Icon icon={stat.icon} className={stat.color} width={20} height={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}











