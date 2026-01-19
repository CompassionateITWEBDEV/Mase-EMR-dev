"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LucideIcon } from "lucide-react";

interface TabItem {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface ResponsiveTabsListProps {
  tabs: TabItem[];
  value: string;
  onValueChangeAction: (value: string) => void;
  className?: string;
  /**
   * Number of tabs to show on desktop before overflow
   * @default 6
   */
  maxVisibleDesktop?: number;
  /**
   * Number of tabs to show on tablet before overflow
   * @default 4
   */
  maxVisibleTablet?: number;
  /**
   * Number of tabs to show on mobile before overflow
   * @default 2
   */
  maxVisibleMobile?: number;
}

/**
 * ResponsiveTabsList - A responsive tab list that handles overflow gracefully
 *
 * On smaller screens, excess tabs are moved to a dropdown "More" menu.
 * Uses CSS media queries for responsive behavior.
 */
export function ResponsiveTabsList({
  tabs,
  value,
  onValueChangeAction,
  className,
  maxVisibleDesktop = 6,
  maxVisibleTablet = 4,
  maxVisibleMobile = 2,
}: ResponsiveTabsListProps) {
  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determine max visible based on screen size
  const maxVisible = React.useMemo(() => {
    if (windowWidth < 640) return maxVisibleMobile;
    if (windowWidth < 1024) return maxVisibleTablet;
    return maxVisibleDesktop;
  }, [windowWidth, maxVisibleDesktop, maxVisibleTablet, maxVisibleMobile]);

  const visibleTabs = tabs.slice(0, maxVisible);
  const overflowTabs = tabs.slice(maxVisible);
  const activeOverflowTab = overflowTabs.find((tab) => tab.value === value);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <TabsList className="flex-1 h-auto flex-wrap justify-start">
        {visibleTabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="flex items-center gap-1">
            {tab.icon && <tab.icon className="h-4 w-4" />}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {overflowTabs.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={activeOverflowTab ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-1">
              {activeOverflowTab ? (
                <>
                  {activeOverflowTab.icon && (
                    <activeOverflowTab.icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {activeOverflowTab.label}
                  </span>
                </>
              ) : (
                <span>More</span>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {overflowTabs.map((tab) => (
              <DropdownMenuItem
                key={tab.value}
                onClick={() => onValueChangeAction(tab.value)}
                className={cn(
                  "flex items-center gap-2 cursor-pointer",
                  value === tab.value && "bg-accent"
                )}>
                {tab.icon && <tab.icon className="h-4 w-4" />}
                {tab.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/**
 * ScrollableTabsList - Alternative approach using horizontal scroll
 */
export function ScrollableTabsList({
  tabs,
  value,
  onValueChangeAction,
  className,
}: {
  tabs: TabItem[];
  value: string;
  onValueChangeAction: (value: string) => void;
  className?: string;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Scroll active tab into view
  React.useEffect(() => {
    if (scrollRef.current) {
      const activeTab = scrollRef.current.querySelector(
        '[data-state="active"]'
      );
      if (activeTab) {
        activeTab.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [value]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
        className
      )}>
      <TabsList className="inline-flex w-max min-w-full justify-start">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="flex items-center gap-1 whitespace-nowrap">
            {tab.icon && <tab.icon className="h-4 w-4" />}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}
