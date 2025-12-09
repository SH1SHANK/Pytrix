"use client";

/**
 * AppSidebar - Main navigation sidebar using Aceternity sidebar.
 *
 * Uses the new motion-based sidebar with expandable/collapsible behavior.
 * Uses Phosphor icons for visual consistency with the rest of the app.
 */

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Sidebar, SidebarBody, useSidebar } from "@/components/ui/sidebar";
import {
  House,
  Books,
  GraduationCap,
  Lightning,
  ClockCounterClockwise,
  ChartBar,
  Gauge,
  Question,
  Bug,
  Code,
  Gear,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// Navigation items
const navItems = [
  // Core
  { label: "Dashboard", href: "/", icon: House },
  { label: "Modules", href: "/modules", icon: Books },
  { label: "Manual Practice", href: "/practice/manual", icon: GraduationCap },
  { label: "Auto Mode", href: "/practice/auto", icon: Lightning },
  { label: "History", href: "/history", icon: ClockCounterClockwise },
  // Insights
  { label: "Stats & Progress", href: "/insights/stats", icon: ChartBar },
  { label: "API Usage", href: "/insights/api-usage", icon: Gauge },
  // Support
  { label: "Settings", href: "/support/settings", icon: Gear },
  { label: "Help & Docs", href: "/support/help", icon: Question },
  { label: "Bug Report", href: "/support/bug-report", icon: Bug },
];

// Convert to SidebarLink format with active state styling
function NavLinks() {
  const pathname = usePathname();
  const { open, animate, setOpen } = useSidebar();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active = isActive(item.href);
        const IconComponent = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors group/nav-item",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <IconComponent
              weight={active ? "fill" : "duotone"}
              className="w-5 h-5 shrink-0"
            />
            <motion.span
              animate={{
                display: animate
                  ? open
                    ? "inline-block"
                    : "none"
                  : "inline-block",
                opacity: animate ? (open ? 1 : 0) : 1,
              }}
              className="text-sm font-medium whitespace-nowrap"
            >
              {item.label}
            </motion.span>
          </Link>
        );
      })}
    </div>
  );
}

// Logo component
function Logo() {
  const { open, animate } = useSidebar();

  return (
    <Link href="/" className="flex items-center gap-3 px-2 py-2 mb-4">
      <div className="flex aspect-square w-8 h-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
        <Code weight="bold" className="w-4 h-4" />
      </div>
      <motion.div
        animate={{
          display: animate ? (open ? "flex" : "none") : "flex",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="flex flex-col gap-0.5 leading-none"
      >
        <span className="font-semibold text-foreground">Pytrix</span>
        <span className="text-xs text-muted-foreground">Learn Python</span>
      </motion.div>
    </Link>
  );
}

// Footer with version
function SidebarFooter() {
  const { open, animate } = useSidebar();

  return (
    <div className="mt-auto px-2 py-4 border-t border-border">
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-xs text-muted-foreground"
      >
        v0.1.0
      </motion.span>
    </div>
  );
}

export function AppSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-4 border-r border-border bg-background">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Logo />
          <NavLinks />
        </div>
        <SidebarFooter />
      </SidebarBody>
    </Sidebar>
  );
}
