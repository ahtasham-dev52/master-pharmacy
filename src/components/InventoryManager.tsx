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
    <div className="space-y-6 font-sans text-slate-800">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 gap-4 shadow-xs">
        <div>
          <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">Batch-Wise Inventory & Expiry</h1>
          <p className="text-slate-500 text-xs mt-0.5">Track batch-wise medicinal stock using FEFO (First-Expire, First-Out) algorithms.</p>
        </div>
        <div className="flex gap-2 text-xs flex-wrap">
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all border cursor-pointer ${
              activeTab === 'batches'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Monitor Batches
          </button>
          <button
            onClick={() => setActiveTab('adjustments')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all border cursor-pointer ${
              activeTab === 'adjustments'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
                purchasePrice: 15,
                sellingPrice: 20,
                minimumStock: 150,
                quantityBoxes: 5,
                quantityStrips: 0,
                quantityUnits: 0,
                stripsPerBox: 10,
                unitsPerStrip: 10,
              });
              setShowBatchModal(true);
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm shadow-emerald-600/10"
          >
            <Plus className="h-4 w-4" /> Add Batch Opening Stock
          </button>
        </div>
      </div>

      {activeTab === 'batches' ? (
        <>
          {/* Batches tab filter toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col lg:flex-row gap-3.5 shadow-xs text-xs">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-4 py-2.5 text-slate-800 placeholder-slate-400 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Search Brand Name, Generic Name, Batch Number..."
              />
            </div>

            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setFilterAlert('all')}
                className={`px-3 py-1.5 rounded-lg border font-semibold cursor-pointer ${
                  filterAlert === 'all'
                    ? 'bg-slate-100 border-slate-300 text-slate-800 font-bold'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                All Batches
              </button>
              <button
                onClick={() => setFilterAlert('expired')}
                className={`px-3 py-1.5 rounded-lg border font-semibold cursor-pointer ${
                  filterAlert === 'expired'
                    ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Expired Stock Only
              </button>
              <button
                onClick={() => setFilterAlert('expiring')}
                className={`px-3 py-1.5 rounded-lg border font-semibold cursor-pointer ${
                  filterAlert === 'expiring'
                    ? 'bg-amber-50 border-amber-200 text-amber-700 font-bold'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Near Expiry (60 Days)
              </button>
              <button
                onClick={() => setFilterAlert('low_stock')}
                className={`px-3 py-1.5 rounded-lg border font-semibold cursor-pointer ${
                  filterAlert === 'low_stock'
                    ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Low Stock Thresholds
              </button>
            </div>
          </div>

          {/* Batches Table Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3.5 text-[10px] uppercase tracking-wider">Medicine Brand</th>
                    <th className="p-3.5 text-[10px] uppercase tracking-wider">Batch #</th>
                    <th className="p-3.5 text-[10px] uppercase tracking-wider">Expiry Date</th>
                    <th className="p-3.5 text-right text-[10px] uppercase tracking-wider">Cost Price</th>
                    <th className="p-3.5 text-right text-[10px] uppercase tracking-wider">Sell Price</th>
                    <th className="p-3.5 text-right text-[10px] uppercase tracking-wider">Margin %</th>
                    <th className="p-3.5 text-center text-[10px] uppercase tracking-wider">Available Stock Breakdown</th>
                    <th className="p-3.5 text-right text-[10px] uppercase tracking-wider">Total Units</th>
                    <th className="p-3.5 text-center text-[10px] uppercase tracking-wider">Audit Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {filteredBatches.map(b => {
                    const med = getMedicineInfo(b.medicineId);
                    const isLow = b.totalUnitsAvailable <= b.minimumStock;
                    const isExp = new Date(b.expiryDate) < new Date();
                    
                    const limit = new Date();
                    limit.setDate(limit.getDate() + settings.expiryWarningDays);
                    const isNearExp = !isExp && new Date(b.expiryDate) <= limit;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50 transition-all">
                        <td className="p-3.5 font-sans">
                          <p className="font-bold text-slate-800 text-sm">{med?.brandName} {med?.strength}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{med?.genericName}</p>
                        </td>
                        <td className="p-3.5 font-bold font-mono">
                          <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-slate-700">
                            {b.batchNumber}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {isExp ? (
                            <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              Expired: {b.expiryDate}
                            </span>
                          ) : isNearExp ? (
                            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Near Expiry: {b.expiryDate}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-mono">{b.expiryDate}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-bold font-mono text-slate-800">{formatPKR(b.purchasePrice)}</td>
                        <td className="p-3.5 text-right font-bold font-mono text-emerald-600">{formatPKR(b.sellingPrice)}</td>
                        <td className="p-3.5 text-right text-emerald-600 font-bold font-mono">{b.profitMargin}%</td>
                        <td className="p-3.5 text-center text-[11px] text-slate-500 font-mono">
                          {b.quantityBoxes} boxes • {b.quantityStrips} strips • {b.quantityUnits} loose
                        </td>
                        <td className={`p-3.5 text-right font-bold font-mono ${isLow ? 'text-amber-700 bg-amber-50' : 'text-slate-800'}`}>
                          {b.totalUnitsAvailable} units
                          {isLow && <p className="text-[10px] text-amber-600 font-sans mt-0.5 font-extrabold uppercase">Low Stock</p>}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleOpenAdj(b)}
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredBatches.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400 font-sans">
                        <AlertTriangle className="h-10 w-10 text-slate-300 mx-auto mb-2 opacity-60" />
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">No Batches Monitored</p>
                        <p className="text-[10px] text-slate-400 mt-1">Try resetting filter controls.</p>
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-white">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
              <Activity className="h-4.5 w-4.5 text-emerald-600" />
              SQLite Transactional Stock Adjustments Journal
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3.5 text-[10px] uppercase tracking-wider">Timestamp</th>
                  <th className="p-3.5 text-[10px] uppercase tracking-wider">Medicine</th>
                  <th className="p-3.5 text-[10px] uppercase tracking-wider">Batch Reference</th>
                  <th className="p-3.5 text-[10px] uppercase tracking-wider">Adjustment Type</th>
                  <th className="p-3.5 text-right text-[10px] uppercase tracking-wider">Quantity Change</th>
                  <th className="p-3.5 text-[10px] uppercase tracking-wider">Mandatory Audit Reason</th>
                  <th className="p-3.5 text-[10px] uppercase tracking-wider">Adjusted By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {stockAdjustments.map(adj => (
                  <tr key={adj.id} className="hover:bg-slate-50 transition-all">
                    <td className="p-3.5 text-slate-400 font-mono">{new Date(adj.createdAt).toLocaleString('en-PK')}</td>
                    <td className="p-3.5 font-bold text-slate-800">{adj.brandName}</td>
                    <td className="p-3.5 font-bold font-mono text-slate-500">{adj.batchNumber}</td>
                    <td className="p-3.5 font-bold uppercase text-[10px]">
                      <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-emerald-700 font-mono">
                        {adj.type}
                      </span>
                    </td>
                    <td className={`p-3.5 text-right font-bold font-mono ${adj.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {adj.quantityChange > 0 ? `+${adj.quantityChange}` : adj.quantityChange} units
                    </td>
                    <td className="p-3.5 text-slate-600 italic">{adj.reason}</td>
                    <td className="p-3.5 font-bold text-slate-500">{adj.adjustedBy}</td>
                  </tr>
                ))}

                {stockAdjustments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 font-sans">
                      <LayoutList className="h-10 w-10 text-slate-300 mx-auto mb-2 opacity-60" />
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">No stock adjustments recorded</p>
                      <p className="text-[10px] text-slate-400 mt-1">Manual edits will be detailed in this list.</p>
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 my-8 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add Opening Stock Batch Entry</h3>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleBatchSubmit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold uppercase block">Select Medicine *</label>
                  <select
                    required
                    value={formData.medicineId}
                    onChange={(e) => setFormData({ ...formData, medicineId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold cursor-pointer"
                  >
                    <option value="">-- Choose Drug --</option>
                    {medicines.filter(m => !m.deletedAt).map(m => (
                      <option key={m.id} value={m.id}>{m.brandName} {m.strength}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold uppercase block">Select Supplier *</label>
                  <select
                    required
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
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
                  <label className="text-slate-500 font-semibold uppercase block">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. BAT-206"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold uppercase block">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold uppercase block">Purchase Price / tab *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.purchasePrice || ''}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="PKR cost per tablet"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold uppercase block">Selling Price / tab *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sellingPrice || ''}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="PKR sell price per tablet"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold uppercase block">Minimum Stock Alert</label>
                  <input
                    type="number"
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <p className="font-bold text-slate-800 text-xs">Stock Conversion Settings</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-mono">Boxes</label>
                    <input
                      type="number"
                      value={formData.quantityBoxes}
                      onChange={(e) => setFormData({ ...formData, quantityBoxes: parseInt(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 text-center font-bold font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-mono">Strips</label>
                    <input
                      type="number"
                      value={formData.quantityStrips}
                      onChange={(e) => setFormData({ ...formData, quantityStrips: parseInt(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 text-center font-bold font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-mono">Loose Units</label>
                    <input
                      type="number"
                      value={formData.quantityUnits}
                      onChange={(e) => setFormData({ ...formData, quantityUnits: parseInt(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 text-center font-bold font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-700 font-bold uppercase font-mono">Total Units</label>
                    <div className="w-full py-1.5 bg-slate-900 border border-slate-900 rounded-lg text-center text-emerald-400 font-bold font-mono text-sm h-9">
                      {(formData.quantityBoxes * formData.stripsPerBox * formData.unitsPerStrip) + (formData.quantityStrips * formData.unitsPerStrip) + Number(formData.quantityUnits)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-mono">Strips per Box</label>
                    <input
                      type="number"
                      value={formData.stripsPerBox}
                      onChange={(e) => setFormData({ ...formData, stripsPerBox: parseInt(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 text-center font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-mono">Tablets per Strip</label>
                    <input
                      type="number"
                      value={formData.unitsPerStrip}
                      onChange={(e) => setFormData({ ...formData, unitsPerStrip: parseInt(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 text-center font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/10 cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Manual Stock Audit Adjustment</h3>
              <button onClick={() => { setShowAdjModal(false); setSelectedBatchForAdj(null); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAdjSubmit} className="space-y-4 text-xs font-sans">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-600 space-y-1 font-mono text-[11px]">
                <p>Medicine: <strong className="text-slate-800">{getMedicineInfo(selectedBatchForAdj.medicineId)?.brandName}</strong></p>
                <p>Batch Reference: <strong className="text-slate-800">{selectedBatchForAdj.batchNumber}</strong></p>
                <p>Current Quantity: <strong className="text-slate-800">{selectedBatchForAdj.totalUnitsAvailable} base units</strong></p>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold uppercase block">Adjustment Type</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
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
                  <label className="text-slate-500 font-semibold uppercase block">Quantity Change *</label>
                  <input
                    type="number"
                    required
                    value={adjQtyChange}
                    onChange={(e) => setAdjQtyChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Positive (+) or negative (-)"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold uppercase block">Mandatory Audit Reason *</label>
                <textarea
                  required
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. Physical inventory check revealed discrepancies in tablet counting."
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowAdjModal(false); setSelectedBatchForAdj(null); }}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/10 cursor-pointer"
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
