"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Eye,
  TrendingUp,
  Users,
  Globe,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";
import { getOwnerPortalTranslations, OwnerPortalLanguage } from "@/lib/i18n/owner-portal-translations";

interface PropertyStatsProps {
  propertyId: string;
  propertyTitle: string;
  lang: OwnerPortalLanguage;
}

interface Stats {
  views: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    chart: { date: string; views: number }[];
    byCountry: { country: string; count: number }[];
  };
  leads: {
    total: number;
    pending: number;
    recent: {
      id: string;
      name: string;
      email: string;
      phone: string;
      status: string;
      requestType: string;
      createdAt: string;
    }[];
  };
}

export default function PropertyStats({ propertyId, propertyTitle, lang }: PropertyStatsProps) {
  const t = getOwnerPortalTranslations(lang);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [propertyId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/owner-portal/properties/${propertyId}/stats`);
      const data = await response.json();

      if (response.ok) {
        setStats(data);
      } else {
        toast.error(data.error || t.failedToLoadStats);
      }
    } catch (error) {
      toast.error(t.failedToLoadStats);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "CONFIRMED":
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case "COMPLETED":
        return <Badge className="bg-blue-500">Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(lang === "nl" ? "nl-NL" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">{t.loadingStats}</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t.failedToLoadStats}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.viewsTotal}</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.views.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {t.viewsToday}: {stats.views.today}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.viewsThisWeek}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.views.thisWeek.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {t.viewsThisMonth}: {stats.views.thisMonth}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.leadsTotal}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leads.total}</div>
            <p className="text-xs text-muted-foreground">
              {t.leadsPending}: {stats.leads.pending}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.viewsByCountry}</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {stats.views.byCountry.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.country}</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
              ))}
              {stats.views.byCountry.length === 0 && (
                <p className="text-xs text-muted-foreground">-</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Views Chart (Simple bar representation) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.viewsChart}</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.views.chart.length > 0 ? (
            <div className="h-32 flex items-end gap-1">
              {stats.views.chart.map((day, idx) => {
                const maxViews = Math.max(...stats.views.chart.map((d) => d.views), 1);
                const height = (day.views / maxViews) * 100;
                return (
                  <div
                    key={idx}
                    className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t relative group"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${day.date}: ${day.views} views`}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {day.views} views
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No view data available</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.recentLeads}</CardTitle>
          <CardDescription>
            {stats.leads.total} total, {stats.leads.pending} pending
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.leads.recent.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.leadName}</TableHead>
                  <TableHead>{t.leadEmail}</TableHead>
                  <TableHead>{t.leadPhone}</TableHead>
                  <TableHead>{t.leadStatus}</TableHead>
                  <TableHead>{t.leadDate}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.leads.recent.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <a href={`mailto:${lead.email}`} className="text-primary hover:underline flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {lead.email}
                      </a>
                    </TableCell>
                    <TableCell>
                      <a href={`tel:${lead.phone}`} className="text-primary hover:underline flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </a>
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(lead.createdAt)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">{t.noLeads}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
