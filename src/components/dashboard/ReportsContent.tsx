import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { reportsApi } from "@/services/reportsApi";
import { TopProductsTab } from "@/components/reports/TopProductsTab";
import { TopCustomersTab } from "@/components/reports/TopCustomersTab";
import { ProductSalesTab } from "@/components/reports/ProductSalesTab";
import { CustomerPurchasesTab } from "@/components/reports/CustomerPurchasesTab";

const getMonthOptions = () => {
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];
  return months;
};

export const ReportsContent = () => {
  const [activeTab, setActiveTab] = useState("top-products");
  
  // Default to December 2025 (where data exists) instead of current month
  const [selectedMonth, setSelectedMonth] = useState(12);
  const [selectedYear, setSelectedYear] = useState(2025);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  // Navigate to next month
  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Fetch report data with year/month parameters for server-side filtering
  const { data: topProducts = [], isLoading: loadingTopProducts } = useQuery({
    queryKey: ['monthly-top-products', selectedYear, selectedMonth],
    queryFn: () => reportsApi.getMonthlyTopProducts({ year: selectedYear, month: selectedMonth }),
  });

  const { data: topCustomers = [], isLoading: loadingTopCustomers } = useQuery({
    queryKey: ['monthly-top-customers', selectedYear, selectedMonth],
    queryFn: () => reportsApi.getMonthlyTopCustomers({ year: selectedYear, month: selectedMonth }),
  });

  const { data: productSales = [], isLoading: loadingProductSales } = useQuery({
    queryKey: ['monthly-product-sales', selectedYear, selectedMonth],
    queryFn: () => reportsApi.getMonthlyProductSales({ year: selectedYear, month: selectedMonth }),
  });

  const { data: customerPurchases = [], isLoading: loadingCustomerPurchases } = useQuery({
    queryKey: ['monthly-customer-purchases', selectedYear, selectedMonth],
    queryFn: () => reportsApi.getMonthlyCustomerPurchases({ year: selectedYear, month: selectedMonth }),
  });

  const monthLabel = getMonthOptions().find(m => m.value === selectedMonth)?.label || '';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Monthly Reports</h2>
        
        {/* Simple Arrow Navigation */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToPreviousMonth}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-4 py-2 bg-muted/50 rounded-lg border border-border min-w-[160px] text-center">
            <span className="font-medium">{monthLabel} {selectedYear}</span>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToNextMonth}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs - Reordered: Top Products => Products => Top Customers => Customers */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="top-products" className="gap-2 data-[state=active]:bg-background text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Top Products</span>
          </TabsTrigger>
          <TabsTrigger value="product-sales" className="gap-2 data-[state=active]:bg-background text-xs sm:text-sm">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Products</span>
          </TabsTrigger>
          <TabsTrigger value="top-customers" className="gap-2 data-[state=active]:bg-background text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Top Customers</span>
          </TabsTrigger>
          <TabsTrigger value="customer-purchases" className="gap-2 data-[state=active]:bg-background text-xs sm:text-sm">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Customers</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="top-products" className="mt-6">
          <TopProductsTab 
            data={topProducts} 
            isLoading={loadingTopProducts} 
            monthLabel={monthLabel}
            year={selectedYear}
          />
        </TabsContent>

        <TabsContent value="product-sales" className="mt-6">
          <ProductSalesTab 
            data={productSales} 
            isLoading={loadingProductSales}
            monthLabel={monthLabel}
            year={selectedYear}
          />
        </TabsContent>

        <TabsContent value="top-customers" className="mt-6">
          <TopCustomersTab 
            data={topCustomers} 
            isLoading={loadingTopCustomers}
            monthLabel={monthLabel}
            year={selectedYear}
          />
        </TabsContent>

        <TabsContent value="customer-purchases" className="mt-6">
          <CustomerPurchasesTab 
            data={customerPurchases} 
            isLoading={loadingCustomerPurchases}
            monthLabel={monthLabel}
            year={selectedYear}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
