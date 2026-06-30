/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePharmacyStore } from '../store';
import { IndianRupee, Undo2, ArrowRightLeft, FileText, Check, X } from 'lucide-react';

export default function ReturnsRefunds() {
  const { 
    sales, batches, medicines, suppliers, customerReturns, supplierReturns,
    addCustomerReturn, addSupplierReturn 
  } = usePharmacyStore();

  const [activeTab, setActiveTab] = useState<'customer' | 'supplier'>('customer');

  // Customer Return form state
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [foundSale, setFoundSale] = useState<any | null>(null);
  const [returnItems, setReturnItems] = useState<{
    saleItemId: string;
    medicineId: string;
    batchId: string;
    brandName: string;
    batchNumber: string;
    soldQty: number; // base units
    returnQty: number;
    unitType: 'Box' | 'Strip' | 'Unit';
    isSellable: boolean;
    unitPrice: number;
  }[]>([]);
  const [custReturnReason, setCustReturnReason] = useState('');

  // Supplier Return form state
  const [supRetFormData, setSupRetFormData] = useState({
    supplierId: '',
    medicineId: '',
    batchId: '',
    quantity: 1,
    reason: '',
  });

  const formatPKR = (val: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSearchInvoice = () => {
    const sale = sales.find(s => s.invoiceNumber === invoiceSearch.trim() && s.status !== 'Refunded');
    if (!sale) {
      alert('Invoice not found or already fully refunded.');
      setFoundSale(null);
      setReturnItems([]);
      return;
    }

    setFoundSale(sale);
    
    // Get sale items
    const sItems = usePharmacyStore.getState().saleItems.filter(si => si.saleId === sale.id);
    const mapped = sItems.map(item => ({
      saleItemId: item.id,
      medicineId: item.medicineId,
      batchId: item.batchId,
      brandName: item.medicineName,
      batchNumber: item.batchNumber,
      soldQty: item.quantity,
      returnQty: 0,
      unitType: item.unitType,
      isSellable: true,
      unitPrice: item.unitPrice,
    }));

    setReturnItems(mapped);
  };

  const handleCustomerReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundSale) return;

    // Filter to items with returns > 0
    const itemsToReturn = returnItems.filter(it => it.returnQty > 0);
    if (itemsToReturn.length === 0) {
      alert('Please specify at least one item quantity to refund.');
      return;
    }

    // Verify refund limit
    const isOverLimit = itemsToReturn.some(it => it.returnQty > it.soldQty);
    if (isOverLimit) {
      alert('Error: Returned quantity cannot exceed sold quantity.');
      return;
    }

    if (!custReturnReason.trim()) {
      alert('Please enter a reason for this customer refund.');
      return;
    }

    // Calculate refund amount
    const refundTotal = itemsToReturn.reduce((sum, item) => sum + (item.returnQty * item.unitPrice), 0);

    const formattedItems = itemsToReturn.map(it => ({
      medicineId: it.medicineId,
      batchId: it.batchId,
      quantity: it.returnQty,
      unitType: it.unitType,
      isSellable: it.isSellable,
      refundPrice: it.unitPrice,
    }));

    addCustomerReturn({
      saleId: foundSale.id,
      invoiceNumber: foundSale.invoiceNumber,
      refundAmount: refundTotal,
      reason: custReturnReason,
      cashierId: 'usr_1',
    }, formattedItems);

    alert(`Refund Processed successfully. Refund amount: ${refundTotal} PKR returned to customer.`);
    setFoundSale(null);
    setInvoiceSearch('');
    setReturnItems([]);
    setCustReturnReason('');
  };

  const handleSupplierReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { supplierId, medicineId, batchId, quantity, reason } = supRetFormData;
    if (!supplierId || !medicineId || !batchId || quantity <= 0) {
      alert('Please fill out all supplier return fields.');
      return;
    }

    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    if (batch.totalUnitsAvailable < quantity) {
      alert(`Error: Cannot return ${quantity} units. Batch has only ${batch.totalUnitsAvailable} units available.`);
      return;
    }

    const supplier = suppliers.find(s => s.id === supplierId);
    const med = medicines.find(m => m.id === medicineId);

    const totalRefund = quantity * batch.purchasePrice;

    addSupplierReturn({
      supplierId,
      supplierName: supplier?.name || 'Unknown',
      totalRefundAmount: totalRefund,
    }, [
      {
        medicineId,
        batchId,
        quantity,
        purchasePricePerUnit: batch.purchasePrice,
      }
    ]);

    alert(`Supplier Return saved. Payable balance with ${supplier?.name} decreased by ${totalRefund} PKR.`);
    setSupRetFormData({ supplierId: '', medicineId: '', batchId: '', quantity: 1, reason: '' });
  };

  // Get active batches for selected return medicine
  const availableBatchesForReturn = batches.filter(
    b => b.medicineId === supRetFormData.medicineId && !b.deletedAt && b.totalUnitsAvailable > 0
  );

  return (
    <div className="space-y-6 font-sans text-xs text-slate-800">
      {/* Header tab switch */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 gap-4 shadow-xs">
        <div>
          <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">Returns & Refund Ledger</h1>
          <p className="text-slate-500 text-xs mt-0.5">Log patient returns (refunds) or return expired/damaged wholesale stocks to distributors.</p>
        </div>
        <div className="flex gap-2 text-xs flex-wrap">
          <button
            onClick={() => setActiveTab('customer')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all border cursor-pointer ${
              activeTab === 'customer'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Customer Returns
          </button>
          <button
            onClick={() => setActiveTab('supplier')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all border cursor-pointer ${
              activeTab === 'supplier'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Distributor Returns
          </button>
        </div>
      </div>

      {activeTab === 'customer' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Refund Form */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
                Process Customer Refund
              </h2>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Enter invoice number (e.g. MP-2026-000001)"
                />
                <button
                  type="button"
                  onClick={handleSearchInvoice}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer shadow-xs text-xs"
                >
                  Locate Invoice
                </button>
              </div>

              {foundSale && (
                <form onSubmit={handleCustomerReturnSubmit} className="space-y-4 pt-2">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 font-mono text-[10px] text-slate-600">
                    <p>Original Invoice ID: <strong className="text-slate-800">{foundSale.invoiceNumber}</strong></p>
                    <p>Customer: <strong className="text-slate-800">{foundSale.customerName} ({foundSale.customerPhone})</strong></p>
                    <p>Net Paid: <strong className="text-slate-800">{formatPKR(foundSale.netPayable)}</strong></p>
                  </div>

                  {/* Return items mapping */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-slate-600 font-mono">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] text-slate-500 border-b border-slate-200 font-bold uppercase">
                        <tr>
                          <th className="p-2.5">Medicine Brand</th>
                          <th className="p-2.5 text-center">Sold Qty</th>
                          <th className="p-2.5 text-center">Return Qty</th>
                          <th className="p-2.5 font-sans">Quality Check</th>
                          <th className="p-2.5 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {returnItems.map((item, idx) => (
                          <tr key={item.saleItemId} className="hover:bg-slate-50 text-[11px]">
                            <td className="p-2.5 font-sans">
                              <p className="font-bold text-slate-800 text-xs">{item.brandName}</p>
                              <p className="text-[9px] text-slate-400 font-mono">Batch {item.batchNumber}</p>
                            </td>
                            <td className="p-2.5 text-center font-bold">{item.soldQty} {item.unitType.toLowerCase()}</td>
                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                min="0"
                                max={item.soldQty}
                                value={item.returnQty || ''}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value);
                                  const copy = [...returnItems];
                                  copy[idx].returnQty = isNaN(v) ? 0 : v;
                                  setReturnItems(copy);
                                }}
                                className="w-12 bg-white border border-slate-200 rounded p-1 text-center font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                                placeholder="0"
                              />
                            </td>
                            <td className="p-2.5">
                              <select
                                value={item.isSellable ? 'true' : 'false'}
                                onChange={(e) => {
                                  const copy = [...returnItems];
                                  copy[idx].isSellable = e.target.value === 'true';
                                  setReturnItems(copy);
                                }}
                                className="bg-white border border-slate-200 text-slate-600 rounded p-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-sans"
                              >
                                <option value="true">Sellable (Restock)</option>
                                <option value="false">Damaged (Waste)</option>
                              </select>
                            </td>
                            <td className="p-2.5 text-right text-emerald-600 font-bold">
                              {formatPKR(item.unitPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-1 font-sans">
                    <label className="text-slate-500 font-semibold uppercase block">Mandatory Refund Reason *</label>
                    <textarea
                      required
                      value={custReturnReason}
                      onChange={(e) => setCustReturnReason(e.target.value)}
                      className="w-full h-16 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                      placeholder="e.g. Unopened blister strip returned by patient, verified by pharmacist."
                    />
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 font-sans">
                    <button
                      type="button"
                      onClick={() => setFoundSale(null)}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/10 cursor-pointer"
                    >
                      Approve Refund
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right: History Log */}
          <div className="lg:col-span-1 font-sans">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Recent Refund Log
              </h2>
              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {customerReturns.map(ret => (
                  <div key={ret.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-[10px] space-y-1 font-mono">
                    <div className="flex justify-between text-slate-800 font-bold text-xs font-sans">
                      <span>Refund for Inv# {ret.invoiceNumber}</span>
                      <span className="text-rose-600">{formatPKR(ret.refundAmount)}</span>
                    </div>
                    <p className="text-slate-500 font-sans mt-1">Reason: <span className="italic">"{ret.reason}"</span></p>
                    <p className="text-slate-400 text-[9px] pt-1 border-t border-slate-200">{new Date(ret.createdAt).toLocaleString('en-PK')}</p>
                  </div>
                ))}
                {customerReturns.length === 0 && (
                  <p className="text-slate-400 text-center py-6">No refunds logged in offline database.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Supplier return tab layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Return Stock to Distributor
              </h2>

              <form onSubmit={handleSupplierReturnSubmit} className="space-y-4 font-sans text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-semibold uppercase block">Distributor *</label>
                    <select
                      required
                      value={supRetFormData.supplierId}
                      onChange={(e) => setSupRetFormData({ ...supRetFormData, supplierId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-bold"
                    >
                      <option value="">-- Choose Supplier --</option>
                      {suppliers.filter(s => !s.deletedAt).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 font-semibold uppercase block">Medicine *</label>
                    <select
                      required
                      value={supRetFormData.medicineId}
                      onChange={(e) => setSupRetFormData({ ...supRetFormData, medicineId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-bold"
                    >
                      <option value="">-- Choose Drug --</option>
                      {medicines.filter(m => !m.deletedAt).map(m => (
                        <option key={m.id} value={m.id}>{m.brandName} {m.strength}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 font-semibold uppercase block">Inventory Batch *</label>
                    <select
                      required
                      value={supRetFormData.batchId}
                      onChange={(e) => setSupRetFormData({ ...supRetFormData, batchId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-mono text-xs"
                    >
                      <option value="">-- Choose Batch --</option>
                      {availableBatchesForReturn.map(b => (
                        <option key={b.id} value={b.id}>{b.batchNumber} ({b.totalUnitsAvailable} available)</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-semibold uppercase block">Quantity to Return (Base Units) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={supRetFormData.quantity}
                      onChange={(e) => setSupRetFormData({ ...supRetFormData, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 font-semibold uppercase block">Memo / Reason</label>
                    <input
                      type="text"
                      value={supRetFormData.reason}
                      onChange={(e) => setSupRetFormData({ ...supRetFormData, reason: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder="e.g. Expired stock return agreement."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-emerald-600/10"
                >
                  Confirm Distributor Return
                </button>
              </form>
            </div>
          </div>

          {/* Right: Supplier Returns log */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Recent Supplier Returns
              </h2>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {supplierReturns.map(ret => (
                  <div key={ret.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[10px] space-y-1 font-mono">
                    <div className="flex justify-between text-slate-800 font-bold">
                      <span>{ret.supplierName}</span>
                      <span className="text-emerald-600">{formatPKR(ret.totalRefundAmount)}</span>
                    </div>
                    <p className="text-slate-400">Return logged on {new Date(ret.returnDate).toLocaleDateString('en-PK')}</p>
                  </div>
                ))}
                {supplierReturns.length === 0 && (
                  <p className="text-slate-400 text-center py-6">No supplier returns logged.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
