import { redirect } from "next/navigation";

export default function DashboardPage() {
  redirect("/main/dashboard/overview");
  return;
}
