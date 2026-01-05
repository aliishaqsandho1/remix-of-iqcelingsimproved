import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PincodeProtection } from "@/components/PincodeProtection"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { XAxis, YAxis, CartesianGrid, Cell, BarChart, Bar, AreaChart, Area } from "recharts"
import { DollarSign, TrendingUp, Package, Users, ShoppingCart, Target, CreditCard, Package2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "@/services/api"
import { reportsApi } from "@/services/reportsApi"
import { ProfitContent } from "@/components/profit/ProfitContent";
import { ReportsContent } from "@/components/dashboard/ReportsContent";
import { WeeklyPerformanceChart } from "@/components/dashboard/WeeklyPerformanceChart";
import { HighValueSalesChart } from "@/components/dashboard/HighValueSalesChart";
import { ProductPerformanceChart } from "@/components/dashboard/ProductPerformanceChart";
function formatNumber(value) {
  const num = Number(value);
  if (isNaN(num)) return '0';

  if (num >= 10000000) {
    return (num / 10000000).toFixed(2) + ' Cr';
  } else if (num >= 100000) {
    return (num / 100000).toFixed(2) + ' Lac';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + ' K';
  } else {
    return num.toFixed(0);
  }
}

// Enhanced Chart configurations with beautiful colors
const cashFlowChartConfig = {
  inflow: {
    label: "Cash Inflow",
    color: "#10b981",
  },
  outflow: {
    label: "Cash Outflow",
    color: "#ef4444",
  },
  net: {
    label: "Net Cash Flow",
    color: "#3b82f6",
  },
}
const defaultColors = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
];
const categoryChartConfig = {
  sheets: { label: "Sheets", color: "#3b82f6" },
  uncategorized: { label: "Uncategorized", color: "#ef4444" },
  new: { label: "New", color: "#10b981" },
  electronics: { label: "Electronics", color: "#f59e0b" },
  plus: { label: "Plus", color: "#8b5cf6" },
}

const salesChartConfig = {
  sales: {
    label: "Actual Sales",
    color: "#10b981",
  },
  target: {
    label: "Target",
    color: "#f59e0b",
  },
}

const inventoryChartConfig = {
  stock: {
    label: "Current Stock",
    color: "#3b82f6",
  },
  sold: {
    label: "Units Sold",
    color: "#10b981",
  },
  reorderLevel: {
    label: "Reorder Level",
    color: "#ef4444",
  },
}

export default function Dashboard() {
  // Fetch dashboard data
  const { data: enhancedStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-enhanced-stats'],
    queryFn: dashboardApi.getEnhancedStats,
  })

  const { data: categoryPerformance, isLoading: categoryLoading } = useQuery({
    queryKey: ['dashboard-category-performance'],
    queryFn: dashboardApi.getCategoryPerformance,
  })

  const { data: dailySales, isLoading: salesLoading } = useQuery({
    queryKey: ['dashboard-daily-sales'],
    queryFn: dashboardApi.getDailySales,
  })

  const { data: inventoryStatus, isLoading: inventoryLoading } = useQuery({
    queryKey: ['dashboard-inventory-status'],
    queryFn: dashboardApi.getInventoryStatus,
  })

  // Fetch reports data for Analytics and Reports tabs
  const { data: salesReport, isLoading: salesReportLoading } = useQuery({
    queryKey: ['sales-report-monthly'],
    queryFn: () => reportsApi.getSalesReport({ period: 'daily' }),
  })

  const { data: inventoryReport, isLoading: inventoryReportLoading } = useQuery({
    queryKey: ['inventory-report'],
    queryFn: reportsApi.getInventoryReport,
  })

  const { data: financialReport, isLoading: financialReportLoading } = useQuery({
    queryKey: ['financial-report'],
    queryFn: () => reportsApi.getFinancialReport({ period: 'monthly', year: 2025 }),
  })

  // Loading state
  if (statsLoading || categoryLoading || salesLoading || inventoryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const stats = enhancedStats?.data
  const categoryData = categoryPerformance?.data || []
  const salesData = dailySales?.data || []
  const inventoryData = inventoryStatus?.data || []

  // Format category data for pie chart with better colors
  const formattedCategoryData = categoryData.map((item, index) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
    return {
      name: item.category,
      value: item.amount,
      percentage: item.value,
      unitsSold: item.unitsSold,
      color: colors[index % colors.length]
    }
  })

  // Create cash flow data from stats
  const cashFlowData = [
    {
      period: "Opening",
      inflow: 0,
      outflow: 0,
      net: stats?.cashFlow?.monthlyInflows - stats?.cashFlow?.monthlyOutflows || 0
    },
    {
      period: "Current",
      inflow: stats?.cashFlow?.monthlyInflows || 0,
      outflow: stats?.cashFlow?.monthlyOutflows || 0,
      net: stats?.cashFlow?.netCashFlow || 0
    }
  ]

  // Create payment method data for pie chart
  const paymentMethodData = stats?.sales?.paymentMethods?.map((method, index) => ({
    name: method.method.charAt(0).toUpperCase() + method.method.slice(1),
    value: method.amount,
    count: method.count,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]
  })) || []

  return (
    <PincodeProtection 
      title="Dashboard Analytics" 
      description="Access comprehensive business insights and real-time analytics"
    >
      <div className="flex-1 space-y-4 p-4 md:p-6">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 mb-6 h-full lg:w-auto lg:grid-cols-3">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="profits" className="text-xs sm:text-sm">Profits</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs sm:text-sm">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Overview Cards with gradient backgrounds */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="col-span-1 shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-blue-600 to-blue-900 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white/90 mb-1">Today's Revenue</p>
                      <p className="text-lg sm:text-2xl font-bold text-white mb-1">
                        Rs. {formatNumber(stats?.financial?.todayRevenue)}

                      </p>
                      <p className="text-xs text-white/80">
                        {stats?.financial?.revenueGrowth > 0 ? '+' : ''}
                        {stats?.financial?.revenueGrowth?.toFixed(1) || '0'}% from yesterday
                      </p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-full">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-green-600 to-green-900 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white/90 mb-1">Today's Orders</p>
                      <p className="text-lg sm:text-2xl font-bold text-white mb-1">
                        Rs. {formatNumber(stats?.sales?.todaySales)}

                      </p>
                      <p className="text-xs text-white/80">
                        Avg: Rs. {stats?.sales?.avgOrderValue?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-full">
                      <ShoppingCart className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-red-600 to-red-900 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white/90 mb-1">Low Stock Items</p>
                      <p className="text-lg sm:text-2xl font-bold text-white mb-1">
                        {stats?.inventory?.lowStockItems || '0'}
                      </p>
                      <p className="text-xs text-white/80">
                        Value: Rs. {(stats?.inventory?.totalInventoryValue / 1000)?.toFixed(0) || '0'}k
                      </p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-full">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-purple-500 to-purple-900 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white/90 mb-1">Total Customers</p>
                      <p className="text-lg sm:text-2xl font-bold text-white mb-1">
                        {stats?.customers?.totalCustomers?.toLocaleString() || '0'}
                      </p>
                      <p className="text-xs text-white/80">
                        Avg: Rs. {stats?.customers?.avgCustomerValue?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-full">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Financial Metrics Row */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="col-span-1 shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white/90 mb-1">Month Revenue</p>
                      <p className="text-lg sm:text-2xl font-bold text-white mb-1">
                        Rs. {formatNumber(stats?.financial?.monthRevenue)}

                      </p>
                      <p className="text-xs text-white/80">
                        {stats?.financial?.monthlyGrowth?.toFixed(1) || '0'}% growth
                      </p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-full">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-amber-600 to-amber-900 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white/90 mb-1">Monthly Profit</p>
                      <p className="text-lg sm:text-2xl font-bold text-white mb-1">
                        Rs. {formatNumber(stats?.financial?.netProfit)}


                      </p>
                      <p className="text-xs text-white/80">
                        Rs. {stats?.financial?.profitMargin?.toFixed(1) || '0'}% profit Margin
                      </p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-full">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white/90 mb-1">Receivables</p>
                      <p className="text-lg sm:text-2xl font-bold text-white mb-1">
                        Rs. {formatNumber(stats?.customers?.totalReceivables)}
                      </p>
                      <p className="text-xs text-white/80">
                        Outstanding payments
                      </p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-full">
                      <CreditCard className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-cyan-600 to-cyan-900 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white/90 mb-1">Inventory Value</p>
                      <p className="text-lg sm:text-2xl font-bold text-white mb-1">
                        Rs. {formatNumber(stats?.inventory?.totalInventoryValue)}
                      </p>
                      <p className="text-xs text-white/80">
                        Turnover: {stats?.inventory?.inventoryTurnover?.toFixed(2) || '0'}
                      </p>
                    </div>
                    <div className="bg-white/20 p-2 rounded-full">
                      <Package2 className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section - Two charts per row */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Sales vs Target */}
            <Card className="shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Target className="h-5 w-5 text-orange-600" />
                  Sales vs Target
                </CardTitle>
               
              </CardHeader>
              <CardContent className="p-4">
                <ChartContainer config={salesChartConfig} className="h-[300px] w-full">
                  <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-700" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12, fill: 'currentColor' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'currentColor' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `Rs. ${(value / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent
                        formatter={(value, name) => [
                          `Rs. ${value.toLocaleString()}`,
                          name === 'sales' ? 'Actual Sales' : 'Sales Target'
                        ]}
                      />}
                    />
                    <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} name="Actual Sales" />
                    <Bar dataKey="target" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Sales Target" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Sales by Category */}
            <Card className="shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/30">
                <CardTitle className="flex items-center gap-3 text-lg font-bold tracking-tight">
                  <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                  Sales by Category
                </CardTitle>
                
              </CardHeader>
              <CardContent className="p-6">
                <ChartContainer config={categoryChartConfig} className="h-[300px] w-full">
                  <BarChart
                    data={formattedCategoryData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    barCategoryGap={50}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-700" />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      tickLine={false}
                      axisLine={false}
                      tick={(props) => {
                        const { x, y, payload } = props;
                        return (
                          <text
                            x={x}
                            y={y}
                            dy={20}
                            textAnchor="end"
                            fontSize={12}
                            fill="currentColor"
                            transform={`rotate(-30, ${x}, ${y})`}
                          >
                            {payload.value}
                          </text>
                        );
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'currentColor' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `Rs. ${(value / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent
                        formatter={(value, name, props) => [
                          `Rs. ${value.toLocaleString('en-IN')}`,
                          `${props.payload.name}`,
                        ]}
                      />}
                    />
                    <Bar
                      dataKey="value"
                      name="Revenue"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    >
                      {formattedCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || defaultColors[index % defaultColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* New API-powered Charts */}
          <WeeklyPerformanceChart />
          <ProductPerformanceChart />
          <HighValueSalesChart />
        </TabsContent>

        <TabsContent value="profits" className="space-y-6">
          <ProfitContent />
        </TabsContent>

        {/* Hidden Analytics - Removed from tabs but keeping for reference */}
        <TabsContent value="analytics-hidden" className="space-y-6">
          {/* Enhanced Analytics Section */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats?.financial?.profitMargin?.toFixed(1) || '0'}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Net Profit: Rs. {stats?.financial?.netProfit?.toLocaleString() || '0'}
                </p>
                <div className="mt-2">
                  <Badge variant={stats?.financial?.profitMargin > 10 ? "default" : "destructive"}>
                    {stats?.financial?.profitMargin > 10 ? "Healthy" : "Needs Attention"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Turnover</CardTitle>
                <Package className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats?.inventory?.inventoryTurnover?.toFixed(2) || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Times per period
                </p>
                <div className="mt-2">
                  <Badge variant={stats?.inventory?.inventoryTurnover > 1 ? "default" : "secondary"}>
                    {stats?.inventory?.inventoryTurnover > 1 ? "Active" : "Slow"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receivables</CardTitle>
                <DollarSign className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  Rs. {stats?.customers?.totalReceivables?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Outstanding amount
                </p>
                <div className="mt-2">
                  <Badge variant={stats?.customers?.totalReceivables === 0 ? "default" : "destructive"}>
                    {stats?.customers?.totalReceivables === 0 ? "All Clear" : "Pending"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Avg Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  Rs. {formatNumber(stats?.performance?.dailyAvgRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average per day
                </p>
                <div className="mt-2">
                  <Badge variant="outline">
                    Monthly: Rs. {(stats?.performance?.dailyAvgRevenue * 30)?.toLocaleString() || '0'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Performance Trends */}
            <Card className="col-span-1 shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Performance Analysis
                </CardTitle>
                <CardDescription>Weekly revenue and order trends</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.performance?.weeklyTrend && (
                  <ChartContainer config={salesChartConfig} className="h-[300px] w-full">
                    <AreaChart data={stats.performance.weeklyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-700" />
                      <XAxis dataKey="week" tick={{ fontSize: 12, fill: 'currentColor' }} />
                      <YAxis tick={{ fontSize: 12, fill: 'currentColor' }} tickFormatter={(value) => `Rs. ${(value / 1000).toFixed(0)}k`} />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => [`Rs. ${value.toLocaleString()}`, name === 'revenue' ? 'Revenue' : 'Orders']} />} />
                      <Area dataKey="revenue" fill="#10b981" stroke="#10b981" fillOpacity={0.3} />
                      <Area dataKey="orders" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.2} />
                    </AreaChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Customer Analytics */}
            <Card className="col-span-1 shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  Customer Analytics
                </CardTitle>
                <CardDescription>Customer distribution and value analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {stats?.customers?.totalCustomers || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Customers</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats?.customers?.newCustomersThisMonth || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">New This Month</p>
                    </div>
                  </div>

                  {/* Customer Types */}
                  <div className="space-y-2">
                    <p className="font-medium">Customer Types</p>
                    {stats?.customers?.customerTypes?.map((type, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="capitalize">{type.type}</span>
                        <Badge variant="outline">{type.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Customers & Fast Moving Products */}
          <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-1 shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>Highest value customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.customers?.topCustomers?.map((customer, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-lg">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.totalPurchases} purchases
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 dark:text-green-400">
                          Rs. {customer.balance.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )) || <p className="text-muted-foreground">No customer data available</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 shadow-xl border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
              <CardHeader>
                <CardTitle>Fast Moving Products</CardTitle>
                <CardDescription>Best selling items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.inventory?.fastMovingProducts?.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Sold: {product.sold} | Remaining: {product.remaining}
                        </p>
                      </div>
                      <Badge variant="outline">
                        #{index + 1}
                      </Badge>
                    </div>
                  )) || <p className="text-muted-foreground">No product data available</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ReportsContent />
        </TabsContent>

      </Tabs>
      </div>
    </PincodeProtection>
  )
}
