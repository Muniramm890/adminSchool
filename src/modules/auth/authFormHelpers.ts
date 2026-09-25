// path: src/modules/auth/authFormHelpers.ts






// ═══════════════════════════════════════════════════════════════
// MULTI-STEP SIGNUP COMPONENT
// ═══════════════════════════════════════════════════════════════






export const premiumInputStyle = {
  width: "100%",
  background: "#1A1D27",
  border: "1.5px solid #2D3250",
  borderRadius: "12px",
  padding: "14px 18px",
  color: "#E8EAF6",
  fontSize: "14px",
  fontWeight: 500,
  outline: "none",
  boxSizing: "border-box",
  transition: "all 0.3s ease",
  fontFamily: "'DM Sans', sans-serif",
};


export const handleFocus = (e) => {
  e.target.style.borderColor = "#E8600A";
  e.target.style.boxShadow = "0 0 0 4px rgba(232, 96, 10, 0.15)";
};
export const handleBlur = (e) => {
  e.target.style.borderColor = "#2D3250";
  e.target.style.boxShadow = "none";
};
