"use client";
import { SidebarLayoutSwitcherModern } from "./sidebar-layout-switcher-modern";
import { ThemeSwitcherModern } from "./theme-switcher-modern";

export default function AppearanceSettings() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-2 text-lg font-semibold">Theme</h2>
        <ThemeSwitcherModern />
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold">Sidebar Layout</h2>
        <SidebarLayoutSwitcherModern />
      </section>
    </div>
  );
}
