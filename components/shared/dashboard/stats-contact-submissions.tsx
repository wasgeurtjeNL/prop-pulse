"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@iconify/react";

interface Stats {
  total: number;
  new: number;
  contacted: number;
  inProgress: number;
  resolved: number;
}

export default function StatsContactSubmissions() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    new: 0,
    contacted: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/contact");
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          const submissions = data.data;
          setStats({
            total: submissions.length,
            new: submissions.filter((s: { status: string }) => s.status === "NEW").length,
            contacted: submissions.filter((s: { status: string }) => s.status === "CONTACTED").length,
            inProgress: submissions.filter((s: { status: string }) => s.status === "IN_PROGRESS").length,
            resolved: submissions.filter((s: { status: string }) => s.status === "RESOLVED").length,
          });
        }
      } catch (error) {
        console.error("Failed to fetch contact stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Submissions",
      value: stats.total,
      icon: "lucide:mail",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "New",
      value: stats.new,
      icon: "lucide:inbox",
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    },
    {
      title: "Contacted",
      value: stats.contacted,
      icon: "lucide:phone-outgoing",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      icon: "lucide:clock",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    },
    {
      title: "Resolved",
      value: stats.resolved,
      icon: "lucide:check-circle",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <Icon icon={stat.icon} className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Icon icon="lucide:loader-2" className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                stat.value
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
