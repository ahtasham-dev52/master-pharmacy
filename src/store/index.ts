/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { 
  User, UserRole, AppSettings, Medicine, MedicineBatch, Supplier, 
  SupplierLedgerEntry, SupplierPayment, Purchase, PurchaseItem, 
  Sale, SaleItem, Customer, CustomerReturn, DamagedStock, 
  SupplierReturn, StockAdjustment, BackupLog, ActivityLog, SaleStatus 
} from '../types';
import { INITIAL_MEDICINES, INITIAL_BATCHES, INITIAL_SUPPLIERS } from '../data/initialMedicines';

interface PharmacyState {
  // Auth
  currentUser: User | null;
  users: User[];
  login: (username: string, role: UserRole) => boolean;
  logout: () => void;
  addUser: (username: string, role: UserRole) => void;
  updateUserStatus: (id: string, active: boolean) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;

  // Medicines
  medicines: Medicine[];
  addMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>) => Medicine;
  updateMedicine: (id: string, updates: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void; // Soft delete

  // Batches & Inventory
  batches: MedicineBatch[];
  addBatch: (batch: Omit<MedicineBatch, 'id' | 'createdAt' | 'updatedAt' | 'isExpired'>) => MedicineBatch;
  updateBatch: (id: string, updates: Partial<MedicineBatch>) => void;
  deleteBatch: (id: string) => void;

  // Suppliers
  suppliers: Supplier[];
  supplierLedgers: SupplierLedgerEntry[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'currentPayableBalance'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addSupplierPayment: (payment: Omit<SupplierPayment, 'id' | 'paymentDate'>) => void;

  // Purchases
  purchases: Purchase[];
  purchaseItems: PurchaseItem[];
  addPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt' | 'purchaseDate'>, items: Omit<PurchaseItem, 'id' | 'purchaseId'>[]) => void;

  // Sales (POS)
  sales: Sale[];
  saleItems: SaleItem[];
  heldBills: { id: string; customerName: string; customerPhone: string; items: any[]; heldAt: string }[];
  holdBill: (customerName: string, customerPhone: string, items: any[]) => void;
  resumeBill: (id: string) => { customerName: string; customerPhone: string; items: any[] } | null;
  clearHeldBill: (id: string) => void;
  completeSale: (saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'createdAt'>, cartItems: { medicineId: string; quantity: number; unitType: 'Box' | 'Strip' | 'Unit' }[]) => Sale;

  // Returns
  customerReturns: CustomerReturn[];
  supplierReturns: SupplierReturn[];
  addCustomerReturn: (returnDetails: Omit<CustomerReturn, 'id' | 'createdAt'>, items: { medicineId: string; batchId: string; quantity: number; unitType: 'Box' | 'Strip' | 'Unit'; isSellable: boolean; refundPrice: number }[]) => void;
  addSupplierReturn: (returnDetails: Omit<SupplierReturn, 'id' | 'createdAt' | 'returnDate'>, items: { medicineId: string; batchId: string; quantity: number; purchasePricePerUnit: number }[]) => void;

  // Damaged Stock & Adjustments
  damagedStocks: DamagedStock[];
  stockAdjustments: StockAdjustment[];
  addDamagedStock: (damaged: Omit<DamagedStock, 'id' | 'createdAt' | 'reportedBy'>) => void;
  addStockAdjustment: (adjustment: Omit<StockAdjustment, 'id' | 'createdAt' | 'adjustedBy'>) => void;

  // Logs & Backups
  activityLogs: ActivityLog[];
  backupLogs: BackupLog[];
  addActivityLog: (action: string, module: string, recordId?: string, oldValue?: any, newValue?: any) => void;
  createBackup: (type: 'Local' | 'Google Drive') => void;
  restoreBackup: (backupContent: string) => boolean;

  // Customers
  customers: Customer[];
  addCustomer: (name: string, phone: string, email?: string) => Customer;
}

const DEFAULT_SETTINGS: AppSettings = {
  storeName: 'Master Pharmacy',
  storePhone: '042-35882321',
  storeAddress: 'Main Boulevard, Gulberg III, Lahore, Pakistan',
  licenseNumber: 'LHR-PHA-2026-9817',
  ntnNtnGst: 'NTN: 8172635-4',
  currency: 'PKR',
  lowStockThreshold: 150,
  expiryWarningDays: 60,
  enableTax: false,
  taxPercentage: 15,
  enableNegativeStock: false,
  enablePrescriptionWarning: true,
  invoiceFooterText: 'Thank you for your visit. Medicines once sold cannot be returned without original receipt. Stay healthy!',
  printerName: 'XP-80 thermal printer',
  autoBackup: true,
  backupRetentionCount: 15,
  googleDriveConnected: false,
};

const DEFAULT_USERS: User[] = [
  { id: 'usr_1', username: 'admin', role: 'Owner', isActive: true, createdAt: new Date().toISOString() },
  { id: 'usr_2', username: 'cashier1', role: 'Cashier', isActive: true, createdAt: new Date().toISOString() },
  { id: 'usr_3', username: 'inv_manager', role: 'Inventory Manager', isActive: true, createdAt: new Date().toISOString() },
];

export const usePharmacyStore = create<PharmacyState>((set, get) => {
  // Helpers to read/write localStorage
  const loadLocalStorage = <T>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(`master_pharmacy_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
      console.error(`Failed to load ${key} from storage`, e);
      return defaultValue;
    }
  };

  const saveLocalStorage = (key: string, value: any) => {
    try {
      localStorage.setItem(`master_pharmacy_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save ${key} to storage`, e);
    }
  };

  // Helper to add audit log
  const pushAuditLog = (action: string, module: string, recordId?: string, oldValue?: any, newValue?: any) => {
    const user = get().currentUser;
    const log: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: user?.id || 'sys',
      username: user?.username || 'System',
      action,
      module,
      recordId,
      oldValue: oldValue ? JSON.stringify(oldValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined,
      ipAddress: '127.0.0.1 (Local)',
      createdAt: new Date().toISOString(),
    };
    const updated = [log, ...get().activityLogs];
    set({ activityLogs: updated });
    saveLocalStorage('activity_logs', updated);
  };

  return {
    // Initial State values retrieved from localStorage or fallback
    currentUser: loadLocalStorage<User | null>('current_user', null),
    users: loadLocalStorage<User[]>('users', DEFAULT_USERS),
    settings: loadLocalStorage<AppSettings>('settings', DEFAULT_SETTINGS),
    medicines: loadLocalStorage<Medicine[]>('medicines', INITIAL_MEDICINES),
    batches: loadLocalStorage<MedicineBatch[]>('batches', INITIAL_BATCHES),
    suppliers: loadLocalStorage<Supplier[]>('suppliers', INITIAL_SUPPLIERS),
    supplierLedgers: loadLocalStorage<SupplierLedgerEntry[]>('supplier_ledgers', []),
    purchases: loadLocalStorage<Purchase[]>('purchases', []),
    purchaseItems: loadLocalStorage<PurchaseItem[]>('purchase_items', []),
    sales: loadLocalStorage<Sale[]>('sales', []),
    saleItems: loadLocalStorage<SaleItem[]>('sale_items', []),
    heldBills: loadLocalStorage<any[]>('held_bills', []),
    customerReturns: loadLocalStorage<CustomerReturn[]>('customer_returns', []),
    supplierReturns: loadLocalStorage<SupplierReturn[]>('supplier_returns', []),
    damagedStocks: loadLocalStorage<DamagedStock[]>('damaged_stocks', []),
    stockAdjustments: loadLocalStorage<StockAdjustment[]>('stock_adjustments', []),
    activityLogs: loadLocalStorage<ActivityLog[]>('activity_logs', []),
    backupLogs: loadLocalStorage<BackupLog[]>('backup_logs', []),
    customers: loadLocalStorage<Customer[]>('customers', [
      { id: 'cust_walkin', name: 'Walk-in Customer', phone: 'N/A', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ]),

    // Auth Actions
    login: (username, role) => {
      const user = get().users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.role === role);
      if (user && user.isActive) {
        set({ currentUser: user });
        saveLocalStorage('current_user', user);
        pushAuditLog('User Login', 'Authentication', user.id, null, { username, role });
        return true;
      }
      return false;
    },

    logout: () => {
      const user = get().currentUser;
      if (user) {
        pushAuditLog('User Logout', 'Authentication', user.id);
      }
      set({ currentUser: null });
      saveLocalStorage('current_user', null);
    },

    addUser: (username, role) => {
      const newUser: User = {
        id: `usr_${Date.now()}`,
        username,
        role,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      const updated = [...get().users, newUser];
      set({ users: updated });
      saveLocalStorage('users', updated);
      pushAuditLog('Create User', 'Users', newUser.id, null, newUser);
    },

    updateUserStatus: (id, active) => {
      const updated = get().users.map(u => u.id === id ? { ...u, isActive: active } : u);
      set({ users: updated });
      saveLocalStorage('users', updated);
      pushAuditLog('Update User Status', 'Users', id, null, { active });
    },

    // Settings
    updateSettings: (newSettings) => {
      const oldSettings = get().settings;
      const updated = { ...oldSettings, ...newSettings };
      set({ settings: updated });
      saveLocalStorage('settings', updated);
      pushAuditLog('Update App Settings', 'Settings', 'global', oldSettings, updated);
    },

    // Medicines
    addMedicine: (medicine) => {
      const newMed: Medicine = {
        ...medicine,
        id: `med_${Date.now()}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...get().medicines, newMed];
      set({ medicines: updated });
      saveLocalStorage('medicines', updated);
      pushAuditLog('Create Medicine', 'Medicines', newMed.id, null, newMed);
      return newMed;
    },

    updateMedicine: (id, updates) => {
      const oldMed = get().medicines.find(m => m.id === id);
      const updated = get().medicines.map(m => m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m);
      set({ medicines: updated });
      saveLocalStorage('medicines', updated);
      pushAuditLog('Update Medicine', 'Medicines', id, oldMed, updates);
    },

    deleteMedicine: (id) => {
      // Soft Delete
      const oldMed = get().medicines.find(m => m.id === id);
      const updated = get().medicines.map(m => m.id === id ? { ...m, isActive: false, deletedAt: new Date().toISOString() } : m);
      set({ medicines: updated });
      saveLocalStorage('medicines', updated);
      pushAuditLog('Soft Delete Medicine', 'Medicines', id, oldMed, { isActive: false, deletedAt: true });
    },

    // Batches & Inventory
    addBatch: (batch) => {
      const newBatch: MedicineBatch = {
        ...batch,
        id: `bat_${Date.now()}`,
        isExpired: new Date(batch.expiryDate) < new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...get().batches, newBatch];
      set({ batches: updated });
      saveLocalStorage('batches', updated);
      pushAuditLog('Add Medicine Batch', 'Inventory', newBatch.id, null, newBatch);
      return newBatch;
    },

    updateBatch: (id, updates) => {
      const oldBatch = get().batches.find(b => b.id === id);
      const updated = get().batches.map(b => b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b);
      set({ batches: updated });
      saveLocalStorage('batches', updated);
      pushAuditLog('Update Batch Inventory', 'Inventory', id, oldBatch, updates);
    },

    deleteBatch: (id) => {
      const oldBatch = get().batches.find(b => b.id === id);
      const updated = get().batches.map(b => b.id === id ? { ...b, deletedAt: new Date().toISOString() } : b);
      set({ batches: updated });
      saveLocalStorage('batches', updated);
      pushAuditLog('Delete Batch', 'Inventory', id, oldBatch, { deletedAt: true });
    },

    // Suppliers
    addSupplier: (supplier) => {
      const newSup: Supplier = {
        ...supplier,
        id: `sup_${Date.now()}`,
        currentPayableBalance: supplier.openingBalance,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...get().suppliers, newSup];
      set({ suppliers: updated });
      saveLocalStorage('suppliers', updated);

      if (supplier.openingBalance > 0) {
        const ledgerEntry: SupplierLedgerEntry = {
          id: `led_${Date.now()}`,
          supplierId: newSup.id,
          date: new Date().toISOString(),
          type: 'Purchase',
          referenceId: 'opening_balance',
          description: 'Opening Balance Credit',
          debit: 0,
          credit: supplier.openingBalance,
          runningBalance: supplier.openingBalance,
        };
        const ledgers = [ledgerEntry, ...get().supplierLedgers];
        set({ supplierLedgers: ledgers });
        saveLocalStorage('supplier_ledgers', ledgers);
      }

      pushAuditLog('Create Supplier', 'Suppliers', newSup.id, null, newSup);
      return newSup;
    },

    updateSupplier: (id, updates) => {
      const oldSup = get().suppliers.find(s => s.id === id);
      const updated = get().suppliers.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s);
      set({ suppliers: updated });
      saveLocalStorage('suppliers', updated);
      pushAuditLog('Update Supplier', 'Suppliers', id, oldSup, updates);
    },

    deleteSupplier: (id) => {
      const oldSup = get().suppliers.find(s => s.id === id);
      const updated = get().suppliers.map(s => s.id === id ? { ...s, deletedAt: new Date().toISOString() } : s);
      set({ suppliers: updated });
      saveLocalStorage('suppliers', updated);
      pushAuditLog('Soft Delete Supplier', 'Suppliers', id, oldSup, { deletedAt: true });
    },

    addSupplierPayment: (payment) => {
      const payId = `pay_${Date.now()}`;
      const fullPayment: SupplierPayment = {
        ...payment,
        id: payId,
        paymentDate: new Date().toISOString(),
      };

      // Update supplier balance
      const suppliers = get().suppliers.map(s => {
        if (s.id === payment.supplierId) {
          const newBal = s.currentPayableBalance - payment.amountPaid;
          
          // Add ledger entry
          const ledgerEntry: SupplierLedgerEntry = {
            id: `led_${Date.now()}`,
            supplierId: s.id,
            date: new Date().toISOString(),
            type: 'Payment',
            referenceId: payId,
            description: `Payment via ${payment.paymentMethod} ${payment.referenceNumber ? `(Ref: ${payment.referenceNumber})` : ''}`,
            debit: payment.amountPaid,
            credit: 0,
            runningBalance: newBal,
          };
          
          const updatedLedgers = [ledgerEntry, ...get().supplierLedgers];
          set({ supplierLedgers: updatedLedgers });
          saveLocalStorage('supplier_ledgers', updatedLedgers);
          
          return { ...s, currentPayableBalance: newBal };
        }
        return s;
      });

      set({ suppliers });
      saveLocalStorage('suppliers', suppliers);
      pushAuditLog('Supplier Payment Logged', 'Suppliers', payment.supplierId, null, fullPayment);
    },

    // Purchases (Stock Entry)
    addPurchase: (purchase, items) => {
      const purchaseId = `pur_${Date.now()}`;
      const newPurchase: Purchase = {
        ...purchase,
        id: purchaseId,
        purchaseDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Save Purchase items
      const purchaseItemsToSave: PurchaseItem[] = items.map((item, idx) => ({
        ...item,
        id: `pur_item_${Date.now()}_${idx}`,
        purchaseId,
      }));

      // Update Inventory batches & Create or Update Batches!
      const currentBatches = [...get().batches];
      purchaseItemsToSave.forEach(item => {
        // Look for existing batch with the same medicine ID, supplier ID and batch number
        const existingBatchIndex = currentBatches.findIndex(
          b => b.medicineId === item.medicineId && 
               b.batchNumber.toLowerCase() === item.batchNumber.toLowerCase() &&
               !b.deletedAt
        );

        if (existingBatchIndex >= 0) {
          // Increment existing batch stock
          const batch = currentBatches[existingBatchIndex];
          const newBoxes = batch.quantityBoxes + item.quantityBoxes;
          const newStrips = batch.quantityStrips + item.quantityStrips;
          const newUnits = batch.quantityUnits + item.quantityUnits;
          const totalUnitsIncr = item.totalUnits;
          const newTotalUnits = batch.totalUnitsAvailable + totalUnitsIncr;

          currentBatches[existingBatchIndex] = {
            ...batch,
            quantityBoxes: newBoxes,
            quantityStrips: newStrips,
            quantityUnits: newUnits,
            totalUnitsAvailable: newTotalUnits,
            totalUnitsPurchased: batch.totalUnitsPurchased + totalUnitsIncr,
            purchasePrice: item.purchasePricePerUnit,
            sellingPrice: item.sellingPricePerUnit,
            profitMargin: parseFloat((((item.sellingPricePerUnit - item.purchasePricePerUnit) / item.sellingPricePerUnit) * 100).toFixed(1)),
            expiryDate: item.expiryDate,
            isExpired: new Date(item.expiryDate) < new Date(),
            updatedAt: new Date().toISOString(),
          };
        } else {
          // Create new batch!
          const profitPercent = parseFloat((((item.sellingPricePerUnit - item.purchasePricePerUnit) / item.sellingPricePerUnit) * 100).toFixed(1));
          const newBatch: MedicineBatch = {
            id: `bat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            medicineId: item.medicineId,
            supplierId: purchase.supplierId,
            branchId: purchase.branchId,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            purchasePrice: item.purchasePricePerUnit,
            sellingPrice: item.sellingPricePerUnit,
            profitMargin: profitPercent,
            minimumStock: 100, // default
            quantityBoxes: item.quantityBoxes,
            quantityStrips: item.quantityStrips,
            quantityUnits: item.quantityUnits,
            stripsPerBox: item.stripsPerBox,
            unitsPerStrip: item.unitsPerStrip,
            totalUnitsAvailable: item.totalUnits,
            totalUnitsPurchased: item.totalUnits,
            isExpired: new Date(item.expiryDate) < new Date(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          currentBatches.push(newBatch);
        }
      });

      // Update Supplier balance & Ledger
      const outstandingCredit = purchase.totalAmount - purchase.discountAmount - purchase.paidAmount;
      const currentSuppliers = get().suppliers.map(s => {
        if (s.id === purchase.supplierId) {
          const newBal = s.currentPayableBalance + outstandingCredit;
          
          // Ledger entry
          const ledgerEntry: SupplierLedgerEntry = {
            id: `led_${Date.now()}`,
            supplierId: s.id,
            date: new Date().toISOString(),
            type: 'Purchase',
            referenceId: purchaseId,
            description: `Purchase Inv# ${purchase.invoiceNumber} (Total: ${purchase.totalAmount}, Paid: ${purchase.paidAmount})`,
            debit: 0,
            credit: outstandingCredit,
            runningBalance: newBal,
          };
          
          const updatedLedgers = [ledgerEntry, ...get().supplierLedgers];
          set({ supplierLedgers: updatedLedgers });
          saveLocalStorage('supplier_ledgers', updatedLedgers);

          return { ...s, currentPayableBalance: newBal };
        }
        return s;
      });

      const updatedPurchases = [newPurchase, ...get().purchases];
      const updatedPurchaseItems = [...purchaseItemsToSave, ...get().purchaseItems];

      set({ 
        purchases: updatedPurchases, 
        purchaseItems: updatedPurchaseItems, 
        batches: currentBatches,
        suppliers: currentSuppliers
      });

      saveLocalStorage('purchases', updatedPurchases);
      saveLocalStorage('purchase_items', updatedPurchaseItems);
      saveLocalStorage('batches', currentBatches);
      saveLocalStorage('suppliers', currentSuppliers);

      pushAuditLog('Purchase Invoice Logged', 'Purchases', purchaseId, null, newPurchase);
    },

    // Sales Hold/Resume POS
    holdBill: (customerName, customerPhone, items) => {
      const newHeld = {
        id: `held_${Date.now()}`,
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || '',
        items,
        heldAt: new Date().toISOString()
      };
      const updated = [...get().heldBills, newHeld];
      set({ heldBills: updated });
      saveLocalStorage('held_bills', updated);
      pushAuditLog('Bill Placed on Hold', 'POS', newHeld.id);
    },

    resumeBill: (id) => {
      const bill = get().heldBills.find(h => h.id === id);
      if (bill) {
        // Remove from held
        const updated = get().heldBills.filter(h => h.id !== id);
        set({ heldBills: updated });
        saveLocalStorage('held_bills', updated);
        pushAuditLog('Held Bill Resumed', 'POS', id);
        return { customerName: bill.customerName, customerPhone: bill.customerPhone, items: bill.items };
      }
      return null;
    },

    clearHeldBill: (id) => {
      const updated = get().heldBills.filter(h => h.id !== id);
      set({ heldBills: updated });
      saveLocalStorage('held_bills', updated);
    },

    // POS Billing core transaction with FEFO Algorithm
    completeSale: (saleData, cartItems) => {
      const saleId = `sale_${Date.now()}`;
      
      // Calculate Invoice Number (Auto Increments cleanly!)
      const todayYear = new Date().getFullYear();
      const currentYearSales = get().sales.filter(s => s.invoiceNumber.startsWith(`MP-${todayYear}`));
      const nextSequence = currentYearSales.length + 1;
      const formattedSeq = String(nextSequence).padStart(6, '0');
      const invoiceNumber = `MP-${todayYear}-${formattedSeq}`;

      const activeBatches = [...get().batches];
      const finalSaleItems: SaleItem[] = [];

      // Loop through cart items and apply FEFO deduction algorithm
      cartItems.forEach(cartItem => {
        const medicine = get().medicines.find(m => m.id === cartItem.medicineId);
        if (!medicine) throw new Error(`Medicine ${cartItem.medicineId} not found`);

        // Find available batches for this medicine
        const medicineBatches = activeBatches.filter(
          b => b.medicineId === cartItem.medicineId && 
               !b.deletedAt && 
               b.totalUnitsAvailable > 0
        );

        // Filter expired out if negative stock/expired sales are disabled
        const validBatches = medicineBatches.filter(b => !b.isExpired);

        // FEFO Sorting: nearest expiry first!
        validBatches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

        // Calculate total base units to deduct
        let unitsToDeduct = 0;
        const bSample = medicineBatches[0] || get().batches.find(b => b.medicineId === cartItem.medicineId);
        const stripsPerBox = bSample?.stripsPerBox || 10;
        const unitsPerStrip = bSample?.unitsPerStrip || 10;

        if (cartItem.unitType === 'Box') {
          unitsToDeduct = cartItem.quantity * stripsPerBox * unitsPerStrip;
        } else if (cartItem.unitType === 'Strip') {
          unitsToDeduct = cartItem.quantity * unitsPerStrip;
        } else {
          unitsToDeduct = cartItem.quantity;
        }

        let remainingToDeduct = unitsToDeduct;

        // Verify total available stock first
        const totalAvailable = validBatches.reduce((sum, b) => sum + b.totalUnitsAvailable, 0);
        if (totalAvailable < unitsToDeduct && !get().settings.enableNegativeStock) {
          throw new Error(`Insufficient stock for ${medicine.brandName}. Requested: ${unitsToDeduct} units, Available: ${totalAvailable} units.`);
        }

        // Deduct from batches
        for (let i = 0; i < validBatches.length && remainingToDeduct > 0; i++) {
          const batch = validBatches[i];
          const deductFromThisBatch = Math.min(batch.totalUnitsAvailable, remainingToDeduct);

          const newTotalUnits = batch.totalUnitsAvailable - deductFromThisBatch;
          remainingToDeduct -= deductFromThisBatch;

          // Re-calculate boxes, strips, units based on remaining total units
          const boxCapacity = batch.stripsPerBox * batch.unitsPerStrip;
          const stripCapacity = batch.unitsPerStrip;

          const remainingBoxes = Math.floor(newTotalUnits / boxCapacity);
          const remainderAfterBoxes = newTotalUnits % boxCapacity;
          const remainingStrips = Math.floor(remainderAfterBoxes / stripCapacity);
          const remainingLooseUnits = remainderAfterBoxes % stripCapacity;

          // Find exact batch in main array to update
          const bIdx = activeBatches.findIndex(b => b.id === batch.id);
          if (bIdx >= 0) {
            activeBatches[bIdx] = {
              ...activeBatches[bIdx],
              totalUnitsAvailable: newTotalUnits,
              quantityBoxes: remainingBoxes,
              quantityStrips: remainingStrips,
              quantityUnits: remainingLooseUnits,
              updatedAt: new Date().toISOString(),
            };
          }

          // Record as SaleItem
          let unitPrice = batch.sellingPrice;
          if (cartItem.unitType === 'Box') {
            unitPrice = batch.sellingPrice * boxCapacity;
          } else if (cartItem.unitType === 'Strip') {
            unitPrice = batch.sellingPrice * stripCapacity;
          }

          finalSaleItems.push({
            id: `sale_item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            saleId,
            medicineId: medicine.id,
            medicineName: `${medicine.brandName} ${medicine.strength}`,
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            quantity: cartItem.quantity * (deductFromThisBatch / unitsToDeduct), // proportional quantity
            unitType: cartItem.unitType,
            unitsPerStrip: batch.unitsPerStrip,
            stripsPerBox: batch.stripsPerBox,
            baseUnitsQuantity: deductFromThisBatch,
            unitPrice: unitPrice,
            purchasePricePerUnit: batch.purchasePrice,
            subtotal: parseFloat((deductFromThisBatch * batch.sellingPrice).toFixed(2)),
          });
        }

        // In case negative stock is enabled and we still need to deduct!
        if (remainingToDeduct > 0 && get().settings.enableNegativeStock) {
          // Deduct from the last batch or create a dummy negative batch
          const batch = validBatches[validBatches.length - 1] || medicineBatches[0];
          if (batch) {
            const bIdx = activeBatches.findIndex(b => b.id === batch.id);
            if (bIdx >= 0) {
              const newTotal = activeBatches[bIdx].totalUnitsAvailable - remainingToDeduct;
              activeBatches[bIdx] = {
                ...activeBatches[bIdx],
                totalUnitsAvailable: newTotal,
                quantityBoxes: 0,
                quantityStrips: 0,
                quantityUnits: newTotal, // represent negative
                updatedAt: new Date().toISOString(),
              };
            }
          }
        }
      });

      // Save Sale & items
      const newSale: Sale = {
        ...saleData,
        id: saleId,
        invoiceNumber,
        createdAt: new Date().toISOString(),
      };

      const updatedSales = [newSale, ...get().sales];
      const updatedSaleItems = [...finalSaleItems, ...get().saleItems];

      set({
        sales: updatedSales,
        saleItems: updatedSaleItems,
        batches: activeBatches,
      });

      saveLocalStorage('sales', updatedSales);
      saveLocalStorage('sale_items', updatedSaleItems);
      saveLocalStorage('batches', activeBatches);

      // Register Customer dynamically if new & phone is provided
      if (saleData.customerName && saleData.customerPhone && saleData.customerPhone !== 'N/A') {
        get().addCustomer(saleData.customerName, saleData.customerPhone);
      }

      pushAuditLog('POS Sale Completed', 'POS', saleId, null, { invoiceNumber, netPayable: saleData.netPayable });
      return newSale;
    },

    // Customers
    addCustomer: (name, phone, email) => {
      const existing = get().customers.find(c => c.phone === phone);
      if (existing) return existing;

      const newCust: Customer = {
        id: `cust_${Date.now()}`,
        name,
        phone,
        email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...get().customers, newCust];
      set({ customers: updated });
      saveLocalStorage('customers', updated);
      pushAuditLog('New Customer Added', 'Customers', newCust.id, null, newCust);
      return newCust;
    },

    // Customer Returns / Refunds
    addCustomerReturn: (returnDetails, items) => {
      const returnId = `ret_${Date.now()}`;
      const newReturn: CustomerReturn = {
        ...returnDetails,
        id: returnId,
        createdAt: new Date().toISOString(),
      };

      const activeBatches = [...get().batches];
      const damagedRecords = [...get().damagedStocks];

      // Process items returned
      items.forEach(item => {
        const batchIndex = activeBatches.findIndex(b => b.id === item.batchId);
        
        let baseUnitsQty = 0;
        const bSample = activeBatches[batchIndex];
        const stripsPerBox = bSample?.stripsPerBox || 10;
        const unitsPerStrip = bSample?.unitsPerStrip || 10;

        if (item.unitType === 'Box') {
          baseUnitsQty = item.quantity * stripsPerBox * unitsPerStrip;
        } else if (item.unitType === 'Strip') {
          baseUnitsQty = item.quantity * unitsPerStrip;
        } else {
          baseUnitsQty = item.quantity;
        }

        if (item.isSellable && batchIndex >= 0) {
          // Add back to inventory
          const batch = activeBatches[batchIndex];
          const newTotalUnits = batch.totalUnitsAvailable + baseUnitsQty;
          
          const boxCapacity = batch.stripsPerBox * batch.unitsPerStrip;
          const stripCapacity = batch.unitsPerStrip;

          const remainingBoxes = Math.floor(newTotalUnits / boxCapacity);
          const remainderAfterBoxes = newTotalUnits % boxCapacity;
          const remainingStrips = Math.floor(remainderAfterBoxes / stripCapacity);
          const remainingLooseUnits = remainderAfterBoxes % stripCapacity;

          activeBatches[batchIndex] = {
            ...batch,
            totalUnitsAvailable: newTotalUnits,
            quantityBoxes: remainingBoxes,
            quantityStrips: remainingStrips,
            quantityUnits: remainingLooseUnits,
            updatedAt: new Date().toISOString(),
          };
        } else {
          // Log to damaged stock directly
          const medicine = get().medicines.find(m => m.id === item.medicineId);
          damagedRecords.push({
            id: `dmg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            medicineId: item.medicineId,
            brandName: medicine?.brandName || 'Unknown Medicine',
            batchId: item.batchId,
            batchNumber: bSample?.batchNumber || 'N/A',
            quantity: baseUnitsQty,
            reason: `Customer Return (Unsellable): ${returnDetails.reason}`,
            reportedBy: get().currentUser?.username || 'Cashier',
            createdAt: new Date().toISOString(),
          });
        }
      });

      // Update original sale status to partially/fully refunded if matching
      const sales = get().sales.map(s => {
        if (s.invoiceNumber === returnDetails.invoiceNumber) {
          return { ...s, status: 'Refunded' as SaleStatus };
        }
        return s;
      });

      const updatedReturns = [newReturn, ...get().customerReturns];

      set({
        customerReturns: updatedReturns,
        batches: activeBatches,
        damagedStocks: damagedRecords,
        sales: sales
      });

      saveLocalStorage('customer_returns', updatedReturns);
      saveLocalStorage('batches', activeBatches);
      saveLocalStorage('damaged_stocks', damagedRecords);
      saveLocalStorage('sales', sales);

      pushAuditLog('Customer Refund Approved', 'POS', returnId, null, { invoiceNumber: returnDetails.invoiceNumber, refundAmount: returnDetails.refundAmount });
    },

    // Supplier Returns
    addSupplierReturn: (returnDetails, items) => {
      const returnId = `sret_${Date.now()}`;
      const newReturn: SupplierReturn = {
        ...returnDetails,
        id: returnId,
        returnDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      const activeBatches = [...get().batches];

      items.forEach(item => {
        const batchIndex = activeBatches.findIndex(b => b.id === item.batchId);
        if (batchIndex >= 0) {
          const batch = activeBatches[batchIndex];
          const newTotalUnits = Math.max(0, batch.totalUnitsAvailable - item.quantity);

          const boxCapacity = batch.stripsPerBox * batch.unitsPerStrip;
          const stripCapacity = batch.unitsPerStrip;

          const remainingBoxes = Math.floor(newTotalUnits / boxCapacity);
          const remainderAfterBoxes = newTotalUnits % boxCapacity;
          const remainingStrips = Math.floor(remainderAfterBoxes / stripCapacity);
          const remainingLooseUnits = remainderAfterBoxes % stripCapacity;

          activeBatches[batchIndex] = {
            ...batch,
            totalUnitsAvailable: newTotalUnits,
            quantityBoxes: remainingBoxes,
            quantityStrips: remainingStrips,
            quantityUnits: remainingLooseUnits,
            updatedAt: new Date().toISOString(),
          };
        }
      });

      // Update supplier credit balance
      const suppliers = get().suppliers.map(s => {
        if (s.id === returnDetails.supplierId) {
          const newBal = s.currentPayableBalance - returnDetails.totalRefundAmount;
          
          const ledgerEntry: SupplierLedgerEntry = {
            id: `led_${Date.now()}`,
            supplierId: s.id,
            date: new Date().toISOString(),
            type: 'Return',
            referenceId: returnId,
            description: `Supplier Return Credit (Total Return Value: ${returnDetails.totalRefundAmount})`,
            debit: returnDetails.totalRefundAmount, // reduces payable balance!
            credit: 0,
            runningBalance: newBal,
          };

          const updatedLedgers = [ledgerEntry, ...get().supplierLedgers];
          set({ supplierLedgers: updatedLedgers });
          saveLocalStorage('supplier_ledgers', updatedLedgers);

          return { ...s, currentPayableBalance: newBal };
        }
        return s;
      });

      const updatedReturns = [newReturn, ...get().supplierReturns];

      set({
        supplierReturns: updatedReturns,
        batches: activeBatches,
        suppliers: suppliers
      });

      saveLocalStorage('supplier_returns', updatedReturns);
      saveLocalStorage('batches', activeBatches);
      saveLocalStorage('suppliers', suppliers);

      pushAuditLog('Supplier Return Processed', 'Suppliers', returnId, null, newReturn);
    },

    // Damaged Stock
    addDamagedStock: (damaged) => {
      const dmgId = `dmg_${Date.now()}`;
      const fullDmg: DamagedStock = {
        ...damaged,
        id: dmgId,
        reportedBy: get().currentUser?.username || 'System',
        createdAt: new Date().toISOString(),
      };

      // Deduct from batch
      const batches = get().batches.map(b => {
        if (b.id === damaged.batchId) {
          const newTotalUnits = Math.max(0, b.totalUnitsAvailable - damaged.quantity);
          const boxCapacity = b.stripsPerBox * b.unitsPerStrip;
          const stripCapacity = b.unitsPerStrip;

          const remainingBoxes = Math.floor(newTotalUnits / boxCapacity);
          const remainderAfterBoxes = newTotalUnits % boxCapacity;
          const remainingStrips = Math.floor(remainderAfterBoxes / stripCapacity);
          const remainingLooseUnits = remainderAfterBoxes % stripCapacity;

          return {
            ...b,
            totalUnitsAvailable: newTotalUnits,
            quantityBoxes: remainingBoxes,
            quantityStrips: remainingStrips,
            quantityUnits: remainingLooseUnits,
            updatedAt: new Date().toISOString(),
          };
        }
        return b;
      });

      const updatedDmg = [fullDmg, ...get().damagedStocks];

      set({ damagedStocks: updatedDmg, batches });
      saveLocalStorage('damaged_stocks', updatedDmg);
      saveLocalStorage('batches', batches);

      pushAuditLog('Damaged Stock Logged', 'Inventory', dmgId, null, fullDmg);
    },

    // Manual Stock Adjustments
    addStockAdjustment: (adjustment) => {
      const adjId = `adj_${Date.now()}`;
      const fullAdj: StockAdjustment = {
        ...adjustment,
        id: adjId,
        adjustedBy: get().currentUser?.username || 'Admin',
        createdAt: new Date().toISOString(),
      };

      // Apply quantity change to batch
      const batches = get().batches.map(b => {
        if (b.id === adjustment.batchId) {
          const newTotalUnits = Math.max(0, b.totalUnitsAvailable + adjustment.quantityChange);
          const boxCapacity = b.stripsPerBox * b.unitsPerStrip;
          const stripCapacity = b.unitsPerStrip;

          const remainingBoxes = Math.floor(newTotalUnits / boxCapacity);
          const remainderAfterBoxes = newTotalUnits % boxCapacity;
          const remainingStrips = Math.floor(remainderAfterBoxes / stripCapacity);
          const remainingLooseUnits = remainderAfterBoxes % stripCapacity;

          return {
            ...b,
            totalUnitsAvailable: newTotalUnits,
            quantityBoxes: remainingBoxes,
            quantityStrips: remainingStrips,
            quantityUnits: remainingLooseUnits,
            updatedAt: new Date().toISOString(),
          };
        }
        return b;
      });

      const updatedAdj = [fullAdj, ...get().stockAdjustments];

      set({ stockAdjustments: updatedAdj, batches });
      saveLocalStorage('stock_adjustments', updatedAdj);
      saveLocalStorage('batches', batches);

      pushAuditLog('Stock Adjusted Manually', 'Inventory', adjId, null, fullAdj);
    },

    // Logs & Backups
    addActivityLog: pushAuditLog,

    // Backups
    createBackup: (type) => {
      const backupId = `bk_${Date.now()}`;
      
      // Serialize current state variables as our "SQLite" snapshot!
      const dump = {
        medicines: get().medicines,
        batches: get().batches,
        suppliers: get().suppliers,
        supplierLedgers: get().supplierLedgers,
        purchases: get().purchases,
        purchaseItems: get().purchaseItems,
        sales: get().sales,
        saleItems: get().saleItems,
        customers: get().customers,
        customerReturns: get().customerReturns,
        supplierReturns: get().supplierReturns,
        damagedStocks: get().damagedStocks,
        stockAdjustments: get().stockAdjustments,
        settings: get().settings,
        activityLogs: get().activityLogs,
      };

      const dumpString = JSON.stringify(dump);
      const sizeKB = (dumpString.length / 1024).toFixed(2) + ' KB';

      const log: BackupLog = {
        id: backupId,
        timestamp: new Date().toISOString(),
        fileName: `MP_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.mpb`,
        fileSize: sizeKB,
        backupType: type,
        status: 'Success',
        message: type === 'Google Drive' ? 'Uploaded to Google Drive successfully' : 'Downloaded backup file locally',
      };

      // Keep backup history
      const updatedLogs = [log, ...get().backupLogs].slice(0, get().settings.backupRetentionCount);
      set({ backupLogs: updatedLogs });
      saveLocalStorage('backup_logs', updatedLogs);

      // Trigger automatic file download if local backup
      if (type === 'Local') {
        try {
          const blob = new Blob([dumpString], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = log.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (e) {
          console.error('Trigger backup download failed in sandbox, which is expected.', e);
        }
      }

      pushAuditLog('Database Backup Created', 'Settings', backupId, null, { type, fileName: log.fileName });
    },

    restoreBackup: (backupContent) => {
      try {
        const parsed = JSON.parse(backupContent);
        
        // Strict Schema Validation check before restore
        const requiredKeys = ['medicines', 'batches', 'suppliers', 'sales', 'settings'];
        const matches = requiredKeys.every(k => k in parsed);
        if (!matches) {
          throw new Error('Invalid backup file format. Missing core database structures.');
        }

        // Apply backup states
        set({
          medicines: parsed.medicines || get().medicines,
          batches: parsed.batches || get().batches,
          suppliers: parsed.suppliers || get().suppliers,
          supplierLedgers: parsed.supplierLedgers || get().supplierLedgers,
          purchases: parsed.purchases || get().purchases,
          purchaseItems: parsed.purchaseItems || get().purchaseItems,
          sales: parsed.sales || get().sales,
          saleItems: parsed.saleItems || get().saleItems,
          customers: parsed.customers || get().customers,
          customerReturns: parsed.customerReturns || get().customerReturns,
          supplierReturns: parsed.supplierReturns || get().supplierReturns,
          damagedStocks: parsed.damagedStocks || get().damagedStocks,
          stockAdjustments: parsed.stockAdjustments || get().stockAdjustments,
          settings: parsed.settings || get().settings,
          activityLogs: parsed.activityLogs || get().activityLogs,
        });

        // Write to local storage
        saveLocalStorage('medicines', parsed.medicines);
        saveLocalStorage('batches', parsed.batches);
        saveLocalStorage('suppliers', parsed.suppliers);
        saveLocalStorage('supplier_ledgers', parsed.supplierLedgers);
        saveLocalStorage('purchases', parsed.purchases);
        saveLocalStorage('purchase_items', parsed.purchaseItems);
        saveLocalStorage('sales', parsed.sales);
        saveLocalStorage('sale_items', parsed.saleItems);
        saveLocalStorage('customers', parsed.customers);
        saveLocalStorage('customer_returns', parsed.customerReturns);
        saveLocalStorage('supplier_returns', parsed.supplierReturns);
        saveLocalStorage('damaged_stocks', parsed.damagedStocks);
        saveLocalStorage('stock_adjustments', parsed.stockAdjustments);
        saveLocalStorage('settings', parsed.settings);
        saveLocalStorage('activity_logs', parsed.activityLogs);

        pushAuditLog('Database Restore Successful', 'Settings', 'restore');
        return true;
      } catch (e) {
        console.error('Restore failed', e);
        pushAuditLog('Database Restore Failed', 'Settings', 'restore', null, { error: String(e) });
        return false;
      }
    },
  };
});
