import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Link2, TrendingUp, Settings2, BarChart3, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UtmLinkGenerator } from "@/components/shared/dashboard/utm-link-generator";
import { UtmPresetManager } from "@/components/shared/dashboard/utm-preset-manager";
import { UtmCampaignAnalytics } from "@/components/shared/dashboard/utm-campaign-analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = {
  title: "Marketing Tools | Dashboard",
  description: "Generate trackable links and analyze marketing performance",
};

function LoadingState() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-32 bg-muted rounded-lg" />
      <div className="h-64 bg-muted rounded-lg" />
    </div>
  );
}

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Marketing Tools</h2>
          <p className="text-muted-foreground">
            Generate trackable links and analyze traffic sources
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="generator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="generator" className="gap-2">
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">Link Generator</span>
            <span className="sm:hidden">Links</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Campaign Analytics</span>
            <span className="sm:hidden">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="presets" className="gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Channel Presets</span>
            <span className="sm:hidden">Presets</span>
          </TabsTrigger>
          <TabsTrigger value="guide" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">How It Works</span>
            <span className="sm:hidden">Guide</span>
          </TabsTrigger>
        </TabsList>

        {/* Link Generator Tab */}
        <TabsContent value="generator" className="space-y-6">
          <Suspense fallback={<LoadingState />}>
            <UtmLinkGenerator />
          </Suspense>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Suspense fallback={<LoadingState />}>
            <UtmCampaignAnalytics />
          </Suspense>
        </TabsContent>

        {/* Presets Tab */}
        <TabsContent value="presets" className="space-y-6">
          <Suspense fallback={<LoadingState />}>
            <UtmPresetManager />
          </Suspense>
        </TabsContent>

        {/* Guide Tab */}
        <TabsContent value="guide" className="space-y-6">
          {/* How It Works */}
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Link2 className="h-5 w-5" />
                How UTM Tracking Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-background rounded-lg">
                  <div className="flex items-center gap-2 font-medium mb-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
                    Generate Links
                  </div>
                  <p className="text-muted-foreground">
                    Use the Link Generator to create unique tracking URLs for each marketing channel.
                  </p>
                </div>
                <div className="p-4 bg-background rounded-lg">
                  <div className="flex items-center gap-2 font-medium mb-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">2</span>
                    Share & Promote
                  </div>
                  <p className="text-muted-foreground">
                    Post these links on Facebook Marketplace, Instagram, partner sites, or anywhere else.
                  </p>
                </div>
                <div className="p-4 bg-background rounded-lg">
                  <div className="flex items-center gap-2 font-medium mb-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">3</span>
                    Track Results
                  </div>
                  <p className="text-muted-foreground">
                    View analytics to see which channels drive the most traffic and leads.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-background rounded-lg">
                <p className="font-medium mb-2">Example URL:</p>
                <code className="text-xs break-all text-muted-foreground block p-2 bg-muted rounded">
                  https://www.psmphuket.com/properties/phuket/luxury-villa?<span className="text-blue-600">utm_source=facebook</span>&<span className="text-green-600">utm_medium=marketplace</span>&<span className="text-orange-600">utm_campaign=december_2024</span>
                </code>
              </div>
            </CardContent>
          </Card>

          {/* UTM Parameters Explained */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">UTM Parameter Guide</CardTitle>
              <CardDescription>
                Understanding each tracking parameter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">utm_source</code>
                    <span className="text-sm font-medium">Required</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>What:</strong> Where the traffic comes from (e.g., facebook, google, instagram)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Examples:</strong> facebook, instagram, google, tiktok, partner_site
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded">utm_medium</code>
                    <span className="text-sm font-medium">Required</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>What:</strong> The type of traffic (e.g., social, marketplace, email)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Examples:</strong> marketplace, social, ads, organic, email, referral
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-orange-100 dark:bg-orange-900/50 px-2 py-1 rounded">utm_campaign</code>
                    <span className="text-sm font-medium">Recommended</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>What:</strong> A name for your marketing campaign
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Examples:</strong> december_2024, villa_promo, new_year_sale, beachfront_villas
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">utm_term</code>
                    <span className="text-sm text-muted-foreground">Optional</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>What:</strong> Keywords for paid search campaigns
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Examples:</strong> phuket+villa, luxury+property, beachfront+condo
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">utm_content</code>
                    <span className="text-sm text-muted-foreground">Optional</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>What:</strong> Used to differentiate similar content or A/B tests
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Examples:</strong> hero_image, sidebar_banner, video_cta, text_link
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span><strong>Be consistent:</strong> Always use the same source names (e.g., always "facebook" not sometimes "fb")</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span><strong>Use lowercase:</strong> UTM parameters are case-sensitive, so stick to lowercase</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span><strong>Use underscores:</strong> Replace spaces with underscores (e.g., "new_year_sale")</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span><strong>Name campaigns clearly:</strong> Include the month/year for easy tracking (e.g., "december_2024")</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span><strong>Save your links:</strong> Use the "Save to History" feature to keep track of generated links</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">!</span>
                  <span><strong>Persistent tracking:</strong> Once a visitor clicks your link, their source is remembered for 30 days</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
