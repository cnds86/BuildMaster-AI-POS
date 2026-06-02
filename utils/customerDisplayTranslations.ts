/**
 * Customer Display — Multi-language translations
 * Supports: Lao (lo) 🇱🇦, English (en) 🇬🇧, Thai (th) 🇹🇭
 * Persists selection in localStorage so customer display remembers it
 */

export type Lang = 'lo' | 'en' | 'th';

export const LANG_KEY = 'mhxpos_customer_display_lang';

export const LANG_OPTIONS: { code: Lang; label: string; flag: string; native: string }[] = [
  { code: 'lo', label: 'ລາວ', flag: '🇱🇦', native: 'ພາສາລາວ' },
  { code: 'en', label: 'EN', flag: '🇬🇧', native: 'English' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭', native: 'ภาษาไทย' },
];

type T = Record<string, string>;

const lo: T = {
  // Header
  welcome: 'ຍິນດີຕ້ອນຮັບ',
  pleaseWait: 'ກະລຸນາລໍຖ້າ',
  items: 'ລາຍການ',
  empty: 'ຍັງບໍ່ມີລາຍການ',
  // Cart
  qty: 'ຈຳນວນ',
  price: 'ລາຄາ',
  subtotal: 'ຍອດລວມກ່ອນ VAT',
  vat: 'VAT 7%',
  total: 'ລວມທັງໝົດ',
  // Promo / pay
  promotion: 'ໂປຣໂມຊັ່ນພິເສດ',
  scanToPay: 'ສະແກນເພື່ອຊຳລະ',
  promptPay: 'PromptPay',
  amount: 'ຈຳນວນເງິນ',
  // Misc
  item: 'ລາຍການ',
  line: 'ແຖວ',
  thankYou: 'ຂອບໃຈທີ່ໃຊ້ບໍລິການ',
  // Days
  sun: 'ອາທິດ', mon: 'ຈັນ', tue: 'ອັງຄານ', wed: 'ພຸດ', thu: 'ພະຫັດ', fri: 'ສຸກ', sat: 'ເສົາ',
};

const en: T = {
  welcome: 'Welcome',
  pleaseWait: 'Please wait',
  items: 'items',
  empty: 'No items yet',
  qty: 'Qty',
  price: 'Price',
  subtotal: 'Subtotal',
  vat: 'VAT 7%',
  total: 'Total',
  promotion: 'Special Promotion',
  scanToPay: 'Scan to pay',
  promptPay: 'PromptPay',
  amount: 'Amount',
  item: 'item',
  line: 'line',
  thankYou: 'Thank you for your business',
  sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',
};

const th: T = {
  welcome: 'ยินดีต้อนรับ',
  pleaseWait: 'กรุณารอสักครู่',
  items: 'รายการ',
  empty: 'ยังไม่มีรายการ',
  qty: 'จำนวน',
  price: 'ราคา',
  subtotal: 'ยอดก่อน VAT',
  vat: 'VAT 7%',
  total: 'รวมทั้งสิ้น',
  promotion: 'โปรโมชั่นพิเศษ',
  scanToPay: 'สแกนเพื่อชำระ',
  promptPay: 'PromptPay',
  amount: 'จำนวนเงิน',
  item: 'รายการ',
  line: 'บรรทัด',
  thankYou: 'ขอบคุณที่ใช้บริการ',
  sun: 'อา', mon: 'จ', tue: 'อ', wed: 'พ', thu: 'พฤ', fri: 'ศ', sat: 'ส',
};

const DICT: Record<Lang, T> = { lo, en, th };

export function getLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === 'lo' || v === 'en' || v === 'th') return v;
  } catch {}
  return 'lo';
}

export function setLang(l: Lang) {
  try { localStorage.setItem(LANG_KEY, l); } catch {}
}

export function t(key: keyof typeof lo): string {
  const lang = getLang();
  return DICT[lang][key] ?? lo[key] ?? key;
}

/** Helper: format price with currency symbol based on language */
export function formatPriceLAK(amount: number, lang?: Lang): string {
  const l = lang ?? getLang();
  const formatted = new Intl.NumberFormat(l === 'lo' ? 'lo-LA' : l === 'th' ? 'th-TH' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(amount);
  return `₭${formatted}`;
}
