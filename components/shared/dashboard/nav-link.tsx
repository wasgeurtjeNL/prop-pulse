'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: number;
}

export default function NavLink({ href, icon, children, badge }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <Button 
        variant={isActive ? "secondary" : "ghost"} 
        className={cn(
          "w-full justify-start gap-2 relative",
          isActive && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
        )}
      >
        {icon} {children}
        {badge !== undefined && badge > 0 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </Button>
    </Link>
  );
}












