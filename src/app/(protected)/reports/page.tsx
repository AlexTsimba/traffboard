import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"

const reports = [
  {
    title: "Cohort",
    description: "Analyze user cohort behavior and retention patterns",
    url: "/reports/cohort",
  },
  {
    title: "Conversions",
    description: "Track conversion rates and funnel performance",
    url: "/reports/conversions",
  },
  {
    title: "Quality",
    description: "Monitor traffic quality and engagement metrics",
    url: "/reports/quality",
  },
  {
    title: "Landings",
    description: "Analyze landing page performance and optimization",
    url: "/reports/landings",
  },
]

export default function ReportsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {reports.map((report) => (
          <Link key={report.title} href={report.url}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle>{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}