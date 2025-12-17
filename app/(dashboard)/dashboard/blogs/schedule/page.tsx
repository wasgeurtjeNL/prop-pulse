"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BlogCalendar } from "@/components/smart-blog/BlogCalendar";

export default function BlogSchedulePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              📅 Blog Schedule
            </h1>
            <p className="text-muted-foreground">
              Plan en beheer je blog publicaties met SEO-geoptimaliseerde timing
            </p>
          </div>
          <Link href="/dashboard/blogs/smart-generator">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Smart Generator
            </Button>
          </Link>
        </div>

        {/* Calendar Component */}
        <BlogCalendar 
          topics={[]}
          onTopicScheduled={(topicId) => {
            console.log("Topic scheduled:", topicId);
          }}
        />
      </div>
    </div>
  );
}




