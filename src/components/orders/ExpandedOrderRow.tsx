import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { User, RotateCcw, Save, X, Clock, Search, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { salesApi, customersApi } from "@/services/api";
import { useCustomerBalance } from "@/hooks/useCustomerBalance";
import { useStockManagement } from "@/hooks/useStockManagement";

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
  outsourcedItems?: any[];
}

interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

interface ExpandedOrderRowProps {
  order: Sale;
  onOrderUpdated?: () => void;
}

export const ExpandedOrderRow = ({ order, onOrderUpdated }: ExpandedOrderRowProps) => {
  const { toast } = useToast();
  const { updateBalanceForOrderStatusChange } = useCustomerBalance();
  const { handleOrderStatusChange } = useStockManagement();
  
  const [isReturning, setIsReturning] = useState(false);
  const [showItemsTable, setShowItemsTable] = useState(false);
  const [returnQuantities, setReturnQuantities] = useState<{ [key: number]: number }>({});
  const [returnNotes, setReturnNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Edit states
  const [editedStatus, setEditedStatus] = useState(order.status);
  const [editedPaymentMethod, setEditedPaymentMethod] = useState(order.paymentMethod);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(order.customerId);
  const [selectedCustomerName, setSelectedCustomerName] = useState(order.customerName || "Walk-in");
  
  // Customer picker modal
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  
  // Track if any changes were made
  const hasChanges = 
    editedStatus !== order.status || 
    editedPaymentMethod !== order.paymentMethod ||
    selectedCustomerId !== order.customerId;

  // Live calculations for return flow
  const computedRefund = React.useMemo(() => {
    let sum = 0;
    order.items.forEach((item) => {
      const qty = returnQuantities[item.productId] || 0;
      if (qty > 0) sum += qty * item.unitPrice;
    });
    return Number(sum.toFixed(2));
  }, [order.items, returnQuantities]);

  const newTotal = React.useMemo(
    () => Number((order.total - computedRefund).toFixed(2)),
    [order.total, computedRefund]
  );

  const formatCurrency = (val: number) =>
    `Rs. ${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
      pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      cancelled: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
    };
    return variants[status] || "bg-muted text-muted-foreground border-border";
  };

  const getPaymentBadge = (method: string) => {
    const variants: Record<string, string> = {
      cash: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
      credit: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      card: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
    };
    return variants[method] || "bg-muted text-muted-foreground border-border";
  };

  // Fetch customers when picker opens
  useEffect(() => {
    if (isCustomerPickerOpen && customers.length === 0) {
      fetchCustomers();
    }
  }, [isCustomerPickerOpen]);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await customersApi.getAll({ limit: 1000 });
      if (response.success) {
        setCustomers(response.data.customers || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.id?.toString().includes(customerSearchTerm) ||
    customer.phone?.includes(customerSearchTerm)
  );

  const handleSelectCustomer = (customer: Customer | null) => {
    if (customer) {
      setSelectedCustomerId(customer.id);
      setSelectedCustomerName(customer.name);
    } else {
      setSelectedCustomerId(null);
      setSelectedCustomerName("Walk-in");
    }
    setIsCustomerPickerOpen(false);
    setCustomerSearchTerm("");
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      // Handle status change with stock management
      if (editedStatus !== order.status) {
        const stockResult = await handleOrderStatusChange(
          order.id,
          order.orderNumber,
          order.items || [],
          editedStatus,
          order.status
        );
        
        if (!stockResult.success) {
          toast({
            title: "Stock Update Failed",
            description: stockResult.message,
            variant: "destructive"
          });
          return;
        }
        
        // Handle customer balance
        if (order.customerId) {
          await updateBalanceForOrderStatusChange(
            order.id,
            order.customerId,
            order.orderNumber,
            order.total,
            editedStatus,
            order.status
          );
        }

        await salesApi.updateStatus(order.id, { status: editedStatus });
      }

      // Handle payment method and customer change
      if (editedPaymentMethod !== order.paymentMethod || selectedCustomerId !== order.customerId) {
        const updatePayload: any = {};
        if (editedPaymentMethod !== order.paymentMethod) {
          updatePayload.paymentMethod = editedPaymentMethod;
        }
        if (selectedCustomerId !== order.customerId) {
          updatePayload.customerId = selectedCustomerId;
          updatePayload.customerName = selectedCustomerName;
        }

        const response = await salesApi.updateDetails(order.id, updatePayload);
        
        if (!response.success) throw new Error('Failed to update order details');
      }
      
      toast({
        title: "Order Updated",
        description: "Order details have been updated successfully",
      });
      
      onOrderUpdated?.();
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturn = async () => {
    const itemsToReturn = Object.entries(returnQuantities).filter(([_, qty]) => qty > 0);
    
    if (itemsToReturn.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select items to return",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const returnData = {
        type: "return",
        items: itemsToReturn.map(([productId, quantity]) => ({
          productId: parseInt(productId),
          quantity,
          reason: "customer_request",
        })),
        adjustmentReason: returnNotes || "Order adjustment - items returned after completion",
        refundAmount: computedRefund,
        restockItems: true,
      };

      await salesApi.adjustOrder(order.id, returnData);
      
      toast({
        title: "Return Processed",
        description: "Items have been returned and inventory updated",
      });
      
      setIsReturning(false);
      setReturnQuantities({});
      setReturnNotes("");
      onOrderUpdated?.();
    } catch (error: any) {
      console.error('Return error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process return",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelChanges = () => {
    setEditedStatus(order.status);
    setEditedPaymentMethod(order.paymentMethod);
    setSelectedCustomerId(order.customerId);
    setSelectedCustomerName(order.customerName || "Walk-in");
  };

  return (
    <div className="p-4 bg-muted/30 border-t border-border">
      {/* Cancelled Order View */}
      {order.status === "cancelled" ? (
        <div className="bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
              <X className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-red-700 dark:text-red-400 mb-1">Order Cancelled</h4>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-3">
                This order has been cancelled and cannot be reverted.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <p className="font-medium">{order.customerName || "Walk-in"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Items:</span>
                  <p className="font-medium">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <p className="font-medium">{formatCurrency(order.total)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment:</span>
                  <p className="font-medium capitalize">{order.paymentMethod}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Simple Edit Form */}
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
              {/* Customer Selector */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Customer</Label>
                <Button
                  variant="outline"
                  className="w-full justify-between h-9 text-sm font-normal"
                  onClick={() => setIsCustomerPickerOpen(true)}
                >
                  <span className="flex items-center gap-2 truncate">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {selectedCustomerName}
                  </span>
                </Button>
              </div>

              {/* Status Selector */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Status</Label>
                <Select value={editedStatus} onValueChange={setEditedStatus}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Completed
                      </div>
                    </SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        Pending
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        Cancelled
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method Selector */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Payment Method</Label>
                <Select value={editedPaymentMethod} onValueChange={setEditedPaymentMethod}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Return Button with Dropdown */}
              <div className="flex items-center gap-2">
                {!isReturning ? (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setIsReturning(true)}
                    className="h-9 flex-1"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Return
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setIsReturning(false);
                      setReturnQuantities({});
                      setReturnNotes("");
                    }}
                    className="h-9 flex-1 border-orange-300 text-orange-700 dark:text-orange-400"
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Cancel Return
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 px-2"
                  onClick={() => setShowItemsTable(!showItemsTable)}
                >
                  {showItemsTable ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            {hasChanges && (
              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelChanges}
                  disabled={isLoading}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSaveChanges}
                  disabled={isLoading}
                >
                  <Save className="h-3.5 w-3.5 mr-1" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>

          {/* Return Mode - Expanded Content */}
          {isReturning && (
            <div className="mt-4 bg-card rounded-lg border border-orange-200 dark:border-orange-800 overflow-hidden">
              <div className="px-4 py-2 bg-orange-50 dark:bg-orange-950/20 border-b border-orange-200 dark:border-orange-800 flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-orange-700 dark:text-orange-400 font-medium">Return Mode</span>
                  <span className="text-muted-foreground mx-2">•</span>
                  Refund: <span className="font-semibold">{formatCurrency(computedRefund)}</span>
                  <span className="mx-2">•</span>
                  New Total: <span className="font-bold text-primary">{formatCurrency(newTotal)}</span>
                </div>
                <Button size="sm" onClick={handleReturn} disabled={isLoading || computedRefund <= 0} className="h-7">
                  <Save className="h-3 w-3 mr-1" />
                  Process Return
                </Button>
              </div>

              {/* Return Notes */}
              <div className="px-4 py-3 border-b border-orange-200 dark:border-orange-800">
                <Label className="text-xs">Return Notes (Optional)</Label>
                <Textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Enter notes about the return..."
                  className="mt-1 text-sm min-h-[60px]"
                />
              </div>
              
              {/* Items Table for Return */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-xs">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground w-12">#</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Product Name</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground w-20">Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground w-28">Unit Price</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground w-32">Total</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground w-24">Return Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {order.items.map((item, index) => (
                      <tr key={index} className="hover:bg-muted/20 transition-colors text-sm">
                        <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                        <td className="px-3 py-2">
                          <div>
                            <p className="font-medium text-foreground">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">ID: {item.productId}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge variant="secondary" className="text-xs">{item.quantity}</Badge>
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          Rs. {item.unitPrice.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-primary">
                          Rs. {item.total.toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max={item.quantity}
                            value={returnQuantities[item.productId] || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              setReturnQuantities({
                                ...returnQuantities,
                                [item.productId]: value === "" ? 0 : parseFloat(value)
                              });
                            }}
                            placeholder="0"
                            className="w-20 h-7 text-center text-xs mx-auto"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* View Items Table (non-return mode) */}
          {showItemsTable && !isReturning && (
            <div className="mt-4 bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="text-xs">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground w-12">#</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Product Name</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground w-20">Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground w-28">Unit Price</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground w-32">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {order.items.map((item, index) => (
                      <tr key={index} className="hover:bg-muted/20 transition-colors text-sm">
                        <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                        <td className="px-3 py-2">
                          <div>
                            <p className="font-medium text-foreground">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">ID: {item.productId}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge variant="secondary" className="text-xs">{item.quantity}</Badge>
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          Rs. {item.unitPrice.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-primary">
                          Rs. {item.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-muted/30 border-t border-border flex justify-end gap-4 text-sm">
                <span className="text-muted-foreground">Subtotal: <span className="font-semibold text-foreground">{formatCurrency(order.subtotal)}</span></span>
                {order.discount > 0 && <span className="text-muted-foreground">Discount: <span className="font-semibold text-red-600">-{formatCurrency(order.discount)}</span></span>}
                <span className="text-muted-foreground">Total: <span className="font-bold text-primary">{formatCurrency(order.total)}</span></span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Outsourced Items */}
      {order.outsourcedItems && order.outsourcedItems.length > 0 && (
        <div className="mt-4 bg-card rounded-lg border border-orange-200 dark:border-orange-800 overflow-hidden">
          <div className="px-4 py-3 bg-orange-50 dark:bg-orange-950/20 border-b border-orange-200 dark:border-orange-800">
            <h4 className="text-sm font-semibold text-foreground">Outsourced Items</h4>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-xs">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground w-12">#</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Product</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground w-20">Qty</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground w-28">Unit Price</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground w-32">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {order.outsourcedItems.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-muted/20 transition-colors text-sm">
                    <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                    <td className="px-3 py-2 font-medium text-foreground">{item.name}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant="secondary" className="text-xs">{item.quantity}</Badge>
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      Rs. {item.price.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-primary">
                      Rs. {(item.quantity * item.price).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Picker Modal */}
      <Dialog open={isCustomerPickerOpen} onOpenChange={setIsCustomerPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, ID, or phone..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Walk-in Option */}
            <Card
              className={`cursor-pointer transition-all ${
                selectedCustomerId === null
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/50'
              }`}
              onClick={() => handleSelectCustomer(null)}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="font-medium">Walk-in Customer</span>
                </div>
                {selectedCustomerId === null && (
                  <div className="p-1 bg-primary rounded-full">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer List */}
            <ScrollArea className="h-[300px]">
              {loadingCustomers ? (
                <div className="text-center py-8 text-muted-foreground">Loading customers...</div>
              ) : (
                <div className="space-y-2 pr-4">
                  {filteredCustomers.map((customer) => (
                    <Card
                      key={customer.id}
                      className={`cursor-pointer transition-all ${
                        selectedCustomerId === customer.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/50'
                      }`}
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-muted">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ID: {customer.id}
                              {customer.phone && ` • ${customer.phone}`}
                            </p>
                          </div>
                        </div>
                        {selectedCustomerId === customer.id && (
                          <div className="p-1 bg-primary rounded-full">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {filteredCustomers.length === 0 && !loadingCustomers && (
                    <div className="text-center py-8 text-muted-foreground">
                      No customers found
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomerPickerOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
