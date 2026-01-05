import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Package, AlertTriangle } from 'lucide-react';
import { dashboardApi } from '@/services/api';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const chartConfig = {
  revenue: { label: "Revenue", color: "#10b981" },
  profit: { label: "Profit", color: "#3b82f6" },
  quantity: { label: "Quantity", color: "#f59e0b" },
};

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(0);
};

// Gradient colors for top products chart
const topProductColors = [
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
];

// Red gradient for dead stock
const deadStockColors = [
  '#ef4444', '#f87171', '#fb923c', '#fbbf24', '#f59e0b',
  '#ef4444', '#f87171', '#fb923c', '#fbbf24', '#f59e0b',
  '#ef4444', '#f87171', '#fb923c', '#fbbf24', '#f59e0b',
];

export function ProductPerformanceChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['product-performance'],
    queryFn: () => dashboardApi.getProductPerformance({ limit: 15, period_days: 90 }),
  });

  if (isLoading) {
    return (
      <Card className="shadow-xl border-0 rounded-2xl">
        <CardContent className="flex items-center justify-center h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.data) {
    return (
      <Card className="shadow-xl border-0 rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center h-[400px] text-center">
          <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Unable to load product performance data</p>
        </CardContent>
      </Card>
    );
  }

  const responseData = data?.data || data;
  const { top_products = [], dead_products = [] } = responseData || {};
  const summary = (data as any)?.summary || responseData?.summary || {};
  const metadata = (data as any)?.metadata || responseData?.metadata || {};

  // Prepare chart data for all top products
  const topChartData = top_products.map((p: any, idx: number) => ({
    name: p.product_name?.substring(0, 12) + (p.product_name?.length > 12 ? '...' : ''),
    fullName: p.product_name,
    revenue: parseFloat(p.total_revenue) || 0,
    profit: parseFloat(p.total_profit) || 0,
    quantity: parseFloat(p.total_quantity_sold) || 0,
    margin: parseFloat(p.profit_margin_percent) || 0,
    color: topProductColors[idx % topProductColors.length],
  }));

  // Prepare chart data for all dead products
  const deadChartData = dead_products.map((p: any, idx: number) => ({
    name: p.product_name?.substring(0, 12) + (p.product_name?.length > 12 ? '...' : ''),
    fullName: p.product_name,
    value: parseFloat(p.dead_stock_value) || 0,
    stock: parseFloat(p.current_stock) || 0,
    color: deadStockColors[idx % deadStockColors.length],
  }));

  return (
    <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-violet-50 to-purple-100 dark:from-violet-950/30 dark:to-purple-900/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Package className="h-5 w-5 text-violet-600" />
              Product Performance
            </CardTitle>
            <CardDescription>Top performers & dead stock analysis</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs bg-white/50 dark:bg-black/20">
            {metadata?.analysis_period || 'Last 90 days'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <Tabs defaultValue="top" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="top" className="flex items-center gap-2 data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-700">
              <TrendingUp className="h-4 w-4" />
              Top Products
            </TabsTrigger>
            <TabsTrigger value="dead" className="flex items-center gap-2 data-[state=active]:bg-red-500/10 data-[state=active]:text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Dead Stock
            </TabsTrigger>
          </TabsList>

          <TabsContent value="top" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/30 border border-emerald-200/50 dark:border-emerald-700/30 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  Rs {formatCurrency(parseFloat(summary.top_products?.total_revenue?.replace(/,/g, '') || '0'))}
                </div>
                <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Total Revenue</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 border border-blue-200/50 dark:border-blue-700/30 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  Rs {formatCurrency(parseFloat(summary.top_products?.total_profit?.replace(/,/g, '') || '0'))}
                </div>
                <div className="text-xs text-blue-600/70 dark:text-blue-400/70">Total Profit</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/30 border border-amber-200/50 dark:border-amber-700/30 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {parseFloat(summary.top_products?.total_quantity_sold?.replace(/,/g, '') || '0').toLocaleString()}
                </div>
                <div className="text-xs text-amber-600/70 dark:text-amber-400/70">Units Sold</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/30 border border-purple-200/50 dark:border-purple-700/30 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {summary.top_products?.avg_profit_margin || '0'}%
                </div>
                <div className="text-xs text-purple-600/70 dark:text-purple-400/70">Avg Margin</div>
              </div>
            </div>

            {/* Bar Chart - Larger */}
            <div className="h-[280px] bg-gradient-to-b from-transparent to-emerald-50/30 dark:to-emerald-950/10 rounded-xl p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topChartData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700/50" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: 'currentColor' }}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: 'currentColor' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `Rs ${formatCurrency(v)}`}
                    width={60}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border text-sm">
                            <p className="font-semibold text-foreground mb-1">{data.fullName}</p>
                            <p className="text-emerald-600">Revenue: Rs {data.revenue.toLocaleString()}</p>
                            <p className={data.profit >= 0 ? "text-blue-600" : "text-red-600"}>
                              Profit: Rs {data.profit.toLocaleString()}
                            </p>
                            <p className="text-amber-600">Sold: {data.quantity.toLocaleString()} units</p>
                            <p className={data.margin >= 0 ? "text-purple-600" : "text-red-600"}>
                              Margin: {data.margin.toFixed(1)}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {topChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Product List - All 15 products */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {top_products.map((product: any, index: number) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/30 rounded-lg hover:shadow-md transition-all duration-200 border border-slate-200/50 dark:border-slate-700/50"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div 
                      className="flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: topProductColors[index % topProductColors.length] }}
                    >
                      {product.rank || index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-xs truncate">{product.product_name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{product.sku}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                      Rs {formatCurrency(parseFloat(product.total_revenue))}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] justify-end">
                      {parseFloat(product.profit_margin_percent) >= 0 ? (
                        <TrendingUp className="h-2.5 w-2.5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-2.5 w-2.5 text-red-500" />
                      )}
                      <span className={parseFloat(product.profit_margin_percent) >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {parseFloat(product.profit_margin_percent).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="dead" className="space-y-4">
            {/* Dead Stock Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/30 border border-red-200/50 dark:border-red-700/30 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-red-600 dark:text-red-400">
                  Rs {formatCurrency(parseFloat(summary.dead_products?.total_dead_stock_value?.replace(/,/g, '') || '0'))}
                </div>
                <div className="text-xs text-red-600/70 dark:text-red-400/70">Dead Stock Value</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/30 border border-orange-200/50 dark:border-orange-700/30 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {parseFloat(summary.dead_products?.total_stock_units?.replace(/,/g, '') || '0').toLocaleString()}
                </div>
                <div className="text-xs text-orange-600/70 dark:text-orange-400/70">Stock Units</div>
              </div>
            </div>

            {/* Bar Chart for Dead Stock */}
            <div className="h-[280px] bg-gradient-to-b from-transparent to-red-50/30 dark:to-red-950/10 rounded-xl p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deadChartData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fecaca" className="dark:stroke-red-900/30" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: 'currentColor' }}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: 'currentColor' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `Rs ${formatCurrency(v)}`}
                    width={60}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border text-sm">
                            <p className="font-semibold text-foreground mb-1">{data.fullName}</p>
                            <p className="text-red-600">Dead Stock Value: Rs {data.value.toLocaleString()}</p>
                            <p className="text-orange-600">Units in Stock: {data.stock.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {deadChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Dead Stock List - All 15 products */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {dead_products.map((product: any, index: number) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 border border-red-200/50 dark:border-red-800/30 rounded-lg hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div 
                      className="flex items-center justify-center w-6 h-6 rounded-full text-white flex-shrink-0"
                      style={{ backgroundColor: deadStockColors[index % deadStockColors.length] }}
                    >
                      <AlertTriangle className="h-3 w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-xs truncate">{product.product_name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {product.sku} • {product.current_stock} {product.unit}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="font-semibold text-xs text-red-600 dark:text-red-400">
                      Rs {formatCurrency(parseFloat(product.dead_stock_value || 0))}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {product.last_sale_date ? `Last: ${product.last_sale_date}` : 'Never sold'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
