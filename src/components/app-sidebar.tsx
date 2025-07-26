"use client"

import * as React from "react"
import {
  PieChart,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "~/components/nav-main"
import { AuthNavUser } from "~/components/auth-nav-user"
import { TeamSwitcher } from "~/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar"

// Traffboard application data
const data = {
  user: {
    name: "Demo User",
    email: "demo@traffboard.com",
    avatar: "/avatars/user.jpg",
  },
  teams: [
    {
      name: "Traffboard",
      logo: PieChart,
      plan: "Pro",
    },
  ],
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: PieChart,
      items: [
        {
          title: "Cohort",
          url: "/reports/cohort",
        },
        {
          title: "Conversions",
          url: "/reports/conversions",
        },
        {
          title: "Quality",
          url: "/reports/quality",
        },
        {
          title: "Landings",
          url: "/reports/landings",
        },
      ],
    },
  ],
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar>

export function AppSidebar({ ...props }: AppSidebarProps) {
  // Settings and administration moved to AuthNavUser component
  const fullNavItems = data.navMain

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={fullNavItems} />
      </SidebarContent>
      <SidebarFooter>
        <AuthNavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
