"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Globe,
  Tag,
  Zap,
  AlertTriangle,
  Server,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CacheConfig {
  paths: { path: string; label: string }[];
  tags: { tag: string; label: string }[];
  vercelConfigured: boolean;
}

interface CacheResult {
  success: string[];
  failed: string[];
}

export default function CacheManager() {
  const [config, setConfig] = useState<CacheConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customPath, setCustomPath] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [lastResult, setLastResult] = useState<CacheResult | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/cache");
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      toast.error("Failed to load cache config");
    } finally {
      setLoading(false);
    }
  };

  const handleCacheAction = async (
    action: string,
    options?: { paths?: string[]; tags?: string[] }
  ) => {
    setProcessing(true);
    setLastResult(null);

    try {
      const response = await fetch("/api/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          paths: options?.paths || selectedPaths,
          tags: options?.tags || selectedTags,
          customPath: customPath || undefined,
          customTag: customTag || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setLastResult(data.results);
        // Reset selections after successful operation
        if (action !== "purge-vercel-cache") {
          setSelectedPaths([]);
          setSelectedTags([]);
          setCustomPath("");
          setCustomTag("");
        }
      } else {
        toast.error(data.error || "Cache operatie mislukt");
      }
    } catch (error) {
      toast.error("Cache operatie mislukt");
    } finally {
      setProcessing(false);
    }
  };

  const togglePath = (path: string) => {
    setSelectedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const selectAllPaths = () => {
    if (config) {
      setSelectedPaths(config.paths.map((p) => p.path));
    }
  };

  const selectAllTags = () => {
    if (config) {
      setSelectedTags(config.tags.map((t) => t.tag));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-orange-900 dark:text-orange-100">
              Snelle Acties
            </CardTitle>
          </div>
          <CardDescription>
            Eén-klik acties om de cache te legen
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  className="gap-2 bg-orange-600 hover:bg-orange-700"
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Alles Legen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Alle Cache Legen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Dit zal alle gecachte pagina&apos;s en data refreshen. De
                    website kan tijdelijk trager laden terwijl de cache opnieuw
                    wordt opgebouwd.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleCacheAction("revalidate-all")}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Ja, Cache Legen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {config?.vercelConfigured && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2" disabled={processing}>
                    <Server className="w-4 h-4" />
                    Vercel Edge Cache
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Vercel Edge Cache Legen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Dit leegt de Vercel CDN edge cache. Gebruik dit als
                      wijzigingen niet zichtbaar zijn ondanks normale cache
                      revalidatie.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuleren</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleCacheAction("purge-vercel-cache")}
                    >
                      Ja, Vercel Cache Legen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {!config?.vercelConfigured && (
            <div className="mt-4 flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Vercel API niet geconfigureerd. Voeg{" "}
                <code className="bg-muted px-1 rounded">VERCEL_API_TOKEN</code>,{" "}
                <code className="bg-muted px-1 rounded">VERCEL_PROJECT_ID</code>{" "}
                en optioneel{" "}
                <code className="bg-muted px-1 rounded">VERCEL_TEAM_ID</code> toe
                aan je environment variables voor edge cache purging.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Path Revalidation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <CardTitle>Pagina&apos;s Verversen</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAllPaths}
              className="text-xs"
            >
              Selecteer Alles
            </Button>
          </div>
          <CardDescription>
            Selecteer specifieke pagina&apos;s om te refreshen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {config?.paths.map(({ path, label }) => (
              <label
                key={path}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedPaths.includes(path)
                    ? "bg-primary/5 border-primary"
                    : "hover:bg-muted/50"
                )}
              >
                <Checkbox
                  checked={selectedPaths.includes(path)}
                  onCheckedChange={() => togglePath(path)}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {path}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customPath">Aangepast Pad (optioneel)</Label>
            <div className="flex gap-2">
              <Input
                id="customPath"
                placeholder="/properties/villa-name"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Voer een specifiek pad in, bijv. /properties/[slug] voor een
              specifieke property
            </p>
          </div>

          <Button
            onClick={() => handleCacheAction("revalidate-paths")}
            disabled={
              processing ||
              (selectedPaths.length === 0 && !customPath)
            }
            className="gap-2"
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Geselecteerde Pagina&apos;s Verversen ({selectedPaths.length}
            {customPath ? "+1" : ""})
          </Button>
        </CardContent>
      </Card>

      {/* Tag Revalidation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              <CardTitle>Cache Tags Verversen</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAllTags}
              className="text-xs"
            >
              Selecteer Alles
            </Button>
          </div>
          <CardDescription>
            Ververs data gebonden aan specifieke cache tags
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {config?.tags.map(({ tag, label }) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-colors py-2 px-3",
                  selectedTags.includes(tag) && "bg-primary"
                )}
                onClick={() => toggleTag(tag)}
              >
                {label}
              </Badge>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customTag">Aangepaste Tag (optioneel)</Label>
            <Input
              id="customTag"
              placeholder="custom-tag-name"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
            />
          </div>

          <Button
            onClick={() => handleCacheAction("revalidate-tags")}
            disabled={
              processing ||
              (selectedTags.length === 0 && !customTag)
            }
            className="gap-2"
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Geselecteerde Tags Verversen ({selectedTags.length}
            {customTag ? "+1" : ""})
          </Button>
        </CardContent>
      </Card>

      {/* Last Result */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Laatste Resultaat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lastResult.success.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Succesvol ({lastResult.success.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {lastResult.success.map((item, i) => (
                      <Badge key={i} variant="outline" className="text-green-600">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {lastResult.failed.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    Mislukt ({lastResult.failed.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {lastResult.failed.map((item, i) => (
                      <Badge key={i} variant="outline" className="text-red-600">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Wanneer Cache Legen?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
              <span>
                <strong>Na database wijzigingen</strong> die niet automatisch de
                cache updaten
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
              <span>
                <strong>Wanneer wijzigingen niet zichtbaar zijn</strong> op de
                live site
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
              <span>
                <strong>Na deployment</strong> als oude content nog zichtbaar is
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
              <span>
                <strong>Bij SEO updates</strong> om zoekmachines de nieuwe
                content te tonen
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

