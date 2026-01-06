import { useState, useEffect } from "react";
import { Users, Eye, Download, TrendingUp } from "lucide-react";
import { statsService } from "@/services/statsService";
import { SiteStats } from "@/types/user";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const AdminStats = () => {
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await statsService.getSiteStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-500" },
    { label: "Total Views", value: stats?.totalViews || 0, icon: Eye, color: "text-green-500" },
    { label: "Total Downloads", value: stats?.totalDownloads || 0, icon: Download, color: "text-purple-500" },
    { label: "This Month", value: stats?.monthlyUsers[5]?.count || 0, icon: TrendingUp, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="content-card p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-secondary ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Users Chart */}
      <div className="content-card p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly User Registrations</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.monthlyUsers || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
