import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, TrendingUp, Award, Crown } from "lucide-react";
import { MonthlyTopProduct } from "@/services/reportsApi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface TopProductsTabProps {
  data: MonthlyTopProduct[];
  isLoading: boolean;
  monthLabel?: string;
  year?: number;
}

const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'Rs 0';
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatNumber = (value: number | string) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-PK');
};

const CHART_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1', // Indigo
];

export function TopProductsTab({ data, isLoading, monthLabel, year }: TopProductsTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
          <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No Products Data</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            No product sales data available for {monthLabel} {year}
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.slice(0, 10).map((p, index) => ({
    name: p.product_name.length > 20 ? p.product_name.substring(0, 20) + '...' : p.product_name,
    fullName: p.product_name,
    revenue: parseFloat(p.total_revenue) || 0,
    quantity: typeof p.total_quantity === 'number' ? p.total_quantity : parseInt(String(p.total_quantity)) || 0,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const totalRevenue = data.reduce((sum, p) => sum + (parseFloat(p.total_revenue) || 0), 0);
  const totalQuantity = data.reduce((sum, p) => {
    const qty = typeof p.total_quantity === 'number' ? p.total_quantity : parseInt(String(p.total_quantity)) || 0;
    return sum + qty;
  }, 0);

  const topProduct = data[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Top Products
          </h2>
          <p className="text-muted-foreground mt-1">
            {monthLabel} {year} • Best performing products by revenue
          </p>
        </div>
        <Badge variant="outline" className="px-4 py-2 text-sm">
          {data.length} Products
        </Badge>
      </div>

      {/* Summary Cards - Better color differentiation */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Revenue</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-blue-600/70 mt-1">From top products this month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Total Quantity</CardTitle>
            <Package className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{formatNumber(totalQuantity)}</div>
            <p className="text-xs text-emerald-600/70 mt-1">Units sold this month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Top Seller</CardTitle>
            <Crown className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-700 dark:text-amber-300 truncate">{topProduct?.product_name}</div>
            <p className="text-sm text-amber-600/70 mt-1">{formatCurrency(topProduct?.total_revenue || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart - Modern horizontal bar chart */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Top 10 Products by Revenue
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                layout="vertical" 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  horizontal={true} 
                  vertical={false}
                  stroke="hsl(var(--border))" 
                />
                <XAxis 
                  type="number" 
                  tickFormatter={(v) => `Rs ${(v / 1000).toFixed(0)}k`} 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={180} 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    padding: '12px 16px'
                  }}
                  cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                />
                <Bar 
                  dataKey="revenue" 
                  radius={[0, 8, 8, 0]}
                  maxBarSize={40}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table - Clean modern design */}
      <Card>
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Product Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-16 text-center font-semibold">Rank</TableHead>
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="text-right font-semibold">Orders</TableHead>
                <TableHead className="text-right font-semibold">Qty Sold</TableHead>
                <TableHead className="text-right font-semibold">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((product, index) => (
                <TableRow 
                  key={product.product_id} 
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="text-center">
                    {index < 3 ? (
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center mx-auto font-bold text-sm
                        ${index === 0 ? 'bg-yellow-500/20 text-yellow-600 ring-2 ring-yellow-500/30' : ''}
                        ${index === 1 ? 'bg-slate-400/20 text-slate-600 ring-2 ring-slate-400/30' : ''}
                        ${index === 2 ? 'bg-amber-600/20 text-amber-700 ring-2 ring-amber-600/30' : ''}
                      `}>
                        {index + 1}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">{index + 1}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{product.product_name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {product.category_name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{product.times_sold}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {formatNumber(product.total_quantity)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-primary">{formatCurrency(product.total_revenue)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}