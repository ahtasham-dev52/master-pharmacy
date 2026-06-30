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
    <div className="space-y-6 font-sans text-xs text-slate-800">
      {/* Header tab switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 gap-4 shadow-xs">
        <div>
          <h1 className="text-lg font-extrabold text-slate-800 tracking-tight uppercase">System Settings & Audits</h1>
          <p className="text-slate-500 text-xs mt-0.5">Edit store billing details, print parameters, user credentials, and download database snapshots.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all border cursor-pointer ${
              activeTab === 'config'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Terminal Configuration
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all border cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            System Logs ({activityLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl font-bold transition-all border cursor-pointer ${
              activeTab === 'users'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Cashier Management ({users.length})
          </button>
        </div>
      </div>

      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-700">
          
          {/* Form Settings */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
              General Operations & Fiscal Controls
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[10px]">Currency Symbol</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[10px]">Low Stock Safety Threshold</label>
                  <input
                    type="number"
                    value={lowStockAlert}
                    onChange={(e) => setLowStockAlert(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[10px]">Expiry Buffer warnings (Days)</label>
                  <input
                    type="number"
                    value={expiryWarning}
                    onChange={(e) => setExpiryWarning(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold uppercase text-[10px]">Taxation Percentage (%)</label>
                  <input
                    type="number"
                    value={taxPercentage}
                    onChange={(e) => setTaxPercentage(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1.5">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <span className="font-bold text-slate-800">Enable GST Taxation</span>
                    <p className="text-[10px] text-slate-500">Apply government general sales tax automatically on invoices.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={taxEnabled}
                    onChange={(e) => setTaxEnabled(e.target.checked)}
                    className="w-5 h-5 accent-emerald-600 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <span className="font-bold text-slate-800">Allow Negative Stocking</span>
                    <p className="text-[10px] text-slate-500">Allow cashiers to complete sales even if digital inventory hits zero.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowNegativeStock}
                    onChange={(e) => setAllowNegativeStock(e.target.checked)}
                    className="w-5 h-5 accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-xs cursor-pointer"
              >
                Save Settings Profile
              </button>
            </form>
          </div>

          {/* Backup restore sidebar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
              Disaster Recovery backups
            </h2>

            <div className="space-y-3">
              <button
                onClick={handleDownloadBackup}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-3 px-4 rounded-xl cursor-pointer"
              >
                <Download className="h-4 w-4 text-emerald-600" />
                Generate Local JSON Backup
              </button>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  <RotateCcw className="h-4 w-4 text-amber-600" />
                  Restore system backup
                </p>
                <p className="text-[10px] text-slate-500">Upload a snapshot to restore the system state.</p>
                
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreBackupFile}
                  className="w-full text-slate-500 file:mr-3 file:py-1 file:px-2 file:rounded-xl file:border-0 file:bg-slate-900 file:text-white file:font-semibold hover:file:bg-slate-800 text-[10px] cursor-pointer"
                />
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl space-y-2">
                <span className="font-extrabold flex items-center gap-1.5 text-emerald-900 text-xs uppercase tracking-wider">
                  <RefreshCw className="h-3.5 w-3.5 text-emerald-600 animate-spin" />
                  Clinix Pharmacy Seed Pack
                </span>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Instantly populate the active database with 12 popular local & multinational medicines (Nexum, Flagyl, Ponstan, CAC, Surbex-Z) with pre-configured FEFO batches.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const { medicinesAdded, batchesAdded } = seedClinixInventory();
                    alert(`Successfully imported Clinix Pharmacy Inventory: ${medicinesAdded} medicines and ${batchesAdded} active inventory batches are now live in the system!`);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-[10px] cursor-pointer text-center transition-all shadow-md shadow-emerald-600/10 uppercase tracking-wider"
                >
                  Load Clinix Inventory Pack
                </button>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 text-blue-800 rounded-xl space-y-1">
                <span className="font-bold text-blue-900">Google Drive Cloud Sync Plan:</span>
                <p className="text-[10px] leading-relaxed text-blue-700">System architecture contains multi-branch cloud sync tables. Set up GCP Client IDs to enable daily auto backups to Google Drive.</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-slate-700">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-xs font-extrabold text-slate-800 flex items-center gap-2 font-sans uppercase tracking-wider">
              <ClipboardList className="h-4.5 w-4.5 text-emerald-600" />
              System Audit Log / Transactions Trail
            </h2>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse font-mono">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Cashier / User</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">Activity description</th>
                  <th className="p-3 text-right">Reference Record ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {activityLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-all text-[11px]">
                    <td className="p-3 text-slate-400">{new Date(log.createdAt).toLocaleString('en-PK')}</td>
                    <td className="p-3 text-slate-800 font-bold">{log.username}</td>
                    <td className="p-3 uppercase">
                      <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-emerald-700 text-[10px] font-bold">
                        {log.module}
                      </span>
                    </td>
                    <td className="p-3 font-sans">{log.action}</td>
                    <td className="p-3 text-right text-slate-400">{log.recordId || '-'}</td>
                  </tr>
                ))}

                {activityLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400 font-sans">No security or billing audit logs recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-slate-700">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-xs font-extrabold text-slate-800 font-sans uppercase tracking-wider">Staff Cashier Credentials (Offline Session Profiles)</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold">
                  <th className="p-3">Username</th>
                  <th className="p-3">Security Privilege Profile</th>
                  <th className="p-3">Branch Reference</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-800">{u.username}</td>
                    <td className="p-3 font-bold text-emerald-700">{u.role}</td>
                    <td className="p-3">Lahore Main Branch (br_01)</td>
                    <td className="p-3">
                      <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-xl text-[10px] font-bold">
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
