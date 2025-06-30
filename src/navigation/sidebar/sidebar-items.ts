import {
  Home,
  ChartPie,
  Grid2X2,
  ChartLine,
  ShoppingBag,
  Users,
  SquareArrowUpRight,
  type LucideIcon,
} from "lucide-react";

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
      {
        title: "Dashboards",
        url: "/main/dashboard",
        icon: Home,
        subItems: [
          { title: "Overview", url: "/main/dashboard/overview", icon: Home },
          { title: "Conversions", url: "/main/dashboard/conversions", icon: ChartPie },
          { title: "Traffic Breakdown", url: "/main/dashboard/traffic", icon: Grid2X2, comingSoon: true },
          { title: "Cohorts", url: "/main/dashboard/cohorts", icon: ChartLine, comingSoon: true },
          { title: "Landings", url: "/main/dashboard/landings", icon: ShoppingBag, comingSoon: true },
        ],
      },
    ],
  },
];

// Secondary navigation items for bottom of sidebar
export const navSecondaryItems = [
  {
    title: "CSV Upload",
    url: "/main/dashboard/upload",
    icon: SquareArrowUpRight,
    comingSoon: true,
  },
  {
    title: "User Management",
    url: "/main/dashboard/users",
    icon: Users,
    comingSoon: true,
  },
];
