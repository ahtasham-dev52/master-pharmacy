/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { usePharmacyStore } from '../store';
import { Medicine, MedicineBatch } from '../types';
import { 
  Search, Keyboard, Plus, Trash2, ShoppingCart, Info, 
  HelpCircle, AlertTriangle, Printer, Minimize2, Check, CreditCard, Sparkles, X
} from 'lucide-react';

export default function POSBilling() {
  const { 
    medicines, batches, settings, completeSale, currentUser,
    heldBills, holdBill, resumeBill, clearHeldBill, customers, addCustomer
  } = usePharmacyStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<MedicineBatch | null>(null);
  
  // Cart state
  const [cart, setCart] = useState<{
    id: string;
    medicine: Medicine;
    batch: MedicineBatch;
    quantity: number;
    unitType: 'Box' | 'Strip' | 'Unit';
    unitPrice: number;
    itemDiscount: number; // percentage
  }[]>([]);

  // Customer state
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('N/A');

  // Checkout modifiers
  const [billDiscount, setBillDiscount] = useState(0); // flat PKR amount
  const [cashReceived, setCashReceived] = useState('');
  
  // Search state
  const [searchResults, setSearchResults] = useState<{ medicine: Medicine; batches: MedicineBatch[] }[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Modals / Overlays
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any | null>(null);
  const [showInvoicePrint, setShowInvoicePrint] = useState(false);

  // Warnings lists
  const [alertWarning, setAlertWarning] = useState<string | null>(null);
  const [alternativesList, setAlternativesList] = useState<any[]>([]);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);

  // Set default customer
  useEffect(() => {
    setCustomerName('Walk-in Customer');
    setCustomerPhone('N/A');
  }, []);

  // Keyboard Shortcuts hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) handleCheckoutTrigger();
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) handleHoldBill();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowCheckoutModal(false);
        setShowInvoicePrint(false);
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, customerName, customerPhone, billDiscount, cashReceived]);

  // Fast Medicine Search logic (handles brand, generic, company, barcode, batch number)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHighlightedIndex(-1);
      return;
    }

    const term = searchQuery.toLowerCase();
    
    // Filter active medicines matching query
    const matchedMeds = medicines.filter(m => 
      m.isActive && !m.deletedAt && (
        m.brandName.toLowerCase().includes(term) ||
        m.genericName.toLowerCase().includes(term) ||
        m.company.toLowerCase().includes(term) ||
        m.barcode.includes(term)
      )
    );

    // Group with their active batches
    const results = matchedMeds.map(med => {
      const medBatches = batches.filter(b => b.medicineId === med.id && !b.deletedAt && b.totalUnitsAvailable > 0);
      return { medicine: med, batches: medBatches };
    }).filter(r => r.batches.length > 0 || settings.enableNegativeStock);

    setSearchResults(results.slice(0, 10)); // Top 10 for fast rendering
    setHighlightedIndex(results.length > 0 ? 0 : -1);
  }, [searchQuery, medicines, batches]);

  // Calculate generic medicine alternatives for selected item
  const calculateAlternatives = (med: Medicine) => {
    const matchedAlts = medicines.filter(m => 
      m.id !== med.id && 
      m.genericName.toLowerCase() === med.genericName.toLowerCase() &&
      m.strength.toLowerCase() === med.strength.toLowerCase() &&
      m.isActive && !m.deletedAt
    );

    const fullAlts = matchedAlts.map(m => {
      const altBatches = batches.filter(b => b.medicineId === m.id && !b.deletedAt && b.totalUnitsAvailable > 0);
      const primaryBatch = altBatches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];
      return {
        medicine: m,
        batch: primaryBatch,
      };
    }).filter(a => a.batch !== undefined);

    setAlternativesList(fullAlts);
  };

  // Selection Handler
  const handleSelectResult = (result: { medicine: Medicine; batches: MedicineBatch[] }) => {
    setSelectedMed(result.medicine);
    
    // Find nearest non-expired expiry batch for selected med (FEFO alignment)
    const sortedBatches = [...result.batches].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    const validBatch = sortedBatches.find(b => !b.isExpired) || sortedBatches[0] || null;
    setSelectedBatch(validBatch);

    calculateAlternatives(result.medicine);

    // Trigger near-expiry/prescription warnings
    setAlertWarning(null);
    if (result.medicine.prescriptionRequired && settings.enablePrescriptionWarning) {
      setAlertWarning('Prescription Required: This medicine is registered as a POM (Prescription Only Medicine).');
    } else if (validBatch) {
      const warningDays = settings.expiryWarningDays;
      const limit = new Date();
      limit.setDate(limit.getDate() + warningDays);
      if (new Date(validBatch.expiryDate) < new Date()) {
        setAlertWarning('Expired Stock Blocked: Selected medicine batch has already expired.');
      } else if (new Date(validBatch.expiryDate) <= limit) {
        setAlertWarning(`Near Expiry Warning: Selected batch ${validBatch.batchNumber} expires on ${validBatch.expiryDate}.`);
      }
    }

    setSearchQuery('');
    setSearchResults([]);
    // Focus quantity input
    setTimeout(() => qtyInputRef.current?.focus(), 100);
  };

  // Add Item to active cart
  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed || !selectedBatch) return;

    const qtyVal = parseFloat(qtyInputRef.current?.value || '1');
    if (isNaN(qtyVal) || qtyVal <= 0) return;

    // Verify expiry date blocking
    if (selectedBatch.isExpired && !settings.enableNegativeStock) {
      alert('Cannot sell expired medicines!');
      return;
    }

    // Determine selling unit price based on selected unit type
    let calculatedPrice = selectedBatch.sellingPrice;
    const boxCapacity = selectedBatch.stripsPerBox * selectedBatch.unitsPerStrip;
    const stripCapacity = selectedBatch.unitsPerStrip;

    const unitType = (e.currentTarget as any).unitType?.value as 'Box' | 'Strip' | 'Unit' || 'Unit';

    if (unitType === 'Box') {
      calculatedPrice = selectedBatch.sellingPrice * boxCapacity;
    } else if (unitType === 'Strip') {
      calculatedPrice = selectedBatch.sellingPrice * stripCapacity;
    }

    // Check if item is already in cart
    const existingIndex = cart.findIndex(c => c.medicine.id === selectedMed.id && c.batch.id === selectedBatch.id && c.unitType === unitType);

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += qtyVal;
      setCart(updated);
    } else {
      setCart([...cart, {
        id: `cart_${Date.now()}`,
        medicine: selectedMed,
        batch: selectedBatch,
        quantity: qtyVal,
        unitType,
        unitPrice: calculatedPrice,
        itemDiscount: 0
      }]);
    }

    // Reset selectors
    setSelectedMed(null);
    setSelectedBatch(null);
    setAlertWarning(null);
    setAlternativesList([]);
    if (qtyInputRef.current) qtyInputRef.current.value = '1';
    searchInputRef.current?.focus();
  };

  // Alternate Brand Click
  const handleSelectAlternative = (alt: { medicine: Medicine; batch: MedicineBatch }) => {
    setSelectedMed(alt.medicine);
    setSelectedBatch(alt.batch);
    calculateAlternatives(alt.medicine);
    setTimeout(() => qtyInputRef.current?.focus(), 100);
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    setCart(cart.filter(c => c.id !== id));
  };

  // Clear Cart
  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear the current bill?')) {
      setCart([]);
      setSelectedMed(null);
      setSelectedBatch(null);
      setAlertWarning(null);
      setAlternativesList([]);
      setBillDiscount(0);
      setCashReceived('');
    }
  };

  // Calculations
  const getCartTotals = () => {
    let grossTotal = 0;
    cart.forEach(item => {
      const lineTotal = item.quantity * item.unitPrice;
      const discountVal = lineTotal * (item.itemDiscount / 100);
      grossTotal += (lineTotal - discountVal);
    });

    let taxAmount = 0;
    if (settings.enableTax) {
      taxAmount = parseFloat((grossTotal * (settings.taxPercentage / 100)).toFixed(2));
    }

    const netPayable = Math.max(0, parseFloat((grossTotal - billDiscount + taxAmount).toFixed(2)));

    return {
      grossTotal,
      taxAmount,
      netPayable
    };
  };

  const { grossTotal, taxAmount, netPayable } = getCartTotals();

  // Cash Change Calculation
  const getCashChange = () => {
    const cashVal = parseFloat(cashReceived);
    if (isNaN(cashVal)) return 0;
    return Math.max(0, cashVal - netPayable);
  };

  // Hold bill
  const handleHoldBill = () => {
    holdBill(customerName, customerPhone, cart);
    setCart([]);
    setBillDiscount(0);
    setCustomerName('Walk-in Customer');
    setCustomerPhone('N/A');
    alert('Bill saved on hold.');
  };

  // Resume bill
  const handleResumeBill = (id: string) => {
    const resumed = resumeBill(id);
    if (resumed) {
      setCart(resumed.items);
      setCustomerName(resumed.customerName);
      setCustomerPhone(resumed.customerPhone);
    }
  };

  // Trigger Checkout Overlay
  const handleCheckoutTrigger = () => {
    if (cart.length === 0) return;
    setCashReceived(String(Math.ceil(netPayable)));
    setShowCheckoutModal(true);
    setTimeout(() => cashInputRef.current?.focus(), 150);
  };

  // Final Submit checkout transaction
  const handleCompleteSale = () => {
    const cashVal = parseFloat(cashReceived);
    if (isNaN(cashVal) || cashVal < netPayable) {
      alert(`Invalid Amount: Cash received must be at least ${netPayable} PKR.`);
      return;
    }

    try {
      // Map cart to backend-ready structure for the transaction method
      const cartItems = cart.map(item => ({
        medicineId: item.medicine.id,
        quantity: item.quantity,
        unitType: item.unitType,
      }));

      const saleData = {
        cashierId: currentUser?.id || 'usr_1',
        cashierName: currentUser?.username || 'admin',
        customerName: customerName,
        customerPhone: customerPhone,
        totalAmount: grossTotal,
        discountAmount: billDiscount,
        taxAmount: taxAmount,
        netPayable: netPayable,
        cashReceived: cashVal,
        cashChange: getCashChange(),
        paymentMethod: 'Cash' as const,
        status: 'Completed' as const,
        branchId: 'br_01',
      };

      const resultSale = completeSale(saleData, cartItems);

      // Cache details for thermal printing
      setLastInvoice({
        ...resultSale,
        items: cart.map(c => ({
          brandName: c.medicine.brandName,
          strength: c.medicine.strength,
          batchNumber: c.batch.batchNumber,
          expiryDate: c.batch.expiryDate,
          quantity: c.quantity,
          unitType: c.unitType,
          unitPrice: c.unitPrice,
          subtotal: c.quantity * c.unitPrice,
        }))
      });

      // Clear states
      setCart([]);
      setBillDiscount(0);
      setCustomerName('Walk-in Customer');
      setCustomerPhone('N/A');
      setShowCheckoutModal(false);
      setShowInvoicePrint(true);
    } catch (e: any) {
      alert(`POS Transaction Failed: ${e.message}`);
    }
  };

  const formatPKR = (val: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      
      {/* LEFT COLUMN: Search, alternatives, active items entries */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Medicine Search Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-mono"
              placeholder="Search Brand, Generic, Company, Barcode (Press F2 to focus)"
            />
            
            {/* Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((res, idx) => {
                  const bPrimary = res.batches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];
                  return (
                    <div
                      key={res.medicine.id}
                      onClick={() => handleSelectResult(res)}
                      className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-800">{res.medicine.brandName}</span>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {res.medicine.strength}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono">
                          {res.medicine.genericName} • {res.medicine.company}
                        </p>
                      </div>
                      <div className="text-right">
                        {bPrimary ? (
                          <>
                            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              {formatPKR(bPrimary.sellingPrice)}/tab
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">Batch {bPrimary.batchNumber} ({bPrimary.totalUnitsAvailable} available)</p>
                          </>
                        ) : (
                          <span className="text-xs font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            Out of stock
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Warning banner */}
          {alertWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium leading-relaxed">{alertWarning}</p>
            </div>
          )}

          {/* Active selected item add panel */}
          {selectedMed && selectedBatch && (
            <form onSubmit={handleAddToCart} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-fade-in">
              <div className="md:col-span-1 space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Selected Item</label>
                <div className="text-sm font-bold text-slate-800 truncate">{selectedMed.brandName} {selectedMed.strength}</div>
                <div className="text-[10px] text-slate-500 truncate">Generic: {selectedMed.genericName}</div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Unit Type</label>
                <select 
                  name="unitType"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono cursor-pointer"
                >
                  <option value="Unit">Unit (Tablet/Cap)</option>
                  <option value="Strip">Strip (x{selectedBatch.unitsPerStrip})</option>
                  <option value="Box">Box (x{selectedBatch.stripsPerBox * selectedBatch.unitsPerStrip})</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Qty</label>
                <input
                  ref={qtyInputRef}
                  type="number"
                  defaultValue="1"
                  min="1"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-center font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all uppercase tracking-wider h-10 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add (Enter)
              </button>
            </form>
          )}
        </div>

        {/* Smart Alternatives Recommendations Panel */}
        {selectedMed && alternativesList.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
              <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Smart Drug Recommendations</h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Below are alternative brands matching generic <strong className="text-slate-700">{selectedMed.genericName} {selectedMed.strength}</strong>. Pakistan-sourced equivalents with better margins:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {alternativesList.map(alt => {
                const isHighProfit = alt.batch.profitMargin > (selectedBatch?.profitMargin || 0);
                return (
                  <div 
                    key={alt.medicine.id}
                    onClick={() => handleSelectAlternative(alt)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isHighProfit 
                        ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300' 
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-800">{alt.medicine.brandName}</span>
                          <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                            {alt.medicine.brandOrigin}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{alt.medicine.company}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-700">{formatPKR(alt.batch.sellingPrice)}</span>
                        <p className="text-[10px] text-slate-400 mt-1">{alt.batch.totalUnitsAvailable} available</p>
                      </div>
                    </div>
                    
                    {/* Profit margin highlight */}
                    <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] text-slate-400">Profit Margin:</span>
                      <span className={`text-[10px] font-mono font-bold ${isHighProfit ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {alt.batch.profitMargin}% {isHighProfit && '🔥 (Highest Profit)'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Billing Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
              <ShoppingCart className="h-4 w-4 text-emerald-600" />
              Active Sales Cart
            </h2>
            <span className="text-xs font-mono bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600 font-bold">
              {cart.length} items added
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3.5 uppercase tracking-wider text-[10px]">Medicine</th>
                  <th className="p-3.5 uppercase tracking-wider text-[10px]">Batch</th>
                  <th className="p-3.5 text-center uppercase tracking-wider text-[10px]">Qty / Unit</th>
                  <th className="p-3.5 text-right uppercase tracking-wider text-[10px]">Price</th>
                  <th className="p-3.5 text-right uppercase tracking-wider text-[10px]">Disc %</th>
                  <th className="p-3.5 text-right uppercase tracking-wider text-[10px]">Subtotal</th>
                  <th className="p-3.5 text-center uppercase tracking-wider text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {cart.map((item, idx) => {
                  const subTotalLine = item.quantity * item.unitPrice;
                  const discountAmount = subTotalLine * (item.itemDiscount / 100);
                  const finalLineTotal = subTotalLine - discountAmount;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 text-slate-600 transition-all">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{item.medicine.brandName} {item.medicine.strength}</div>
                        <div className="text-[10px] text-slate-400">{item.medicine.genericName}</div>
                      </td>
                      <td className="p-3.5 text-xs">
                        <span className="font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-mono">
                          {item.batch.batchNumber}
                        </span>
                        <div className="text-[10px] text-amber-600 mt-1">Exp: {item.batch.expiryDate}</div>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <input 
                            type="number"
                            value={item.quantity}
                            min="1"
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!isNaN(v) && v > 0) {
                                const copy = [...cart];
                                copy[idx].quantity = v;
                                setCart(copy);
                              }
                            }}
                            className="w-12 bg-white border border-slate-200 rounded p-1 text-center font-bold text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <span className="text-[10px] text-slate-400 font-sans uppercase font-bold">{item.unitType}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-right text-slate-800 font-bold font-mono">
                        {formatPKR(item.unitPrice)}
                      </td>
                      <td className="p-3.5 text-right">
                        <input 
                          type="number"
                          value={item.itemDiscount}
                          min="0"
                          max="100"
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v) && v >= 0 && v <= 100) {
                              const copy = [...cart];
                              copy[idx].itemDiscount = v;
                              setCart(copy);
                            }
                          }}
                          className="w-12 bg-white border border-slate-200 rounded p-1 text-center font-bold text-emerald-600 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-3.5 text-right text-emerald-600 font-bold font-mono">
                        {formatPKR(finalLineTotal)}
                      </td>
                      <td className="p-3.5 text-center">
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {cart.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 font-sans">
                      <ShoppingCart className="h-10 w-10 text-slate-300 mx-auto mb-2.5 opacity-60" />
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Shopping Cart is Empty</p>
                      <p className="text-[10px] text-slate-400 mt-1">Search and select medicines to add items to this invoice.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Customer settings, totals, shortcuts */}
      <div className="space-y-6">
        
        {/* Customer selection panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <h2 className="text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-2 mb-1 uppercase tracking-wider">
            Customer / Patient Info
          </h2>
          <div className="grid grid-cols-1 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-mono text-slate-400 uppercase text-[10px] font-bold">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-bold font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Walk-in Customer"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-slate-400 uppercase text-[10px] font-bold">Mobile Number</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. 03001234567"
              />
            </div>
          </div>
        </div>

        {/* Bill calculation summaries and modifiers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs text-xs">
          <h2 className="text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-2 mb-1 uppercase tracking-wider">
            Checkout Summary
          </h2>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Gross Total:</span>
              <span className="text-slate-800 font-bold">{formatPKR(grossTotal + billDiscount - taxAmount)}</span>
            </div>
            
            {settings.enableTax && (
              <div className="flex justify-between text-slate-500">
                <span>Tax ({settings.taxPercentage}%):</span>
                <span className="text-rose-600 font-bold">{formatPKR(taxAmount)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-500 py-1">
              <span>Flat Discount:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={billDiscount}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setBillDiscount(isNaN(v) ? 0 : v);
                  }}
                  className="w-16 bg-slate-50 border border-slate-200 rounded p-1 text-right text-emerald-600 font-bold focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 font-sans font-bold">PKR</span>
              </div>
            </div>

            <div className="flex justify-between text-slate-800 font-sans font-extrabold text-sm border-t border-slate-100 pt-3.5">
              <span>Net Payable:</span>
              <span className="text-emerald-600 text-base font-mono">{formatPKR(netPayable)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
            <button 
              onClick={handleClearCart}
              disabled={cart.length === 0}
              className="py-2.5 px-1 text-center bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-700 font-bold rounded-xl cursor-pointer disabled:opacity-40 transition-all"
            >
              Clear Cart
            </button>
            <button 
              onClick={handleHoldBill}
              disabled={cart.length === 0}
              className="py-2.5 px-1 text-center bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-700 font-bold rounded-xl cursor-pointer disabled:opacity-40 transition-all flex items-center justify-center gap-1"
            >
              Hold Bill (F8)
            </button>
          </div>

          <button
            onClick={handleCheckoutTrigger}
            disabled={cart.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3.5 rounded-xl shadow-md shadow-emerald-600/10 cursor-pointer text-center text-xs uppercase tracking-wider disabled:opacity-55 transition-all flex items-center justify-center gap-1.5"
          >
            <CreditCard className="h-4 w-4" />
            Complete Checkout (F4)
          </button>
        </div>

        {/* Held Bills widget */}
        {heldBills.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Bills On Hold ({heldBills.length})
            </h2>
            <div className="space-y-2">
              {heldBills.map(bill => (
                <div key={bill.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">{bill.customerName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{bill.items.length} items added</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handleResumeBill(bill.id)}
                      className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-100 font-bold hover:bg-emerald-100 transition-all cursor-pointer"
                    >
                      Resume
                    </button>
                    <button 
                      onClick={() => clearHeldBill(bill.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fast Keyboard Shortcuts Map */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-xs text-slate-500 space-y-3 shadow-xs">
          <h2 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
            <Keyboard className="h-4 w-4 text-slate-400" />
            POS Keyboard Shortcuts
          </h2>
          <div className="grid grid-cols-2 gap-2 font-mono">
            <div className="flex items-center gap-1"><kbd className="bg-slate-50 px-1.5 py-0.5 rounded text-emerald-700 border border-slate-200 text-[10px] font-bold">F2</kbd> Search</div>
            <div className="flex items-center gap-1"><kbd className="bg-slate-50 px-1.5 py-0.5 rounded text-emerald-700 border border-slate-200 text-[10px] font-bold">F4</kbd> Checkout</div>
            <div className="flex items-center gap-1"><kbd className="bg-slate-50 px-1.5 py-0.5 rounded text-emerald-700 border border-slate-200 text-[10px] font-bold">F8</kbd> Hold</div>
            <div className="flex items-center gap-1"><kbd className="bg-slate-50 px-1.5 py-0.5 rounded text-emerald-700 border border-slate-200 text-[10px] font-bold">ESC</kbd> Clear</div>
          </div>
        </div>

      </div>

      {/* MODAL 1: CHECKOUT MODIFIER AND CASH RECEIVED */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <CreditCard className="h-4.5 w-4.5 text-emerald-600" />
                Finalize Cash Payment
              </h3>
              <button 
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Net Payable Amount:</span>
                <span className="text-xl font-extrabold font-mono text-emerald-600">{formatPKR(netPayable)}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider font-mono">Cash Received (PKR)</label>
                <input
                  ref={cashInputRef}
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-mono font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-center"
                  placeholder="Enter cash received"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Cash Return (Change):</span>
                <span className="font-extrabold font-mono text-slate-800 text-lg">{formatPKR(getCashChange())}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold py-3 rounded-xl text-xs transition-all uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSale}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3 rounded-xl text-xs transition-all uppercase tracking-wider shadow-md shadow-emerald-600/10 cursor-pointer"
              >
                Verify & Print (Enter)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: HIGH-FIDELITY 80MM THERMAL RECEIPT PRINT PREVIEW */}
      {showInvoicePrint && lastInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 text-slate-900 space-y-4 my-8 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">80mm Thermal Invoice Preview</span>
              <button 
                onClick={() => setShowInvoicePrint(false)}
                className="text-slate-400 hover:text-slate-950 p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Receipt container (standard 80mm roll format) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-h-[400px] overflow-y-auto font-mono text-xs">
              <div className="text-center space-y-1 border-b border-dashed border-slate-400 pb-3 mb-3">
                <h4 className="text-xs font-bold uppercase tracking-tight text-slate-950">{settings.storeName}</h4>
                <p className="text-[9px] text-slate-500 leading-tight">{settings.storeAddress}</p>
                <p className="text-[9px] text-slate-500">PH: {settings.storePhone}</p>
                <p className="text-[9px] text-slate-500">{settings.licenseNumber} • {settings.ntnNtnGst}</p>
              </div>

              {/* Receipt Metadata */}
              <div className="space-y-1 border-b border-dashed border-slate-400 pb-3 mb-3 text-slate-600 text-[10px]">
                <div className="flex justify-between">
                  <span>INV NO:</span>
                  <span className="font-bold text-slate-950">{lastInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{new Date(lastInvoice.createdAt).toLocaleString('en-PK')}</span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER:</span>
                  <span>{lastInvoice.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span>{lastInvoice.customerName}</span>
                </div>
              </div>

              {/* Items listing */}
              <table className="w-full text-left border-collapse mb-3 text-[10px]">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-500 font-bold uppercase text-[9px]">
                    <th className="pb-1">Item</th>
                    <th className="pb-1 text-center">Qty</th>
                    <th className="pb-1 text-right">Price</th>
                    <th className="pb-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {lastInvoice.items.map((it: any, i: number) => (
                    <tr key={i} className="py-1">
                      <td className="py-1">
                        <span className="font-bold text-slate-950">{it.brandName}</span>
                        <div className="text-[8px] text-slate-400 font-mono">Batch {it.batchNumber}</div>
                      </td>
                      <td className="py-1 text-center">{it.quantity} {it.unitType.toLowerCase()}</td>
                      <td className="py-1 text-right font-mono">{it.unitPrice}</td>
                      <td className="py-1 text-right font-bold text-slate-950 font-mono">{it.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t border-dashed border-slate-400 pt-3.5 space-y-1.5 text-slate-700 text-[10px]">
                <div className="flex justify-between">
                  <span>Gross Total:</span>
                  <span className="font-mono">{formatPKR(lastInvoice.totalAmount)}</span>
                </div>
                {lastInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatPKR(lastInvoice.discountAmount)}</span>
                  </div>
                )}
                {settings.enableTax && (
                  <div className="flex justify-between">
                    <span>GST ({settings.taxPercentage}%):</span>
                    <span className="font-mono">{formatPKR(lastInvoice.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-extrabold text-slate-950 border-t border-slate-300 pt-1">
                  <span>NET PAYABLE:</span>
                  <span className="font-mono">{formatPKR(lastInvoice.netPayable)}</span>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 pt-1">
                  <span>Cash Tendered:</span>
                  <span className="font-mono">{formatPKR(lastInvoice.cashReceived)}</span>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500">
                  <span>Cash Change:</span>
                  <span className="font-mono">{formatPKR(lastInvoice.cashChange)}</span>
                </div>
              </div>

              {/* Footer text */}
              <div className="text-center pt-4 border-t border-dashed border-slate-400 mt-4 space-y-1">
                <p className="text-[8px] text-slate-500 italic leading-relaxed">{settings.invoiceFooterText}</p>
                <p className="text-[8px] text-slate-400 mt-2 font-sans font-bold uppercase tracking-wider">Master Pharmacy POS Terminal</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  alert('Command sent: Printing 1 copy to standard thermal printer.');
                  setShowInvoicePrint(false);
                }}
                className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer border border-transparent shadow-xs"
              >
                <Printer className="h-4 w-4" />
                Print (F6)
              </button>
              <button
                onClick={() => setShowInvoicePrint(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer border border-slate-200"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
