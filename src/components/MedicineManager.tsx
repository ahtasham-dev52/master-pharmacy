/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePharmacyStore } from '../store';
import { Medicine } from '../types';
import { 
  Plus, Search, FileDown, UploadCloud, Edit2, Trash2, 
  Filter, Check, AlertCircle, RefreshCw, X 
} from 'lucide-react';

export default function MedicineManager() {
  const { medicines, addMedicine, updateMedicine, deleteMedicine, seedClinixInventory } = usePharmacyStore();
  const [search, setSearch] = useState('');
  const [dosageFilter, setDosageFilter] = useState('');
  const [originFilter, setOriginFilter] = useState('');

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  const [formData, setFormData] = useState({
    brandName: '',
    genericName: '',
    company: '',
    strength: '',
    dosageForm: 'Tablet' as const,
    barcode: '',
    category: '',
    brandOrigin: 'Pakistani' as const,
    prescriptionRequired: false,
  });

  // CSV Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);

  // Filter medicines
  const filteredMedicines = medicines.filter(m => {
    if (m.deletedAt) return false; // Hide soft-deleted items
    const matchSearch = 
      m.brandName.toLowerCase().includes(search.toLowerCase()) ||
      m.genericName.toLowerCase().includes(search.toLowerCase()) ||
      m.company.toLowerCase().includes(search.toLowerCase()) ||
      m.barcode.includes(search);
    const matchDosage = dosageFilter ? m.dosageForm === dosageFilter : true;
    const matchOrigin = originFilter ? m.brandOrigin === originFilter : true;
    return matchSearch && matchDosage && matchOrigin;
  });

  // CRUD Actions
  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      brandName: '',
      genericName: '',
      company: '',
      strength: '',
      dosageForm: 'Tablet',
      barcode: '',
      category: '',
      brandOrigin: 'Pakistani',
      prescriptionRequired: false,
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (m: Medicine) => {
    setIsEditing(true);
    setEditId(m.id);
    setFormData({
      brandName: m.brandName,
      genericName: m.genericName,
      company: m.company,
      strength: m.strength,
      dosageForm: m.dosageForm,
      barcode: m.barcode,
      category: m.category,
      brandOrigin: m.brandOrigin,
      prescriptionRequired: m.prescriptionRequired,
    });
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brandName || !formData.genericName || !formData.company) {
      alert('Please fill out all required fields.');
      return;
    }

    if (isEditing) {
      updateMedicine(editId, formData);
      alert('Medicine updated successfully.');
    } else {
      addMedicine(formData);
      alert('Medicine registered successfully in system catalogue.');
    }
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to soft-delete this medicine? It will be marked inactive and hidden from active sales.')) {
      deleteMedicine(id);
    }
  };

  // CSV Import Simulation
  const handleCSVPreview = () => {
    setImportErrors([]);
    setImportPreview([]);
    setImportSuccess(false);

    if (!csvContent.trim()) {
      setImportErrors(['CSV input is empty. Please enter CSV rows.']);
      return;
    }

    const rows = csvContent.split('\n');
    const header = rows[0].split(',');
    
    // Validate CSV columns
    // Expected: BrandName,GenericName,Company,Strength,DosageForm,Barcode,Category,Origin,PrescriptionRequired
    const expectedHeaders = ['brandname', 'genericname', 'company', 'strength', 'dosageform'];
    const validHeaders = expectedHeaders.every(h => header.some(col => col.toLowerCase().trim() === h));
    
    if (!validHeaders) {
      setImportErrors(['Invalid CSV Headers. Required columns: BrandName, GenericName, Company, Strength, DosageForm']);
      return;
    }

    const previewList: any[] = [];
    const errors: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue;
      const cols = rows[i].split(',');
      
      const brandName = cols[0]?.trim();
      const genericName = cols[1]?.trim();
      const company = cols[2]?.trim();
      const strength = cols[3]?.trim();
      const dosageForm = cols[4]?.trim() as any;
      const barcode = cols[5]?.trim() || '';
      const category = cols[6]?.trim() || 'General';
      const origin = (cols[7]?.trim() === 'Multinational' ? 'Multinational' : 'Pakistani') as any;
      const rx = cols[8]?.trim().toLowerCase() === 'true';

      // Row level validation
      if (!brandName || !genericName || !company || !strength) {
        errors.push(`Row ${i + 1}: Missing required values (Brand, Generic, Company, or Strength)`);
        continue;
      }

      previewList.push({
        brandName,
        genericName,
        company,
        strength,
        dosageForm: dosageForm || 'Tablet',
        barcode,
        category,
        brandOrigin: origin,
        prescriptionRequired: rx,
      });
    }

    setImportErrors(errors);
    setImportPreview(previewList);
  };

  const handleImportSave = () => {
    if (importPreview.length === 0) return;
    
    importPreview.forEach(item => {
      addMedicine(item);
    });

    setImportSuccess(true);
    setCsvContent('');
    setImportPreview([]);
    alert(`Success: ${importPreview.length} new medicines imported into SQLite local catalog.`);
    setShowImportModal(false);
  };

  const downloadSampleCSV = () => {
    const csvContent = "BrandName,GenericName,Company,Strength,DosageForm,Barcode,Category,Origin,PrescriptionRequired\n" +
      "Risek,Omeprazole,Getz,20mg,Capsule,8964000100220,Anti-Ulcerant,Pakistani,false\n" +
      "Panadol,Paracetamol,GSK,500mg,Tablet,8964000100330,Analgesic,Multinational,false\n" +
      "Xavor,Losartan,Getz,50mg,Tablet,8964000100440,Cardiology,Pakistani,true";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'medicine_import_sample.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 gap-4 shadow-xs">
        <div>
          <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">Medicine Catalogue Manager</h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage the master directory of medicines, drugs, generic pairings, and origins.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <UploadCloud className="h-4 w-4" />
            CSV Import
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add New Drug
          </button>
        </div>
      </div>

      {/* Clinix Pharmacy Seed Banner */}
      {!medicines.some(m => m.id === 'med_nexum_40') && (
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs animate-fade-in">
          <div className="flex gap-3.5 items-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
              <RefreshCw className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-xs">Pre-load Clinix Pharmacy Inventory Pack</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Add 12 premium local & multinational medicines (Nexum, Flagyl, Ponstan, CAC, Surbex-Z) with pre-configured active FEFO stock batches instantly to your store catalogue.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const { medicinesAdded, batchesAdded } = seedClinixInventory();
              alert(`Successfully imported Clinix Pharmacy Inventory: ${medicinesAdded} medicines and ${batchesAdded} active inventory batches are now live in the system!`);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap shadow-md shadow-emerald-600/10"
          >
            Seed Clinix Inventory
          </button>
        </div>
      )}

      {/* Search and filter toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-3.5 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-slate-800 placeholder-slate-400 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="Search by Brand Name, Generic Name, Company, Barcode..."
          />
        </div>

        <div className="flex gap-2 flex-wrap text-xs">
          <select
            value={dosageFilter}
            onChange={(e) => setDosageFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-600 rounded-xl p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-xs"
          >
            <option value="">All Dosages</option>
            <option value="Tablet">Tablets</option>
            <option value="Capsule">Capsules</option>
            <option value="Syrup">Syrups</option>
            <option value="Injection">Injections</option>
            <option value="Inhaler">Inhalers</option>
            <option value="Drops">Drops</option>
          </select>

          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-600 rounded-xl p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-xs"
          >
            <option value="">All Origins</option>
            <option value="Pakistani">Pakistani Brands</option>
            <option value="Multinational">Multinational Brands</option>
          </select>
        </div>
      </div>

      {/* Main Grid table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="p-3.5 uppercase tracking-wider text-[10px]">Drug Identity</th>
                <th className="p-3.5 uppercase tracking-wider text-[10px]">Generic Name</th>
                <th className="p-3.5 uppercase tracking-wider text-[10px]">Strength / Form</th>
                <th className="p-3.5 uppercase tracking-wider text-[10px]">Manufacturer</th>
                <th className="p-3.5 uppercase tracking-wider text-[10px]">Origin</th>
                <th className="p-3.5 uppercase tracking-wider text-[10px]">POM Rating</th>
                <th className="p-3.5 text-center uppercase tracking-wider text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredMedicines.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition-all">
                  <td className="p-3.5 font-sans">
                    <p className="font-bold text-slate-800 text-sm">{m.brandName}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Barcode: {m.barcode || 'N/A'}</p>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-700">{m.genericName}</td>
                  <td className="p-3.5">
                    <span className="bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded text-[11px] font-bold text-emerald-700 font-mono">
                      {m.strength}
                    </span>
                    <span className="ml-1.5 text-slate-500 font-sans">{m.dosageForm}</span>
                  </td>
                  <td className="p-3.5 text-slate-500">{m.company}</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full font-sans text-[10px] font-bold ${
                      m.brandOrigin === 'Multinational' 
                        ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {m.brandOrigin}
                    </span>
                  </td>
                  <td className="p-3.5">
                    {m.prescriptionRequired ? (
                      <span className="text-amber-600 font-sans font-bold text-[10px] flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Rx (Req)
                      </span>
                    ) : (
                      <span className="text-slate-400 font-sans font-semibold text-[10px]">OTC (General)</span>
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                        title="Edit Medicine details"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="Soft Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredMedicines.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-sans">
                    <Filter className="h-10 w-10 text-slate-300 mx-auto mb-2 opacity-60" />
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">No Medicines Found</p>
                    <p className="text-[10px] text-slate-400 mt-1">Try resetting search query filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD / EDIT MEDICINE FORM */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {isEditing ? 'Edit Medicine Directory Entry' : 'Register New Medicine in Database'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold uppercase block">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. Panadol"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold uppercase block">Generic Formulation *</label>
                  <input
                    type="text"
                    required
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. Paracetamol"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold uppercase block">Company / Manufacturer *</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. GSK"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold uppercase block">Strength Rating *</label>
                  <input
                    type="text"
                    required
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. 500mg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold uppercase block">Dosage Form *</label>
                  <select
                    value={formData.dosageForm}
                    onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Drops">Drops</option>
                    <option value="Ointment">Ointment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold uppercase block">Barcode ID</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. 89640001"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold uppercase block">Therapeutic Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. Analgesic"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-semibold uppercase block">Brand Origin</label>
                  <select
                    value={formData.brandOrigin}
                    onChange={(e) => setFormData({ ...formData, brandOrigin: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Pakistani">Pakistani Brand</option>
                    <option value="Multinational">Multinational Brand</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800">Prescription Required (POM)</span>
                  <p className="text-[10px] text-slate-500">If active, POS billing triggers safety alerts to verify medical credentials.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.prescriptionRequired}
                  onChange={(e) => setFormData({ ...formData, prescriptionRequired: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/10 cursor-pointer"
                >
                  Save to Local SQLite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CSV IMPORTER */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 flex flex-col max-h-[85vh] animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <UploadCloud className="h-4.5 w-4.5 text-emerald-600" />
                CSV Catalog Importer
              </h3>
              <button onClick={() => { setShowImportModal(false); setImportPreview([]); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans overflow-y-auto flex-1 pr-1">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800">Import Drug Catalog Instantly</span>
                  <p className="text-[10px] text-slate-500">Download a template or paste rows below to populate 5,000+ medicines instantly.</p>
                </div>
                <button
                  onClick={downloadSampleCSV}
                  className="flex items-center gap-1 text-[11px] bg-white hover:bg-slate-50 text-emerald-700 border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer font-bold"
                >
                  <FileDown className="h-3.5 w-3.5" /> Template
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-semibold uppercase block">Paste CSV Data Rows (Comma-Separated)</label>
                <textarea
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="BrandName,GenericName,Company,Strength,DosageForm,Barcode,Category,Origin,PrescriptionRequired&#10;Risek,Omeprazole,Getz,20mg,Capsule,8964000100220,Anti-Ulcerant,Pakistani,false"
                />
              </div>

              <button
                onClick={handleCSVPreview}
                className="w-full bg-slate-50 hover:bg-slate-100 text-emerald-700 border border-slate-200 font-bold py-2.5 px-4 rounded-xl cursor-pointer text-xs"
              >
                Validate & Preview Rows
              </button>

              {/* Validation errors */}
              {importErrors.length > 0 && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 space-y-1">
                  <p className="font-bold text-rose-700">Validation Errors Detected:</p>
                  <ul className="list-disc pl-5 text-[10px] text-rose-600 space-y-0.5">
                    {importErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}

              {/* Preview table */}
              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <p className="font-bold text-emerald-700 text-xs">Previewing {importPreview.length} Valid Rows:</p>
                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                    <table className="w-full text-left text-[10px] font-mono">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2">Brand</th>
                          <th className="p-2">Generic</th>
                          <th className="p-2">Form</th>
                          <th className="p-2 text-right">Origin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {importPreview.map((item, i) => (
                          <tr key={i} className="bg-white hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-800">{item.brandName} {item.strength}</td>
                            <td className="p-2">{item.genericName}</td>
                            <td className="p-2">{item.dosageForm}</td>
                            <td className="p-2 text-right">{item.brandOrigin}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => { setShowImportModal(false); setImportPreview([]); }}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                disabled={importPreview.length === 0}
                onClick={handleImportSave}
                className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/10 cursor-pointer disabled:opacity-40"
              >
                Import Approved Rows
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
