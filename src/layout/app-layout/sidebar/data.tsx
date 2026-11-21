import { GearIcon, LayoutGridIcon, ListIcon, PieChartIcon } from "@/icons";
import type { NavItem } from "./types";

export const navItems: NavItem[] = [
  { key: "dashboard", icon: <LayoutGridIcon className="size-6" />, path: "/" },
  { key: "transactions", icon: <ListIcon className="size-6" />, path: "/transactions" },
  { key: "budget", icon: <PieChartIcon className="size-6" />, path: "/budget" },
  { key: "settings", icon: <GearIcon className="size-6" />, path: "/settings" },
];

export const supportItems: NavItem[] = [];
export const othersItems: NavItem[] = [];
