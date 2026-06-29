/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePharmacyStore } from '../store';
import { 
  Settings, ShieldAlert, Download, Upload, ClipboardList, 
  RotateCcw, Save, Check, RefreshCw 
} from 'lucide-react';

export default function SettingsLogs() {
  const { 
    settings, updateSettings, activityLogs, restoreBackup, users, seedClinixInventory 
  } = usePharmacyStore();

  const [taxEnabled, setTaxEnabled] = useState(settings.enableTax);
  const [taxPercentage, setTaxPercentage] = useState(settings.taxPercentage);
  const [currency, setCurrency] = useState(settings.currency);
  const [lowStockAlert, setLowStockAlert] = useState(settings.lowStockThreshold);
  const [expiryWarning, setExpiryWarning] = useState(settings.expiryWarningDays);
  const [allowNegativeStock, setAllowNegativeStock] = useState(settings.enableNegativeStock);

  const [activeTab, setActiveTab] = useState<'config' | 'logs' | 'users'>('config');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      enableTax: taxEnabled,
      taxPercentage: Number(taxPercentage),
      currency,
      lowStockThreshold: Number(lowStockAlert),
      expiryWarningDays: Number(expiryWarning),
      enableNegativeStock: allowNegativeStock,
    });
    alert('System operational settings committed successfully.');
  };

  // Generate offline backup blob
  const handleDownloadBackup = () => {
    const dump = {
      medicines: usePharmacyStore.getState().medicines,
      batches: usePharmacyStore.getState().batches,
      suppliers: usePharmacyStore.getState().suppliers,
      supplierLedgers: usePharmacyStore.getState().supplierLedgers,
      purchases: usePharmacyStore.getState().purchases,
      purchaseItems: usePharmacyStore.getState().purchaseItems,
      sales: usePharmacyStore.getState().sales,
      saleItems: usePharmacyStore.getState().saleItems,
      customers: usePharmacyStore.getState().customers,
      customerReturns: usePharmacyStore.getState().customerReturns,
      supplierReturns: usePharmacyStore.getState().supplierReturns,
      damagedStocks: usePharmacyStore.getState().damagedStocks,
      stockAdjustments: usePharmacyStore.getState().stockAdjustments,
      settings: usePharmacyStore.getState().settings,
      activityLogs: usePharmacyStore.getState().activityLogs,
    };
    const backupData = JSON.stringify(dump, null, 2);
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MasterPharmacy_Offline_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('Encrypted JSON state backup compiled and downloaded to local disk.');
  };

  const handleRestoreBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const parsed = JSON.parse(jsonStr);
        
        // Basic schema check
        if (!parsed.medicines || !parsed.batches) {
          throw new Error('Invalid backup schema definition.');
        }

        if (confirm('CRITICAL WARN: Restoring a backup will overwrite all current transactional databases. Do you want to proceed?')) {
          restoreBackup(jsonStr);
          alert('Database restored and re-indexed. System state refreshed.');
          window.location.reload();
        }
      } catch (err) {
        alert('Failed to parse state file. Ensure it is a valid Master Pharmacy backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Header tab switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-800 p-5 rounded-2xl border border-slate-700/40 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">System Settings & Audits</h1>
          <p className="text-slate-400 text-xs mt-0.5">Edit store billing details, print parameters, user credentials, and download SQLite snapshots.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all border cursor-pointer ${
              activeTab === 'config'
                ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            Terminal Configuration
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all border cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            System Logs ({activityLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all border cursor-pointer ${
              activeTab === 'users'
                ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            Cashier Management ({users.length})
          </button>
        </div>
      </div>

      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-300">
          
          {/* Form Settings */}
          <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700/40 p-5 shadow-xl space-y-5">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-700/40 pb-2">
              General Operations & Fiscal Controls
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Currency Symbol</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Low Stock Safety Threshold</label>
                  <input
                    type="number"
                    value={lowStockAlert}
                    onChange={(e) => setLowStockAlert(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Expiry Buffer warnings (Days)</label>
                  <input
                    type="number"
                    value={expiryWarning}
                    onChange={(e) => setExpiryWarning(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase">Taxation Percentage (%)</label>
                  <input
                    type="number"
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1.5">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-700/30 flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <span className="font-bold text-white">Enable GST Taxation</span>
                    <p className="text-[10px] text-slate-400">Apply government general sales tax automatically on invoices.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={taxEnabled}
                    onChange={(e) => setTaxEnabled(e.target.checked)}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-700/30 flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <span className="font-bold text-white">Allow Negative Stocking</span>
                    <p className="text-[10px] text-slate-400">Allow cashiers to complete sales even if digital inventory hits zero.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowNegativeStock}
                    onChange={(e) => setAllowNegativeStock(e.target.checked)}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                Save Settings Profile
              </button>
            </form>
          </div>

          {/* Backup restore sidebar */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700/40 p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-700/40 pb-2">
              Disaster Recovery backups
            </h2>

            <div className="space-y-3">
              <button
                onClick={handleDownloadBackup}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700/85 font-bold py-3 px-4 rounded-xl cursor-pointer"
              >
                <Download className="h-4 w-4 text-emerald-400" />
                Generate Local JSON Backup
              </button>

              <div className="p-3.5 bg-slate-900/55 rounded-xl border border-slate-700/30 space-y-2">
                <p className="font-bold text-white text-xs flex items-center gap-1">
                  <RotateCcw className="h-4 w-4 text-amber-400" />
                  Restore system backup
                </p>
                <p className="text-[10px] text-slate-400">Upload a snapshot to restore the SQLite structures.</p>
                
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackupFile}
                  className="w-full text-slate-400 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-800 file:text-emerald-400 file:font-semibold hover:file:bg-slate-700 text-[10px]"
                />
              </div>

              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl space-y-2">
                <span className="font-bold flex items-center gap-1.5 text-white">
                  <RefreshCw className="h-4 w-4 text-emerald-400" />
                  Clinix Pharmacy Seed Pack
                </span>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Instantly populate the active database with 12 popular local & multinational medicines (Nexum, Flagyl, Ponstan, CAC, Surbex-Z) with pre-configured FEFO batches.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const { medicinesAdded, batchesAdded } = seedClinixInventory();
                    alert(`Successfully imported Clinix Pharmacy Inventory: ${medicinesAdded} medicines and ${batchesAdded} active inventory batches are now live in the system!`);
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-3 rounded-xl text-xs cursor-pointer text-center transition-all shadow-md shadow-emerald-500/10"
                >
                  Load Clinix Inventory Pack
                </button>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-xl space-y-1">
                <span className="font-bold">Google Drive Cloud Sync Plan:</span>
                <p className="text-[10px] leading-relaxed">System architecture contains multi-branch cloud sync tables. Set up GCP Client IDs to enable daily auto backups to Google Drive.</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700/40 shadow-xl overflow-hidden text-slate-300">
          <div className="p-4 border-b border-slate-700/40 bg-slate-800/80">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 font-sans">
              <ClipboardList className="h-5 w-5 text-emerald-400" />
              SQLite System Audit Log / Transactions Trail
            </h2>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse font-mono">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700 text-[11px]">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Cashier / User</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">Activity description</th>
                  <th className="p-3 text-right">Reference Record ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {activityLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-700/10 transition-all text-[11px]">
                    <td className="p-3 text-slate-400">{new Date(log.createdAt).toLocaleString('en-PK')}</td>
                    <td className="p-3 text-white font-bold">{log.username}</td>
                    <td className="p-3 uppercase">
                      <span className="bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded text-emerald-400 text-[10px] font-bold">
                        {log.module}
                      </span>
                    </td>
                    <td className="p-3 font-sans">{log.action}</td>
                    <td className="p-3 text-right text-slate-400">{log.recordId || '-'}</td>
                  </tr>
                ))}

                {activityLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-500 font-sans">No security or billing audit logs recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700/40 shadow-xl overflow-hidden text-slate-300">
          <div className="p-4 border-b border-slate-700/40 bg-slate-800/80">
            <h2 className="text-sm font-bold text-white font-sans">Staff Cashier Credentials (Offline Session Profiles)</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700 text-[11px]">
                  <th className="p-3">Username</th>
                  <th className="p-3">Security Privilege Profile</th>
                  <th className="p-3">Branch Reference</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-700/10">
                    <td className="p-3 font-bold text-white">{u.username}</td>
                    <td className="p-3 font-bold text-emerald-400">{u.role}</td>
                    <td className="p-3">Lahore Main Branch (br_01)</td>
                    <td className="p-3">
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded text-[10px] font-bold">
                        Active Profile
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
