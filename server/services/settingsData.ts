/**
 * Server-side initial SystemSettings (mirrors services/data.ts INITIAL_SETTINGS).
 * Used when the database has no settings row yet (first boot).
 */

import type { SystemSettings } from '../../src/types.js'

export const INITIAL_SETTINGS: SystemSettings = {
  companyName: 'MAHAXAY Construction Supply',
  taxId: '1234567890123',
  address: '123 Lane Xang Avenue, Vientiane, Laos',
  phone: '021-123-4567',
  language: 'lo',
  currencySymbol: '₭',
  defaultItemsPerPage: 10,
  monthlyTarget: 500000000,

  tax: {
    enabled: true,
    rate: 7.0,
    calculationMode: 'excluded',
    displayOnReceipt: true,
  },

  rounding: {
    enabled: true,
    interval: 500,
    displayOnReceipt: true,
  },

  cashDenominations: [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500],

  customerDisplay: {
    enabled: true,
    welcomeMessage: 'ສະບາຍດີ! ຍິນດີຕ້ອນຮັບສູ່ MAHAXAY',
    promotionInterval: 5,
  },

  loyaltyProgram: {
    enabled: true,
    earnRate: 10000,
    redeemRate: 100,
  },

  receiptHeader: 'Thank you for shopping with us!',
  receiptFooter: 'No returns after 7 days.',
  receiptPaperSize: '80mm',
  receiptAutoPrint: false,
  receiptShowTaxId: true,
  receiptShowCashier: true,
  receiptCopies: 1,
  receiptLogoUrl: '',
  receiptQrCodeUrl: '',

  showBankInfoOnReceipt: true,
  bankAccounts: [
    {
      id: 'bank-1',
      bankName: 'BCEL',
      accountName: 'MAHAXAY Construction Supply',
      accountNumber: '123456789',
    },
  ],

  currentBranchId: '',
  currentPosId: '',
  deviceRole: 'Master',
  localDatabase: {
    enabled: false,
    type: 'postgresql',
    host: 'localhost',
    port: '5432',
    databaseName: 'mahaxay_pos',
    username: '',
    password: '',
  },
  masterApiUrl: '',
  autoSyncInterval: 15,
  lastSyncTime: '',
}