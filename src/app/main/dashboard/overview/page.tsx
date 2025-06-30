export default function OverviewPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Analytics overview and key metrics for TraffBoard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-6">
          <h3 className="text-sm font-medium">Total Conversions</h3>
          <p className="text-2xl font-bold">1,234</p>
          <p className="text-muted-foreground text-xs">+20.1% from last month</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="text-sm font-medium">Conversion Rate</h3>
          <p className="text-2xl font-bold">3.2%</p>
          <p className="text-muted-foreground text-xs">+0.5% from last month</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="text-sm font-medium">Total Revenue</h3>
          <p className="text-2xl font-bold">$12,345</p>
          <p className="text-muted-foreground text-xs">+15.3% from last month</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="text-sm font-medium">Active Campaigns</h3>
          <p className="text-2xl font-bold">42</p>
          <p className="text-muted-foreground text-xs">3 new this week</p>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>
        <p className="text-muted-foreground">CSV data analysis and conversion tracking will appear here.</p>
      </div>
    </div>
  );
}
