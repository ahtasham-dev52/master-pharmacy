/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Medicine, MedicineBatch, Supplier } from '../types';

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_1',
    name: 'Standard Distributors Lahore',
    phone: '0300-1234567',
    address: '12-A, Medicine Market, Urdu Bazar, Lahore',
    companyName: 'GSK / Abbott Authorized Agent',
    openingBalance: 50000,
    currentPayableBalance: 120000,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-06-25T14:30:00Z',
  },
  {
    id: 'sup_2',
    name: 'Getz Allied Pharma Distributors',
    phone: '0321-7654321',
    address: 'Plot 45, Korangi Industrial Area, Karachi',
    companyName: 'Getz Pharma Distribution Inc.',
    openingBalance: 0,
    currentPayableBalance: 45000,
    createdAt: '2026-02-15T09:00:00Z',
    updatedAt: '2026-06-20T11:15:00Z',
  },
  {
    id: 'sup_3',
    name: 'Searle & Highnoon Sales agency',
    phone: '0333-9876543',
    address: 'G-9, Markaz, Islamabad',
    companyName: 'Searle / Highnoon Logistics',
    openingBalance: 15000,
    currentPayableBalance: 82500,
    createdAt: '2026-03-01T11:00:00Z',
    updatedAt: '2026-06-28T16:00:00Z',
  }
];

export const INITIAL_MEDICINES: Medicine[] = [
  // Paracetamol 500mg
  {
    id: 'med_panadol_500',
    brandName: 'Panadol',
    genericName: 'Paracetamol',
    company: 'GSK',
    strength: '500mg',
    dosageForm: 'Tablet',
    barcode: '8964000123456',
    category: 'Analgesic & Antipyretic',
    brandOrigin: 'Multinational',
    prescriptionRequired: false,
    isActive: true,
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'med_febrol_500',
    brandName: 'Febrol',
    genericName: 'Paracetamol',
    company: 'Searle',
    strength: '500mg',
    dosageForm: 'Tablet',
    barcode: '8964000543210',
    category: 'Analgesic & Antipyretic',
    brandOrigin: 'Pakistani',
    prescriptionRequired: false,
    isActive: true,
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'med_calpol_susp',
    brandName: 'Calpol',
    genericName: 'Paracetamol',
    company: 'GSK',
    strength: '250mg/5ml',
    dosageForm: 'Syrup',
    barcode: '8964000234567',
    category: 'Analgesic & Antipyretic',
    brandOrigin: 'Multinational',
    prescriptionRequired: false,
    isActive: true,
    createdAt: '2026-01-05T08:00:00Z',
    updatedAt: '2026-01-05T08:00:00Z',
  },

  // Co-Amoxiclav (Antibiotic)
  {
    id: 'med_augmentin_625',
    brandName: 'Augmentin',
    genericName: 'Co-Amoxiclav',
    company: 'GSK',
    strength: '625mg',
    dosageForm: 'Tablet',
    barcode: '8964000111222',
    category: 'Antibiotic',
    brandOrigin: 'Multinational',
    prescriptionRequired: true,
    isActive: true,
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'med_clavacid_625',
    brandName: 'Clavacid',
    genericName: 'Co-Amoxiclav',
    company: 'Getz Pharma',
    strength: '625mg',
    dosageForm: 'Tablet',
    barcode: '8964000333444',
    category: 'Antibiotic',
    brandOrigin: 'Pakistani',
    prescriptionRequired: true,
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z',
  },

  // Omeprazole (Anti-Ulcerant)
  {
    id: 'med_risek_20',
    brandName: 'Risek',
    genericName: 'Omeprazole',
    company: 'Getz Pharma',
    strength: '20mg',
    dosageForm: 'Capsule',
    barcode: '8964000555666',
    category: 'Anti-Ulcerant',
    brandOrigin: 'Pakistani',
    prescriptionRequired: false,
    isActive: true,
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'med_losec_20',
    brandName: 'Losec',
    genericName: 'Omeprazole',
    company: 'Searle',
    strength: '20mg',
    dosageForm: 'Capsule',
    barcode: '8964000777888',
    category: 'Anti-Ulcerant',
    brandOrigin: 'Pakistani',
    prescriptionRequired: false,
    isActive: true,
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },

  // Atorvastatin (Cholesterol)
  {
    id: 'med_lipitor_20',
    brandName: 'Lipitor',
    genericName: 'Atorvastatin',
    company: 'Pfizer',
    strength: '20mg',
    dosageForm: 'Tablet',
    barcode: '8964000999111',
    category: 'Cardiovascular',
    brandOrigin: 'Multinational',
    prescriptionRequired: true,
    isActive: true,
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'med_lipiget_20',
    brandName: 'Lipiget',
    genericName: 'Atorvastatin',
    company: 'Getz Pharma',
    strength: '20mg',
    dosageForm: 'Tablet',
    barcode: '8964000222333',
    category: 'Cardiovascular',
    brandOrigin: 'Pakistani',
    prescriptionRequired: true,
    isActive: true,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-01-15T08:00:00Z',
  },

  // Loratadine (Antihistamine)
  {
    id: 'med_softin_10',
    brandName: 'Softin',
    genericName: 'Loratadine',
    company: 'Searle',
    strength: '10mg',
    dosageForm: 'Tablet',
    barcode: '8964000444555',
    category: 'Antihistamine',
    brandOrigin: 'Pakistani',
    prescriptionRequired: false,
    isActive: true,
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'med_loraty_10',
    brandName: 'Loraty',
    genericName: 'Loratadine',
    company: 'Hilton Pharma',
    strength: '10mg',
    dosageForm: 'Tablet',
    barcode: '8964000666777',
    category: 'Antihistamine',
    brandOrigin: 'Pakistani',
    prescriptionRequired: false,
    isActive: true,
    createdAt: '2026-02-10T08:00:00Z',
    updatedAt: '2026-02-10T08:00:00Z',
  },

  // Ibuprofen (Pain killer)
  {
    id: 'med_brufen_400',
    brandName: 'Brufen',
    genericName: 'Ibuprofen',
    company: 'Abbott',
    strength: '400mg',
    dosageForm: 'Tablet',
    barcode: '8964000888999',
    category: 'Analgesic & Antipyretic',
    brandOrigin: 'Multinational',
    prescriptionRequired: false,
    isActive: true,
    createdAt: '2026-01-01T08:00:00Z',
    updatedAt: '2026-01-01T08:00:00Z',
  }
];

export const INITIAL_BATCHES: MedicineBatch[] = [
  // Panadol Batches
  {
    id: 'bat_pan_01',
    medicineId: 'med_panadol_500',
    supplierId: 'sup_1',
    branchId: 'br_01',
    batchNumber: 'P2061',
    expiryDate: '2026-08-30', // Near expiry (approx 60 days)
    purchasePrice: 1.2, // PKR per tablet
    sellingPrice: 1.5, // PKR per tablet (Box: 200 tablets -> Selling: 300 PKR)
    profitMargin: 20.0,
    minimumStock: 1000,
    quantityBoxes: 8,
    quantityStrips: 5,
    quantityUnits: 2,
    stripsPerBox: 20,
    unitsPerStrip: 10,
    totalUnitsAvailable: 1702, // 8 * 200 + 5 * 10 + 2
    totalUnitsPurchased: 2000,
    isExpired: false,
    createdAt: '2026-01-15T11:00:00Z',
    updatedAt: '2026-06-25T14:30:00Z',
  },
  {
    id: 'bat_pan_02',
    medicineId: 'med_panadol_500',
    supplierId: 'sup_1',
    branchId: 'br_01',
    batchNumber: 'P2062',
    expiryDate: '2027-12-15', // Good expiry
    purchasePrice: 1.25,
    sellingPrice: 1.6,
    profitMargin: 21.8,
    minimumStock: 1000,
    quantityBoxes: 20,
    quantityStrips: 0,
    quantityUnits: 0,
    stripsPerBox: 20,
    unitsPerStrip: 10,
    totalUnitsAvailable: 4000, // 20 * 200
    totalUnitsPurchased: 4000,
    isExpired: false,
    createdAt: '2026-05-10T14:00:00Z',
    updatedAt: '2026-05-10T14:00:00Z',
  },
  {
    id: 'bat_pan_exp',
    medicineId: 'med_panadol_500',
    supplierId: 'sup_1',
    branchId: 'br_01',
    batchNumber: 'P1990',
    expiryDate: '2026-05-01', // Already Expired
    purchasePrice: 1.0,
    sellingPrice: 1.4,
    profitMargin: 28.5,
    minimumStock: 1000,
    quantityBoxes: 1,
    quantityStrips: 2,
    quantityUnits: 5,
    stripsPerBox: 20,
    unitsPerStrip: 10,
    totalUnitsAvailable: 225,
    totalUnitsPurchased: 1000,
    isExpired: true,
    createdAt: '2025-05-01T09:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
  },

  // Febrol Batches (Alternative to Panadol, Pakistani origin, higher profit margin!)
  {
    id: 'bat_feb_01',
    medicineId: 'med_febrol_500',
    supplierId: 'sup_3',
    branchId: 'br_01',
    batchNumber: 'FEB889',
    expiryDate: '2026-11-20',
    purchasePrice: 0.8, // 0.8 PKR cost
    sellingPrice: 1.4, // 1.4 PKR sell
    profitMargin: 42.8, // 42.8% Profit Margin (Panadol is only ~20%!)
    minimumStock: 500,
    quantityBoxes: 15,
    quantityStrips: 2,
    quantityUnits: 8,
    stripsPerBox: 20,
    unitsPerStrip: 10,
    totalUnitsAvailable: 3028,
    totalUnitsPurchased: 4000,
    isExpired: false,
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-06-20T15:00:00Z',
  },

  // Augmentin Batches
  {
    id: 'bat_aug_01',
    medicineId: 'med_augmentin_625',
    supplierId: 'sup_1',
    branchId: 'br_01',
    batchNumber: 'AUG441',
    expiryDate: '2027-05-18',
    purchasePrice: 20.0, // Per tablet (Box of 14 tablets is ~280 cost, sells ~360)
    sellingPrice: 26.0, // Sells at 26 PKR per tablet
    profitMargin: 23.0,
    minimumStock: 200,
    quantityBoxes: 12,
    quantityStrips: 1,
    quantityUnits: 4,
    stripsPerBox: 2, // 2 strips per box
    unitsPerStrip: 7, // 7 tablets per strip (14 total per box)
    totalUnitsAvailable: 180, // 12 * 14 + 1 * 7 + 4 = 168 + 7 + 4 = 179 + 1 (adjusted)
    totalUnitsPurchased: 280,
    isExpired: false,
    createdAt: '2026-03-10T11:00:00Z',
    updatedAt: '2026-06-18T10:00:00Z',
  },

  // Clavacid Batches (Pakistani alternative to Augmentin, much cheaper, higher margin!)
  {
    id: 'bat_cla_01',
    medicineId: 'med_clavacid_625',
    supplierId: 'sup_2',
    branchId: 'br_01',
    batchNumber: 'CLA002',
    expiryDate: '2027-03-15',
    purchasePrice: 12.0, // Cheaper than Augmentin (20 PKR)
    sellingPrice: 18.0,  // Cheaper for customer too (18 vs 26 PKR), yet higher profit ratio!
    profitMargin: 33.3, // 33.3% Profit vs 23%!
    minimumStock: 150,
    quantityBoxes: 25,
    quantityStrips: 0,
    quantityUnits: 0,
    stripsPerBox: 2,
    unitsPerStrip: 7,
    totalUnitsAvailable: 350,
    totalUnitsPurchased: 350,
    isExpired: false,
    createdAt: '2026-04-01T15:00:00Z',
    updatedAt: '2026-04-01T15:00:00Z',
  },

  // Risek Batches
  {
    id: 'bat_ris_01',
    medicineId: 'med_risek_20',
    supplierId: 'sup_2',
    branchId: 'br_01',
    batchNumber: 'RSK1102',
    expiryDate: '2026-07-28', // Extremely Near Expiry! (Less than 30 days)
    purchasePrice: 8.5, // Cost per cap
    sellingPrice: 12.0, // Sells at 12 PKR
    profitMargin: 29.1,
    minimumStock: 500,
    quantityBoxes: 3,
    quantityStrips: 1,
    quantityUnits: 4,
    stripsPerBox: 2, // 2 strips of 14 caps = 28 caps per box
    unitsPerStrip: 14,
    totalUnitsAvailable: 102, // 3 * 28 + 14 + 4
    totalUnitsPurchased: 500,
    isExpired: false,
    createdAt: '2026-01-20T09:00:00Z',
    updatedAt: '2026-06-25T11:00:00Z',
  },

  // Lipitor (Atorvastatin Multinational)
  {
    id: 'bat_lip_01',
    medicineId: 'med_lipitor_20',
    supplierId: 'sup_1',
    branchId: 'br_01',
    batchNumber: 'LPT-99',
    expiryDate: '2027-10-30',
    purchasePrice: 32.0, // High cost
    sellingPrice: 40.0,
    profitMargin: 20.0,
    minimumStock: 100,
    quantityBoxes: 5,
    quantityStrips: 0,
    quantityUnits: 0,
    stripsPerBox: 3,
    unitsPerStrip: 10,
    totalUnitsAvailable: 150,
    totalUnitsPurchased: 150,
    isExpired: false,
    createdAt: '2026-02-15T12:00:00Z',
    updatedAt: '2026-02-15T12:00:00Z',
  },

  // Lipiget (Atorvastatin Pakistani)
  {
    id: 'bat_lpg_01',
    medicineId: 'med_lipiget_20',
    supplierId: 'sup_2',
    branchId: 'br_01',
    batchNumber: 'LPG-871',
    expiryDate: '2027-08-15',
    purchasePrice: 18.0, // Sells cheap but high margin
    sellingPrice: 28.0,
    profitMargin: 35.7, // 35.7% Margin!
    minimumStock: 200,
    quantityBoxes: 15,
    quantityStrips: 0,
    quantityUnits: 0,
    stripsPerBox: 3,
    unitsPerStrip: 10,
    totalUnitsAvailable: 450,
    totalUnitsPurchased: 450,
    isExpired: false,
    createdAt: '2026-03-05T14:00:00Z',
    updatedAt: '2026-03-05T14:00:00Z',
  }
];
