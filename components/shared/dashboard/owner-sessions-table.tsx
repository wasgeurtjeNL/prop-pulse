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
  LogIn,
  LogOut,
  Clock,
  User,
  Globe,
  Monitor,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { nl } from "date-fns/locale";

interface SessionUser {
  id: string;
  name: string;
  email: string;
}

interface OwnerSession {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  action: string;
  createdAt: string;
  user?: SessionUser;
}

export function OwnerSessionsTable() {
  const [sessions, setSessions] = useState<OwnerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState("50");

  useEffect(() => {
    fetchSessions();
  }, [limit]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/owner-portal/sessions?limit=${limit}`);
      const data = await response.json();

      if (response.ok) {
        setSessions(data.sessions || []);
      } else {
        toast.error(data.error || "Failed to fetch sessions");
      }
    } catch (error) {
      toast.error("Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "LOGIN":
        return <LogIn className="h-4 w-4 text-green-500" />;
      case "LOGOUT":
        return <LogOut className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "LOGIN":
        return <Badge className="bg-green-500">Ingelogd</Badge>;
      case "LOGOUT":
        return <Badge variant="secondary">Uitgelogd</Badge>;
      case "SESSION_EXPIRED":
        return <Badge variant="outline">Sessie Verlopen</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const parseUserAgent = (userAgent: string | null) => {
    if (!userAgent) return "Onbekend";
    
    // Simple browser detection
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Andere browser";
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Eigenaar Login Sessies</h3>
        <Select value={limit} onValueChange={setLimit}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Limiet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              Geen login sessies gevonden
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {getActionIcon(session.action)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {session.user?.name || "Onbekende gebruiker"}
                        </span>
                        {getActionBadge(session.action)}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(session.createdAt), {
                            addSuffix: true,
                            locale: nl,
                          })}
                        </span>
                        {session.ipAddress && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {session.ipAddress}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Monitor className="h-3 w-3" />
                          {parseUserAgent(session.userAgent)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {format(new Date(session.createdAt), "d MMM yyyy HH:mm", {
                      locale: nl,
                    })}
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
