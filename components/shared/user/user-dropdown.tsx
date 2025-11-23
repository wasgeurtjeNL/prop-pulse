"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LogOut,
  User2,
  BriefcaseBusiness,
  Loader2,
  LayoutDashboard, // 1. Import Dashboard Icon
} from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { getUserInitials } from "@/lib/utils";
import { switchUserRole } from "@/lib/actions/user.actions";

const UserDropdown = () => {
  const { data: session } = authClient.useSession();
  const [isLoading, setIsLoading] = useState(false);

  if (!session) return null;

  const userInitials = getUserInitials(session?.user?.name);
  const avatarUrl =
    session?.user?.image ||
    `https://avatar.vercel.sh/${userInitials}.svg?text=${userInitials}`;

  const isAgent = session?.user.role === "AGENT";

  const handleRoleSwitch = async () => {
    setIsLoading(true);
    try {
      await switchUserRole();
      toast.success(
        isAgent ? "Switched to User view" : "Welcome to Agent mode!"
      );
      window.location.reload();
    } catch (error) {
      console.log(error);
      toast.error("Failed to switch roles");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative h-10 w-10 rounded-full cursor-pointer transition-opacity hover:opacity-80">
          <Avatar className="h-10 w-10 border border-slate-200">
            <AvatarImage src={avatarUrl} alt={session.user.name || "User"} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
        <div className="flex items-center justify-start gap-3 p-2 mb-1">
          <div className="flex flex-col space-y-1 leading-none">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">
                {session?.user.name}
              </p>
              {isAgent && (
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  PRO
                </span>
              )}
            </div>
            <p className="w-[180px] truncate text-xs text-gray-500">
              {session?.user.email}
            </p>
          </div>
        </div>

        <div className="px-1 py-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              handleRoleSwitch();
            }}
            disabled={isLoading}
            className={`
               w-full flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all cursor-pointer
               ${
                 isAgent
                   ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                   : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90"
               }
             `}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isAgent ? (
              <>
                <User2 className="h-4 w-4" /> Switch to User
              </>
            ) : (
              <>
                <BriefcaseBusiness className="h-4 w-4" /> Switch to Agent
              </>
            )}
          </button>
        </div>

        {isAgent && (
          <>
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard"
                className="flex items-center py-2.5 cursor-pointer font-medium text-indigo-600 focus:text-indigo-700 focus:bg-indigo-50"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Agent Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          className="flex items-center text-red-600 focus:text-red-600 focus:bg-red-50 py-2.5 cursor-pointer"
          onClick={async () => {
            await authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.href = "/sign-in";
                },
              },
            });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
