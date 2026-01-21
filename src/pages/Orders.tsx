import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { salesApi, customersApi } from "@/services/api";
import { PDFExportModal, ExportOptions } from "@/components/orders/PDFExportModal";
import { OrdersHeader } from "@/components/orders/OrdersHeader";
import { OrdersSummaryCards } from "@/components/orders/OrdersSummaryCards";
import { OrdersFilters } from "@/components/orders/OrdersFilters";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { useOrderPDFGenerator } from "@/components/orders/OrdersPDFGenerator";
import { generateOrdersReportPDF } from "@/utils/ordersReportPdfGenerator";

interface Sale {
  id: number;
  orderNumber: string;
  customerId: number | null;
  customerName: string | null;
  date: string;
  time: string;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: string;
  createdBy: string;
  createdAt: string;
}

const Orders = () => {
  const { toast } = useToast();
  const { generateOrderPDF } = useOrderPDFGenerator();
  const [orders, setOrders] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    avgOrderValue: 0
  });
  
  const [isPDFExportModalOpen, setIsPDFExportModalOpen] = useState(false);

  // Items per page for server-side pagination
  const ITEMS_PER_PAGE = 20;
  // Cache full dataset for current filters during search to avoid repeated network calls
  const allSalesCacheRef = useRef<Sale[]>([]);
  const cacheKeyRef = useRef<string>("");

  // State to track if we're currently searching (for UI feedback without blocking)
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search term - instant feedback, debounced API call
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (searchTerm.trim().length > 0) {
        setCurrentPage(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch initial data on mount and when filters change (not search)
  useEffect(() => {
    fetchAllOrders();
  }, [filterStatus, filterCustomer, dateFrom, dateTo, filterPaymentMethod]);

  // Handle search separately - filter from cache
  useEffect(() => {
    if (allSalesCacheRef.current.length > 0) {
      filterAndDisplayOrders();
    }
  }, [debouncedSearchTerm, currentPage]);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);

      // Build base filters
      const baseParams: any = { limit: 5000, page: 1 };
      if (filterStatus !== "all") baseParams.status = filterStatus;
      if (filterCustomer) baseParams.customerId = parseInt(filterCustomer);
      if (dateFrom) baseParams.dateFrom = dateFrom;
      if (dateTo) baseParams.dateTo = dateTo;
      if (filterPaymentMethod !== "all") baseParams.paymentMethod = filterPaymentMethod;

      const response = await salesApi.getAll(baseParams);
      if (response.success) {
        const sales = (response.data.sales || response.data || []) as Sale[];
        // Sort by latest first
        sales.sort((a, b) => {
          const aTime = new Date(a.createdAt || a.date).getTime();
          const bTime = new Date(b.createdAt || b.date).getTime();
          return bTime - aTime;
        });
        allSalesCacheRef.current = sales;
        cacheKeyRef.current = `${filterStatus}|${filterPaymentMethod}|${dateFrom}|${dateTo}|${filterCustomer || ''}`;
        
        // Apply current search filter if any
        filterAndDisplayOrders();
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load orders data";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filterAndDisplayOrders = () => {
    const term = debouncedSearchTerm.trim().toLowerCase();
    let filteredSales = allSalesCacheRef.current;

    if (term.length > 0) {
      setIsSearching(true);
      filteredSales = allSalesCacheRef.current.filter((sale: Sale) => {
        // Search in order number
        if (sale.orderNumber?.toLowerCase().includes(term)) return true;
        // Search in customer name
        if (sale.customerName?.toLowerCase().includes(term)) return true;
        // Search in customer ID
        if (sale.customerId?.toString().includes(term)) return true;
        // Search in order ID
        if (sale.id?.toString().includes(term)) return true;
        // Search in created by
        if (sale.createdBy?.toLowerCase().includes(term)) return true;
        // Search in payment method
        if (sale.paymentMethod?.toLowerCase().includes(term)) return true;
        // Search in product names and product IDs within items
        if (sale.items?.some(item => 
          item.productName?.toLowerCase().includes(term) ||
          item.productId?.toString().includes(term)
        )) return true;
        return false;
      });

      // Sort by relevance and recency
      filteredSales.sort((a, b) => {
        const scoreOrder = (s: Sale) => {
          const name = (s.customerName || '').toLowerCase();
          const order = (s.orderNumber || '').toLowerCase();
          let sc = 0;
          if (name === term) sc += 1000;
          if (name.startsWith(term)) sc += 800;
          if (name.includes(term)) sc += 500;
          if (order === term) sc += 400;
          if (order.startsWith(term)) sc += 300;
          if (order.includes(term)) sc += 150;
          if (s.id?.toString() === term) sc += 600;
          // Check product matches
          if (s.items?.some(item => item.productId?.toString() === term)) sc += 550;
          return sc;
        };
        
        const diff = scoreOrder(b) - scoreOrder(a);
        if (diff !== 0) return diff;
        // Tie-breaker: newest first
        const aTime = new Date(a.createdAt || a.date).getTime();
        const bTime = new Date(b.createdAt || b.date).getTime();
        return bTime - aTime;
      });
      
      setIsSearching(false);
    }

    // Paginate
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedSales = filteredSales.slice(startIndex, endIndex);

    setOrders(paginatedSales);
    setTotalPages(Math.max(1, Math.ceil(filteredSales.length / ITEMS_PER_PAGE)));
    
    const totalSalesValue = filteredSales.reduce((sum, s) => sum + s.total, 0);
    setSummary({
      totalSales: totalSalesValue,
      totalOrders: filteredSales.length,
      avgOrderValue: filteredSales.length ? totalSalesValue / filteredSales.length : 0
    });
  };

  const fetchOrders = fetchAllOrders;

  const handleOrderPDF = async (order: Sale) => {
    await generateOrderPDF(order);
  };


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAdvancedPDFExport = async (options: ExportOptions) => {
    try {
      setExportLoading(true);
      setIsPDFExportModalOpen(false);
      
      // Build query parameters based on options
      const params: any = { 
        limit: 10000,
        page: 1
      };

      // Add customer filtering
      if (options.customerScope === 'single' && options.selectedCustomers.length === 1) {
        params.customerId = options.selectedCustomers[0];
      } else if (options.customerScope === 'multiple' && options.selectedCustomers.length > 0) {
        params.customerIds = options.selectedCustomers.join(',');
      }

      // Add time filtering
      const now = new Date();
      let filterText = 'Filters Applied: ';
      
      if (options.customerScope === 'single') {
        filterText += 'Single Customer | ';
      } else if (options.customerScope === 'multiple') {
        filterText += `${options.selectedCustomers.length} Selected Customers | `;
      } else {
        filterText += 'All Customers | ';
      }
      
      switch (options.timeScope) {
        case 'today':
          params.dateFrom = now.toISOString().split('T')[0];
          params.dateTo = now.toISOString().split('T')[0];
          filterText += 'Today Only';
          break;
        case 'weekly':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          params.dateFrom = weekStart.toISOString().split('T')[0];
          params.dateTo = new Date().toISOString().split('T')[0];
          filterText += 'This Week';
          break;
        case 'monthly':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          params.dateFrom = monthStart.toISOString().split('T')[0];
          params.dateTo = new Date().toISOString().split('T')[0];
          filterText += 'This Month';
          break;
        case 'custom':
          if (options.startDate) params.dateFrom = options.startDate;
          if (options.endDate) params.dateTo = options.endDate;
          filterText += `${options.startDate} to ${options.endDate}`;
          break;
        default:
          filterText += 'All Time Period';
      }

      // Fetch filtered orders
      const response = await salesApi.getAll(params);
      
      if (response.success) {
        const filteredOrders = response.data.sales || response.data || [];
        
        // Calculate summary data
        const totalSales = filteredOrders.reduce((sum: number, order: Sale) => sum + (order.subtotal - order.discount), 0);
        const totalItems = filteredOrders.reduce((sum: number, order: Sale) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
        const avgOrderValue = filteredOrders.length > 0 ? totalSales / filteredOrders.length : 0;

        // Build report payload and generate PDF
        const reportData = {
          title: 'ORDERS EXPORT REPORT',
          orders: filteredOrders,
          exportDate: new Date().toLocaleString(),
          totalOrders: filteredOrders.length,
          totalSales: totalSales,
          totalItems: totalItems,
          avgOrderValue: avgOrderValue,
          filters: filterText
        };
        const filename = await generateOrdersReportPDF(reportData);

        toast({
          title: "PDF Export Successful",
          description: `Exported ${filteredOrders.length} orders to PDF.`,
        });
      }
    } catch (error) {
      console.error('Failed to export orders to PDF:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to export orders data to PDF. Please try again.";
      toast({
        title: "PDF Export Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-6 space-y-6 min-h-screen bg-slate-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading orders...</div>
        </div>
      </div>
    );
  }

  // Get unique customers for the export modal
  const uniqueCustomers = orders.reduce((acc: Array<{id: number, name: string}>, order) => {
    if (order.customerId && !acc.find(c => c.id === order.customerId)) {
      acc.push({
        id: order.customerId,
        name: order.customerName || `Customer #${order.customerId}`
      });
    }
    return acc;
  }, []);

  return (
    <div className="flex-1 p-2 md:p-6 space-y-3 min-h-[calc(100vh-65px)]">
      <OrdersHeader 
        onPDFExport={() => setIsPDFExportModalOpen(true)}
        exportLoading={exportLoading}
      />

      <OrdersSummaryCards summary={summary} />

      <Card className="border-slate-200">
        <CardContent>
          <OrdersFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterPaymentMethod={filterPaymentMethod}
            setFilterPaymentMethod={setFilterPaymentMethod}
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            filterCustomer={filterCustomer}
            setFilterCustomer={setFilterCustomer}
          />

          <OrdersTable
            orders={orders}
            currentPage={currentPage}
            totalPages={totalPages}
            onOrderPDF={handleOrderPDF}
            onPageChange={handlePageChange}
            onOrderUpdated={fetchOrders}
          />
        </CardContent>
      </Card>

      {/* PDF Export Modal */}
      <PDFExportModal
        open={isPDFExportModalOpen}
        onOpenChange={setIsPDFExportModalOpen}
        onExport={handleAdvancedPDFExport}
        customers={uniqueCustomers}
        isLoading={exportLoading}
      />
    </div>
  );
};

export default Orders;
