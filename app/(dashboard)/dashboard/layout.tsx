import Link from "next/link";
import { LayoutDashboard, PlusCircle, Settings, FileText, Files, ExternalLink, ImageIcon, BarChart3, MessageCircle, UserPlus, Plane, Link2, Sparkles, Globe, Search, Mail, ListTodo, Users } from "lucide-react";
import AgentProfileCard from "@/components/shared/dashboard/agent-profile-card";
import NavLink from "@/components/shared/dashboard/nav-link";
import { OwnerPortalNavLink } from "@/components/shared/dashboard/owner-portal-nav-link";
import DashboardChatProvider from "@/components/shared/dashboard/dashboard-chat-provider";
import { TaskNotifications } from "@/components/shared/dashboard/task-notifications";
import { MobileSidebar } from "@/components/shared/dashboard/mobile-sidebar";
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
    // Customer users should be redirected to their bookings
    redirect("/my-bookings");
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="hidden w-64 flex-col border-r bg-white dark:bg-slate-900 md:flex">
        <div className="flex h-16 items-center justify-between border-b px-6">
          <span className="text-xl font-bold tracking-tight">PSM Phuket</span>
          <div className="flex items-center gap-1">
            <TaskNotifications />
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
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {/* Main Navigation */}
          <NavLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>
            Overview
          </NavLink>
          <NavLink href="/dashboard/analytics" icon={<BarChart3 className="h-4 w-4" />}>
            Analytics
          </NavLink>
          <NavLink href="/dashboard/marketing" icon={<Link2 className="h-4 w-4" />}>
            Marketing
          </NavLink>
          <NavLink href="/dashboard/messages" icon={<MessageCircle className="h-4 w-4" />}>
            Messages
          </NavLink>
          <NavLink href="/dashboard/contact-submissions" icon={<Mail className="h-4 w-4" />}>
            Contact Forms
          </NavLink>
          <NavLink href="/dashboard/tasks" icon={<ListTodo className="h-4 w-4" />}>
            Tasks
          </NavLink>
          
          <div className="my-4 border-t border-slate-200 dark:border-slate-700" />
          
          {/* Content Management */}
          <NavLink href="/dashboard/all-pages" icon={<Globe className="h-4 w-4" />}>
            All Pages
          </NavLink>
          <NavLink href="/dashboard/blogs" icon={<FileText className="h-4 w-4" />}>
            Blog Posts
          </NavLink>
          <NavLink href="/dashboard/pages" icon={<Files className="h-4 w-4" />}>
            Landing Pages
          </NavLink>
          <NavLink href="/dashboard/seo-templates" icon={<Sparkles className="h-4 w-4" />}>
            SEO Templates
          </NavLink>
          <NavLink href="/dashboard/seo" icon={<Search className="h-4 w-4" />}>
            SEO & Indexing
          </NavLink>
          <NavLink href="/dashboard/add" icon={<PlusCircle className="h-4 w-4" />}>
            Add Property
          </NavLink>
          
          <div className="my-4 border-t border-slate-200 dark:border-slate-700" />
          
          {/* Settings */}
          <OwnerPortalNavLink />
          <NavLink href="/dashboard/tm30" icon={<Plane className="h-4 w-4" />}>
            TM30 Immigration
          </NavLink>
          <NavLink href="/dashboard/hero-images" icon={<ImageIcon className="h-4 w-4" />}>
            Hero Images
          </NavLink>
          {session.user.role === "ADMIN" && (
            <>
              <NavLink href="/dashboard/invites" icon={<UserPlus className="h-4 w-4" />}>
                Agent Invites
              </NavLink>
              <NavLink href="/dashboard/users" icon={<Users className="h-4 w-4" />}>
                User Management
              </NavLink>
            </>
          )}
          <NavLink href="/dashboard/settings" icon={<Settings className="h-4 w-4" />}>
            Settings
          </NavLink>
        </nav>

        <AgentProfileCard />
      </aside>

      <main className="flex-1 flex flex-col">
        {/* Mobile Header with Hamburger Menu */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:hidden dark:bg-slate-900">
          <MobileSidebar userRole={session.user.role} />
          <span className="font-bold">PSM Phuket</span>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>
        <DashboardChatProvider>
          <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">{children}</div>
        </DashboardChatProvider>
      </main>
    </div>
  );
}
