"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  ExternalLink,
  Zap,
  ArrowUpCircle,
  FileText,
  AlertCircle,
} from "lucide-react";

interface BlogStatus {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  createdAt: string;
  isUpgraded: boolean;
  sectionCount: number;
  imageCount: number;
}

interface UpgradeStats {
  total: number;
  upgradeable: number;
  upgraded: number;
}

export function BlogUpgrade() {
  const [blogs, setBlogs] = useState<BlogStatus[]>([]);
  const [stats, setStats] = useState<UpgradeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [upgradingBlogId, setUpgradingBlogId] = useState<string | null>(null);
  const [upgradeProgress, setUpgradeProgress] = useState(0);

  const loadBlogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/smart-blog/upgrade");
      const data = await response.json();
      
      if (response.ok) {
        setBlogs(data.blogs || []);
        setStats({
          total: data.total,
          upgradeable: data.upgradeable,
          upgraded: data.upgraded,
        });
      } else {
        toast.error(data.error || "Failed to load blogs");
      }
    } catch (error) {
      console.error("Failed to load blogs:", error);
      toast.error("Failed to load blogs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  const upgradeBlog = async (blogId: string) => {
    setUpgradingBlogId(blogId);
    setUpgradeProgress(10);

    // Simulate progress while waiting
    const progressInterval = setInterval(() => {
      setUpgradeProgress(prev => Math.min(prev + 5, 90));
    }, 2000);

    try {
      const response = await fetch("/api/smart-blog/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId }),
      });

      clearInterval(progressInterval);
      const data = await response.json();

      if (response.ok) {
        setUpgradeProgress(100);
        toast.success(
          `Blog upgraded! ${data.stats.sectionsCreated} sections, ${data.stats.imagesGenerated} images`
        );
        // Refresh the list
        setTimeout(() => {
          loadBlogs();
          setUpgradeProgress(0);
        }, 1000);
      } else {
        if (data.alreadyUpgraded) {
          toast.error("Blog is already upgraded");
        } else {
          toast.error(data.error || "Failed to upgrade blog");
        }
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error("Failed to upgrade blog:", error);
      toast.error("Failed to upgrade blog");
    } finally {
      setUpgradingBlogId(null);
    }
  };

  const upgradeableBlogs = blogs.filter(b => !b.isUpgraded);
  const upgradedBlogs = blogs.filter(b => b.isUpgraded);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading blogs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-primary" />
            Blog Upgrade Center
          </h3>
          <p className="text-sm text-muted-foreground">
            Upgrade bestaande blogs naar de nieuwe alternerende layout met AI-afbeeldingen
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadBlogs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
                  <p className="text-sm text-blue-600/80 dark:text-blue-400/80">Totaal Blogs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.upgradeable}</p>
                  <p className="text-sm text-amber-600/80 dark:text-amber-400/80">Te Upgraden</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.upgraded}</p>
                  <p className="text-sm text-blue-600/80 dark:text-blue-400/80">Geüpgraded</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upgradeable Blogs */}
      {upgradeableBlogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Blogs om te Upgraden ({upgradeableBlogs.length})
            </CardTitle>
            <CardDescription>
              Deze blogs hebben nog de oude HTML layout. Upgrade ze naar de nieuwe alternerende layout met AI-afbeeldingen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {upgradeableBlogs.map((blog) => (
                  <div
                    key={blog.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Thumbnail */}
                      <div className="relative w-16 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                        {blog.coverImage ? (
                          <Image
                            src={blog.coverImage}
                            alt={blog.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Title & Info */}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium truncate">{blog.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Oude layout
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(blog.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/blogs/${blog.slug}`} target="_blank">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>

                      {upgradingBlogId === blog.id ? (
                        <div className="w-32">
                          <Progress value={upgradeProgress} className="h-2" />
                          <p className="text-xs text-center mt-1 text-muted-foreground">
                            {upgradeProgress < 30 ? "Analyseren..." : 
                             upgradeProgress < 70 ? "Afbeeldingen..." : 
                             upgradeProgress < 100 ? "Opslaan..." : "Klaar!"}
                          </p>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => upgradeBlog(blog.id)}
                          disabled={upgradingBlogId !== null}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Upgrade
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Already Upgraded Blogs */}
      {upgradedBlogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
              Geüpgrade Blogs ({upgradedBlogs.length})
            </CardTitle>
            <CardDescription>
              Deze blogs hebben al de nieuwe alternerende layout met AI-afbeeldingen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {upgradedBlogs.map((blog) => (
                  <div
                    key={blog.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Thumbnail */}
                      <div className="relative w-16 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                        {blog.coverImage ? (
                          <Image
                            src={blog.coverImage}
                            alt={blog.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Title & Stats */}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium truncate">{blog.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Geüpgraded
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {blog.sectionCount} secties
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            {blog.imageCount} afbeeldingen
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* View Link */}
                    <Link href={`/blogs/${blog.slug}`} target="_blank">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Bekijk
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {blogs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium text-lg mb-2">Geen blogs gevonden</h3>
            <p className="text-muted-foreground">
              Er zijn geen gepubliceerde blogs om te upgraden.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BlogUpgrade;



