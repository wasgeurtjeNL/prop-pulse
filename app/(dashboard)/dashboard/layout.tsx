import Link from "next/link";
import { LayoutDashboard, PlusCircle, List, Settings, Calendar, Key, TrendingUp, FileText, Inbox, Download, Files, ExternalLink, Home, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import AgentProfileCard from "@/components/shared/dashboard/agent-profile-card";
import NavLink from "@/components/shared/dashboard/nav-link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get session without redirecting to avoid infinite loops
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If no session, render a sign-in prompt instead of redirecting
  if (!session || !session.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center max-w-md p-8">
          <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">
            You need to sign in to access the dashboard.
          </p>
          <Link
            href="/sign-in?callbackUrl=/dashboard"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Check role - render access denied instead of redirecting
  const allowedRoles = ["AGENT", "ADMIN"];
  const hasAccess = allowedRoles.includes(session.user.role || "");
  
  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center max-w-md p-8">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the dashboard. Only agents and admins can access this area.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="hidden w-64 flex-col border-r bg-white dark:bg-slate-900 md:flex">
        <div className="flex h-16 items-center justify-between border-b px-6">
          <span className="text-xl font-bold tracking-tight">Proppulse</span>
          <Link 
            href="/" 
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-colors"
            title="View Live Site"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>View Site</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <NavLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>
            Overview
          </NavLink>
          <NavLink href="/dashboard/submissions" icon={<Inbox className="h-4 w-4" />}>
            Property Submissions
          </NavLink>
          <NavLink href="/dashboard/viewing-requests" icon={<Calendar className="h-4 w-4" />}>
            Viewing Requests
          </NavLink>
          <NavLink href="/dashboard/rental-leads" icon={<Key className="h-4 w-4" />}>
            Rental Leads
          </NavLink>
          <NavLink href="/dashboard/investor-leads" icon={<TrendingUp className="h-4 w-4" />}>
            Investor Leads
          </NavLink>
          <NavLink href="/dashboard/blogs" icon={<FileText className="h-4 w-4" />}>
            Blog Posts
          </NavLink>
          <NavLink href="/dashboard/pages" icon={<Files className="h-4 w-4" />}>
            Landing Pages
          </NavLink>
          <NavLink href="/dashboard/add" icon={<PlusCircle className="h-4 w-4" />}>
            Add Property
          </NavLink>
          <NavLink href="/dashboard/property-import" icon={<Download className="h-4 w-4" />}>
            Import Property
          </NavLink>
          
          <div className="my-4 border-t border-slate-200 dark:border-slate-700" />
          
          <NavLink href="/dashboard/hero-images" icon={<ImageIcon className="h-4 w-4" />}>
            Hero Images
          </NavLink>
          <NavLink href="/dashboard/settings" icon={<Settings className="h-4 w-4" />}>
            Instellingen
          </NavLink>
        </nav>

        <AgentProfileCard />
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="flex h-16 items-center border-b bg-white px-6 md:hidden dark:bg-slate-900">
          <span className="font-bold">Proppulse Agent</span>
        </header>
        <div className="flex-1 p-6 md:p-8 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
