import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, Package, DollarSign, Download, AlertTriangle } from "lucide-react";

interface ReportsTabProps {
  salesReport: any;
  inventoryReport: any;
  financialReport: any;
}

export function ReportsTab({ salesReport, inventoryReport, financialReport }: ReportsTabProps) {
  return (
    <div className="space-y-6">
      {/* Report Generation Header */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-6 w-6 text-primary" />
            Business Reports
          </CardTitle>
          <CardDescription>
            Comprehensive business analytics and detailed reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="h-20 flex flex-col gap-2 border-border hover:bg-accent" variant="outline">
              <TrendingUp className="h-6 w-6 text-primary" />
              <div className="text-center">
                <p className="font-medium text-foreground">Sales Reports</p>
                <p className="text-xs text-muted-foreground">Revenue & order analysis</p>
              </div>
            </Button>
            <Button className="h-20 flex flex-col gap-2 border-border hover:bg-accent" variant="outline">
              <Package className="h-6 w-6 text-primary" />
              <div className="text-center">
                <p className="font-medium text-foreground">Inventory Reports</p>
                <p className="text-xs text-muted-foreground">Stock & movement analysis</p>
              </div>
            </Button>
            <Button className="h-20 flex flex-col gap-2 border-border hover:bg-accent" variant="outline">
              <DollarSign className="h-6 w-6 text-primary" />
              <div className="text-center">
                <p className="font-medium text-foreground">Financial Reports</p>
                <p className="text-xs text-muted-foreground">P&L and cash flow</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales Report Summary */}
      {salesReport && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-foreground">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Sales Report Summary
              </div>
              <Button size="sm" variant="outline" className="border-border">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-2xl font-bold text-primary">
                  Rs. {salesReport.data?.summary?.totalRevenue?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
              <div className="text-center p-4 bg-accent rounded-lg border border-border">
                <p className="text-2xl font-bold text-foreground">
                  {salesReport.data?.summary?.totalOrders?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
              <div className="text-center p-4 bg-accent rounded-lg border border-border">
                <p className="text-2xl font-bold text-foreground">
                  Rs. {salesReport.data?.summary?.avgOrderValue?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-2xl font-bold text-primary">
                  {salesReport.data?.summary?.growth?.toFixed(1) || '0'}%
                </p>
                <p className="text-sm text-muted-foreground">Growth Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Report Summary */}
      {inventoryReport && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-foreground">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Inventory Report Summary
              </div>
              <Button size="sm" variant="outline" className="border-border">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-accent rounded-lg border border-border">
                <p className="text-2xl font-bold text-foreground">
                  {inventoryReport.data?.inventoryReport?.totalProducts || '0'}
                </p>
                <p className="text-sm text-muted-foreground">Total Products</p>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-2xl font-bold text-primary">
                  Rs. {inventoryReport.data?.inventoryReport?.totalValue?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
              <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-2xl font-bold text-destructive">
                  {inventoryReport.data?.inventoryReport?.lowStockItems?.length || '0'}
                </p>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
              </div>
            </div>

            {/* Low Stock Items Alert */}
            {inventoryReport.data?.inventoryReport?.lowStockItems?.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3 flex items-center gap-2 text-foreground">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Critical Stock Alerts
                </h4>
                <div className="space-y-2">
                  {inventoryReport.data?.inventoryReport?.lowStockItems?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          Current: {item.currentStock} | Min: {item.minStock}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        Reorder {item.reorderQuantity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
