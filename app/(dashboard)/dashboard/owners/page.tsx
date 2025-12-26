"use client";

import { PropertyOwnersTable } from "@/components/shared/dashboard/property-owners-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Home, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

interface OwnerStats {
  totalOwners: number;
  verifiedOwners: number;
  totalDocuments: number;
  linkedProperties: number;
}

export default function OwnersPage() {
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/owners");
      const data = await response.json();
      
      if (response.ok) {
        const owners = data.owners || [];
        setStats({
          totalOwners: owners.length,
          verifiedOwners: owners.filter((o: any) => o.isVerified).length,
          totalDocuments: owners.reduce((acc: number, o: any) => acc + (o.documents?.length || 0), 0),
          linkedProperties: owners.reduce((acc: number, o: any) => acc + (o.properties?.length || 0), 0),
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Eigenaren Beheer</h1>
        <p className="text-muted-foreground">
          Beheer eigenaren, hun documenten en gekoppelde woningen voor TM30 registratie.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Eigenaren</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : stats?.totalOwners || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Geregistreerde eigenaren
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geverifieerd</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : stats?.verifiedOwners || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Met complete documenten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documenten</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : stats?.totalDocuments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              ID kaarten & bluebooks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gekoppeld</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "-" : stats?.linkedProperties || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Woningen aan eigenaren
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            Hoe werkt het Eigenaren Systeem?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            <strong>1 ID Kaart per eigenaar:</strong> Upload eenmalig de Thai ID kaart. 
            Deze wordt opgeslagen en hergebruikt voor alle woningen.
          </p>
          <p>
            <strong>1 Bluebook per woning:</strong> Elke woning heeft een aparte Tabienbaan (ทะเบียนบ้าน). 
            Deze wordt gekoppeld aan zowel de eigenaar als de woning.
          </p>
          <p>
            <strong>Automatische herkenning:</strong> Via WhatsApp wordt de eigenaar herkend op telefoonnummer. 
            Bij bestaande eigenaren wordt de ID kaart automatisch hergebruikt.
          </p>
        </CardContent>
      </Card>

      {/* Owners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Eigenaren</CardTitle>
          <CardDescription>
            Alle geregistreerde eigenaren met hun documenten en woningen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyOwnersTable />
        </CardContent>
      </Card>
    </div>
  );
}





