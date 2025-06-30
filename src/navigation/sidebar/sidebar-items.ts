import { Home, ChartPie, Users, SquareArrowUpRight, type LucideIcon } from "lucide-react";

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
    label: "Analytics",
    items: [
      {
        title: "Overview",
        url: "/main/dashboard/overview",
        icon: Home,
      },
      {
        title: "Conversions",
        url: "/main/dashboard/conversions",
        icon: ChartPie,
      },
    ],
  },
  {
    id: 2,
    label: "Data Management",
    items: [
      {
        title: "CSV Upload",
        url: "/main/dashboard/upload",
        icon: SquareArrowUpRight,
        comingSoon: true,
      },
    ],
  },
  {
    id: 3,
    label: "Admin",
    items: [
      {
        title: "User Management",
        url: "/main/dashboard/users",
        icon: Users,
        comingSoon: true,
      },
    ],
  },
];
