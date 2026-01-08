"use client";

import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import NavLink from "./nav-link";

export function OwnerPortalNavLink() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await fetch("/api/owner-portal/stats");
        const data = await response.json();
        if (response.ok && data.stats) {
          setPendingCount(data.stats.pendingPriceRequests || 0);
        }
      } catch (error) {
        console.error("Failed to fetch pending count:", error);
      }
    };

    fetchPendingCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NavLink 
      href="/dashboard/owner-portal" 
      icon={<Users className="h-4 w-4" />}
      badge={pendingCount}
    >
      Owner Portal
    </NavLink>
  );
}
