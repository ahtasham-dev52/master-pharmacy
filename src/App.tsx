/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePharmacyStore } from './store';
import AuthLogin from './components/AuthLogin';
import Dashboard from './components/Dashboard';
import POSBilling from './components/POSBilling';
import MedicineManager from './components/MedicineManager';
import InventoryManager from './components/InventoryManager';
import SupplierLedger from './components/SupplierLedger';
import ReturnsRefunds from './components/ReturnsRefunds';
import ReportsPanel from './components/ReportsPanel';
import SettingsLogs from './components/SettingsLogs';

import { 
  LayoutDashboard, ShoppingCart, Pill, Boxes, Users, 
  RotateCcw, BarChart3, Settings as SettingsIcon, LogOut, ShieldAlert, AlertTriangle 
} from 'lucide-react';

export default function App() {
  const { currentUser, logout, settings, batches } = usePharmacyStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'medicines' | 'inventory' | 'suppliers' | 'returns' | 'reports' | 'settings'>('dashboard');

  if (!currentUser) {
    return <AuthLogin />;
  }

  // Count active warnings
  const countLowStock = batches.filter(b => !b.deletedAt && b.totalUnitsAvailable <= b.minimumStock).length;
  const countExpired = batches.filter(b => !b.deletedAt && new Date(b.expiryDate) < new Date()).length;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-10 shadow-xl">
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Pill className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white tracking-wider uppercase font-mono">Master Pharmacy</h2>
            <p className="text-[10px] text-slate-400 font-medium">Smart Medical Store System</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Control Dashboard
          </button>

          <button
            onClick={() => setActiveTab('pos')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            POS billing Terminal
          </button>

          <button
            onClick={() => setActiveTab('medicines')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'medicines'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
          >
            <Pill className="h-4 w-4" />
            Medicine Catalogue
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
          >
            <Boxes className="h-4 w-4" />
            FEFO Inventory
            {(countLowStock > 0 || countExpired > 0) && (
              <span className="ml-auto bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold">
                {countLowStock + countExpired}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'suppliers'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
          >
            <Users className="h-4 w-4" />
            Supplier Ledger
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'returns'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            Returns & Refunds
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Revenues & Reports
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
          >
            <SettingsIcon className="h-4 w-4" />
            System Settings
          </button>
        </nav>

        {/* User profile section at base */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white uppercase tracking-wider font-mono">
              {currentUser.username[0]}
            </div>
            <div className="flex-1 truncate">
              <p className="font-bold text-white truncate">{currentUser.username}</p>
              <p className="text-[10px] text-slate-400">{currentUser.role}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 transition-all rounded-lg hover:bg-rose-500/5 cursor-pointer"
              title="Logout session"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
        {/* Upper Action Bar */}
        <header className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex justify-between items-center shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">Offline SQLite Database Online • Lahore Branch</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            {countExpired > 0 && (
              <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded-xl flex items-center gap-1 font-sans">
                <ShieldAlert className="h-4 w-4" /> {countExpired} EXPIRED DRUGS
              </span>
            )}
            {countLowStock > 0 && (
              <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-xl flex items-center gap-1 font-sans">
                <AlertTriangle className="h-4 w-4" /> {countLowStock} LOW STOCK ITEMS
              </span>
            )}
          </div>
        </header>

        {/* Scrollable container for dynamic pages */}
        <section className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && <Dashboard onNavigate={(tab: any) => setActiveTab(tab)} />}
          {activeTab === 'pos' && <POSBilling />}
          {activeTab === 'medicines' && <MedicineManager />}
          {activeTab === 'inventory' && <InventoryManager />}
          {activeTab === 'suppliers' && <SupplierLedger />}
          {activeTab === 'returns' && <ReturnsRefunds />}
          {activeTab === 'reports' && <ReportsPanel />}
          {activeTab === 'settings' && <SettingsLogs />}
        </section>
      </main>

    </div>
  );
}
