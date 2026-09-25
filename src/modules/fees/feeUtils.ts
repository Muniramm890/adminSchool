// path: src/modules/fees/feeUtils.ts




// ═══════════════════════════════════════════════════════════════
// MODULE: FEE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export const rupees = (paise) => `₹${((paise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
export const toPaise = (rupeeStr) => Math.round((parseFloat(rupeeStr) || 0) * 100);

export const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank Transfer", "Cheque"];
export const RAZORPAY_METHODS = ["UPI", "Card"];

export const loadRazorpayScript = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

// ── PDF VIEWER MODAL ──
// ── IN-APP PDF VIEWER MODAL (dynamic page-size aware, no external tab) ──
export const PAGE_SIZE_RATIOS = {
  A4: { w: 595, h: 842 },
  A5: { w: 420, h: 595 },
  Legal: { w: 612, h: 1008 },
  Letter: { w: 612, h: 792 },
};
