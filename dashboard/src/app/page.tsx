"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDashboardStats,
  fetchFilterOptions,
  generateDemoData,
  clearDemoData,
  getExportUrl,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Download,
  RefreshCw,
  Zap,
  Target,
  Trophy,
  Skull,
  TrendingUp,
  Database,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

const COLORS = ["#00ff88", "#ff4444", "#ffaa00", "#00d4ff", "#ff00ff", "#8800ff"];

export default function Dashboard() {
  const [days, setDays] = useState(7);
  const [appVersion, setAppVersion] = useState<string | undefined>();
  const [platform, setPlatform] = useState<string | undefined>();

  const queryClient = useQueryClient();

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ["dashboard-stats", days, appVersion, platform],
    queryFn: () => fetchDashboardStats(days, appVersion, platform),
  });

  const { data: filters } = useQuery({
    queryKey: ["filter-options"],
    queryFn: fetchFilterOptions,
  });

  const generateMutation = useMutation({
    mutationFn: () => generateDemoData(7, 50),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["filter-options"] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: clearDemoData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["filter-options"] });
    },
  });

  const handleExport = () => {
    const url = getExportUrl(days, appVersion, platform);
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-[rgb(10,10,26)] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 text-[#ffaa00]" />
          <h1 className="text-2xl font-bold tracking-wider">PULSE FORGE ANALYTICS</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="bg-[#1a1a2e] border-[#333] hover:bg-[#2a2a4e]"
          >
            <Database className="h-4 w-4 mr-2" />
            {generateMutation.isPending ? "Generating..." : "Generate Demo"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending}
            className="bg-[#1a1a2e] border-[#333] hover:bg-[#2a2a4e] text-red-400"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-[#14142a] rounded-lg border border-[#333]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Period:</span>
          <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
            <SelectTrigger className="w-32 bg-[#1a1a2e] border-[#333]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-[#333]">
              <SelectItem value="1">Last 24h</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Version:</span>
          <Select
            value={appVersion || "all"}
            onValueChange={(v) => setAppVersion(v === "all" ? undefined : v)}
          >
            <SelectTrigger className="w-32 bg-[#1a1a2e] border-[#333]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-[#333]">
              <SelectItem value="all">All</SelectItem>
              {filters?.app_versions.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Platform:</span>
          <Select
            value={platform || "all"}
            onValueChange={(v) => setPlatform(v === "all" ? undefined : v)}
          >
            <SelectTrigger className="w-32 bg-[#1a1a2e] border-[#333]">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-[#333]">
              <SelectItem value="all">All</SelectItem>
              {filters?.platforms.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="bg-[#1a1a2e] border-[#333] hover:bg-[#2a2a4e]"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="bg-[#1a1a2e] border-[#333] hover:bg-[#2a2a4e]"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 bg-[#1a1a2e]" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="bg-[#14142a] border-[#333]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-[#00ff88]" />
                  <div>
                    <p className="text-sm text-gray-400">Total Runs</p>
                    <p className="text-2xl font-bold">{stats?.summary.total_runs || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#14142a] border-[#333]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Trophy className="h-8 w-8 text-[#ffaa00]" />
                  <div>
                    <p className="text-sm text-gray-400">Avg Score</p>
                    <p className="text-2xl font-bold">{stats?.summary.avg_score || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#14142a] border-[#333]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-[#00d4ff]" />
                  <div>
                    <p className="text-sm text-gray-400">Blueprints Earned</p>
                    <p className="text-2xl font-bold">{stats?.summary.total_blueprints || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#14142a] border-[#333]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skull className="h-8 w-8 text-[#ff4444]" />
                  <div>
                    <p className="text-sm text-gray-400">Top Death Cause</p>
                    <p className="text-2xl font-bold capitalize">
                      {stats?.death_causes[0]?.cause || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Death Causes Pie */}
            <Card className="bg-[#14142a] border-[#333]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Death Causes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats?.death_causes || []}
                      dataKey="count"
                      nameKey="cause"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ cause, percent }) =>
                        `${cause} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {stats?.death_causes.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#14142a", border: "1px solid #333" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Segment Distribution */}
            <Card className="bg-[#14142a] border-[#333]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Segment Reached</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats?.segment_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                      dataKey="segment"
                      stroke="#666"
                      tick={{ fill: "#888" }}
                    />
                    <YAxis stroke="#666" tick={{ fill: "#888" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#14142a", border: "1px solid #333" }}
                    />
                    <Bar dataKey="count" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Score Distribution */}
            <Card className="bg-[#14142a] border-[#333]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats?.score_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="bucket" stroke="#666" tick={{ fill: "#888" }} />
                    <YAxis stroke="#666" tick={{ fill: "#888" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#14142a", border: "1px solid #333" }}
                    />
                    <Bar dataKey="count" fill="#00ff88" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Blueprints Distribution */}
            <Card className="bg-[#14142a] border-[#333]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Blueprints per Run</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats?.blueprints_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="bucket" stroke="#666" tick={{ fill: "#888" }} />
                    <YAxis stroke="#666" tick={{ fill: "#888" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#14142a", border: "1px solid #333" }}
                    />
                    <Bar dataKey="count" fill="#ffaa00" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Upgrade Picks */}
          <Card className="bg-[#14142a] border-[#333] mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Top Upgrade Picks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={stats?.upgrade_picks.slice(0, 10) || []}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis type="number" stroke="#666" tick={{ fill: "#888" }} />
                    <YAxis
                      type="category"
                      dataKey="upgrade_id"
                      stroke="#666"
                      tick={{ fill: "#888" }}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#14142a", border: "1px solid #333" }}
                    />
                    <Bar dataKey="picks" fill="#ff00ff" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <Table>
                  <TableHeader>
                    <TableRow className="border-[#333]">
                      <TableHead className="text-gray-400">Upgrade</TableHead>
                      <TableHead className="text-gray-400">Rarity</TableHead>
                      <TableHead className="text-gray-400">Category</TableHead>
                      <TableHead className="text-gray-400 text-right">Picks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.upgrade_picks.slice(0, 10).map((u, i) => (
                      <TableRow key={i} className="border-[#333]">
                        <TableCell className="font-medium">{u.upgrade_id}</TableCell>
                        <TableCell>
                          <Badge
                            variant={u.rarity === "legendary" ? "destructive" : "secondary"}
                            className={
                              u.rarity === "rare"
                                ? "bg-blue-600"
                                : u.rarity === "legendary"
                                ? "bg-purple-600"
                                : "bg-gray-600"
                            }
                          >
                            {u.rarity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">{u.category}</TableCell>
                        <TableCell className="text-right font-mono">{u.picks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Tables */}
          <div className="grid grid-cols-2 gap-4">
            {/* Recent Runs */}
            <Card className="bg-[#14142a] border-[#333]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent Runs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#333]">
                        <TableHead className="text-gray-400">Time</TableHead>
                        <TableHead className="text-gray-400">Score</TableHead>
                        <TableHead className="text-gray-400">Duration</TableHead>
                        <TableHead className="text-gray-400">Death</TableHead>
                        <TableHead className="text-gray-400">Platform</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats?.recent_runs.slice(0, 15).map((run) => (
                        <TableRow key={run._id} className="border-[#333]">
                          <TableCell className="text-gray-400 text-sm">
                            {run.ts ? format(new Date(run.ts), "MMM d HH:mm") : "N/A"}
                          </TableCell>
                          <TableCell className="font-mono text-[#00ff88]">
                            {run.score}
                          </TableCell>
                          <TableCell className="font-mono">{run.duration}s</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                run.death_cause === "wall"
                                  ? "border-red-500 text-red-400"
                                  : run.death_cause === "drone"
                                  ? "border-orange-500 text-orange-400"
                                  : run.death_cause === "laser"
                                  ? "border-yellow-500 text-yellow-400"
                                  : "border-gray-500 text-gray-400"
                              }
                            >
                              {run.death_cause || "survived"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400">{run.platform}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Recent Purchases */}
            <Card className="bg-[#14142a] border-[#333]">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent Purchases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#333]">
                        <TableHead className="text-gray-400">Time</TableHead>
                        <TableHead className="text-gray-400">Item</TableHead>
                        <TableHead className="text-gray-400">Type</TableHead>
                        <TableHead className="text-gray-400 text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats?.recent_purchases.length === 0 ? (
                        <TableRow className="border-[#333]">
                          <TableCell colSpan={4} className="text-center text-gray-500">
                            No purchases yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        stats?.recent_purchases.map((p) => (
                          <TableRow key={p._id} className="border-[#333]">
                            <TableCell className="text-gray-400 text-sm">
                              {p.ts ? format(new Date(p.ts), "MMM d HH:mm") : "N/A"}
                            </TableCell>
                            <TableCell className="font-medium">{p.item_id}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  p.item_type === "cosmetic"
                                    ? "border-purple-500 text-purple-400"
                                    : "border-blue-500 text-blue-400"
                                }
                              >
                                {p.item_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-[#ffaa00]">
                              {p.cost} BP
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
