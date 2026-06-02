import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { MahaxayLogo } from './customer-display/MahaxayLogo';
import {
  Lang, LANG_OPTIONS, t as tx, formatPriceLAK, getLang, setLang as persistLang,
} from '../utils/customerDisplayTranslations';
import {
  playAddItem, unlockAudio, isMuted, setMuted as persistMuted, playTap, playPromoChange,
} from '../utils/customerDisplaySounds';
import {
  buildPromptPayPayload, qrToSVG,
} from '../utils/promptPayQR';
import {
  DEFAULT_PROMOS, PromoSlide, PromoConfig,
} from '../utils/customerDisplayPromotions';

/**
 * MHX-POS — Customer Display (Customer-Facing Screen)
 *
 * Opens as a secondary window via `window.open('/customer-display', ...)`.
 * Reads cart from Zustand persist localStorage (key: 'bm_cart_store') so any
 * change on the cashier POS terminal is reflected here in real-time via
 * the `storage` event + interval polling.
 *
 * Features (2026-06-02 update):
 *   ✅ Multi-language (Lao 🇱🇦 / English 🇬🇧 / Thai 🇹🇭)
 *   ✅ Promotional carousel (auto-rotating slides)
 *   ✅ PromptPay QR code for cashless payment
 *   ✅ MAHAXAY branded logo
 *   ✅ Sound effects (add/remove item, promo change)
 *
 * Designed to be:
 * - Fullscreen / no scrollbars
 * - High-contrast (dark bg, large light text) — readable from 1-2m away
 * - Auto-updates via storage events (cross-tab sync) + interval polling fallback
 */

const CART_STORAGE_KEY = 'bm_cart_store';
const PROMO_CONFIG_KEY = 'mhxpos_customer_display_promo_config';
const PROMPTPAY_PHONE_KEY = 'mhxpos_promptpay_phone';
const DEFAULT_PROMPTPAY_PHONE = '081-234-5678';

export const CustomerDisplayPage: React.FC = () => {
  const { formatPrice } = useGlobal();
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [lang, setLangState] = useState<Lang>(getLang());
  const [muted, setMutedState] = useState<boolean>(isMuted());
  const [promoIdx, setPromoIdx] = useState(0);
  const [showQR, setShowQR] = useState(true);
  const [promptpayPhone, setPromptpayPhone] = useState<string>(DEFAULT_PROMPTPAY_PHONE);
  const [promoConfig, setPromoConfig] = useState<PromoConfig>({
    enabled: true,
    intervalSec: 8,
    slides: DEFAULT_PROMOS,
  });
  const prevCartCount = useRef<number>(0);
  const prevPromoIdx = useRef<number>(0);

  // ---------- Read settings from localStorage ----------
  useEffect(() => {
    try {
      const phone = localStorage.getItem(PROMPTPAY_PHONE_KEY);
      if (phone) setPromptpayPhone(phone);
    } catch {}
    try {
      const raw = localStorage.getItem(PROMO_CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.slides)) {
          setPromoConfig((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {}
  }, []);

  // ---------- Polling cart + customer from localStorage ----------
  useEffect(() => {
    const readCart = () => {
      try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) {
          setCart([]);
          return;
        }
        const parsed = JSON.parse(raw);
        const items = parsed?.state?.cart || [];
        // Detect add-item event for sound effect
        const newCount = items.reduce((s: number, it: any) => s + (it.quantity || 0), 0);
        const oldCount = prevCartCount.current;
        if (newCount > oldCount) {
          playAddItem();
        } else if (newCount < oldCount && oldCount > 0) {
          // playRemoveItem(); // optional, can be annoying
        }
        prevCartCount.current = newCount;
        setCart(items);
        setSelectedCustomer(parsed?.state?.selectedCustomer || null);
      } catch (e) {
        console.error('[CustomerDisplay] readCart error', e);
        setCart([]);
      }
    };
    readCart();
    const interval = setInterval(readCart, 500);
    return () => clearInterval(interval);
  }, []);

  // ---------- Cross-tab sync via storage event ----------
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : null;
          setCart(parsed?.state?.cart || []);
          setSelectedCustomer(parsed?.state?.selectedCustomer || null);
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ---------- Clock ----------
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ---------- Promo carousel ----------
  useEffect(() => {
    if (!promoConfig.enabled || promoConfig.slides.length === 0) return;
    const id = setInterval(() => {
      setPromoIdx((i) => {
        const next = (i + 1) % promoConfig.slides.length;
        if (next !== prevPromoIdx.current) {
          playPromoChange();
          prevPromoIdx.current = next;
        }
        return next;
      });
    }, Math.max(2000, promoConfig.intervalSec * 1000));
    return () => clearInterval(id);
  }, [promoConfig.enabled, promoConfig.intervalSec, promoConfig.slides.length]);

  // ---------- Audio unlock on first user interaction ----------
  useEffect(() => {
    const onFirstClick = () => { unlockAudio(); window.removeEventListener('click', onFirstClick); };
    window.addEventListener('click', onFirstClick);
    return () => window.removeEventListener('click', onFirstClick);
  }, []);

  // ---------- Hide scrollbars ----------
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // ---------- Totals ----------
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0),
    [cart]
  );
  const tax = useMemo(() => subtotal * 0.07, [subtotal]);
  const total = subtotal + tax;
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const lineCount = cart.length;

  // ---------- Build PromptPay payload + QR ----------
  const promptpayPayload = useMemo(() => {
    if (!showQR || total <= 0) return null;
    // PromptPay uses THB. Convert LAK to THB at 1 THB = 650 LAK (mock rate, real-time rates come from backend in future)
    const thbAmount = total / 650;
    return buildPromptPayPayload({ phoneOrId: promptpayPhone, amount: thbAmount });
  }, [total, promptpayPhone, showQR]);
  const qrSvgUri = useMemo(() => {
    if (!promptpayPayload) return null;
    return qrToSVG(promptpayPayload, { size: 220, dark: '#0f172a', light: '#ffffff' });
  }, [promptpayPayload]);

  // ---------- Lang handlers ----------
  const switchLang = (l: Lang) => {
    playTap();
    persistLang(l);
    setLangState(l);
  };
  const toggleMute = () => {
    const next = !muted;
    persistMuted(next);
    setMutedState(next);
    if (!next) playTap();
  };

  // ---------- Locale-aware price (uses selected language) ----------
  const fmt = (n: number) => formatPriceLAK(n, lang);

  // ---------- Date formatting by language ----------
  const dayKey = (() => {
    const jsDay = now.getDay();
    const keys: (keyof typeof loKey)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return keys[jsDay];
  })();
  // Helper: map short keys to a translated day name
  const loKey = { sun: '', mon: '', tue: '', wed: '', thu: '', fri: '', sat: '' } as const;
  const dayName = tx(dayKey);
  const dateLocale = lang === 'lo' ? 'lo-LA' : lang === 'th' ? 'th-TH' : 'en-US';
  const dateStr = now.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // ---------- Render ----------
  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden"
      style={{ userSelect: 'none' }}
    >
      {/* ==================== TOP BANNER ==================== */}
      <div className="flex items-center justify-between px-12 py-6 border-b border-white/10">
        <div className="flex items-center gap-6">
          <MahaxayLogo size={72} variant="mark" />
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-wider">MAHAXAY</h1>
            <p className="text-lg text-slate-300 mt-1">
              {selectedCustomer
                ? `${tx('welcome')} ${selectedCustomer.name || 'ລູກຄ້າ'}`
                : `${tx('welcome')} — ${lang === 'lo' ? 'Welcome' : lang === 'th' ? 'ยินดีต้อนรับ' : 'Welcome'}`}
            </p>
          </div>
        </div>

        {/* Center — promo carousel slide indicator (text only) */}
        {promoConfig.enabled && promoConfig.slides.length > 0 && (
          <div className="flex-1 max-w-2xl mx-8 hidden lg:block">
            <div className="text-center text-sm text-slate-400">
              <span className="text-amber-400 font-bold">{promoConfig.slides[promoIdx].badge?.[lang]}</span>
              <span className="mx-2">·</span>
              <span>{promoConfig.slides[promoIdx].title[lang]}</span>
            </div>
          </div>
        )}

        <div className="text-right flex items-center gap-6">
          {/* Language switcher */}
          <div className="flex gap-1 bg-white/5 rounded-full p-1 border border-white/10" data-testid="lang-switcher">
            {LANG_OPTIONS.map((o) => (
              <button
                key={o.code}
                onClick={() => switchLang(o.code)}
                className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                  lang === o.code
                    ? 'bg-amber-400 text-slate-900 shadow-lg scale-105'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
                aria-label={`Switch to ${o.native}`}
                data-testid={`lang-${o.code}`}
              >
                {o.flag} {o.label}
              </button>
            ))}
          </div>

          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl hover:bg-white/10"
            aria-label={muted ? 'Unmute' : 'Mute'}
            data-testid="mute-toggle"
          >
            {muted ? '🔇' : '🔊'}
          </button>

          <div>
            <p className="text-3xl font-mono font-bold text-white">{timeStr}</p>
            <p className="text-sm text-slate-400 mt-1">{dateStr}</p>
          </div>
        </div>
      </div>

      {/* ==================== PROMO BANNER (full-width) ==================== */}
      {promoConfig.enabled && promoConfig.slides.length > 0 && (
        <div className="px-12 py-2 lg:hidden">
          <div
            key={promoIdx}
            className={`bg-gradient-to-r ${promoConfig.slides[promoIdx].gradient} rounded-xl px-6 py-3 flex items-center gap-4 animate-fade-in shadow-lg`}
          >
            <span className="text-3xl">{promoConfig.slides[promoIdx].icon}</span>
            <div className="flex-1">
              <p className="text-base font-bold text-white">{promoConfig.slides[promoIdx].title[lang]}</p>
              <p className="text-xs text-white/80">{promoConfig.slides[promoIdx].subtitle[lang]}</p>
            </div>
            {promoConfig.slides[promoIdx].badge && (
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold text-white">
                {promoConfig.slides[promoIdx].badge?.[lang]}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ==================== MAIN ==================== */}
      <div className="flex h-[calc(100vh-180px)]">
        {/* ----- LEFT: Cart line items + totals ----- */}
        <div className="flex-1 flex flex-col">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-12">
              <MahaxayLogo size={120} variant="full" className="opacity-30 mb-8" />
              <div className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 animate-pulse">
                <svg className="w-16 h-16 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-5xl font-extrabold text-white mb-4">
                {tx('pleaseWait')} — {lang === 'th' ? 'กรุณารอสักครู่' : lang === 'en' ? 'Please wait' : 'ກະລຸນາລໍຖ້າ'}
              </h2>
              <p className="text-2xl text-slate-300 max-w-2xl">
                {lang === 'lo' ? 'ພະນັກງານກຳລັງຊ່ວຍທ່ານຢູ່' : lang === 'th' ? 'พนักงานกำลังช่วยท่านอยู่' : 'Our staff is preparing your order'}
              </p>
            </div>
          ) : (
            <>
              {/* Line items */}
              <div className="flex-1 overflow-y-auto px-12 py-6">
                <div className="space-y-3">
                  {cart.map((item, idx) => (
                    <div
                      key={`${item.id}-${item.selectedVariantId || 'default'}-${idx}`}
                      className="flex items-center justify-between bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4 animate-fade-in"
                    >
                      <div className="flex items-center gap-6 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-300 font-bold text-lg shrink-0">
                          {item.quantity}x
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-2xl font-bold text-white truncate">{item.name}</p>
                          {item.selectedVariantId && item.unit && (
                            <p className="text-sm text-slate-400 mt-0.5">{item.unit}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-6">
                        <p className="text-3xl font-extrabold text-emerald-400">
                          {fmt(item.sellPrice * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-slate-500 mt-1">
                            {fmt(item.sellPrice)} × {item.quantity}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-white/10 bg-black/30 backdrop-blur-md px-12 py-8">
                <div className="max-w-4xl ml-auto space-y-3">
                  <div className="flex justify-between text-xl text-slate-300">
                    <span>{tx('subtotal')}</span>
                    <span className="font-mono">{fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xl text-slate-300">
                    <span>{tx('vat')}</span>
                    <span className="font-mono">{fmt(tax)}</span>
                  </div>
                  <div className="h-px bg-white/20 my-2" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl text-white font-bold">{tx('total')}</span>
                    <span
                      className="text-6xl font-extrabold text-emerald-400 font-mono"
                      data-testid="customer-display-total"
                    >
                      {fmt(total)}
                    </span>
                  </div>
                  <p className="text-right text-sm text-slate-400 mt-2">
                    {itemCount} {itemCount === 1 ? tx('item') : tx('items')} • {lineCount} {tx('line')}(s)
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ----- RIGHT: PromptPay QR (sidebar, original layout) ----- */}
        {showQR && qrSvgUri && total > 0 && (
          <div
            className="w-[320px] shrink-0 border-l border-white/10 bg-gradient-to-b from-sky-900/40 to-blue-900/40 backdrop-blur-sm p-6 flex flex-col items-center justify-center"
            data-testid="promptpay-panel"
          >
            <div className="bg-white rounded-3xl p-5 shadow-2xl mb-3">
              <img src={qrSvgUri} alt="PromptPay QR" className="w-[200px] h-[200px]" />
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">PP</div>
                <h3 className="text-lg font-bold text-white">{tx('promptPay')}</h3>
              </div>
              <p className="text-xs text-slate-300">{tx('scanToPay')}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{promptpayPhone}</p>
            </div>
            <button
              onClick={() => setShowQR(false)}
              className="mt-4 text-xs text-slate-500 hover:text-slate-300 underline"
            >
              {lang === 'lo' ? 'ປິດ' : lang === 'th' ? 'ปิด' : 'Hide'} QR
            </button>
          </div>
        )}

        {/* QR toggle when hidden — floats at bottom-right */}
        {!showQR && total > 0 && (
          <button
            onClick={() => setShowQR(true)}
            className="fixed right-8 bottom-20 bg-blue-600 hover:bg-blue-500 text-white rounded-full px-4 py-2 text-sm font-bold shadow-2xl"
            data-testid="show-qr-btn"
          >
            📱 {tx('promptPay')}
          </button>
        )}
      </div>

      {/* ==================== FOOTER ==================== */}
      <div className="absolute bottom-0 left-0 right-0 px-12 py-3 bg-black/40 border-t border-white/5 text-center flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Customer Display • MAHAXAY POS v1.1
        </p>
        <p className="text-xs text-slate-500">
          {tx('thankYou')} • {now.toISOString().split('T')[1].slice(0, 8)} UTC
        </p>
      </div>
    </div>
  );
};

export default CustomerDisplayPage;
