/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePharmacyStore } from '../store';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { FileDown, Calendar, AlertCircle, TrendingUp, Layers, CheckCircle } from 'lucide-react';

export default function ReportsPanel() {
  const { sales, saleItems, medicines, batches, suppliers } = usePharmacyStore();
  const [reportType, setReportType] = useState<'sales' | 'profit' | 'inventory' | 'expiries'>('sales');

  const formatPKR = (val: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // 1. CHART DATA: Last 7 Days Sales Trend
  const getLast7DaysData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });

      // Calculate sales totals
      const daySales = sales.filter(s => s.createdAt.startsWith(dateStr) && s.status === 'Completed');
      const salesSum = daySales.reduce((sum, s) => sum + s.netPayable, 0);

      // Calculate cost
      let costSum = 0;
      daySales.forEach(s => {
        const sItems = saleItems.filter(si => si.saleId === s.id);
        sItems.forEach(item => {
          costSum += (item.baseUnitsQuantity * item.purchasePricePerUnit);
        });
      });

      const profitSum = Math.max(0, salesSum - costSum);

      data.push({
        date: label,
        rawDate: dateStr,
        Sales: salesSum,
        Profit: profitSum,
      });
    }
    return data;
  };

  const chartData7Days = getLast7DaysData();

  // 2. CHART DATA: Category breakdown
  const getCategoryData = () => {
    const categories: Record<string, number> = {};
    medicines.forEach(m => {
      categories[m.category] = (categories[m.category] || 0) + 1;
    });

    const data = Object.keys(categories).map(k => ({
      name: k,
      value: categories[k],
    }));

    return data.slice(0, 5); // top 5
  };

  const categoryData = getCategoryData();
  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  // CSV Exporters
  const exportCSV = (filename: string, csvHeaders: string[], csvRows: string[][]) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [csvHeaders.join(','), ...csvRows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSalesReport = () => {
    const headers = ['InvoiceNumber', 'Cashier', 'Customer', 'Subtotal', 'Tax', 'Discount', 'NetPayable', 'Date'];
    const rows = sales.map(s => [
      s.invoiceNumber,
      s.cashierName,
      s.customerName || 'Walk-in',
      String(s.totalAmount),
      String(s.taxAmount),
      String(s.discountAmount),
      String(s.netPayable),
      s.createdAt
    ]);
    exportCSV('pharmacy_sales_report.csv', headers, rows);
  };

  const handleExportInventoryReport = () => {
    const headers = ['BrandName', 'Generic', 'Company', 'BatchNumber', 'ExpiryDate', 'CostPrice', 'SellPrice', 'AvailableUnits'];
    const rows = batches.filter(b => !b.deletedAt).map(b => {
      const med = medicines.find(m => m.id === b.medicineId);
      return [
        med?.brandName || 'Unknown',
        med?.genericName || 'N/A',
        med?.company || 'N/A',
        b.batchNumber,
        b.expiryDate,
        String(b.purchasePrice),
        String(b.sellingPrice),
        String(b.totalUnitsAvailable)
      ];
    });
    exportCSV('pharmacy_inventory_report.csv', headers, rows);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header with selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800 p-5 rounded-2xl border border-slate-700/40 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Financial & Inventory Reports</h1>
          <p className="text-slate-400 text-xs mt-0.5 font-sans">Analyze drugstore revenues, drug margins, expiring stocks, and download CSV books.</p>
        </div>
        
        <div className="flex gap-2 text-xs">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 text-slate-300 rounded-xl p-2.5 font-bold cursor-pointer focus:outline-none focus:border-emerald-500"
          >
            <option value="sales">Sales Analysis Book</option>
            <option value="profit">Product Profit Margins</option>
            <option value="inventory">Wholesale Stock Ledger</option>
            <option value="expiries">Expiry Calendar Audits</option>
          </select>
          
          <button
            onClick={reportType === 'sales' ? handleExportSalesReport : handleExportInventoryReport}
            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer font-sans"
          >
            <FileDown className="h-4 w-4" />
            Export CSV Book
          </button>
        </div>
      </div>

      {/* Main analytical grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-mono">
        
        {/* Left column: Chart Trends */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Sales chart */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700/40 p-5 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-700/40 pb-3 font-sans">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              7-Day Sales & Profit margins Trend
            </h2>

            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData7Days}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                  <Area type="monotone" dataKey="Sales" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2.5} name="Gross Sales (PKR)" />
                  <Area type="monotone" dataKey="Profit" stroke="#3b82f6" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2.5} name="Net Profit (PKR)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabular Details depending on selected report */}
          {reportType === 'sales' && (
            <div className="bg-slate-800 rounded-2xl border border-slate-700/40 shadow-xl overflow-hidden">
              <div className="p-4 border-b border-slate-700/40">
                <h3 className="text-sm font-bold text-white font-sans">Sales Invoice ledger</h3>
              </div>
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Cashier</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3 text-right">Tax</th>
                      <th className="p-3 text-right">Discount</th>
                      <th className="p-3 text-right">Net Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {sales.map(s => (
                      <tr key={s.id} className="hover:bg-slate-700/10 text-slate-300">
                        <td className="p-3 font-bold text-white">{s.invoiceNumber}</td>
                        <td className="p-3">{s.cashierName}</td>
                        <td className="p-3 font-sans">{s.customerName || 'Walk-in'}</td>
                        <td className="p-3 text-right text-rose-400">{formatPKR(s.taxAmount)}</td>
                        <td className="p-3 text-right text-emerald-400">-{formatPKR(s.discountAmount)}</td>
                        <td className="p-3 text-right text-white font-bold">{formatPKR(s.netPayable)}</td>
                      </tr>
                    ))}
                    {sales.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500 font-sans">No invoice transactions complete.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'profit' && (
            <div className="bg-slate-800 rounded-2xl border border-slate-700/40 shadow-xl overflow-hidden">
              <div className="p-4 border-b border-slate-700/40">
                <h3 className="text-sm font-bold text-white font-sans">Medicine Profit Margins Ranking</h3>
              </div>
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                      <th className="p-3">Medicine Brand</th>
                      <th className="p-3">Batch Number</th>
                      <th className="p-3 text-right">Cost per Unit</th>
                      <th className="p-3 text-right">Sell per Unit</th>
                      <th className="p-3 text-right">Profit Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {batches.filter(b => !b.deletedAt).map(b => {
                      const med = medicines.find(m => m.id === b.medicineId);
                      return (
                        <tr key={b.id} className="hover:bg-slate-700/10">
                          <td className="p-3 font-sans font-bold text-white">{med?.brandName} {med?.strength}</td>
                          <td className="p-3 font-bold">{b.batchNumber}</td>
                          <td className="p-3 text-right">{formatPKR(b.purchasePrice)}</td>
                          <td className="p-3 text-right text-emerald-400 font-bold">{formatPKR(b.sellingPrice)}</td>
                          <td className="p-3 text-right text-emerald-300 font-bold">{b.profitMargin}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Right column: Category pie chart and summary indices */}
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-2xl border border-slate-700/40 p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-700/40 pb-2 font-sans">
              Therapeutic Catalog Breakdown
            </h2>

            <div className="h-[180px] w-full flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-[10px] font-sans font-semibold">
              {categoryData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="text-slate-300 truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <span className="text-slate-400">{item.value} drugs registered</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700/40 p-5 shadow-xl space-y-3.5">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-700/40 pb-2 font-sans">
              Core Ledger Balance Indices
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-xl border border-slate-700/30">
                <span className="text-slate-400 font-sans">Active Cash Invoice Registers:</span>
                <span className="font-bold text-white font-mono">{sales.filter(s => s.status === 'Completed').length}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-xl border border-slate-700/30">
                <span className="text-slate-400 font-sans">Drug Batches Tracked:</span>
                <span className="font-bold text-white font-mono">{batches.filter(b => !b.deletedAt).length}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-xl border border-slate-700/30">
                <span className="text-slate-400 font-sans">Active Distributors:</span>
                <span className="font-bold text-white font-mono">{suppliers.filter(s => !s.deletedAt).length}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
