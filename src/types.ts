/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Owner' | 'Cashier' | 'Inventory Manager';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
}

export interface Medicine {
  id: string;
  brandName: string;
  genericName: string;
  company: string;
  strength: string; // e.g. "500mg", "20mg"
  dosageForm: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Inhaler' | 'Ointment' | 'Drops';
  barcode: string;
  category: string; // e.g. "Analgesic", "Antibiotic", "Cardiovascular"
  brandOrigin: 'Pakistani' | 'Multinational';
  prescriptionRequired: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface MedicineBatch {
  id: string;
  medicineId: string;
  supplierId: string;
  branchId: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  purchasePrice: number; // Price per base unit (e.g. per tablet)
  sellingPrice: number;  // Selling price per base unit
  profitMargin: number;  // Profit margin percentage
  minimumStock: number;  // Minimum total base units to alert
  quantityBoxes: number; // Current boxes
  quantityStrips: number; // Current strips (outside boxes)
  quantityUnits: number; // Current loose tablets/units
  unitsPerStrip: number;
  stripsPerBox: number;
  totalUnitsAvailable: number; // Total tablets/units = boxes * (strips * units) + strips * units + units
  totalUnitsPurchased: number;
  isExpired: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  companyName: string;
  openingBalance: number;
  currentPayableBalance: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type LedgerEntryType = 'Purchase' | 'Payment' | 'Return';

export interface SupplierLedgerEntry {
  id: string;
  supplierId: string;
  date: string;
  type: LedgerEntryType;
  referenceId: string; // PurchaseId, PaymentId, or ReturnId
  description: string;
  debit: number;  // We paid supplier (decreases balance)
  credit: number; // We bought goods on credit (increases balance)
  runningBalance: number;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  amountPaid: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Cheque';
  referenceNumber?: string;
  paymentDate: string;
  notes?: string;
}

export interface Purchase {
  id: string;
  supplierId: string;
  branchId: string;
  invoiceNumber: string;
  totalAmount: number;
  discountAmount: number;
  paidAmount: number;
  paymentStatus: 'Paid' | 'Credit' | 'Partial';
  purchaseDate: string;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  quantityBoxes: number;
  stripsPerBox: number;
  unitsPerStrip: number;
  quantityStrips: number;
  quantityUnits: number;
  totalUnits: number;
  purchasePricePerUnit: number;
  sellingPricePerUnit: number;
}

export type SaleStatus = 'Completed' | 'Refunded' | 'On Hold';

export interface Sale {
  id: string;
  invoiceNumber: string;
  cashierId: string;
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount: number; // sum of item subtotals before discounts
  discountAmount: number; // bill-level discount
  taxAmount: number; // calculated tax
  netPayable: number; // totalAmount - discountAmount + taxAmount
  cashReceived: number;
  cashChange: number;
  paymentMethod: 'Cash' | 'Card' | 'Mobile';
  status: SaleStatus;
  createdAt: string;
  branchId: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number; // Quantity in selected unit type
  unitType: 'Box' | 'Strip' | 'Unit';
  unitsPerStrip: number;
  stripsPerBox: number;
  baseUnitsQuantity: number; // Converted quantity to base units (tablets)
  unitPrice: number; // Selling price for that specific unit type
  purchasePricePerUnit: number; // Recorded purchase price per base unit (for profit)
  subtotal: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CustomerReturn {
  id: string;
  saleId: string;
  invoiceNumber: string;
  refundAmount: number;
  reason: string;
  createdAt: string;
  cashierId: string;
}

export interface CustomerReturnItem {
  id: string;
  customerReturnId: string;
  medicineId: string;
  batchId: string;
  quantity: number;
  unitType: 'Box' | 'Strip' | 'Unit';
  baseUnitsQuantity: number;
  refundPrice: number;
  isSellable: boolean; // if true, stock is added back to batch. if false, goes to damaged
}

export interface DamagedStock {
  id: string;
  medicineId: string;
  brandName: string;
  batchId: string;
  batchNumber: string;
  quantity: number; // in base units
  reason: string;
  reportedBy: string;
  createdAt: string;
}

export interface SupplierReturn {
  id: string;
  supplierId: string;
  supplierName: string;
  totalRefundAmount: number;
  returnDate: string;
  createdAt: string;
}

export interface SupplierReturnItem {
  id: string;
  supplierReturnId: string;
  medicineId: string;
  medicineName: string;
  batchId: string;
  batchNumber: string;
  quantity: number; // in base units
  purchasePricePerUnit: number;
  subtotal: number;
}

export type StockAdjustmentType = 
  | 'Opening Stock'
  | 'Correction'
  | 'Lost/Missing Stock'
  | 'Damaged Stock'
  | 'Expired Stock'
  | 'Manual Increase'
  | 'Manual Decrease';

export interface StockAdjustment {
  id: string;
  medicineId: string;
  brandName: string;
  batchId: string;
  batchNumber: string;
  type: StockAdjustmentType;
  quantityChange: number; // Positive for increase, negative for decrease
  reason: string;
  adjustedBy: string;
  createdAt: string;
}

export interface BackupLog {
  id: string;
  timestamp: string;
  fileName: string;
  fileSize: string;
  backupType: 'Local' | 'Google Drive';
  status: 'Success' | 'Failed';
  message?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  module: string;
  recordId?: string;
  oldValue?: string; // JSON string
  newValue?: string; // JSON string
  ipAddress?: string;
  createdAt: string;
}

export interface AppSettings {
  storeName: string;
  storePhone: string;
  storeAddress: string;
  licenseNumber: string;
  ntnNtnGst: string;
  currency: string; // "PKR"
  lowStockThreshold: number; // e.g. 100 units
  expiryWarningDays: number; // e.g. 60 days
  enableTax: boolean;
  taxPercentage: number; // e.g. 15%
  enableNegativeStock: boolean;
  enablePrescriptionWarning: boolean;
  invoiceFooterText: string;
  printerName: string;
  autoBackup: boolean;
  backupRetentionCount: number;
  googleDriveConnected: boolean;
  googleDriveEmail?: string;
}
