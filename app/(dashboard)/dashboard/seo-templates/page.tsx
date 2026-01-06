"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

interface SeoTemplate {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  category: string | null;
  isActive: boolean;
  isDefault: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    landingPages: number;
  };
}

export default function SeoTemplatesPage() {
  const [templates, setTemplates] = useState<SeoTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/seo-templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        toast.error("Failed to load templates");
      }
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(`/api/seo-templates/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Template deleted");
        fetchTemplates();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete template");
      }
    } catch {
      toast.error("Failed to delete template");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="ph:spinner" className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SEO Templates</h1>
          <p className="text-muted-foreground mt-1">
            Manage AI prompts and rules for landing page SEO generation
          </p>
        </div>
        <Link href="/dashboard/seo-templates/new">
          <Button className="gap-2">
            <Icon icon="ph:plus" className="h-4 w-4" />
            New Template
          </Button>
        </Link>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
              <Icon icon="ph:lightbulb" className="h-6 w-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                How SEO Templates Work
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Templates contain AI prompts that generate optimized meta titles, descriptions, URLs, and content.
                Use variables like <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{"{{title}}"}</code> and{" "}
                <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">{"{{location}}"}</code> that get replaced with actual values.
                The default template is used when no specific template is selected.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon icon="ph:file-dashed" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No templates yet</h3>
            <p className="text-muted-foreground mt-1">
              Create your first SEO template to start generating optimized content.
            </p>
            <Link href="/dashboard/seo-templates/new">
              <Button className="mt-4 gap-2">
                <Icon icon="ph:plus" className="h-4 w-4" />
                Create Template
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="relative">
              {template.isDefault && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-primary">Default</Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.displayName}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.description || `Template: ${template.name}`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Icon icon="ph:file-text" className="h-4 w-4" />
                    <span>{template._count.landingPages} pages</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon icon="ph:git-branch" className="h-4 w-4" />
                    <span>v{template.version}</span>
                  </div>
                  {template.category && (
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      template.isActive ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  <span className="text-sm text-muted-foreground">
                    {template.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Link href={`/dashboard/seo-templates/${template.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Icon icon="ph:pencil" className="h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/dashboard/seo-templates/${template.id}/test`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Icon icon="ph:flask" className="h-4 w-4" />
                      Test
                    </Button>
                  </Link>
                  {!template.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(template.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Icon icon="ph:trash" className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
