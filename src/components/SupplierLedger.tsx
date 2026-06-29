/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePharmacyStore } from '../store';
import { Supplier } from '../types';
import { 
  Users, Plus, Landmark, ArrowUpRight, TrendingDown, 
  History, Calendar, FileText, CheckCircle, ChevronDown, Check, X 
} from 'lucide-react';

export default function SupplierLedger() {
  const { 
    suppliers, supplierLedgers, addSupplier, updateSupplier, 
    deleteSupplier, addSupplierPayment, addPurchase, medicines 
  } = usePharmacyStore();

  const [activeSupplierId, setActiveSupplierId] = useState<string | null>(null);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showPurModal, setShowPurModal] = useState(false);

  // Supplier Form State
  const [supFormData, setSupFormData] = useState({
    name: '',
    phone: '',
    address: '',
    companyName: '',
    openingBalance: 0,
  });

  // Payment Form State
  const [payFormData, setPayFormData] = useState({
    supplierId: '',
    amountPaid: 0,
    paymentMethod: 'Cash' as const,
    referenceNumber: '',
    notes: '',
  });

  // Purchase Entry Form State
  const [purFormData, setPurFormData] = useState({
    supplierId: '',
    invoiceNumber: '',
    totalAmount: 0,
    paidAmount: 0,
    paymentStatus: 'Credit' as const,
  });
  
  // Purchase Items State (multi items entry support!)
  const [purItems, setPurItems] = useState<{
    medicineId: string;
    batchNumber: string;
    expiryDate: string;
    quantityBoxes: number;
    purchasePricePerUnit: number;
    sellingPricePerUnit: number;
  }[]>([
    { medicineId: '', batchNumber: '', expiryDate: '', quantityBoxes: 1, purchasePricePerUnit: 0, sellingPricePerUnit: 0 }
  ]);

  // Helpers
  const formatPKR = (val: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getActiveSupplier = (): Supplier | undefined => {
    return suppliers.find(s => s.id === activeSupplierId);
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supFormData.name || !supFormData.phone) {
      alert('Supplier name and phone are required.');
      return;
    }

    addSupplier(supFormData);
    alert('Supplier details saved to offline database.');
    setShowAddModal(false);
    setSupFormData({ name: '', phone: '', address: '', companyName: '', openingBalance: 0 });
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payFormData.supplierId || payFormData.amountPaid <= 0) {
      alert('Please specify a valid supplier and payment amount.');
      return;
    }

    addSupplierPayment(payFormData);
    alert('Supplier payment processed and balance updated.');
    setShowPayModal(false);
    setPayFormData({ supplierId: '', amountPaid: 0, paymentMethod: 'Cash', referenceNumber: '', notes: '' });
  };

  const handleAddPurchaseItem = () => {
    setPurItems([...purItems, { medicineId: '', batchNumber: '', expiryDate: '', quantityBoxes: 1, purchasePricePerUnit: 0, sellingPricePerUnit: 0 }]);
  };

  const handleRemovePurchaseItem = (idx: number) => {
    setPurItems(purItems.filter((_, i) => i !== idx));
  };

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purFormData.supplierId || !purFormData.invoiceNumber) {
      alert('Distributor and Purchase invoice number are required.');
      return;
    }

    // Verify item listings are valid
    const isInvalid = purItems.some(it => !it.medicineId || !it.batchNumber || !it.expiryDate || it.purchasePricePerUnit <= 0 || it.sellingPricePerUnit <= 0);
    if (isInvalid) {
      alert('Please fill out all required medicine fields correctly with quantities/prices greater than zero.');
      return;
    }

    // Map item list to core structures
    const itemsToSave = purItems.map(item => {
      const stripsPerBox = 20; // assumed defaults for conversion
      const unitsPerStrip = 10;
      const totalUnits = item.quantityBoxes * stripsPerBox * unitsPerStrip;

      return {
        medicineId: item.medicineId,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        quantityBoxes: item.quantityBoxes,
        stripsPerBox,
        unitsPerStrip,
        quantityStrips: 0,
        quantityUnits: 0,
        totalUnits,
        purchasePricePerUnit: item.purchasePricePerUnit,
        sellingPricePerUnit: item.sellingPricePerUnit,
      };
    });

    const status: 'Paid' | 'Credit' | 'Partial' = 
      purFormData.paidAmount === 0 
        ? 'Credit' 
        : purFormData.paidAmount >= purFormData.totalAmount 
          ? 'Paid' 
          : 'Partial';

    addPurchase({
      supplierId: purFormData.supplierId,
      branchId: 'br_01',
      invoiceNumber: purFormData.invoiceNumber,
      totalAmount: purFormData.totalAmount,
      discountAmount: 0,
      paidAmount: purFormData.paidAmount,
      paymentStatus: status,
    }, itemsToSave);

    alert('Stock Purchase recorded. Inventory totals increased; credit updated.');
    setShowPurModal(false);
    setPurItems([{ medicineId: '', batchNumber: '', expiryDate: '', quantityBoxes: 1, purchasePricePerUnit: 0, sellingPricePerUnit: 0 }]);
    setPurFormData({ supplierId: '', invoiceNumber: '', totalAmount: 0, paidAmount: 0, paymentStatus: 'Credit' });
  };

  const activeSupplier = getActiveSupplier();
  const activeLedger = supplierLedgers.filter(l => l.supplierId === activeSupplierId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      {/* LEFT COLUMN: Suppliers Listing */}
      <div className="lg:col-span-1 space-y-5">
        <div className="bg-slate-800 rounded-2xl border border-slate-700/40 p-5 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
            <h2 className="text-md font-bold text-white flex items-center gap-1.5">
              <Users className="h-5 w-5 text-emerald-400" />
              Drug Distributors
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg cursor-pointer"
              title="Add supplier"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 text-xs">
            {suppliers.filter(s => !s.deletedAt).map(s => {
              const isActive = s.id === activeSupplierId;
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveSupplierId(s.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-slate-900/40 border-slate-700/40 hover:bg-slate-700/35'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-white text-sm">{s.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{s.companyName}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">Ph: {s.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold font-mono text-[11px] ${s.currentPayableBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {formatPKR(s.currentPayableBalance)}
                      </span>
                      <p className="text-[9px] text-slate-500 uppercase font-mono mt-0.5">Payable Balance</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <button 
              onClick={() => {
                if (suppliers.length > 0) {
                  setPayFormData({ ...payFormData, supplierId: activeSupplierId || suppliers[0].id });
                  setShowPayModal(true);
                }
              }}
              className="py-3 px-1 text-center bg-slate-900 hover:bg-slate-700 border border-slate-700 font-bold text-slate-300 rounded-xl transition-all cursor-pointer"
            >
              Log Payment
            </button>
            <button 
              onClick={() => {
                if (suppliers.length > 0) {
                  setPurFormData({ ...purFormData, supplierId: activeSupplierId || suppliers[0].id });
                  setShowPurModal(true);
                }
              }}
              className="py-3 px-1 text-center bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-all cursor-pointer"
            >
              Log Purchase
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Ledger entries */}
      <div className="lg:col-span-2">
        {activeSupplier ? (
          <div className="bg-slate-800 rounded-2xl border border-slate-700/40 p-5 space-y-6 shadow-xl">
            <div className="flex justify-between items-start border-b border-slate-700/50 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{activeSupplier.name}</h2>
                <p className="text-slate-400 text-xs mt-0.5">Company representation: {activeSupplier.companyName}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-1">{activeSupplier.address}</p>
              </div>
              <div className="text-right space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Payable Balance</span>
                <span className="text-2xl font-bold font-mono text-rose-400">{formatPKR(activeSupplier.currentPayableBalance)}</span>
              </div>
            </div>

            {/* Transactions entries table */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <History className="h-4 w-4 text-slate-400" />
                Distributor Accounting Ledger
              </h3>
              
              <div className="border border-slate-700/60 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                      <th className="p-3">Date</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Debit (Payment)</th>
                      <th className="p-3 text-right">Credit (Credit Cost)</th>
                      <th className="p-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {activeLedger.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-700/15 transition-all">
                        <td className="p-3 text-slate-400">{new Date(entry.date).toLocaleDateString('en-PK')}</td>
                        <td className="p-3 font-bold uppercase text-[10px]">
                          <span className={`px-2 py-0.5 rounded ${
                            entry.type === 'Payment' 
                              ? 'bg-emerald-500/15 text-emerald-400' 
                              : entry.type === 'Return'
                                ? 'bg-blue-500/15 text-blue-400'
                                : 'bg-rose-500/15 text-rose-400'
                          }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="p-3 font-sans max-w-[200px] truncate" title={entry.description}>{entry.description}</td>
                        <td className="p-3 text-right text-emerald-400 font-bold">{entry.debit > 0 ? formatPKR(entry.debit) : '-'}</td>
                        <td className="p-3 text-right text-rose-400 font-bold">{entry.credit > 0 ? formatPKR(entry.credit) : '-'}</td>
                        <td className="p-3 text-right text-white font-bold">{formatPKR(entry.runningBalance)}</td>
                      </tr>
                    ))}

                    {activeLedger.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-500 font-sans">
                          No accounting ledger statements recorded for this supplier.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl border border-slate-700/40 p-12 text-center text-slate-500 flex flex-col items-center justify-center h-full min-h-[300px]">
            <Landmark className="h-12 w-12 text-slate-600 mb-3 opacity-35" />
            <p className="text-sm font-semibold">No Distributor Selected</p>
            <p className="text-xs mt-1">Select a drug supplier from the sidebar to view ledgers and log wholesale invoices.</p>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD SUPPLIER */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-6">
            <div className="flex justify-between items-center border-b border-slate-700/50 pb-3 mb-4">
              <h3 className="text-lg font-bold text-white">Add Supplier / Distributor</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold uppercase">Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={supFormData.name}
                  onChange={(e) => setSupFormData({ ...supFormData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                  placeholder="e.g. Searle Authorized Agency"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={supFormData.phone}
                    onChange={(e) => setSupFormData({ ...supFormData, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none"
                    placeholder="03001234567"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Represented Company</label>
                  <input
                    type="text"
                    value={supFormData.companyName}
                    onChange={(e) => setSupFormData({ ...supFormData, companyName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                    placeholder="e.g. Searle Ltd."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold uppercase">Address</label>
                <input
                  type="text"
                  value={supFormData.address}
                  onChange={(e) => setSupFormData({ ...supFormData, address: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                  placeholder="Address details"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold uppercase">Opening Balance Credit (PKR)</label>
                <input
                  type="number"
                  value={supFormData.openingBalance || ''}
                  onChange={(e) => setSupFormData({ ...supFormData, openingBalance: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none"
                  placeholder="Initial payable credit if any"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-900 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg cursor-pointer"
                >
                  Save Distributor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LOG SUPPLIER PAYMENT */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-6">
            <div className="flex justify-between items-center border-b border-slate-700/50 pb-3 mb-4">
              <h3 className="text-lg font-bold text-white">Log Supplier Payment</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold uppercase">Select Supplier *</label>
                <select
                  required
                  value={payFormData.supplierId}
                  onChange={(e) => setPayFormData({ ...payFormData, supplierId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-bold"
                >
                  {suppliers.filter(s => !s.deletedAt).map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Bal: {formatPKR(s.currentPayableBalance)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Amount Paid (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={payFormData.amountPaid || ''}
                    onChange={(e) => setPayFormData({ ...payFormData, amountPaid: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold"
                    placeholder="Enter cash payment"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Payment Method *</label>
                  <select
                    value={payFormData.paymentMethod}
                    onChange={(e) => setPayFormData({ ...payFormData, paymentMethod: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold uppercase">Reference # (Cheque/Tx ID)</label>
                <input
                  type="text"
                  value={payFormData.referenceNumber}
                  onChange={(e) => setPayFormData({ ...payFormData, referenceNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  placeholder="Tx ID or cheque number"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold uppercase">Notes</label>
                <input
                  type="text"
                  value={payFormData.notes}
                  onChange={(e) => setPayFormData({ ...payFormData, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                  placeholder="Memo details"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="bg-slate-900 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg cursor-pointer"
                >
                  Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LOG CREDIT PURCHASE INVOICE */}
      {showPurModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-6 my-8 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-slate-700/50 pb-3 mb-4">
              <h3 className="text-lg font-bold text-white">Log Purchase Invoice & Stocks</h3>
              <button onClick={() => setShowPurModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="space-y-4 text-xs font-sans overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Supplier/Distributor *</label>
                  <select
                    required
                    value={purFormData.supplierId}
                    onChange={(e) => setPurFormData({ ...purFormData, supplierId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-bold"
                  >
                    {suppliers.filter(s => !s.deletedAt).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Distributor Invoice Number *</label>
                  <input
                    type="text"
                    required
                    value={purFormData.invoiceNumber}
                    onChange={(e) => setPurFormData({ ...purFormData, invoiceNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold"
                    placeholder="e.g. GSK-99172"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Total Invoice Value (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={purFormData.totalAmount || ''}
                    onChange={(e) => setPurFormData({ ...purFormData, totalAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold"
                    placeholder="e.g. 50000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Paid Amount (PKR)</label>
                  <input
                    type="number"
                    value={purFormData.paidAmount || ''}
                    onChange={(e) => setPurFormData({ ...purFormData, paidAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                    placeholder="0 for full credit"
                  />
                </div>
              </div>

              {/* Purchase Items sub form */}
              <div className="space-y-3.5 border-t border-slate-700/50 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">Purchase Items / Batches</h4>
                  <button
                    type="button"
                    onClick={handleAddPurchaseItem}
                    className="text-xs bg-slate-900 hover:bg-slate-700 border border-slate-700 text-emerald-400 px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    + Add Drug Row
                  </button>
                </div>

                <div className="space-y-3">
                  {purItems.map((item, idx) => (
                    <div key={idx} className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-700/40 space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => handleRemovePurchaseItem(idx)}
                        className="absolute right-2 top-2 text-rose-400 hover:text-rose-300"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400">Medicine *</label>
                          <select
                            required
                            value={item.medicineId}
                            onChange={(e) => {
                              const copy = [...purItems];
                              copy[idx].medicineId = e.target.value;
                              setPurItems(copy);
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white"
                          >
                            <option value="">-- Choose Drug --</option>
                            {medicines.filter(m => !m.deletedAt).map(m => (
                              <option key={m.id} value={m.id}>{m.brandName} {m.strength}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400">Batch Number *</label>
                          <input
                            type="text"
                            required
                            value={item.batchNumber}
                            onChange={(e) => {
                              const copy = [...purItems];
                              copy[idx].batchNumber = e.target.value;
                              setPurItems(copy);
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white font-mono"
                            placeholder="GSK-206"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[10px]">
                        <div className="space-y-1">
                          <label className="font-mono text-slate-400 uppercase">Expiry Date *</label>
                          <input
                            type="date"
                            required
                            value={item.expiryDate}
                            onChange={(e) => {
                              const copy = [...purItems];
                              copy[idx].expiryDate = e.target.value;
                              setPurItems(copy);
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-white font-mono h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-mono text-slate-400 uppercase">Qty (Boxes) *</label>
                          <input
                            type="number"
                            required
                            value={item.quantityBoxes || ''}
                            onChange={(e) => {
                              const copy = [...purItems];
                              copy[idx].quantityBoxes = parseInt(e.target.value) || 1;
                              setPurItems(copy);
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-white font-mono h-8 text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-mono text-slate-400 uppercase">Cost/tab *</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={item.purchasePricePerUnit || ''}
                            onChange={(e) => {
                              const copy = [...purItems];
                              copy[idx].purchasePricePerUnit = parseFloat(e.target.value) || 0;
                              setPurItems(copy);
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-white font-mono h-8 text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-mono text-slate-400 uppercase">Sell/tab *</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={item.sellingPricePerUnit || ''}
                            onChange={(e) => {
                              const copy = [...purItems];
                              copy[idx].sellingPricePerUnit = parseFloat(e.target.value) || 0;
                              setPurItems(copy);
                            }}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-white font-mono h-8 text-center"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-700/50 mt-4">
                <button
                  type="button"
                  onClick={() => setShowPurModal(false)}
                  className="bg-slate-900 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg cursor-pointer"
                >
                  Log Invoice & Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
