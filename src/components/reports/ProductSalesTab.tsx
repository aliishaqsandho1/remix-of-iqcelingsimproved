import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Search, TrendingUp, TrendingDown, DollarSign, Eye } from "lucide-react";
import { MonthlyProductSale } from "@/services/reportsApi";
import { ProductDetailsModal } from "@/components/sales/ProductDetailsModal";

interface ProductSalesTabProps {
  data: MonthlyProductSale[];
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


export function ProductSalesTab({ data, isLoading, monthLabel, year }: ProductSalesTabProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("revenue");
  const [productDetailsModal, setProductDetailsModal] = useState<{
    open: boolean;
    product: any;
  }>({ open: false, product: null });

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
          <h3 className="text-lg font-medium text-muted-foreground">No Product Data</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">
            No product sales data available for {monthLabel} {year}
          </p>
        </CardContent>
      </Card>
    );
  }

  const categories = [...new Set(data.map(p => p.category_name))].filter(cat => cat && cat.trim() !== '');

  const filteredData = data
    .filter(p => 
      (categoryFilter === "all" || p.category_name === categoryFilter) &&
      (p.product_name.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "revenue":
          return parseFloat(b.total_revenue) - parseFloat(a.total_revenue);
        case "profit":
          return parseFloat(b.total_profit) - parseFloat(a.total_profit);
        case "quantity":
          return b.total_quantity_sold - a.total_quantity_sold;
        case "margin":
          return b.profit_margin_percent - a.profit_margin_percent;
        default:
          return 0;
      }
    });

  const totalRevenue = filteredData.reduce((sum, p) => sum + parseFloat(p.total_revenue), 0);
  const totalProfit = filteredData.reduce((sum, p) => sum + parseFloat(p.total_profit), 0);
  const avgMargin = filteredData.reduce((sum, p) => sum + p.profit_margin_percent, 0) / (filteredData.length || 1);

  const handleViewDetails = (product: MonthlyProductSale) => {
    // Convert to the format expected by ProductDetailsModal - use string ID to match API format
    const productForModal = {
      id: String(product.product_id),
      name: product.product_name,
      sku: product.sku,
      category: product.category_name,
      price: parseFloat(product.current_price),
      costPrice: parseFloat(product.current_cost),
      stock: 0,
      unit: product.unit,
      status: product.product_status,
    };
    setProductDetailsModal({ open: true, product: productForModal });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Product Sales
          </h2>
          <p className="text-muted-foreground mt-1">
            {monthLabel} {year} • Complete product sales breakdown
          </p>
        </div>
        <Badge variant="outline" className="px-4 py-2 text-sm">
          {filteredData.length} Products
        </Badge>
      </div>

      {/* Summary Cards - Better color differentiation */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalProfit)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent border-violet-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-400">Avg Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">{avgMargin.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="profit">Profit</SelectItem>
                <SelectItem value="quantity">Quantity</SelectItem>
                <SelectItem value="margin">Margin %</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Qty Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-center w-16">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((product) => (
                  <TableRow key={`${product.product_id}-${product.month}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.product_name}</span>
                        {product.product_status !== 'active' && (
                          <Badge variant="outline" className="text-xs">
                            {product.product_status}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(product.current_price)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(product.current_cost)}</TableCell>
                    <TableCell className="text-right">
                      {product.total_quantity_sold.toLocaleString()} {product.unit}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(product.total_revenue)}</TableCell>
                    <TableCell className="text-right">
                      <span className={parseFloat(product.total_profit) >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {formatCurrency(product.total_profit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {parseFloat(String(product.profit_margin_percent)) >= 20 ? (
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-orange-500" />
                        )}
                        <span>{parseFloat(String(product.profit_margin_percent)).toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(product)}
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={productDetailsModal.product}
        open={productDetailsModal.open}
        onOpenChange={(open) => setProductDetailsModal({ ...productDetailsModal, open })}
      />
    </div>
  );
}