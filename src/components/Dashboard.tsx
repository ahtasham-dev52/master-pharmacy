/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { usePharmacyStore } from '../store';
import { 
  TrendingUp, IndianRupee, AlertTriangle, PackageCheck, 
  Users, Layers, ChevronRight, BellRing, Pill
} from 'lucide-react';
import { Card, StatCard } from './UI';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { sales, batches, suppliers, medicines, settings } = usePharmacyStore();

  // Helper formatting PKR
  const formatPKR = (val: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Date constants
  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM

  // Filter sales
  const todaySales = sales.filter(s => s.createdAt.startsWith(todayStr) && s.status === 'Completed');
  const thisMonthSales = sales.filter(s => s.createdAt.startsWith(thisMonthStr) && s.status === 'Completed');

  const totalTodaySalesVal = todaySales.reduce((sum, s) => sum + s.netPayable, 0);
  const totalMonthSalesVal = thisMonthSales.reduce((sum, s) => sum + s.netPayable, 0);

  // Profit calculations
  const getSaleProfit = (saleId: string) => {
    const items = usePharmacyStore.getState().saleItems.filter(si => si.saleId === saleId);
    return items.reduce((sum, item) => {
      const cost = item.baseUnitsQuantity * item.purchasePricePerUnit;
      return sum + (item.subtotal - cost);
    }, 0);
  };

  const todayProfit = todaySales.reduce((sum, s) => sum + getSaleProfit(s.id), 0);
  const monthlyProfit = thisMonthSales.reduce((sum, s) => sum + getSaleProfit(s.id), 0);

  // Low stock
  const lowStockBatches = batches.filter(b => b.totalUnitsAvailable <= b.minimumStock && !b.deletedAt);

  // Expiry stats
  const now = new Date();
  const warningLimit = new Date();
  warningLimit.setDate(now.getDate() + settings.expiryWarningDays);

  const expiredBatches = batches.filter(b => new Date(b.expiryDate) < now && !b.deletedAt && b.totalUnitsAvailable > 0);
  const expiringSoonBatches = batches.filter(b => {
    const expDate = new Date(b.expiryDate);
    return expDate >= now && expDate <= warningLimit && !b.deletedAt && b.totalUnitsAvailable > 0;
  });

  // Inventory value & accounts payable
  const totalInventoryValue = batches.filter(b => !b.deletedAt).reduce((sum, b) => sum + (b.totalUnitsAvailable * b.purchasePrice), 0);
  const totalPayableToSuppliers = suppliers.filter(s => !s.deletedAt).reduce((sum, s) => sum + s.currentPayableBalance, 0);

  // Top selling medicines (by base units qty sold)
  const saleItems = usePharmacyStore.getState().saleItems;
  const medSalesMap: Record<string, { brandName: string; company: string; qty: number; revenue: number }> = {};
  saleItems.forEach(item => {
    const sale = sales.find(s => s.id === item.saleId);
    if (sale && sale.status === 'Completed') {
      if (!medSalesMap[item.medicineId]) {
        const med = medicines.find(m => m.id === item.medicineId);
        medSalesMap[item.medicineId] = {
          brandName: med ? med.brandName : item.medicineName,
          company: med ? med.company : '',
          qty: 0,
          revenue: 0
        };
      }
      medSalesMap[item.medicineId].qty += item.baseUnitsQuantity;
      medSalesMap[item.medicineId].revenue += item.subtotal;
    }
  });

  const topSellingList = Object.values(medSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const todayMarginPercent = totalTodaySalesVal > 0 ? ((todayProfit / totalTodaySalesVal) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 font-sans">
      
      {/* Dashboard Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Assalam-o-Alaikum, {usePharmacyStore.getState().currentUser?.username}!
          </h1>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            Here is a summary of Master Pharmacy operations for today, <span className="font-bold text-slate-700">{new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>.
          </p>
        </div>
        <button 
          onClick={() => onNavigate('pos')}
          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold px-5 py-3 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/10 cursor-pointer whitespace-nowrap"
        >
          Launch POS Billing Terminal (F2)
        </button>
      </div>

      {/* Main Responsive Stats Grid (1-column on Mobile, 2-column on Tablet, 4-column on Desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Gross Sales"
          value={formatPKR(totalTodaySalesVal)}
          subtext={`${todaySales.length} billing tickets today`}
          icon={IndianRupee}
          badgeText="Active"
          badgeType="success"
        />

        <StatCard
          title="Today's Net Margin"
          value={formatPKR(todayProfit)}
          subtext={`Profit margin ratio: ${todayMarginPercent}%`}
          icon={TrendingUp}
          badgeText="Live profit"
          badgeType="info"
        />

        <StatCard
          title="Monthly Accumulated"
          value={formatPKR(totalMonthSalesVal)}
          subtext={`Net margin: ${formatPKR(monthlyProfit)}`}
          icon={Layers}
          badgeText="Monthly"
          badgeType="info"
        />

        <StatCard
          title="Supplier Payables"
          value={formatPKR(totalPayableToSuppliers)}
          subtext="Total outstanding credit"
          icon={Users}
          badgeText={totalPayableToSuppliers > 0 ? "Credit due" : "Paid up"}
          badgeType={totalPayableToSuppliers > 0 ? "danger" : "success"}
        />
      </div>

      {/* alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Alerts Panel & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                <BellRing className="h-4 w-4 text-amber-500" />
                Critical Expiry & Stock Alerts
              </h2>
              <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600 border border-slate-200">
                FEFO Check
              </span>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {/* Expired alerts */}
              {expiredBatches.map(b => {
                const med = medicines.find(m => m.id === b.medicineId);
                return (
                  <div key={b.id} className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center justify-between transition-all hover:bg-rose-100/30">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-rose-600 text-white">EXPIRED</span>
                        <span className="text-xs font-bold text-slate-800">{med?.brandName} {med?.strength}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Batch {b.batchNumber} • Expired: {b.expiryDate}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-rose-700 font-mono">{b.totalUnitsAvailable} units</span>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Blocked From POS</p>
                    </div>
                  </div>
                );
              })}

              {/* Expiring soon alerts */}
              {expiringSoonBatches.map(b => {
                const med = medicines.find(m => m.id === b.medicineId);
                return (
                  <div key={b.id} className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center justify-between transition-all hover:bg-amber-100/30">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-amber-500 text-slate-900">NEAR EXPIRY</span>
                        <span className="text-xs font-bold text-slate-800">{med?.brandName} {med?.strength}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Batch {b.batchNumber} • Expiry: {b.expiryDate}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-amber-700 font-mono">{b.totalUnitsAvailable} units</span>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Prioritize Sale</p>
                    </div>
                  </div>
                );
              })}

              {/* Low stock alerts */}
              {lowStockBatches.filter(b => !b.isExpired && b.totalUnitsAvailable > 0).map(b => {
                const med = medicines.find(m => m.id === b.medicineId);
                return (
                  <div key={b.id} className="bg-sky-50 border border-sky-100 rounded-xl p-3 flex items-center justify-between transition-all hover:bg-sky-100/30">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-sky-500 text-white">LOW STOCK</span>
                        <span className="text-xs font-bold text-slate-800">{med?.brandName} {med?.strength}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Batch {b.batchNumber} • Minimum stock threshold alert</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-sky-700 font-mono">{b.totalUnitsAvailable} units</span>
                      <p className="text-[9px] text-slate-400">Min Alert: {b.minimumStock}</p>
                    </div>
                  </div>
                );
              })}

              {expiredBatches.length === 0 && expiringSoonBatches.length === 0 && lowStockBatches.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                  <PackageCheck className="h-10 w-10 text-emerald-500/20 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">All Drug Batches Excellent</p>
                  <p className="text-[10px] text-slate-400 mt-1">No low-stock or expiring batches identified inside the catalog.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Business Inventory Value Summaries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Drug Stock Valuation</h3>
                <p className="text-xl font-extrabold text-slate-800 font-mono mt-2">{formatPKR(totalInventoryValue)}</p>
              </div>
              <p className="text-[10px] text-slate-400 mt-3 font-semibold">Calculated batch-wise at actual cost price</p>
            </Card>
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total System Catalog</h3>
                <p className="text-xl font-extrabold text-slate-800 font-mono mt-2">{medicines.length} Medicines</p>
              </div>
              <p className="text-[10px] text-slate-400 mt-3 font-semibold">{batches.length} individual batch entries monitored</p>
            </Card>
          </div>
        </div>

        {/* Right Column: Top Medicines & Recent Sales */}
        <div className="space-y-6">
          {/* Top Selling Medicines */}
          <Card>
            <h2 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-4 uppercase tracking-wider">
              Top Selling Medicines
            </h2>
            <div className="space-y-4">
              {topSellingList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">{item.brandName}</p>
                    <p className="text-[10px] text-slate-400">{item.company}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-emerald-600 font-mono">{formatPKR(item.revenue)}</p>
                    <p className="text-[9px] text-slate-500 font-semibold">{item.qty} base units sold</p>
                  </div>
                </div>
              ))}
              {topSellingList.length === 0 && (
                <p className="text-[11px] text-slate-400 text-center py-6">No sales completed yet to rank medicines.</p>
              )}
            </div>
          </Card>

          {/* Quick Operations Links */}
          <Card className="space-y-2.5">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">POS Fast Links</h2>
            <button 
              onClick={() => onNavigate('inventory')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all text-xs group cursor-pointer border border-slate-100"
            >
              <span>Add Opening Stock / Batches</span>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-all" />
            </button>
            <button 
              onClick={() => onNavigate('suppliers')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all text-xs group cursor-pointer border border-slate-100"
            >
              <span>Log Supplier Credit & Payments</span>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-all" />
            </button>
            <button 
              onClick={() => onNavigate('reports')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all text-xs group cursor-pointer border border-slate-100"
            >
              <span>View Profit & Expiry Forecasts</span>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-all" />
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
