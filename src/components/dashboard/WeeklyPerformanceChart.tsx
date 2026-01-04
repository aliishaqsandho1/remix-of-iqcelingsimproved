import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { Activity, TrendingUp, DollarSign, ShoppingCart, Percent } from "lucide-react";
import { dashboardApi } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#10b981",
  },
  profit: {
    label: "Profit",
    color: "#3b82f6",
  },
};

function formatNumber(value: number | string) {
  const num = Number(value);
  if (isNaN(num)) return '0';
  if (num >= 10000000) return (num / 10000000).toFixed(2) + ' Cr';
  if (num >= 100000) return (num / 100000).toFixed(2) + ' Lac';
  if (num >= 1000) return (num / 1000).toFixed(2) + ' K';
  return num.toFixed(0);
}

export function WeeklyPerformanceChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['weekly-performance-trend'],
    queryFn: dashboardApi.getWeeklyPerformanceTrend,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const weeklyData = data?.data || [];
  
  // Transform data for the chart
  const chartData = weeklyData.map((week: any) => ({
    name: week.date_range || week.week_label,
    revenue: parseFloat(week.revenue) || 0,
    profit: parseFloat(week.profit) || 0,
    salesCount: parseInt(week.sales_count) || 0,
    profitMargin: parseFloat(week.profit_margin_percent) || 0,
    cogs: parseFloat(week.cogs) || 0,
  })).reverse(); // Reverse to show oldest first

  // Calculate totals
  const totalRevenue = chartData.reduce((sum: number, w: any) => sum + w.revenue, 0);
  const totalProfit = chartData.reduce((sum: number, w: any) => sum + w.profit, 0);
  const totalSales = chartData.reduce((sum: number, w: any) => sum + w.salesCount, 0);
  const avgMargin = chartData.length > 0 
    ? chartData.reduce((sum: number, w: any) => sum + w.profitMargin, 0) / chartData.length 
    : 0;

  return (
    <Card className="shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Activity className="h-5 w-5 text-indigo-600" />
              Weekly Performance Trend
            </CardTitle>
            <CardDescription className="text-sm mt-1">Revenue, profit, and sales performance over weeks</CardDescription>
          </div>
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
            {chartData.length} Weeks
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Total Revenue</span>
            </div>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">Rs. {formatNumber(totalRevenue)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Total Profit</span>
            </div>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">Rs. {formatNumber(totalProfit)}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-xs font-medium">Total Sales</span>
            </div>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{totalSales}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
              <Percent className="h-4 w-4" />
              <span className="text-xs font-medium">Avg Margin</span>
            </div>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{avgMargin.toFixed(1)}%</p>
          </div>
        </div>

        {/* Chart */}
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-700" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11, fill: 'currentColor' }} 
              tickLine={false}
              axisLine={false}
              angle={-15}
              textAnchor="end"
              height={50}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: 'currentColor' }} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `Rs. ${formatNumber(value)}`}
            />
            <ChartTooltip 
              content={<ChartTooltipContent 
                formatter={(value, name) => [
                  `Rs. ${Number(value).toLocaleString()}`,
                  name === 'revenue' ? 'Revenue' : 'Profit'
                ]}
              />}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#10b981" 
              strokeWidth={2.5}
              fill="url(#colorRevenue)" 
              name="Revenue"
            />
            <Area 
              type="monotone" 
              dataKey="profit" 
              stroke="#3b82f6" 
              strokeWidth={2.5}
              fill="url(#colorProfit)" 
              name="Profit"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}