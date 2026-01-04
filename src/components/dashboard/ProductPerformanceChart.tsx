import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Package, AlertTriangle, DollarSign, ShoppingCart } from 'lucide-react';
import { dashboardApi } from '@/services/api';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer } from 'recharts';

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

export function ProductPerformanceChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['product-performance'],
    queryFn: () => dashboardApi.getProductPerformance({ limit: 10, period_days: 90 }),
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

  // Prepare chart data for top products
  const topChartData = top_products.slice(0, 8).map((p: any) => ({
    name: p.product_name?.substring(0, 15) + (p.product_name?.length > 15 ? '...' : ''),
    fullName: p.product_name,
    revenue: parseFloat(p.total_revenue) || 0,
    profit: parseFloat(p.total_profit) || 0,
    quantity: parseFloat(p.total_quantity_sold) || 0,
    margin: parseFloat(p.profit_margin_percent) || 0,
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
            <CardDescription>Top performers & dead stock analysis (Last 90 days)</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {metadata?.analysis_period || 'Last 90 days'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <Tabs defaultValue="top" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="top" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Products
            </TabsTrigger>
            <TabsTrigger value="dead" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Dead Stock
            </TabsTrigger>
          </TabsList>

          <TabsContent value="top" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-emerald-600">
                  Rs {formatCurrency(parseFloat(summary.top_products?.total_revenue?.replace(/,/g, '') || '0'))}
                </div>
                <div className="text-xs text-muted-foreground">Total Revenue</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-600">
                  Rs {formatCurrency(parseFloat(summary.top_products?.total_profit?.replace(/,/g, '') || '0'))}
                </div>
                <div className="text-xs text-muted-foreground">Total Profit</div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-amber-600">
                  {parseFloat(summary.top_products?.total_quantity_sold?.replace(/,/g, '') || '0').toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Units Sold</div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-600">
                  {summary.top_products?.avg_profit_margin || '0'}%
                </div>
                <div className="text-xs text-muted-foreground">Avg Margin</div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="h-[250px]">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={topChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-700" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    tickLine={false}
                    axisLine={false}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `Rs ${formatCurrency(v)}`}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent
                      formatter={(value, name, props) => [
                        `Rs ${parseFloat(String(value)).toLocaleString()}`,
                        name === 'revenue' ? 'Revenue' : 'Profit'
                      ]}
                    />}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ChartContainer>
            </div>

            {/* Product List */}
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {top_products.map((product: any, index: number) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-emerald-500/20 text-emerald-600 rounded-full text-xs font-bold">
                        {product.rank || index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{product.product_name}</div>
                        <div className="text-xs text-muted-foreground">{product.sku}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm text-emerald-600">
                        Rs {parseFloat(product.total_revenue).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {parseFloat(product.profit_margin_percent) >= 0 ? (
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                        <span className={parseFloat(product.profit_margin_percent) >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                          {parseFloat(product.profit_margin_percent).toFixed(1)}% margin
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="dead" className="space-y-4">
            {/* Dead Stock Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-red-600">
                  Rs {formatCurrency(parseFloat(summary.dead_products?.total_dead_stock_value?.replace(/,/g, '') || '0'))}
                </div>
                <div className="text-xs text-muted-foreground">Dead Stock Value</div>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-orange-600">
                  {parseFloat(summary.dead_products?.total_stock_units?.replace(/,/g, '') || '0').toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Stock Units</div>
              </div>
            </div>

            {/* Dead Stock List */}
            <ScrollArea className="h-[320px]">
              <div className="space-y-2">
                {dead_products.map((product: any, index: number) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-red-500/20 text-red-600 rounded-full text-xs font-bold">
                        <AlertTriangle className="h-3 w-3" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{product.product_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.sku} • {product.current_stock} {product.unit}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm text-red-600">
                        Rs {parseFloat(product.dead_stock_value || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {product.last_sale_date ? `Last: ${product.last_sale_date}` : 'Never sold'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
