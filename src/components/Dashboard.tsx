/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { usePharmacyStore } from '../store';
import { 
  TrendingUp, IndianRupee, AlertTriangle, Skull, PackageCheck, 
  Users, Layers, ArrowUpRight, History, BellRing, ChevronRight
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { sales, batches, suppliers, medicines, purchases, customerReturns, settings } = usePharmacyStore();

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
  // profit = saleItem.subtotal - (saleItem.baseUnitsQuantity * saleItem.purchasePricePerUnit)
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
  const lowStockCount = lowStockBatches.length;

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

  return (
    <div className="space-y-6 font-sans">
      {/* App Header Bar inside UI */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800 p-6 rounded-2xl border border-slate-700/40 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Hi, {usePharmacyStore.getState().currentUser?.username}!</h1>
          <p className="text-slate-400 text-sm mt-1">Here is a summary of Master Pharmacy operations for today, {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-mono bg-slate-900 border border-slate-700 py-1.5 px-3 rounded-lg text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            Offline Server: Port 3000
          </span>
          <button 
            onClick={() => onNavigate('POS Billing')}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
          >
            Launch POS Billing (F2)
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/30 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Today's Sales</p>
            <p className="text-2xl font-bold text-white font-mono">{formatPKR(totalTodaySalesVal)}</p>
            <p className="text-xs text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              <span>{todaySales.length} invoices processed</span>
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
            <IndianRupee className="h-6 w-6" />
          </div>
        </div>

        {/* Today's Profit */}
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/30 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Today's Margin Net</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono">{formatPKR(todayProfit)}</p>
            <p className="text-xs text-slate-400">
              Est. Profit: {totalTodaySalesVal > 0 ? ((todayProfit / totalTodaySalesVal) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Monthly Sales */}
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/30 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Monthly Sales</p>
            <p className="text-2xl font-bold text-white font-mono">{formatPKR(totalMonthSalesVal)}</p>
            <p className="text-xs text-emerald-400 flex items-center gap-0.5">
              <span>Net profit: {formatPKR(monthlyProfit)}</span>
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        {/* Supplier Payable Balance */}
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/30 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Supplier Payables</p>
            <p className="text-2xl font-bold text-rose-400 font-mono">{formatPKR(totalPayableToSuppliers)}</p>
            <p className="text-xs text-slate-400">Outstanding credit balance</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400">
            <Users className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Alerts Panel & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 rounded-2xl border border-slate-700/40 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BellRing className="h-5 w-5 text-amber-400" />
                Critical Expiry & Stock Alerts
              </h2>
              <span className="text-xs font-mono bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-amber-300">
                Live Stock Check
              </span>
            </div>

            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {/* Expired alert */}
              {expiredBatches.map(b => {
                const med = medicines.find(m => m.id === b.medicineId);
                return (
                  <div key={b.id} className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-rose-500 text-slate-950">EXPIRED</span>
                        <span className="text-sm font-semibold text-white">{med?.brandName} {med?.strength}</span>
                      </div>
                      <p className="text-xs text-slate-400">Batch {b.batchNumber} • Expired on {b.expiryDate}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-rose-400 font-mono">{b.totalUnitsAvailable} units</span>
                      <p className="text-[10px] text-slate-400">Locked from sales</p>
                    </div>
                  </div>
                );
              })}

              {/* Expiring soon */}
              {expiringSoonBatches.map(b => {
                const med = medicines.find(m => m.id === b.medicineId);
                return (
                  <div key={b.id} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950">NEAR EXPIRY</span>
                        <span className="text-sm font-semibold text-white">{med?.brandName} {med?.strength}</span>
                      </div>
                      <p className="text-xs text-slate-400">Batch {b.batchNumber} • Expiry {b.expiryDate}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-amber-400 font-mono">{b.totalUnitsAvailable} units</span>
                      <p className="text-[10px] text-slate-400">FEFO Auto-prioritized</p>
                    </div>
                  </div>
                );
              })}

              {/* Low stock alerts */}
              {lowStockBatches.filter(b => !b.isExpired && b.totalUnitsAvailable > 0).map(b => {
                const med = medicines.find(m => m.id === b.medicineId);
                return (
                  <div key={b.id} className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-blue-500 text-slate-950">LOW STOCK</span>
                        <span className="text-sm font-semibold text-white">{med?.brandName} {med?.strength}</span>
                      </div>
                      <p className="text-xs text-slate-400">Batch {b.batchNumber} • Supplier Balance Minimum Alert</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-blue-400 font-mono">{b.totalUnitsAvailable} units</span>
                      <p className="text-[10px] text-slate-400">Threshold: {b.minimumStock}</p>
                    </div>
                  </div>
                );
              })}

              {expiredBatches.length === 0 && expiringSoonBatches.length === 0 && lowStockBatches.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <PackageCheck className="h-10 w-10 text-emerald-500/20 mx-auto mb-2" />
                  <p className="text-sm font-medium">All medicines and batches are in excellent state.</p>
                  <p className="text-xs">No expiries or low stock alerts within 60 days.</p>
                </div>
              )}
            </div>
          </div>

          {/* Business Inventory Value Summaries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/30">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Drug Stock Valuation</h3>
              <p className="text-2xl font-bold text-white font-mono">{formatPKR(totalInventoryValue)}</p>
              <p className="text-xs text-slate-400 mt-1">Calculated batch-wise at actual cost price</p>
            </div>
            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700/30">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total System Catalog</h3>
              <p className="text-2xl font-bold text-white font-mono">{medicines.length} Medicines</p>
              <p className="text-xs text-slate-400 mt-1">{batches.length} individual batch entries monitored</p>
            </div>
          </div>
        </div>

        {/* Right Column: Top Medicines & Recent Sales */}
        <div className="space-y-6">
          {/* Top Selling Medicines */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700/40 p-5">
            <h2 className="text-lg font-bold text-white border-b border-slate-700/50 pb-3 mb-4">
              Top Selling Medicines
            </h2>
            <div className="space-y-4">
              {topSellingList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-white">{item.brandName}</p>
                    <p className="text-xs text-slate-400">{item.company}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400 font-mono">{formatPKR(item.revenue)}</p>
                    <p className="text-[10px] text-slate-400">{item.qty} tabs sold</p>
                  </div>
                </div>
              ))}
              {topSellingList.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-6">No sales completed yet to rank medicines.</p>
              )}
            </div>
          </div>

          {/* Quick Operations Links */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700/40 p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">POS Fast Links</h2>
            <button 
              onClick={() => onNavigate('Inventory')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/40 text-slate-300 hover:text-white hover:bg-slate-700/40 transition-all text-sm group"
            >
              <span>Add Opening Stock / Batches</span>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-all" />
            </button>
            <button 
              onClick={() => onNavigate('Suppliers')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/40 text-slate-300 hover:text-white hover:bg-slate-700/40 transition-all text-sm group"
            >
              <span>Log Supplier Credit & Payments</span>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-all" />
            </button>
            <button 
              onClick={() => onNavigate('Reports')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/40 text-slate-300 hover:text-white hover:bg-slate-700/40 transition-all text-sm group"
            >
              <span>View Profit & Expiry Forecasts</span>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-all" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
