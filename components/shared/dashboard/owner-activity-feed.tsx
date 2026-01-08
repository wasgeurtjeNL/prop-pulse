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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  DollarSign,
  Home,
  LogIn,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Activity,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { nl } from "date-fns/locale";

interface ActivityUser {
  id: string;
  name: string;
  email: string;
}

interface ActivityProperty {
  id: string;
  title: string;
  listingNumber: string | null;
}

interface OwnerActivity {
  id: string;
  userId: string;
  propertyId: string | null;
  action: string;
  description: string | null;
  metadata: any;
  ipAddress: string | null;
  createdAt: string;
  user?: ActivityUser;
  property?: ActivityProperty;
}

export function OwnerActivityFeed() {
  const [activities, setActivities] = useState<OwnerActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [limit, setLimit] = useState("50");

  useEffect(() => {
    fetchActivities();
  }, [actionFilter, limit]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("limit", limit);
      if (actionFilter !== "all") params.set("action", actionFilter);

      const response = await fetch(`/api/owner-portal/activity?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setActivities(data.activities || []);
      } else {
        toast.error(data.error || "Failed to fetch activities");
      }
    } catch (error) {
      toast.error("Failed to fetch activities");
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "PRICE_UPDATE":
      case "PRICE_UPDATE_REQUESTED":
        return <DollarSign className="h-4 w-4 text-blue-500" />;
      case "PRICE_APPROVED":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "PRICE_REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "STATUS_CHANGE":
        return <Home className="h-4 w-4 text-purple-500" />;
      case "LOGIN":
        return <LogIn className="h-4 w-4 text-green-500" />;
      case "VIEW_PROPERTY":
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "PRICE_UPDATE":
        return <Badge className="bg-blue-500">Prijs Gewijzigd</Badge>;
      case "PRICE_UPDATE_REQUESTED":
        return <Badge className="bg-yellow-500">Prijs Aangevraagd</Badge>;
      case "PRICE_APPROVED":
        return <Badge className="bg-green-500">Prijs Goedgekeurd</Badge>;
      case "PRICE_REJECTED":
        return <Badge variant="destructive">Prijs Afgewezen</Badge>;
      case "STATUS_CHANGE":
        return <Badge className="bg-purple-500">Status Gewijzigd</Badge>;
      case "LOGIN":
        return <Badge variant="secondary">Ingelogd</Badge>;
      case "VIEW_PROPERTY":
        return <Badge variant="outline">Bekeken</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <h3 className="font-semibold">Eigenaar Activiteit</h3>
        <div className="flex gap-2">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter actie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Acties</SelectItem>
              <SelectItem value="PRICE_UPDATE">Prijs Wijzigingen</SelectItem>
              <SelectItem value="PRICE_UPDATE_REQUESTED">Prijs Aanvragen</SelectItem>
              <SelectItem value="PRICE_APPROVED">Goedgekeurde Prijzen</SelectItem>
              <SelectItem value="STATUS_CHANGE">Status Wijzigingen</SelectItem>
              <SelectItem value="LOGIN">Logins</SelectItem>
            </SelectContent>
          </Select>
          <Select value={limit} onValueChange={setLimit}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Limiet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Activity Feed */}
      {activities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              Geen activiteit gevonden
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {activities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted flex-shrink-0">
                      {getActionIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {activity.user?.name || "Onbekende gebruiker"}
                        </span>
                        {getActionBadge(activity.action)}
                      </div>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                      )}
                      {activity.property && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <Home className="h-3 w-3 inline mr-1" />
                          {activity.property.listingNumber || "N/A"} -{" "}
                          {activity.property.title}
                        </p>
                      )}
                      {/* Show metadata for price changes */}
                      {activity.metadata &&
                        (activity.action === "PRICE_UPDATE" ||
                          activity.action === "PRICE_APPROVED") && (
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <span className="line-through text-muted-foreground">
                              {activity.metadata.oldPrice}
                            </span>
                            <span>→</span>
                            <span className="font-medium">
                              {activity.metadata.newPrice}
                            </span>
                            {activity.metadata.percentageChange && (
                              <Badge variant="secondary" className="text-xs">
                                {activity.metadata.percentageChange > 0 ? "+" : ""}
                                {activity.metadata.percentageChange.toFixed(1)}%
                              </Badge>
                            )}
                          </div>
                        )}
                      {/* Show old/new status for status changes */}
                      {activity.metadata && activity.action === "STATUS_CHANGE" && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <Badge variant="outline">
                            {activity.metadata.previousStatus}
                          </Badge>
                          <span>→</span>
                          <Badge
                            className={
                              activity.metadata.newStatus === "SOLD"
                                ? "bg-green-500"
                                : activity.metadata.newStatus === "RENTED"
                                ? "bg-blue-500"
                                : ""
                            }
                          >
                            {activity.metadata.newStatus}
                          </Badge>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatDistanceToNow(new Date(activity.createdAt), {
                          addSuffix: true,
                          locale: nl,
                        })}
                        {" - "}
                        {format(new Date(activity.createdAt), "d MMM yyyy HH:mm", {
                          locale: nl,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
