
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, Calendar, ShoppingCart } from "lucide-react";
import { API_CONFIG } from "@/config/api";

interface SaleHistoryItem {
  orderId: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  date: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: string;
  profit: number;
}

interface ProductDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  open,
  onOpenChange,
  product
}) => {
  const [salesData, setSalesData] = useState<SaleHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && product) {
      fetchProductSalesHistory();
    }
  }, [open, product]);

  const fetchProductSalesHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/products/${product.id}/sales-history`);
      const data = await response.json();
      
      if (data.sales) {
        setSalesData(data.sales);
      } else {
        setSalesData([]);
      }
    } catch (error) {
      console.error('Failed to fetch product sales history:', error);
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    return Math.round(value).toLocaleString();
  };

  // Calculate totals
  const totalSold = salesData.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
  const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalProfit = salesData.reduce((sum, sale) => sum + (sale.profit || 0), 0);

  if (!product) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-hidden p-0">
        <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <SheetTitle className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <span className="text-lg font-semibold">{product.name}</span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-6 space-y-6">
            {/* Sales Overview Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-600">{totalSold}</div>
                <div className="text-xs text-muted-foreground">{product.unit || 'units'} Sold</div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-emerald-600">PKR {formatCurrency(totalRevenue)}</div>
                <div className="text-xs text-muted-foreground">Revenue</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-600">PKR {formatCurrency(totalProfit)}</div>
                <div className="text-xs text-muted-foreground">Profit</div>
              </div>
            </div>

            {/* Sales History */}
            {salesData.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                  <ShoppingCart className="h-4 w-4" />
                  Sales History ({salesData.length} orders)
                </h3>
                <div className="space-y-2">
                  {salesData.map((sale, index) => (
                    <Card key={index} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-full">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{sale.customerName}</div>
                              <div className="text-xs text-muted-foreground">{formatDate(sale.date)} • {sale.orderNumber}</div>
                              <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'} className="text-xs px-1.5 py-0 mt-1">
                                {sale.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm">{sale.quantity} {product.unit || 'units'}</div>
                            <div className="text-xs text-muted-foreground">@ PKR {formatCurrency(sale.unitPrice)}</div>
                            <div className="text-xs font-medium text-emerald-600">PKR {formatCurrency(sale.total)}</div>
                            <div className="text-xs text-green-600">+PKR {formatCurrency(sale.profit)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                <div className="text-muted-foreground text-sm">Loading sales history...</div>
              </div>
            )}

            {!loading && salesData.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <div className="text-muted-foreground">No sales history found for this product</div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
