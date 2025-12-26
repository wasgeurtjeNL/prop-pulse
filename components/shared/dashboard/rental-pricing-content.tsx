"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Calendar, TrendingUp, Save, Info } from "lucide-react";
import type { PricingConfig, SurchargeTier } from "@/lib/services/rental-pricing";

export default function RentalPricingContent() {
  const [config, setConfig] = useState<PricingConfig>({
    peakSeasonMonths: [12, 1, 2],
    peakSeasonSurcharges: [
      { minDays: 1, maxDays: 7, surchargePercent: 30 },
      { minDays: 8, maxDays: 14, surchargePercent: 20 },
      { minDays: 15, maxDays: 19, surchargePercent: 15 },
      { minDays: 20, maxDays: 30, surchargePercent: 0 },
    ],
    lowSeasonSurcharges: [
      { minDays: 1, maxDays: 7, surchargePercent: 20 },
      { minDays: 8, maxDays: 14, surchargePercent: 17 },
      { minDays: 15, maxDays: 19, surchargePercent: 13 },
      { minDays: 20, maxDays: 30, surchargePercent: 0 },
    ],
    minimumStayDays: 1,
    maximumStayDays: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/rental-pricing-config");
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          const loadedConfig = data.config;
          setConfig({
            peakSeasonMonths: loadedConfig.peakSeasonMonths || [12, 1, 2],
            peakSeasonSurcharges: loadedConfig.peakSeasonSurcharges || loadedConfig.peakSeasonDiscounts?.map((d: any) => ({
              minDays: d.minDays,
              maxDays: d.maxDays,
              surchargePercent: d.discountPercent || d.surchargePercent,
            })) || [],
            lowSeasonSurcharges: loadedConfig.lowSeasonSurcharges || loadedConfig.lowSeasonDiscounts?.map((d: any) => ({
              minDays: d.minDays,
              maxDays: d.maxDays,
              surchargePercent: d.discountPercent || d.surchargePercent,
            })) || [],
            minimumStayDays: loadedConfig.minimumStayDays || 1,
            maximumStayDays: loadedConfig.maximumStayDays || 30,
          });
        }
      }
    } catch (error) {
      toast.error("Failed to load pricing configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/rental-pricing-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success("Pricing configuration saved!");
      } else {
        toast.error("Failed to save configuration");
      }
    } catch (error) {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const updateSurchargeTier = (
    season: "peak" | "low",
    index: number,
    field: keyof SurchargeTier,
    value: number
  ) => {
    setConfig((prev) => {
      const surcharges = season === "peak" ? prev.peakSeasonSurcharges : prev.lowSeasonSurcharges;
      const updated = [...surcharges];
      updated[index] = { ...updated[index], [field]: value };
      return {
        ...prev,
        [season === "peak" ? "peakSeasonSurcharges" : "lowSeasonSurcharges"]: updated,
      };
    });
  };

  const addSurchargeTier = (season: "peak" | "low") => {
    setConfig((prev) => {
      const surcharges = season === "peak" ? prev.peakSeasonSurcharges : prev.lowSeasonSurcharges;
      const lastTier = surcharges[surcharges.length - 1];
      const newTier: SurchargeTier = {
        minDays: lastTier ? lastTier.maxDays + 1 : 1,
        maxDays: lastTier ? lastTier.maxDays + 10 : 7,
        surchargePercent: 0,
      };
      return {
        ...prev,
        [season === "peak" ? "peakSeasonSurcharges" : "lowSeasonSurcharges"]: [...surcharges, newTier],
      };
    });
  };

  const removeSurchargeTier = (season: "peak" | "low", index: number) => {
    setConfig((prev) => {
      const surcharges = season === "peak" ? prev.peakSeasonSurcharges : prev.lowSeasonSurcharges;
      const updated = surcharges.filter((_, i) => i !== index);
      return {
        ...prev,
        [season === "peak" ? "peakSeasonSurcharges" : "lowSeasonSurcharges"]: updated,
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-6 max-w-full">
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">How pricing works:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
              <li>Base daily price = Monthly price ÷ 30</li>
              <li>Surcharge percentages are <strong>added on top</strong> of the base price</li>
              <li>Longer stays = lower surcharge = better value for customers</li>
              <li>Customers only see the final price, not the surcharge breakdown</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Peak Season Months */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <CardTitle>Peak Season Months</CardTitle>
          </div>
          <CardDescription>
            Select months considered as peak season (higher surcharges)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {monthNames.map((month, index) => {
              const monthNum = index + 1;
              const isSelected = config.peakSeasonMonths.includes(monthNum);
              return (
                <button
                  key={monthNum}
                  onClick={() => {
                    setConfig((prev) => ({
                      ...prev,
                      peakSeasonMonths: isSelected
                        ? prev.peakSeasonMonths.filter((m) => m !== monthNum)
                        : [...prev.peakSeasonMonths, monthNum].sort((a, b) => a - b),
                    }));
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                  }`}
                >
                  {month}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Peak Season Surcharges */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <CardTitle>Peak Season Surcharges</CardTitle>
          </div>
          <CardDescription>
            Extra cost percentages added to base price for different stay durations in peak season
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.peakSeasonSurcharges.map((tier, index) => (
            <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div>
                  <Label>From day</Label>
                  <Input
                    type="number"
                    value={tier.minDays}
                    onChange={(e) =>
                      updateSurchargeTier("peak", index, "minDays", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label>To day</Label>
                  <Input
                    type="number"
                    value={tier.maxDays}
                    onChange={(e) =>
                      updateSurchargeTier("peak", index, "maxDays", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label>Surcharge (%)</Label>
                  <Input
                    type="number"
                    value={tier.surchargePercent}
                    onChange={(e) =>
                      updateSurchargeTier(
                        "peak",
                        index,
                        "surchargePercent",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
              </div>
              {config.peakSeasonSurcharges.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSurchargeTier("peak", index)}
                >
                  ×
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" onClick={() => addSurchargeTier("peak")}>
            + Add Tier
          </Button>
        </CardContent>
      </Card>

      {/* Low Season Surcharges */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <CardTitle>Low Season Surcharges</CardTitle>
          </div>
          <CardDescription>
            Extra cost percentages added to base price for different stay durations in low season
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.lowSeasonSurcharges.map((tier, index) => (
            <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div>
                  <Label>From day</Label>
                  <Input
                    type="number"
                    value={tier.minDays}
                    onChange={(e) =>
                      updateSurchargeTier("low", index, "minDays", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label>To day</Label>
                  <Input
                    type="number"
                    value={tier.maxDays}
                    onChange={(e) =>
                      updateSurchargeTier("low", index, "maxDays", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label>Surcharge (%)</Label>
                  <Input
                    type="number"
                    value={tier.surchargePercent}
                    onChange={(e) =>
                      updateSurchargeTier(
                        "low",
                        index,
                        "surchargePercent",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
              </div>
              {config.lowSeasonSurcharges.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSurchargeTier("low", index)}
                >
                  ×
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" onClick={() => addSurchargeTier("low")}>
            + Add Tier
          </Button>
        </CardContent>
      </Card>

      {/* Stay Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Stay Duration Limits</CardTitle>
          <CardDescription>
            Minimum and maximum number of days for a booking
          </CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Minimum stay (days)</Label>
            <Input
              type="number"
              value={config.minimumStayDays}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  minimumStayDays: parseInt(e.target.value) || 1,
                }))
              }
            />
          </div>
          <div>
            <Label>Maximum stay (days)</Label>
            <Input
              type="number"
              value={config.maximumStayDays}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  maximumStayDays: parseInt(e.target.value) || 30,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}






