import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Trophy, DollarSign, Users, TrendingUp, Calendar, Clock } from "lucide-react";
import { dashboardApi } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  amount: {
    label: "Total Amount",
    color: "#10b981",
  },
  profit: {
    label: "Profit",
    color: "#3b82f6",
  },
};

const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
];

function formatCurrency(value: number | string) {
  const num = Number(value);
  if (isNaN(num)) return 'Rs. 0';
  if (num >= 100000) return `Rs. ${(num / 100000).toFixed(1)} Lac`;
  if (num >= 1000) return `Rs. ${(num / 1000).toFixed(1)}K`;
  return `Rs. ${num.toLocaleString()}`;
}

export function HighValueSalesChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['high-value-sales'],
    queryFn: () => dashboardApi.getHighValueSales(15),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="p-4">
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const salesData = data?.data || [];

  // Take top 10 for chart
  const chartData = salesData.slice(0, 10).map((sale: any, index: number) => ({
    name: sale.customer_name?.length > 15 
      ? sale.customer_name.substring(0, 15) + '...' 
      : sale.customer_name || 'Unknown',
    fullName: sale.customer_name || 'Unknown',
    amount: parseFloat(sale.total_amount) || 0,
    profit: parseFloat(sale.estimated_profit) || 0,
    profitMargin: parseFloat(sale.profit_margin_percent) || 0,
    orderNumber: sale.order_number,
    date: sale.sale_date_formatted,
    itemsCount: parseInt(sale.items_count) || 0,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  // Calculate totals
  const totalValue = salesData.reduce((sum: number, s: any) => sum + (parseFloat(s.total_amount) || 0), 0);
  const totalProfit = salesData.reduce((sum: number, s: any) => sum + (parseFloat(s.estimated_profit) || 0), 0);
  const avgOrderValue = salesData.length > 0 ? totalValue / salesData.length : 0;
  const topSale = salesData[0];

  return (
    <Card className="shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Trophy className="h-5 w-5 text-green-600" />
              Recent High-Value Sales
            </CardTitle>
            <CardDescription className="text-sm mt-1">Top performing sales by total amount</CardDescription>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {salesData.length} Sales
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Total Value</span>
            </div>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalValue)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Total Profit</span>
            </div>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalProfit)}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 rounded-xl p-3 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Avg Order</span>
            </div>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{formatCurrency(avgOrderValue)}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
              <Trophy className="h-4 w-4" />
              <span className="text-xs font-medium">Top Sale</span>
            </div>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{formatCurrency(topSale?.total_amount || 0)}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Chart */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Top 10 by Amount</h4>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart 
                data={chartData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-700" />
                <XAxis 
                  type="number" 
                  tickFormatter={(v) => formatCurrency(v)}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    formatter={(value, name, props) => [
                      `Rs. ${Number(value).toLocaleString()}`,
                      name === 'amount' ? 'Total Amount' : 'Profit'
                    ]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  />}
                />
                <Bar 
                  dataKey="amount" 
                  radius={[0, 4, 4, 0]}
                  maxBarSize={30}
                >
                  {chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>

          {/* Sales List */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Recent Sales Details</h4>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {salesData.slice(0, 10).map((sale: any, index: number) => (
                  <div 
                    key={sale.id || index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-transparent hover:border-primary/20"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      >
                        {sale.rank || index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground truncate max-w-[120px]">
                          {sale.customer_name || 'Unknown'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{sale.sale_date_formatted}</span>
                          <span>•</span>
                          <span>{sale.items_count} items</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-green-600 dark:text-green-400">
                        {formatCurrency(sale.total_amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        +{formatCurrency(sale.estimated_profit)} profit
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}