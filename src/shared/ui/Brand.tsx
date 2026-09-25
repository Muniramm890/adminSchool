// path: src/shared/ui/Brand.tsx




// ═══════════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════

export const BrandLogo = ({ size = 72 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "inline-block" }}
  >
    <defs>
      <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E2E52" />
        <stop offset="100%" stopColor="#0F1A33" />
      </linearGradient>
      <linearGradient id="ribbonGrad" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor="#FFB25B" />
        <stop offset="100%" stopColor="#E8600A" />
      </linearGradient>
      <filter id="softLift" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0F1A33" floodOpacity="0.28" />
      </filter>
    </defs>

    <rect x="4" y="4" width="192" height="192" rx="46" fill="url(#badgeGrad)" />
    <rect x="4.5" y="4.5" width="191" height="191" rx="45.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

    {/* recentered group: shape's own bbox center moved onto (100,100) */}
    <g transform="translate(-7, 8)">
      <path
        d="M62,66 C100,44 152,52 146,82 C141,108 96,96 88,116 C81,134 116,140 150,132"
        fill="none"
        stroke="url(#ribbonGrad)"
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#softLift)"
      />
      <circle cx="150" cy="132" r="13" fill="#FFD98A" />
      <circle cx="150" cy="132" r="13" fill="none" stroke="#0F1A33" strokeWidth="2" opacity="0.15" />
    </g>
  </svg>
);

/**
 * Icon mark: a single flowing ribbon forming an "S" — reads as motion/growth
 * (student progress, ERP workflow) rather than a generic ring/orbit.
 * A single accent dot at the stroke's terminal acts as the one "smart" cue —
 * one bold move, everything else kept quiet and disciplined.
 */
export const Mark = ({ size = 96 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block" }}
  >
    <defs>
      <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E2E52" />
        <stop offset="100%" stopColor="#0F1A33" />
      </linearGradient>
      <linearGradient id="ribbonGrad" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor="#FFB25B" />
        <stop offset="100%" stopColor="#E8600A" />
      </linearGradient>
      <filter id="softLift" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0F1A33" floodOpacity="0.28" />
      </filter>
    </defs>

    {/* Badge */}
    <rect x="4" y="4" width="192" height="192" rx="46" fill="url(#badgeGrad)" />
    <rect x="4.5" y="4.5" width="191" height="191" rx="45.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

    {/* Flowing S ribbon */}
    <path
      d="M62,66 C100,44 152,52 146,82 C141,108 96,96 88,116 C81,134 116,140 150,132"
      fill="none"
      stroke="url(#ribbonGrad)"
      strokeWidth="20"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#softLift)"
    />

    {/* Smart node — single accent, the terminal of the ribbon */}
    <circle cx="150" cy="132" r="13" fill="#FFD98A" />
    <circle cx="150" cy="132" r="13" fill="none" stroke="#0F1A33" strokeWidth="2" opacity="0.15" />
  </svg>
);

export const Wordmark = ({ tagline = true, dark = false }) => (
  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
    <div
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 600,
        fontSize: 30,
        letterSpacing: "-0.01em",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ color: dark ? "#F4F6FB" : "#14213D" }}>School</span>
      <span style={{ color: "#E8600A" }}>Office</span>
    </div>
    {tagline && (
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          fontSize: 12.5,
          letterSpacing: "0.02em",
          color: dark ? "#9BA6C4" : "#6B7595",
          marginTop: 6,
        }}
      >
        smart ERP for Smart Schools
      </div>
    )}
  </div>
);

export const Lockup = ({ dark = false }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 18,
      padding: "28px 34px",
      borderRadius: 20,
      background: dark ? "#0B1224" : "#FFFFFF",
      border: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #ECEEF3",
    }}
  >
    <Mark size={64} />
    <Wordmark dark={dark} />
  </div>
);

export const SplashScreen = () => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 100000,
    background: "radial-gradient(circle at 50% 40%, #131A2E 0%, #0B0D14 70%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexDirection: "column", gap: 26, overflow: "hidden",
  }}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600&family=Inter:wght@500&display=swap');
      @keyframes splashBreathe {
        0%   { transform: scale(0.85) rotate(-3deg); }
        50%  { transform: scale(1.06) rotate(2deg); }
        100% { transform: scale(0.85) rotate(-3deg); }
      }
      @keyframes splashGlow {
        0%   { opacity: 0.25; }
        50%  { opacity: 0.65; }
        100% { opacity: 0.25; }
      }
      @keyframes splashRing {
        0%   { transform: scale(0.75); opacity: 0.5; }
        100% { transform: scale(1.9); opacity: 0; }
      }
      @keyframes splashWordUp {
        0%   { opacity: 0; transform: translateY(16px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes splashTagIn {
        0%   { opacity: 0; letter-spacing: 0.5em; }
        100% { opacity: 1; letter-spacing: 0.15em; }
      }
      @keyframes splashDotBounce {
        0%, 80%, 100% { opacity: 0.2; transform: translateY(0); }
        40% { opacity: 1; transform: translateY(-5px); }
      }
      .splash-logo-wrap { position: relative; width: 140px; height: 140px; display:flex; align-items:center; justify-content:center; }
      .splash-ring { position: absolute; width: 140px; height: 140px; border-radius: 38px; border: 1.5px solid #E8600A; animation: splashRing 2.6s cubic-bezier(0.2,0.7,0.3,1) infinite; }
      .splash-ring-2 { animation-delay: 0.9s; }
      .splash-glow { position: absolute; width: 180px; height: 180px; border-radius: 50%; background: radial-gradient(circle, rgba(232,96,10,0.35) 0%, transparent 70%); animation: splashGlow 2.6s ease-in-out infinite; }
      .splash-mark { position: relative; z-index: 2; animation: splashBreathe 2.6s cubic-bezier(0.45,0,0.55,1) infinite; }
      .splash-word { animation: splashWordUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.35s both; }
      .splash-tag { animation: splashTagIn 1.2s ease 0.75s both; }
      .splash-dot { width: 6px; height: 6px; border-radius: 50%; background: #E8600A; display: inline-block; animation: splashDotBounce 1.3s ease-in-out infinite; }
    `}</style>

    <div className="splash-logo-wrap">
      <div className="splash-glow" />
      <div className="splash-ring" />
      <div className="splash-ring splash-ring-2" />
      <div className="splash-mark"><Mark size={92} /></div>
    </div>

    <div style={{ textAlign: "center" }}>
      <div
        className="splash-word"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 600,
          fontSize: 32,
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}
      >
        <span style={{ color: "#F4F6FB" }}>School</span>
        <span style={{ color: "#E8600A" }}>Office</span>
      </div>
      <div
        className="splash-tag"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          fontSize: 12,
          color: "#8891A8",
          marginTop: 10,
          textTransform: "uppercase",
        }}
      >
        Smart ERP for Smart Schools
      </div>
    </div>

    <div style={{ display: "flex", gap: 7, marginTop: 4 }}>
      <span className="splash-dot" style={{ animationDelay: "0s" }} />
      <span className="splash-dot" style={{ animationDelay: "0.15s" }} />
      <span className="splash-dot" style={{ animationDelay: "0.3s" }} />
    </div>
  </div>
);
