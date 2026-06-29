/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePharmacyStore } from '../store';
import { MedicineBatch, StockAdjustmentType } from '../types';
import { 
  AlertTriangle, Filter, Plus, Info, RefreshCw, 
  Settings, Save, Activity, LayoutList, ChevronDown, Check, X 
} from 'lucide-react';

export default function InventoryManager() {
  const { 
    batches, medicines, suppliers, settings,
    addBatch, updateBatch, deleteBatch, addStockAdjustment, stockAdjustments 
  } = usePharmacyStore();

  const [activeTab, setActiveTab] = useState<'batches' | 'adjustments'>('batches');
  const [search, setSearch] = useState('');
  const [filterAlert, setFilterAlert] = useState<'all' | 'expired' | 'expiring' | 'low_stock'>('all');

  // Form State for creating batch
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [formData, setFormData] = useState({
    medicineId: '',
    supplierId: '',
    batchNumber: '',
    expiryDate: '',
    purchasePrice: 0,
    sellingPrice: 0,
    minimumStock: 100,
    quantityBoxes: 0,
    quantityStrips: 0,
    quantityUnits: 0,
    stripsPerBox: 10,
    unitsPerStrip: 10,
  });

  // Form State for manual adjustment
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [selectedBatchForAdj, setSelectedBatchForAdj] = useState<MedicineBatch | null>(null);
  const [adjType, setAdjType] = useState<StockAdjustmentType>('Correction');
  const [adjQtyChange, setAdjQtyChange] = useState('');
  const [adjReason, setAdjReason] = useState('');

  // Helpers
  const formatPKR = (val: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getMedicineInfo = (medId: string) => {
    return medicines.find(m => m.id === medId);
  };

  const getSupplierName = (supId: string) => {
    const s = suppliers.find(sup => sup.id === supId);
    return s ? s.name : 'Unknown Supplier';
  };

  // Filter batches
  const filteredBatches = batches.filter(b => {
    if (b.deletedAt) return false;
    const med = getMedicineInfo(b.medicineId);
    if (!med) return false;

    const matchSearch = 
      med.brandName.toLowerCase().includes(search.toLowerCase()) ||
      med.genericName.toLowerCase().includes(search.toLowerCase()) ||
      b.batchNumber.toLowerCase().includes(search.toLowerCase());

    const now = new Date();
    const warnLimit = new Date();
    warnLimit.setDate(now.getDate() + settings.expiryWarningDays);
    const expDate = new Date(b.expiryDate);

    if (filterAlert === 'expired') {
      return matchSearch && expDate < now;
    } else if (filterAlert === 'expiring') {
      return matchSearch && expDate >= now && expDate <= warnLimit;
    } else if (filterAlert === 'low_stock') {
      return matchSearch && b.totalUnitsAvailable <= b.minimumStock;
    }

    return matchSearch;
  });

  // Calculate profit margin on input changes
  const calculateMargin = (cost: number, sell: number) => {
    if (sell <= 0) return 0;
    return parseFloat((((sell - cost) / sell) * 100).toFixed(1));
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.medicineId || !formData.supplierId || !formData.batchNumber || !formData.expiryDate) {
      alert('Please fill out all required fields.');
      return;
    }

    // Convert to base units first
    const boxCapacity = formData.stripsPerBox * formData.unitsPerStrip;
    const stripCapacity = formData.unitsPerStrip;
    const totalUnits = (formData.quantityBoxes * boxCapacity) + (formData.quantityStrips * stripCapacity) + Number(formData.quantityUnits);

    const profitPercent = calculateMargin(formData.purchasePrice, formData.sellingPrice);

    addBatch({
      medicineId: formData.medicineId,
      supplierId: formData.supplierId,
      branchId: 'br_01',
      batchNumber: formData.batchNumber,
      expiryDate: formData.expiryDate,
      purchasePrice: formData.purchasePrice,
      sellingPrice: formData.sellingPrice,
      profitMargin: profitPercent,
      minimumStock: formData.minimumStock,
      quantityBoxes: formData.quantityBoxes,
      quantityStrips: formData.quantityStrips,
      quantityUnits: formData.quantityUnits,
      stripsPerBox: formData.stripsPerBox,
      unitsPerStrip: formData.unitsPerStrip,
      totalUnitsAvailable: totalUnits,
      totalUnitsPurchased: totalUnits,
    });

    alert('New Batch created and stocked into SQLite inventory.');
    setShowBatchModal(false);
  };

  // Adjustment submit
  const handleAdjSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForAdj) return;
    
    const qtyVal = parseInt(adjQtyChange);
    if (isNaN(qtyVal) || qtyVal === 0) {
      alert('Adjustment change must be a non-zero integer.');
      return;
    }
    if (!adjReason.trim()) {
      alert('A reason is mandatory for any stock adjustment.');
      return;
    }

    const med = getMedicineInfo(selectedBatchForAdj.medicineId);

    addStockAdjustment({
      medicineId: selectedBatchForAdj.medicineId,
      brandName: med?.brandName || 'Unknown Medicine',
      batchId: selectedBatchForAdj.id,
      batchNumber: selectedBatchForAdj.batchNumber,
      type: adjType,
      quantityChange: qtyVal,
      reason: adjReason,
    });

    alert('Stock adjustment saved in SQLite transactional logs.');
    setShowAdjModal(false);
    setSelectedBatchForAdj(null);
    setAdjQtyChange('');
    setAdjReason('');
  };

  const handleOpenAdj = (b: MedicineBatch) => {
    setSelectedBatchForAdj(b);
    setShowAdjModal(true);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800 p-5 rounded-2xl border border-slate-700/40 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Batch-Wise Inventory & Expiry</h1>
          <p className="text-slate-400 text-xs mt-0.5">Track batch-wise medicinal stock using FEFO (First-Expire, First-Out) algorithms.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all border cursor-pointer ${
              activeTab === 'batches'
                ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            Monitor Batches
          </button>
          <button
            onClick={() => setActiveTab('adjustments')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all border cursor-pointer ${
              activeTab === 'adjustments'
                ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            Audit Adjustments ({stockAdjustments.length})
          </button>
          <button
            onClick={() => {
              setFormData({
                medicineId: medicines[0]?.id || '',
                supplierId: suppliers[0]?.id || '',
                batchNumber: '',
                expiryDate: '',
                purchasePrice: 1.5,
                sellingPrice: 2.0,
                minimumStock: 150,
                quantityBoxes: 5,
                quantityStrips: 0,
                quantityUnits: 0,
                stripsPerBox: 10,
                unitsPerStrip: 10,
              });
              setShowBatchModal(true);
            }}
            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Batch Opening Stock
          </button>
        </div>
      </div>

      {activeTab === 'batches' ? (
        <>
          {/* Batches tab filter toolbar */}
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/40 flex flex-col md:flex-row gap-3.5 shadow-md text-xs">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-3 pr-4 py-2 text-white placeholder-slate-400 font-mono focus:outline-none focus:border-emerald-500"
                placeholder="Search Brand Name, Generic Name, Batch Number..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterAlert('all')}
                className={`px-3 py-1.5 rounded-lg border font-semibold ${
                  filterAlert === 'all'
                    ? 'bg-slate-900 border-slate-700 text-emerald-400'
                    : 'bg-slate-950/30 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                All Batches
              </button>
              <button
                onClick={() => setFilterAlert('expired')}
                className={`px-3 py-1.5 rounded-lg border font-semibold ${
                  filterAlert === 'expired'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-slate-950/30 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Expired Stock Only
              </button>
              <button
                onClick={() => setFilterAlert('expiring')}
                className={`px-3 py-1.5 rounded-lg border font-semibold ${
                  filterAlert === 'expiring'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-slate-950/30 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Near Expiry (60 Days)
              </button>
              <button
                onClick={() => setFilterAlert('low_stock')}
                className={`px-3 py-1.5 rounded-lg border font-semibold ${
                  filterAlert === 'low_stock'
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    : 'bg-slate-950/30 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Low Stock Thresholds
              </button>
            </div>
          </div>

          {/* Batches Table Grid */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700/40 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                    <th className="p-3.5">Medicine Brand</th>
                    <th className="p-3.5">Batch #</th>
                    <th className="p-3.5">Expiry Date</th>
                    <th className="p-3.5 text-right">Cost Price</th>
                    <th className="p-3.5 text-right">Sell Price</th>
                    <th className="p-3.5 text-right">Margin %</th>
                    <th className="p-3.5 text-center">Available Stock breakdown</th>
                    <th className="p-3.5 text-right">Total Units</th>
                    <th className="p-3.5 text-center">Audit Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredBatches.map(b => {
                    const med = getMedicineInfo(b.medicineId);
                    const isLow = b.totalUnitsAvailable <= b.minimumStock;
                    const isExp = new Date(b.expiryDate) < new Date();
                    
                    const limit = new Date();
                    limit.setDate(limit.getDate() + settings.expiryWarningDays);
                    const isNearExp = !isExp && new Date(b.expiryDate) <= limit;

                    return (
                      <tr key={b.id} className="hover:bg-slate-700/15 transition-all">
                        <td className="p-3.5 font-sans">
                          <p className="font-bold text-white text-sm">{med?.brandName} {med?.strength}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{med?.genericName}</p>
                        </td>
                        <td className="p-3.5 font-bold">
                          <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded text-slate-300">
                            {b.batchNumber}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {isExp ? (
                            <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                              Expired: {b.expiryDate}
                            </span>
                          ) : isNearExp ? (
                            <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              Near Expiry: {b.expiryDate}
                            </span>
                          ) : (
                            <span className="text-slate-300">{b.expiryDate}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-bold text-white">{formatPKR(b.purchasePrice)}</td>
                        <td className="p-3.5 text-right font-bold text-emerald-400">{formatPKR(b.sellingPrice)}</td>
                        <td className="p-3.5 text-right text-emerald-300 font-bold">{b.profitMargin}%</td>
                        <td className="p-3.5 text-center text-[11px] text-slate-400">
                          {b.quantityBoxes} boxes • {b.quantityStrips} strips • {b.quantityUnits} loose
                        </td>
                        <td className={`p-3.5 text-right font-bold font-mono ${isLow ? 'text-amber-400 bg-amber-500/5' : 'text-white'}`}>
                          {b.totalUnitsAvailable} units
                          {isLow && <p className="text-[10px] text-amber-500 font-sans mt-0.5 font-bold">LOW STOCK</p>}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleOpenAdj(b)}
                            className="bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredBatches.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-500 font-sans">
                        <AlertTriangle className="h-10 w-10 text-slate-600 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">No batch entries monitored under current filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Adjustments tab table */
        <div className="bg-slate-800 rounded-2xl border border-slate-700/40 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/40 bg-slate-800/80">
            <h2 className="text-md font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-400" />
              SQLite Transactional Stock Adjustments Journal
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Medicine</th>
                  <th className="p-3.5">Batch Reference</th>
                  <th className="p-3.5">Adjustment Type</th>
                  <th className="p-3.5 text-right">Quantity Change</th>
                  <th className="p-3.5">Mandatory Audit Reason</th>
                  <th className="p-3.5">Adjusted By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {stockAdjustments.map(adj => (
                  <tr key={adj.id} className="hover:bg-slate-700/15 transition-all">
                    <td className="p-3.5 text-slate-400">{new Date(adj.createdAt).toLocaleString('en-PK')}</td>
                    <td className="p-3.5 font-sans font-bold text-white">{adj.brandName}</td>
                    <td className="p-3.5 font-bold text-slate-400">{adj.batchNumber}</td>
                    <td className="p-3.5 font-bold uppercase text-[10px]">
                      <span className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-emerald-400">
                        {adj.type}
                      </span>
                    </td>
                    <td className={`p-3.5 text-right font-bold ${adj.quantityChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {adj.quantityChange > 0 ? `+${adj.quantityChange}` : adj.quantityChange} units
                    </td>
                    <td className="p-3.5 text-slate-300 font-sans italic">{adj.reason}</td>
                    <td className="p-3.5 font-bold text-slate-400">{adj.adjustedBy}</td>
                  </tr>
                ))}

                {stockAdjustments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500 font-sans">
                      <LayoutList className="h-10 w-10 text-slate-600 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">No manual adjustments have been performed yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD BATCH FORM */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-6 my-8">
            <div className="flex justify-between items-center border-b border-slate-700/50 pb-3 mb-4">
              <h3 className="text-lg font-bold text-white">Add Opening Stock Batch Entry</h3>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBatchSubmit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Select Medicine *</label>
                  <select
                    required
                    value={formData.medicineId}
                    onChange={(e) => setFormData({ ...formData, medicineId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="">-- Choose Drug --</option>
                    {medicines.filter(m => !m.deletedAt).map(m => (
                      <option key={m.id} value={m.id}>{m.brandName} {m.strength}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Select Supplier *</label>
                  <select
                    required
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Choose Distributor --</option>
                    {suppliers.filter(s => !s.deletedAt).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold"
                    placeholder="e.g. BAT-206"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Purchase Price / tab *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.purchasePrice || ''}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                    placeholder="PKR cost per tablet"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Selling Price / tab *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sellingPrice || ''}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                    placeholder="PKR sell price per tablet"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Minimum Stock Alert</label>
                  <input
                    type="number"
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700/40 space-y-3">
                <p className="font-bold text-white text-xs">Stock Conversion Settings</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono">Boxes</label>
                    <input
                      type="number"
                      value={formData.quantityBoxes}
                      onChange={(e) => setFormData({ ...formData, quantityBoxes: parseInt(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-center font-bold font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono">Strips</label>
                    <input
                      type="number"
                      value={formData.quantityStrips}
                      onChange={(e) => setFormData({ ...formData, quantityStrips: parseInt(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-center font-bold font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono">Loose Units</label>
                    <input
                      type="number"
                      value={formData.quantityUnits}
                      onChange={(e) => setFormData({ ...formData, quantityUnits: parseInt(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-center font-bold font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-300 font-bold uppercase font-mono">Total Units</label>
                    <div className="w-full py-1.5 bg-slate-950/80 border border-slate-800 rounded text-center text-emerald-400 font-bold font-mono text-sm h-9">
                      {(formData.quantityBoxes * formData.stripsPerBox * formData.unitsPerStrip) + (formData.quantityStrips * formData.unitsPerStrip) + Number(formData.quantityUnits)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono">Strips per Box</label>
                    <input
                      type="number"
                      value={formData.stripsPerBox}
                      onChange={(e) => setFormData({ ...formData, stripsPerBox: parseInt(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-center font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono">Tablets per Strip</label>
                    <input
                      type="number"
                      value={formData.unitsPerStrip}
                      onChange={(e) => setFormData({ ...formData, unitsPerStrip: parseInt(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-center font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="bg-slate-900 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer"
                >
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL ADJUSTMENT FORM */}
      {showAdjModal && selectedBatchForAdj && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-6">
            <div className="flex justify-between items-center border-b border-slate-700/50 pb-3 mb-4">
              <h3 className="text-lg font-bold text-white">Manual Stock Audit Adjustment</h3>
              <button onClick={() => { setShowAdjModal(false); setSelectedBatchForAdj(null); }} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdjSubmit} className="space-y-4 text-xs font-sans">
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-700/40 text-slate-300 space-y-1 font-mono text-[11px]">
                <p>Medicine: <strong className="text-white">{getMedicineInfo(selectedBatchForAdj.medicineId)?.brandName}</strong></p>
                <p>Batch Reference: <strong className="text-white">{selectedBatchForAdj.batchNumber}</strong></p>
                <p>Current Quantity: <strong className="text-white">{selectedBatchForAdj.totalUnitsAvailable} base units</strong></p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase block">Adjustment Type</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Correction">Correction</option>
                    <option value="Lost/Missing Stock">Lost/Missing Stock</option>
                    <option value="Damaged Stock">Damaged Stock</option>
                    <option value="Expired Stock">Expired Stock</option>
                    <option value="Manual Increase">Manual Increase</option>
                    <option value="Manual Decrease">Manual Decrease</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase block">Quantity Change *</label>
                  <input
                    type="number"
                    required
                    value={adjQtyChange}
                    onChange={(e) => setAdjQtyChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="Positive (+) or negative (-)"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold uppercase block">Mandatory Audit Reason *</label>
                <textarea
                  required
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full h-20 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Physical inventory check revealed discrepancies in tablet counting."
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={() => { setShowAdjModal(false); setSelectedBatchForAdj(null); }}
                  className="bg-slate-900 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer"
                >
                  Commit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
