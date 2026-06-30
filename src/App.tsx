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
  RotateCcw, BarChart3, Settings as SettingsIcon, LogOut, ShieldAlert, AlertTriangle, Menu, X 
} from 'lucide-react';

export default function App() {
  const { currentUser, logout, settings, batches } = usePharmacyStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'medicines' | 'inventory' | 'suppliers' | 'returns' | 'reports' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!currentUser) {
    return <AuthLogin />;
  }

  // Count active warnings
  const countLowStock = batches.filter(b => !b.deletedAt && b.totalUnitsAvailable <= b.minimumStock).length;
  const countExpired = batches.filter(b => !b.deletedAt && new Date(b.expiryDate) < new Date()).length;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* Mobile Header (Hamburger Menu Trigger) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-40 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            title="Toggle Navigation Menu"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wide">Master Pharmacy</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(countLowStock > 0 || countExpired > 0) && (
            <span className="bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {countLowStock + countExpired}
            </span>
          )}
        </div>
      </div>

      {/* Sidebar Navigation - Responsive Drawer & Desktop Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 lg:static w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-50 shadow-xl lg:shadow-none transition-transform duration-300 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-slate-150 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Pill className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-wider uppercase font-mono">Master Pharmacy</h2>
              <p className="text-[10px] text-slate-500 font-semibold">Clinix Medical System</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto text-xs font-bold text-slate-600">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/15'
                : 'hover:text-slate-900 hover:bg-slate-100/80 text-slate-600'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Control Dashboard
          </button>

          <button
            onClick={() => { setActiveTab('pos'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/15'
                : 'hover:text-slate-900 hover:bg-slate-100/80 text-slate-600'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            POS Billing Terminal
          </button>

          <button
            onClick={() => { setActiveTab('medicines'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'medicines'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/15'
                : 'hover:text-slate-900 hover:bg-slate-100/80 text-slate-600'
            }`}
          >
            <Pill className="h-4 w-4" />
            Medicine Catalogue
          </button>

          <button
            onClick={() => { setActiveTab('inventory'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/15'
                : 'hover:text-slate-900 hover:bg-slate-100/80 text-slate-600'
            }`}
          >
            <Boxes className="h-4 w-4" />
            FEFO Inventory
            {(countLowStock > 0 || countExpired > 0) && (
              <span className="ml-auto bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md text-[9px] font-extrabold">
                {countLowStock + countExpired}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('suppliers'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'suppliers'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/15'
                : 'hover:text-slate-900 hover:bg-slate-100/80 text-slate-600'
            }`}
          >
            <Users className="h-4 w-4" />
            Supplier Ledger
          </button>

          <button
            onClick={() => { setActiveTab('returns'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'returns'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/15'
                : 'hover:text-slate-900 hover:bg-slate-100/80 text-slate-600'
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            Returns & Refunds
          </button>

          <button
            onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/15'
                : 'hover:text-slate-900 hover:bg-slate-100/80 text-slate-600'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Revenues & Reports
          </button>

          <button
            onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/15'
                : 'hover:text-slate-900 hover:bg-slate-100/80 text-slate-600'
            }`}
          >
            <SettingsIcon className="h-4 w-4" />
            System Settings
          </button>
        </nav>

        {/* User profile section at base */}
        <div className="p-4 border-t border-slate-150 bg-slate-50 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-extrabold text-slate-700 uppercase tracking-wider font-mono">
              {currentUser.username[0]}
            </div>
            <div className="flex-1 truncate">
              <p className="font-extrabold text-slate-900 truncate">{currentUser.username}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase">{currentUser.role}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-lg cursor-pointer"
              title="Logout session"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay backdrop for mobile side-drawer */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-40 transition-opacity"
        />
      )}

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative pt-16 lg:pt-0">
        {/* Upper Action Bar */}
        <header className="hidden lg:flex h-14 bg-white border-b border-slate-200 px-6 justify-between items-center shrink-0 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-extrabold">SQLite Database Engine • Active Branch Lahore</span>
          </div>

          <div className="flex items-center gap-3.5 text-xs font-bold">
            {countExpired > 0 && (
              <span className="bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-1 rounded-xl flex items-center gap-1">
                <ShieldAlert className="h-4 w-4" /> {countExpired} EXPIRED DRUGS
              </span>
            )}
            {countLowStock > 0 && (
              <span className="bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-xl flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" /> {countLowStock} LOW STOCK ITEMS
              </span>
            )}
          </div>
        </header>

        {/* Scrollable container for dynamic pages */}
        <section className="flex-1 overflow-y-auto p-4 sm:p-6">
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
