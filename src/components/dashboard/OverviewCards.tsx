
import React from 'react';
import { StatsCard } from './StatsCard';
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, Target, Package2, CreditCard } from "lucide-react";

interface OverviewCardsProps {
  stats: any;
}

export function OverviewCards({ stats }: OverviewCardsProps) {
  return (
    <>
      {/* Main Overview Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Today's Revenue"
          value={`Rs. ${stats?.financial?.todayRevenue?.toLocaleString() || '0'}`}
          subtitle={`${stats?.financial?.revenueGrowth > 0 ? '+' : ''}${stats?.financial?.revenueGrowth?.toFixed(1) || '0'}% from yesterday`}
          icon={DollarSign}
          gradientFrom="from-[#012A4A]"
          gradientTo="to-[#01497C]"
        />
        
        <StatsCard
          title="Today's Orders"
          value={stats?.sales?.todaySales?.toLocaleString() || '0'}
          subtitle={`Avg: Rs. ${stats?.sales?.avgOrderValue?.toLocaleString() || '0'}`}
          icon={ShoppingCart}
          gradientFrom="from-[#013A63]"
          gradientTo="to-[#2A6F97]"
        />
        
        <StatsCard
          title="Low Stock Items"
          value={stats?.inventory?.lowStockItems || '0'}
          subtitle={`Value: Rs. ${(stats?.inventory?.totalInventoryValue / 1000)?.toFixed(0) || '0'}k`}
          icon={Package}
          gradientFrom="from-[#014F86]"
          gradientTo="to-[#2C7DA0]"
        />
        
        <StatsCard
          title="Total Customers"
          value={stats?.customers?.totalCustomers?.toLocaleString() || '0'}
          subtitle={`Avg: Rs. ${stats?.customers?.avgCustomerValue?.toLocaleString() || '0'}`}
          icon={Users}
          gradientFrom="from-[#2A6F97]"
          gradientTo="to-[#468FAF]"
        />
      </div>

      {/* Additional Financial Metrics Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Month Revenue"
          value={`Rs. ${(stats?.financial?.monthRevenue)?.toFixed(0) || '0'}`}
          subtitle={`${stats?.financial?.monthlyGrowth?.toFixed(1) || '0'}% growth`}
          icon={TrendingUp}
          gradientFrom="from-[#2C7DA0]"
          gradientTo="to-[#61A5C2]"
        />

        <StatsCard
          title="Monthly Profit"
          value={`Rs. ${(stats?.financial?.netProfit)?.toFixed(0) || '0'}`}
          subtitle={`${stats?.financial?.profitMargin?.toFixed(1) || '0'}% profit Margin`}
          icon={Target}
          gradientFrom="from-[#468FAF]"
          gradientTo="to-[#89C2D9]"
        />

        <StatsCard
          title="Receivables"
          value={`Rs. ${stats?.customers?.totalReceivables?.toLocaleString() || '0'}`}
          subtitle="Outstanding payments"
          icon={CreditCard}
          gradientFrom="from-[#61A5C2]"
          gradientTo="to-[#A9D6E5]"
        />

        <StatsCard
          title="Inventory Value"
          value={`Rs. ${(stats?.inventory?.totalInventoryValue / 1000000)?.toFixed(1) || '0'}M`}
          subtitle={`Turnover: ${stats?.inventory?.inventoryTurnover?.toFixed(2) || '0'}`}
          icon={Package2}
          gradientFrom="from-[#01497C]"
          gradientTo="to-[#468FAF]"
        />
      </div>
    </>
  );
}
