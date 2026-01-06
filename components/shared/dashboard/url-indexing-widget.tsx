"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IndexingResult {
  success: boolean;
  url: string;
  action: string;
  notificationTime?: string;
  error?: string;
}

export function URLIndexingWidget() {
  const [url, setUrl] = useState("");
  const [action, setAction] = useState<"URL_UPDATED" | "URL_DELETED">("URL_UPDATED");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<IndexingResult[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/google-indexing/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), action }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`URL submitted successfully!`);
        setResults((prev) => [data, ...prev].slice(0, 10));
        setUrl("");
      } else {
        toast.error(data.error || "Failed to submit URL");
        setResults((prev) => [data, ...prev].slice(0, 10));
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const quickSubmitUrls = [
    { label: "Homepage", url: "/" },
    { label: "Properties", url: "/properties" },
    { label: "Blogs", url: "/blogs" },
    { label: "Contact", url: "/contact" },
  ];

  const handleQuickSubmit = async (quickUrl: string) => {
    setUrl(quickUrl);
    setLoading(true);

    try {
      const response = await fetch("/api/google-indexing/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: quickUrl, action: "URL_UPDATED" }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${quickUrl} submitted successfully!`);
        setResults((prev) => [data, ...prev].slice(0, 10));
      } else {
        toast.error(data.error || "Failed to submit URL");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
      setUrl("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Icon icon="mdi:google" className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">URL Indexing</CardTitle>
            <CardDescription>
              Submit URLs to Google for instant indexing
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Submit Buttons */}
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Quick Submit</Label>
          <div className="flex flex-wrap gap-2">
            {quickSubmitUrls.map((item) => (
              <Button
                key={item.url}
                variant="outline"
                size="sm"
                onClick={() => handleQuickSubmit(item.url)}
                disabled={loading}
                className="flex items-center gap-1.5"
              >
                <Icon icon="lucide:send" className="h-3.5 w-3.5" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Manual Submit Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter URL (e.g., /blogs/my-blog-post)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
            </div>
            <Select
              value={action}
              onValueChange={(v) => setAction(v as "URL_UPDATED" | "URL_DELETED")}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="URL_UPDATED">
                  <span className="flex items-center gap-2">
                    <Icon icon="lucide:plus-circle" className="h-4 w-4 text-green-500" />
                    Index
                  </span>
                </SelectItem>
                <SelectItem value="URL_DELETED">
                  <span className="flex items-center gap-2">
                    <Icon icon="lucide:minus-circle" className="h-4 w-4 text-red-500" />
                    Remove
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Icon icon="lucide:loader-2" className="h-4 w-4 animate-spin" />
              ) : (
                <Icon icon="lucide:send" className="h-4 w-4" />
              )}
              <span className="ml-2">Submit</span>
            </Button>
          </div>
        </form>

        {/* Recent Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Recent Submissions</Label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border flex items-center justify-between",
                    result.success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      icon={result.success ? "lucide:check-circle" : "lucide:x-circle"}
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        result.success ? "text-green-600" : "text-red-600"
                      )}
                    />
                    <span className="text-sm truncate">{result.url}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "ml-2 flex-shrink-0",
                      result.action === "URL_UPDATED"
                        ? "border-green-300 text-green-700"
                        : "border-red-300 text-red-700"
                    )}
                  >
                    {result.action === "URL_UPDATED" ? "Indexed" : "Removed"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Icon icon="lucide:info" className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium">Automatic Indexing Enabled</p>
              <p className="mt-1">
                URLs are automatically submitted when you publish new blogs, properties, 
                or landing pages. Use this tool for manual submissions.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
