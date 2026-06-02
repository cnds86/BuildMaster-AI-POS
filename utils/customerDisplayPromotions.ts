/**
 * Customer Display — Promotional content carousel
 * Slides rotate automatically based on `intervalSec` setting.
 * Each slide supports: title, subtitle, badge, icon (emoji or hex SVG), gradient bg.
 *
 * 3 languages: Lao / English / Thai
 */

import { Lang } from './customerDisplayTranslations';

export interface PromoSlide {
  id: string;
  // Pre-translated text per language
  title: Record<Lang, string>;
  subtitle: Record<Lang, string>;
  badge?: Record<Lang, string>;
  /** Tailwind gradient class e.g. "from-rose-600 to-amber-500" */
  gradient: string;
  /** Emoji or short text icon */
  icon: string;
}

export const DEFAULT_PROMOS: PromoSlide[] = [
  {
    id: 'welcome',
    title:   { lo: 'ຍິນດີຕ້ອນຮັບສູ່ MAHAXAY', en: 'Welcome to MAHAXAY', th: 'ยินดีต้อนรับสู่ MAHAXAY' },
    subtitle:{ lo: 'ວັດສະດຸກໍ່ສ້າງຄຸນນະພາບ ລາຄາໂດຍກົງຈາກໂຮງງານ', en: 'Quality construction materials at factory-direct prices', th: 'วัสดุก่อสร้างคุณภาพ ราคาตรงจากโรงงาน' },
    badge:   { lo: 'ຍິນດີຕ້ອນຮັບ', en: 'Welcome', th: 'ต้อนรับ' },
    gradient: 'from-blue-700 via-indigo-700 to-purple-700',
    icon: '🏗️',
  },
  {
    id: 'free-delivery',
    title:   { lo: 'ຈັດສົ່ງຟຣີ!', en: 'Free Delivery!', th: 'จัดส่งฟรี!' },
    subtitle:{ lo: 'ສັ່ງຊື້ຂັ້ນຕ່ຳ ₭500,000 ຮັບຟຣີຄ່າຂົນສົ່ງທົ່ວພາກ', en: 'Orders over ₭500,000 get free shipping nationwide', th: 'สั่งซื้อขั้นต่ำ ₭500,000 รับฟรีค่าขนส่งทั่วประเทศ' },
    badge:   { lo: 'ໂປຣໂມຊັ່ນ', en: 'Promotion', th: 'โปรโมชั่น' },
    gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    icon: '🚚',
  },
  {
    id: 'cement-sale',
    title:   { lo: 'ປູນຊີມອງ ລາຄາພິເສດ', en: 'Cement Sale', th: 'ปูนซีเมนต์ ราคาพิเศษ' },
    subtitle:{ lo: 'Tiger Cement 50kg ສະເພາະ ₭65,000 (ປົກກະຕິ ₭75,000)', en: 'Tiger Cement 50kg only ₭65,000 (regular ₭75,000)', th: 'Tiger Cement 50kg เพียง ₭65,000 (ปกติ ₭75,000)' },
    badge:   { lo: 'ປະຢັດ 13%', en: 'Save 13%', th: 'ประหยัด 13%' },
    gradient: 'from-orange-600 via-red-600 to-pink-600',
    icon: '🧱',
  },
  {
    id: 'promptpay',
    title:   { lo: 'ຊຳລະດ້ວຍ PromptPay', en: 'Pay with PromptPay', th: 'ชำระด้วย PromptPay' },
    subtitle:{ lo: 'ສະແກນ QR ປອດໄພ ສະດວກ ວ່ອງໄວ', en: 'Scan QR — secure, easy, instant', th: 'สแกน QR ปลอดภัย สะดวก รวดเร็ว' },
    badge:   { lo: 'ໂອນຟຣີ', en: 'Free transfer', th: 'โอนฟรี' },
    gradient: 'from-sky-600 via-blue-600 to-indigo-700',
    icon: '📱',
  },
  {
    id: 'thank-you',
    title:   { lo: 'ຂອບໃຈພໍ່ແມ່ພີ່ນ້ອງ!', en: 'Thank you!', th: 'ขอบคุณลูกค้าทุกท่าน!' },
    subtitle:{ lo: 'MAHAXAY — ຄູ່ຄິດກໍ່ສ້າງ ທຸກໂຄງການ', en: 'MAHAXAY — your construction partner for every project', th: 'MAHAXAY — คู่คิดก่อสร้าง ทุกโครงการ' },
    badge:   { lo: 'MAHAXAY', en: 'MAHAXAY', th: 'MAHAXAY' },
    gradient: 'from-amber-600 via-orange-600 to-red-600',
    icon: '⭐',
  },
];

export interface PromoConfig {
  enabled: boolean;
  intervalSec: number;
  slides: PromoSlide[];
}

export const DEFAULT_PROMO_CONFIG: PromoConfig = {
  enabled: true,
  intervalSec: 8,
  slides: DEFAULT_PROMOS,
};
