import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip } from "recharts";
import { Trophy, DollarSign, TrendingUp, ShoppingCart, Calendar, Package } from "lucide-react";
import { dashboardApi } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

const GRADIENT_COLORS = [
  { start: '#10b981', end: '#059669' },
  { start: '#3b82f6', end: '#2563eb' },
  { start: '#f59e0b', end: '#d97706' },
  { start: '#ef4444', end: '#dc2626' },
  { start: '#8b5cf6', end: '#7c3aed' },
  { start: '#06b6d4', end: '#0891b2' },
  { start: '#ec4899', end: '#db2777' },
  { start: '#84cc16', end: '#65a30d' },
  { start: '#f97316', end: '#ea580c' },
  { start: '#6366f1', end: '#4f46e5' },
  { start: '#14b8a6', end: '#0d9488' },
  { start: '#a855f7', end: '#9333ea' },
  { start: '#22c55e', end: '#16a34a' },
  { start: '#0ea5e9', end: '#0284c7' },
  { start: '#eab308', end: '#ca8a04' },
];

const chartConfig = {
  amount: { label: "Total Amount", color: "#10b981" },
};

function formatCurrency(value: number | string) {
  const num = Number(value);
  if (isNaN(num)) return 'Rs. 0';
  if (num >= 100000) return `Rs. ${(num / 100000).toFixed(1)} Lac`;
  if (num >= 1000) return `Rs. ${(num / 1000).toFixed(1)}K`;
  return `Rs. ${num.toLocaleString()}`;
}

function formatProfit(value: number | string) {
  const num = Number(value);
  if (isNaN(num)) return '+Rs. 0';
  const prefix = num >= 0 ? '+' : '';
  if (Math.abs(num) >= 100000) return `${prefix}Rs. ${(num / 100000).toFixed(1)} Lac`;
  if (Math.abs(num) >= 1000) return `${prefix}Rs. ${(num / 1000).toFixed(1)}K`;
  return `${prefix}Rs. ${num.toLocaleString()}`;
}

export function HighValueSalesChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['high-value-sales'],
    queryFn: () => dashboardApi.getHighValueSales(15),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-green-500 to-emerald-600">
          <Skeleton className="h-6 w-48 bg-white/20" />
        </CardHeader>
        <CardContent className="p-6">
          <Skeleton className="h-[500px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const salesData = data?.data || [];
  
  const chartData = salesData.slice(0, 10).map((sale: any, index: number) => ({
    name: sale.customer_name?.length > 12 
      ? sale.customer_name.substring(0, 12) + '...' 
      : sale.customer_name || 'Unknown',
    fullName: sale.customer_name || 'Unknown',
    amount: parseFloat(sale.total_amount) || 0,
    profit: parseFloat(sale.estimated_profit) || 0,
    color: GRADIENT_COLORS[index % GRADIENT_COLORS.length].start,
  }));

  const totalValue = salesData.reduce((sum: number, s: any) => sum + (parseFloat(s.total_amount) || 0), 0);
  const totalProfit = salesData.reduce((sum: number, s: any) => sum + (parseFloat(s.estimated_profit) || 0), 0);
  const avgOrderValue = salesData.length > 0 ? totalValue / salesData.length : 0;
  const topSale = salesData[0];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700">
          <p className="font-semibold text-sm mb-1">{data.fullName}</p>
          <p className="text-green-600 font-bold">{formatCurrency(data.amount)}</p>
          <p className="text-xs text-muted-foreground">{formatProfit(data.profit)} profit</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-4 bg-gradient-to-r from-green-500 to-emerald-600">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-white">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            Recent High-Value Sales
          </CardTitle>
          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-3 py-1">
            {salesData.length} Sales
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
            <DollarSign className="h-5 w-5 mb-2 opacity-80" />
            <p className="text-xs font-medium opacity-80">Total Value</p>
            <p className="text-xl font-bold">{formatCurrency(totalValue)}</p>
          </div>
          <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
            <TrendingUp className="h-5 w-5 mb-2 opacity-80" />
            <p className="text-xs font-medium opacity-80">Total Profit</p>
            <p className="text-xl font-bold">{formatCurrency(totalProfit)}</p>
          </div>
          <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
            <ShoppingCart className="h-5 w-5 mb-2 opacity-80" />
            <p className="text-xs font-medium opacity-80">Avg Order</p>
            <p className="text-xl font-bold">{formatCurrency(avgOrderValue)}</p>
          </div>
          <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
            <Trophy className="h-5 w-5 mb-2 opacity-80" />
            <p className="text-xs font-medium opacity-80">Top Sale</p>
            <p className="text-xl font-bold">{formatCurrency(topSale?.total_amount || 0)}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Chart Section */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Top 10 by Amount
            </h4>
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <BarChart 
                data={chartData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis 
                  type="number" 
                  tickFormatter={(v) => formatCurrency(v)}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="amount" 
                  radius={[0, 8, 8, 0]}
                  maxBarSize={28}
                >
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>

          {/* Sales List - All 15 items visible */}
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              All Sales Details
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {salesData.map((sale: any, index: number) => {
                const gradient = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
                const profit = parseFloat(sale.estimated_profit) || 0;
                return (
                  <div 
                    key={sale.id || index}
                    className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-750 hover:shadow-md transition-all duration-200 border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md"
                        style={{ background: `linear-gradient(135deg, ${gradient.start}, ${gradient.end})` }}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                          {sale.customer_name || 'Unknown'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="h-3 w-3" />
                          <span>{sale.sale_date_formatted}</span>
                          <Package className="h-3 w-3 ml-1" />
                          <span>{sale.items_count} items</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm" style={{ color: gradient.start }}>
                        {formatCurrency(sale.total_amount)}
                      </p>
                      <p className={`text-xs font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {formatProfit(profit)} profit
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
