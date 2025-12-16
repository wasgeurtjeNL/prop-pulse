'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export default function NavLink({ href, icon, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href}>
      <Button 
        variant={isActive ? "secondary" : "ghost"} 
        className={cn(
          "w-full justify-start gap-2",
          isActive && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
        )}
      >
        {icon} {children}
      </Button>
    </Link>
  );
}



