"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import Link from "next/link";
import { LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getNavItems } from "./sidebar";
import { useRouter, usePathname } from "next/navigation";

interface UserData {
  name: string;
  email: string;
  username?: string | null;
  profileImage?: string | null;
  role?: string | null;
}

interface DashboardTopbarProps {
  userData: UserData | null;
  softwareName: string;
}

// Map paths to page titles
const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/add-cylinder": "Add Cylinder",
  "/add-customer": "Add Customer",
  "/expenses": "Expenses Management",
  "/payments": "Payment Management",
  "/payment-logs": "Payment Logs",
  "/inventory": "Inventory Management",
  "/reports": "Reports & Analytics",
  "/backup": "Backup",
  "/notes": "Notes",
  "/settings": "Settings",
  "/super-admin": "Super Admin",
};

export function DashboardTopbar({ userData, softwareName }: DashboardTopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<UserData | null>(userData);

  // Get filtered nav items based on user role - recompute when userData changes
  const navItems = useMemo(() => getNavItems(userData?.role || null), [userData?.role]);
  
  // Get current page title based on pathname
  const currentPageTitle = pageTitles[pathname] || "Dashboard";

  // Update user data when prop changes (e.g., after profile update)
  useEffect(() => {
    setUser(userData);
  }, [userData]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      router.refresh();
    };

    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, [router]);

  function handleLogout() {
    startTransition(async () => {
      try {
        // Call logout API route to clear the session cookie
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });

        if (response.ok) {
          // Redirect to login page after successful logout
          window.location.href = "/login";
        } else {
          // Fallback: redirect anyway
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("Logout error:", error);
        // Fallback: redirect anyway
        window.location.href = "/login";
      }
    });
  }

  return (
    <header className="w-full border-b bg-[#f5f7fb] px-4 py-6 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b px-6 py-4 text-left">
                <SheetTitle>LPG Nexus</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 p-6">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <item.icon className="h-5 w-5" strokeWidth={1.5} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{currentPageTitle}</h1>
            <p className="text-sm text-slate-500">Welcome to {softwareName}</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 gap-3 rounded-2xl border border-transparent bg-white px-3 text-left shadow-sm hover:border-slate-200">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.profileImage ?? undefined} alt={user?.name ?? "User"} />
                  <AvatarFallback>
                    {user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left text-sm sm:block">
                  <div className="font-medium text-slate-900">{user?.name || "User"}</div>
                  <div className="text-xs text-slate-500">{user?.email || ""}</div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="w-full">
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/team" className="w-full">
                  Team
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/contact" className="w-full">
                  Contact Us
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/" className="w-full">
                  Website
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/404" className="w-full">
                  404
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 disabled:opacity-60 md:flex"
          >
            <LogOut className="h-4 w-4" />
            {isPending ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </header>
  );
}

