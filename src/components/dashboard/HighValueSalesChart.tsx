import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Trophy, TrendingUp, Calendar, Package } from "lucide-react";
import { dashboardApi } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#a855f7', '#10b981', '#0ea5e9', '#eab308',
];

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
      <Card className="border border-border/50 rounded-xl overflow-hidden bg-card">
        <CardHeader className="pb-2 border-b border-border/30">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const salesData = data?.data || [];
  
  const chartData = salesData.slice(0, 10).map((sale: any, index: number) => ({
    name: sale.customer_name?.length > 14 
      ? sale.customer_name.substring(0, 14) + '...' 
      : sale.customer_name || 'Unknown',
    fullName: sale.customer_name || 'Unknown',
    amount: parseFloat(sale.total_amount) || 0,
    profit: parseFloat(sale.estimated_profit) || 0,
    color: COLORS[index % COLORS.length],
  }));

  const totalValue = salesData.reduce((sum: number, s: any) => sum + (parseFloat(s.total_amount) || 0), 0);
  const totalProfit = salesData.reduce((sum: number, s: any) => sum + (parseFloat(s.estimated_profit) || 0), 0);
  const avgOrderValue = salesData.length > 0 ? totalValue / salesData.length : 0;
  const topSale = salesData[0];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border border-border">
          <p className="font-semibold text-sm">{data.fullName}</p>
          <p className="text-primary font-bold">{formatCurrency(data.amount)}</p>
          <p className="text-xs text-muted-foreground">{formatProfit(data.profit)} profit</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border border-border/50 rounded-xl overflow-hidden bg-card shadow-sm">
      {/* Clean Header */}
      <CardHeader className="pb-3 border-b border-border/30 bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Trophy className="h-4 w-4 text-amber-500" />
            Recent High-Value Sales
          </CardTitle>
          <Badge variant="secondary" className="text-xs font-medium">
            {salesData.length} Sales
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {/* Compact Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Total Value</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalValue)}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Total Profit</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalProfit)}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Avg Order</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatCurrency(avgOrderValue)}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Top Sale</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatCurrency(topSale?.total_amount || 0)}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          
          {/* Sales List - Takes 3 columns, 3-column grid */}
          <div className="lg:col-span-5">
            <p className="text-xs font-medium text-muted-foreground mb-3">All Sales Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {salesData.map((sale: any, index: number) => {
                const profit = parseFloat(sale.estimated_profit) || 0;
                return (
                  <div 
                    key={sale.id || index}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-border/40 bg-muted/10 hover:bg-muted/30 transition-colors"
                  >
                    <div 
                      className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs text-foreground truncate">
                        {sale.customer_name || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Calendar className="h-2.5 w-2.5" />
                        <span>{sale.sale_date_formatted}</span>
                        <span className="mx-0.5">•</span>
                        <Package className="h-2.5 w-2.5" />
                        <span>{sale.items_count}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-xs" style={{ color: COLORS[index % COLORS.length] }}>
                        {formatCurrency(sale.total_amount)}
                      </p>
                      <p className={`text-[10px] font-medium ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {formatProfit(profit)}
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
