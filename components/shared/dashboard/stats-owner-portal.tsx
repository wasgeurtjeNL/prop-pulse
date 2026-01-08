"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Clock,
  Home,
  Mail,
  AlertTriangle,
  TrendingUp,
  LogIn,
} from "lucide-react";
import Link from "next/link";

interface OwnerPortalStats {
  pendingPriceRequests: number;
  totalOwnerAccounts: number;
  todayLogins: number;
  recentStatusChanges: number;
  activeInvites: number;
}

interface RecentSoldRented {
  id: string;
  propertyId: string;
  newStatus: string;
  createdAt: string;
  property?: {
    id: string;
    title: string;
    listingNumber: string | null;
    price: string;
  };
}

export function StatsOwnerPortal() {
  const [stats, setStats] = useState<OwnerPortalStats | null>(null);
  const [recentSoldRented, setRecentSoldRented] = useState<RecentSoldRented[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/owner-portal/stats");
      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
        setRecentSoldRented(data.recentSoldRented || []);
      }
    } catch (error) {
      console.error("Failed to fetch owner portal stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="py-6">
              <div className="h-12 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {/* Pending Price Requests - With Alert */}
        <Card className={stats.pendingPriceRequests > 0 ? "border-yellow-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Prijs Aanvragen
            </CardTitle>
            {stats.pendingPriceRequests > 0 ? (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPriceRequests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingPriceRequests > 0
                ? "Wachtend op goedkeuring"
                : "Geen openstaande aanvragen"}
            </p>
          </CardContent>
        </Card>

        {/* Total Owner Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Eigenaar Accounts
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOwnerAccounts}</div>
            <p className="text-xs text-muted-foreground">Actieve eigenaren</p>
          </CardContent>
        </Card>

        {/* Today's Logins */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Logins Vandaag
            </CardTitle>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayLogins}</div>
            <p className="text-xs text-muted-foreground">Eigenaar logins</p>
          </CardContent>
        </Card>

        {/* Recent Status Changes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Status Wijzigingen
            </CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentStatusChanges}</div>
            <p className="text-xs text-muted-foreground">Afgelopen 7 dagen</p>
          </CardContent>
        </Card>

        {/* Active Invites */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Actieve Uitnodigingen
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeInvites}</div>
            <p className="text-xs text-muted-foreground">Wachtend op gebruik</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sold/Rented */}
      {recentSoldRented.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recent Verkocht/Verhuurd door Eigenaren
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentSoldRented.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        item.newStatus === "SOLD"
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }
                    >
                      {item.newStatus === "SOLD" ? "Verkocht" : "Verhuurd"}
                    </Badge>
                    <div>
                      <span className="font-medium">
                        {item.property?.listingNumber || "N/A"}
                      </span>
                      <span className="text-muted-foreground mx-2">-</span>
                      <span className="text-sm text-muted-foreground">
                        {item.property?.title || "Unknown"}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {item.property?.price}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
