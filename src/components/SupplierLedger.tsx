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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-xs text-slate-800">
      
      {/* LEFT COLUMN: Suppliers Listing */}
      <div className="lg:col-span-1 space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Users className="h-4.5 w-4.5 text-emerald-600" />
              Drug Distributors
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg cursor-pointer"
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
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50 text-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-800'}`}>{s.name}</p>
                      <p className={`text-[10px] mt-0.5 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>{s.companyName}</p>
                      <p className={`text-[10px] font-mono mt-1 ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>Ph: {s.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold font-mono text-[11px] ${isActive ? 'text-emerald-300' : s.currentPayableBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatPKR(s.currentPayableBalance)}
                      </span>
                      <p className={`text-[9px] uppercase font-mono mt-0.5 ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>Payable</p>
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
              className="py-3 px-1 text-center bg-slate-100 hover:bg-slate-200 border border-slate-200 font-bold text-slate-700 rounded-xl transition-all cursor-pointer"
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
              className="py-3 px-1 text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Log Purchase
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Ledger entries */}
      <div className="lg:col-span-2">
        {activeSupplier ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6 shadow-xs">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-800">{activeSupplier.name}</h2>
                <p className="text-slate-500 text-xs mt-0.5">Company representation: {activeSupplier.companyName}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-1">{activeSupplier.address}</p>
              </div>
              <div className="text-right space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Payable Balance</span>
                <span className="text-xl font-extrabold font-mono text-rose-600">{formatPKR(activeSupplier.currentPayableBalance)}</span>
              </div>
            </div>

            {/* Transactions entries table */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <History className="h-4 w-4 text-slate-400" />
                Distributor Accounting Ledger
              </h3>
              
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                      <th className="p-3">Date</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Debit (Paid)</th>
                      <th className="p-3 text-right">Credit (Cost)</th>
                      <th className="p-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {activeLedger.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-all">
                        <td className="p-3 text-slate-400">{new Date(entry.date).toLocaleDateString('en-PK')}</td>
                        <td className="p-3 font-bold uppercase text-[10px]">
                          <span className={`px-2 py-0.5 rounded text-[9px] ${
                            entry.type === 'Payment' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : entry.type === 'Return'
                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="p-3 font-sans max-w-[200px] truncate" title={entry.description}>{entry.description}</td>
                        <td className="p-3 text-right text-emerald-600 font-bold">{entry.debit > 0 ? formatPKR(entry.debit) : '-'}</td>
                        <td className="p-3 text-right text-rose-600 font-bold">{entry.credit > 0 ? formatPKR(entry.credit) : '-'}</td>
                        <td className="p-3 text-right text-slate-800 font-bold">{formatPKR(entry.runningBalance)}</td>
                      </tr>
                    ))}

                    {activeLedger.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400 font-sans">
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
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full min-h-[300px] shadow-xs">
            <Landmark className="h-12 w-12 text-slate-300 mb-3 opacity-60" />
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">No Distributor Selected</p>
            <p className="text-[10px] text-slate-400 mt-1">Select a drug supplier from the sidebar to view ledgers and log wholesale invoices.</p>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD SUPPLIER */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Add Supplier / Distributor</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase text-[10px]">Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={supFormData.name}
                  onChange={(e) => setSupFormData({ ...supFormData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. Searle Authorized Agency"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[10px]">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={supFormData.phone}
                    onChange={(e) => setSupFormData({ ...supFormData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="03001234567"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[10px]">Represented Company</label>
                  <input
                    type="text"
                    value={supFormData.companyName}
                    onChange={(e) => setSupFormData({ ...supFormData, companyName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. Searle Ltd."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase text-[10px]">Address</label>
                <input
                  type="text"
                  value={supFormData.address}
                  onChange={(e) => setSupFormData({ ...supFormData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Address details"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase text-[10px]">Opening Balance Credit (PKR)</label>
                <input
                  type="number"
                  value={supFormData.openingBalance || ''}
                  onChange={(e) => setSupFormData({ ...supFormData, openingBalance: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Initial payable credit if any"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/10 cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Log Supplier Payment</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase text-[10px]">Select Supplier *</label>
                <select
                  required
                  value={payFormData.supplierId}
                  onChange={(e) => setPayFormData({ ...payFormData, supplierId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold cursor-pointer"
                >
                  {suppliers.filter(s => !s.deletedAt).map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Bal: {formatPKR(s.currentPayableBalance)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[10px]">Amount Paid (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={payFormData.amountPaid || ''}
                    onChange={(e) => setPayFormData({ ...payFormData, amountPaid: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Enter cash payment"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[10px]">Payment Method *</label>
                  <select
                    value={payFormData.paymentMethod}
                    onChange={(e) => setPayFormData({ ...payFormData, paymentMethod: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase text-[10px]">Reference # (Cheque/Tx ID)</label>
                <input
                  type="text"
                  value={payFormData.referenceNumber}
                  onChange={(e) => setPayFormData({ ...payFormData, referenceNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Tx ID or cheque number"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold uppercase text-[10px]">Notes</label>
                <input
                  type="text"
                  value={payFormData.notes}
                  onChange={(e) => setPayFormData({ ...payFormData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Memo details"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/10 cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 my-8 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Log Purchase Invoice & Stocks</h3>
              <button onClick={() => setShowPurModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="space-y-4 text-xs font-sans overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[10px]">Supplier/Distributor *</label>
                  <select
                    required
                    value={purFormData.supplierId}
                    onChange={(e) => setPurFormData({ ...purFormData, supplierId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    {suppliers.filter(s => !s.deletedAt).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[10px]">Distributor Invoice Number *</label>
                  <input
                    type="text"
                    required
                    value={purFormData.invoiceNumber}
                    onChange={(e) => setPurFormData({ ...purFormData, invoiceNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. GSK-99172"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[10px]">Total Invoice Value (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={purFormData.totalAmount || ''}
                    onChange={(e) => setPurFormData({ ...purFormData, totalAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. 50000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[10px]">Paid Amount (PKR)</label>
                  <input
                    type="number"
                    value={purFormData.paidAmount || ''}
                    onChange={(e) => setPurFormData({ ...purFormData, paidAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="0 for full credit"
                  />
                </div>
              </div>

              {/* Purchase Items sub form */}
              <div className="space-y-3.5 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Purchase Items / Batches</h4>
                  <button
                    type="button"
                    onClick={handleAddPurchaseItem}
                    className="text-[10px] bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg cursor-pointer font-bold uppercase tracking-wider"
                  >
                    + Add Drug Row
                  </button>
                </div>

                <div className="space-y-3">
                  {purItems.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => handleRemovePurchaseItem(idx)}
                        className="absolute right-2 top-2 text-rose-600 hover:text-rose-800 cursor-pointer"
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
                            className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-700 cursor-pointer"
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
                            className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 font-mono"
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
                            className="w-full bg-white border border-slate-200 rounded p-1 text-slate-800 font-mono h-8 cursor-pointer"
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
                            className="w-full bg-white border border-slate-200 rounded p-1 text-slate-800 font-mono h-8 text-center"
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
                            className="w-full bg-white border border-slate-200 rounded p-1 text-slate-800 font-mono h-8 text-center"
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
                            className="w-full bg-white border border-slate-200 rounded p-1 text-slate-800 font-mono h-8 text-center"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setShowPurModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/10 cursor-pointer"
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
