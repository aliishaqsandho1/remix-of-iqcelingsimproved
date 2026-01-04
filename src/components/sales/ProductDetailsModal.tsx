
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Package, Calendar, AlertTriangle, ShoppingCart } from "lucide-react";
import { salesApi } from "@/services/api";

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
  const [salesData, setSalesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customerStats, setCustomerStats] = useState<{[key: string]: any}>({});

  useEffect(() => {
    if (open && product) {
      fetchProductSalesData();
    }
  }, [open, product]);

  const fetchProductSalesData = async () => {
    try {
      setLoading(true);
      // Fetch ALL sales data without any date restrictions to get complete history
      const response = await salesApi.getAll({ 
        limit: 5000, // Increased limit to ensure we get complete history
      });
      if (response.success) {
        const allSales = response.data?.sales || response.data || [];
        
        // Filter sales that contain this product - handle both string and number IDs
        const productId = String(product.id);
        const productSales = allSales.filter((sale: any) => 
          sale.items && sale.items.some((item: any) => 
            String(item.productId) === productId || String(item.product_id) === productId
          )
        );

        // Extract only the relevant items and add sale info
        const relevantSales = productSales.map((sale: any) => {
          const productItem = sale.items.find((item: any) => 
            String(item.productId) === productId || String(item.product_id) === productId
          );
          return {
            ...productItem,
            saleDate: sale.saleDate || sale.createdAt,
            customerName: sale.customerName || sale.customer?.name || 'Walk-in Customer',
            customerId: sale.customerId,
            saleId: sale.id,
            paymentMethod: sale.paymentMethod,
            status: sale.status,
            // Calculate proper values
            actualUnitPrice: productItem?.unitPrice || productItem?.price || product.price,
            actualTotalPrice: (productItem?.unitPrice || productItem?.price || product.price) * (productItem?.quantity || 1)
          };
        });

        setSalesData(relevantSales);

        // Calculate customer statistics with proper values
        const stats: {[key: string]: any} = {};
        relevantSales.forEach((sale: any) => {
          const customerKey = sale.customerName || 'Walk-in Customer';
          if (!stats[customerKey]) {
            stats[customerKey] = {
              name: customerKey,
              totalQuantity: 0,
              totalValue: 0,
              purchaseCount: 0,
              averagePrice: 0,
              lastPurchase: sale.saleDate
            };
          }
          
          const quantity = sale.quantity || 1;
          const unitPrice = sale.actualUnitPrice || 0;
          const totalPrice = sale.actualTotalPrice || (unitPrice * quantity);
          
          stats[customerKey].totalQuantity += quantity;
          stats[customerKey].totalValue += totalPrice;
          stats[customerKey].purchaseCount += 1;
          
          // Calculate average price per unit
          if (stats[customerKey].totalQuantity > 0) {
            stats[customerKey].averagePrice = stats[customerKey].totalValue / stats[customerKey].totalQuantity;
          }
          
          // Keep the most recent purchase date
          if (new Date(sale.saleDate) > new Date(stats[customerKey].lastPurchase)) {
            stats[customerKey].lastPurchase = sale.saleDate;
          }
        });

        setCustomerStats(stats);
      }
    } catch (error) {
      console.error('Failed to fetch product sales data:', error);
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
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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

  // Calculate totals with proper values
  const totalSold = salesData.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
  const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.actualTotalPrice || 0), 0);
  const uniqueCustomers = Object.keys(customerStats).length;
  const mostRecentSale = salesData.length > 0 ? 
    salesData.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())[0] : null;

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
              {product.incompleteQuantity && (
                <Badge variant="outline" className="ml-2 text-orange-600 border-orange-300">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Incomplete Info
                </Badge>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-6 space-y-6">
            {/* Compact Sales Overview Stats */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-600">{totalSold}</div>
                <div className="text-xs text-muted-foreground">{product.unit || 'units'} Sold</div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-emerald-600">PKR {formatCurrency(totalRevenue)}</div>
                <div className="text-xs text-muted-foreground">Revenue</div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-600">{uniqueCustomers}</div>
                <div className="text-xs text-muted-foreground">Customers</div>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-orange-600">{salesData.length}</div>
                <div className="text-xs text-muted-foreground">Orders</div>
              </div>
            </div>
            
            {mostRecentSale && (
              <div className="p-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                <span className="font-medium">Last Sale:</span> {formatDate(mostRecentSale.saleDate)} by {mostRecentSale.customerName}
              </div>
            )}

            {/* Customer Purchase Summary */}
            {Object.keys(customerStats).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                  <User className="h-4 w-4" />
                  Customer Purchase Summary
                </h3>
                <div className="space-y-2">
                  {Object.values(customerStats)
                    .sort((a: any, b: any) => b.totalValue - a.totalValue)
                    .slice(0, 10)
                    .map((customer: any, index) => (
                    <Card key={index} className="border-l-4 border-l-primary/50 hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium text-sm">{customer.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Last: {formatDate(customer.lastPurchase)}
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {customer.purchaseCount} orders
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="font-semibold text-blue-600">{customer.totalQuantity} {product.unit || 'units'}</div>
                            <div className="text-muted-foreground">Quantity</div>
                          </div>
                          <div>
                            <div className="font-semibold text-emerald-600">PKR {formatCurrency(customer.totalValue)}</div>
                            <div className="text-muted-foreground">Total Value</div>
                          </div>
                          <div>
                            <div className="font-semibold text-purple-600">PKR {formatCurrency(customer.averagePrice)}</div>
                            <div className="text-muted-foreground">Avg Price</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Sales History */}
            {salesData.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                  <ShoppingCart className="h-4 w-4" />
                  Recent Sales History
                </h3>
                <div className="space-y-2">
                  {salesData
                    .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
                    .slice(0, 15)
                    .map((sale, index) => (
                    <Card key={index} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-full">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{sale.customerName || 'Walk-in Customer'}</div>
                              <div className="text-xs text-muted-foreground">{formatDate(sale.saleDate)}</div>
                              <div className="flex gap-1 mt-1">
                                <Badge variant="outline" className="text-xs px-1.5 py-0">
                                  {sale.paymentMethod || 'cash'}
                                </Badge>
                                <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'} className="text-xs px-1.5 py-0">
                                  {sale.status || 'completed'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm">{sale.quantity || 0} {product.unit || 'units'}</div>
                            <div className="text-xs text-emerald-600">PKR {formatCurrency(sale.actualUnitPrice)}/{product.unit || 'unit'}</div>
                            <div className="text-xs font-medium mt-1">Total: PKR {formatCurrency(sale.actualTotalPrice)}</div>
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
                <div className="text-muted-foreground text-sm">Loading sales data...</div>
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
