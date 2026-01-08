"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  FileText,
  Files,
  ExternalLink,
  ImageIcon,
  BarChart3,
  MessageCircle,
  UserPlus,
  Plane,
  Link2,
  Sparkles,
  Globe,
  Search,
  Mail,
  ListTodo,
  Menu,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { TaskNotifications } from "./task-notifications";
import { useState } from "react";

interface MobileSidebarProps {
  userRole?: string;
}

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" />, label: "Overview" },
  { href: "/dashboard/analytics", icon: <BarChart3 className="h-4 w-4" />, label: "Analytics" },
  { href: "/dashboard/marketing", icon: <Link2 className="h-4 w-4" />, label: "Marketing" },
  { href: "/dashboard/messages", icon: <MessageCircle className="h-4 w-4" />, label: "Messages" },
  { href: "/dashboard/contact-submissions", icon: <Mail className="h-4 w-4" />, label: "Contact Forms" },
  { href: "/dashboard/tasks", icon: <ListTodo className="h-4 w-4" />, label: "Tasks" },
];

const contentNavItems: NavItem[] = [
  { href: "/dashboard/all-pages", icon: <Globe className="h-4 w-4" />, label: "All Pages" },
  { href: "/dashboard/blogs", icon: <FileText className="h-4 w-4" />, label: "Blog Posts" },
  { href: "/dashboard/pages", icon: <Files className="h-4 w-4" />, label: "Landing Pages" },
  { href: "/dashboard/seo-templates", icon: <Sparkles className="h-4 w-4" />, label: "SEO Templates" },
  { href: "/dashboard/seo", icon: <Search className="h-4 w-4" />, label: "SEO & Indexing" },
  { href: "/dashboard/add", icon: <PlusCircle className="h-4 w-4" />, label: "Add Property" },
];

const settingsNavItems: NavItem[] = [
  { href: "/dashboard/owner-portal", icon: <Users className="h-4 w-4" />, label: "Owner Portal" },
  { href: "/dashboard/tm30", icon: <Plane className="h-4 w-4" />, label: "TM30 Immigration" },
  { href: "/dashboard/hero-images", icon: <ImageIcon className="h-4 w-4" />, label: "Hero Images" },
  { href: "/dashboard/invites", icon: <UserPlus className="h-4 w-4" />, label: "Agent Invites", adminOnly: true },
  { href: "/dashboard/settings", icon: <Settings className="h-4 w-4" />, label: "Settings" },
];

function MobileNavLink({ 
  href, 
  icon, 
  children, 
  onClick 
}: { 
  href: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || 
    (href !== "/dashboard" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

export function MobileSidebar({ userRole }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  
  const handleNavClick = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold">PSM Phuket</SheetTitle>
            <div className="flex items-center gap-2">
              <TaskNotifications />
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                onClick={handleNavClick}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Site</span>
              </Link>
            </div>
          </div>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto p-4">
          {/* Main Navigation */}
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <MobileNavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                onClick={handleNavClick}
              >
                {item.label}
              </MobileNavLink>
            ))}
          </div>

          <div className="my-4 border-t" />

          {/* Content Management */}
          <div className="mb-2">
            <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Content
            </span>
          </div>
          <div className="space-y-1">
            {contentNavItems.map((item) => (
              <MobileNavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                onClick={handleNavClick}
              >
                {item.label}
              </MobileNavLink>
            ))}
          </div>

          <div className="my-4 border-t" />

          {/* Settings */}
          <div className="mb-2">
            <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Settings
            </span>
          </div>
          <div className="space-y-1">
            {settingsNavItems
              .filter((item) => !item.adminOnly || userRole === "ADMIN")
              .map((item) => (
                <MobileNavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  onClick={handleNavClick}
                >
                  {item.label}
                </MobileNavLink>
              ))}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
