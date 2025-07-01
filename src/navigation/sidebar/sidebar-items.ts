import { Home, ChartPie, Grid2X2, ChartLine, ShoppingBag, type LucideIcon } from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Dashboards",
    items: [
      { title: "Overview", url: "/main/dashboard/overview", icon: Home },
      { title: "Conversions", url: "/main/dashboard/conversions", icon: ChartPie },
      { title: "Traffic Breakdown", url: "/main/dashboard/traffic", icon: Grid2X2, comingSoon: true },
      { title: "Cohorts", url: "/main/dashboard/cohorts", icon: ChartLine, comingSoon: true },
      { title: "Landings", url: "/main/dashboard/landings", icon: ShoppingBag, comingSoon: true },
    ],
  },
];

// Secondary navigation items for bottom of sidebar
export const navSecondaryItems = [
  // пустой массив или оставьте только нужные пункты, если появятся другие
];
