// path: src/modules/auth/MultiStepSignup.tsx

import { useState, useRef, useEffect } from 'react';
import { premiumInputStyle, handleFocus, handleBlur } from './authFormHelpers';
import { apiRequest } from '../../shared/api';
import { BrandLogo } from '../../shared/ui/Brand';



export const MultiStepSignup = ({ onSwitchToLogin }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    schoolName: "",
    affiliationNo: "",
    addressLine1: "",
    city: "",
    state: "",
    adminName: "",
    phone: "",
    email: "",
    password: "",
  });

  // 🔴 Modern 6-Box Split OTP State & Refs
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  // Auto-verify triggered exactly when 6 digits are reached
  useEffect(() => {
    const otpValue = otp.join("");
    if (otpValue.length === 6 && step === 3 && !loading) {
      handleVerifyAndRegister(otpValue);
    }
  }, [otp]);

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Shift focus to next box seamlessly
    if (value !== "" && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Backspace handling to shift focus backwards
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleSendOTP = async () => {
    setError("");
    setLoading(true);
    try {
      // 🟢 API Call: Uncomment this in production
      await apiRequest("/auth/signup/send-otp", "POST", { phone: form.phone });

      // Fake delay for UI testing
      await new Promise((r) => setTimeout(r, 1000));

      setStep(3);
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (otpValue) => {
    setError("");
    setLoading(true);
    try {
      // 🟢 API Calls: Uncomment these in production
      await apiRequest("/auth/signup/verify-otp", "POST", {
        phone: form.phone,
        otp: otpValue,
      });
      await apiRequest("/auth/signup/register", "POST", form);

      // 🔴 Success UI पर मूव करें
      setStep(4);
    } catch (err) {
      setError(err.message || "Verification failed. Invalid OTP.");
      setOtp(["", "", "", "", "", ""]); // Reset boxes on error
      otpRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 500,
        background: "#0F1117",
        borderRadius: 24,
        padding: "40px 32px",
        border: "1px solid #2D3250",
        boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
        margin: "auto",
        position: "relative",
        boxSizing: "border-box", // Ensures padding doesn't break mobile view
      }}
    >
      {/* BRANDING LOGO & TAGLINE (Hide on Step 4 for cleaner look) */}
      {step < 4 && (
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ marginBottom: 12 }}>
             <BrandLogo size={85} />
          </div>
          <h1
            className="syne"
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: "#E8EAF6",
              margin: 0,
              letterSpacing: "1px",
            }}
          >
            SCHOOL OFFICE
          </h1>
          <p
            style={{
              color: "#E8600A",
              fontSize: 11,
              fontWeight: 700,
              marginTop: 4,
              letterSpacing: "2px",
            }}
          >
            SEAMLESS WORKING...
          </p>
        </div>
      )}

      {/* PROGRESS TRACKER (Hide on Step 4) */}
      {step < 4 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 4,
                background: step >= i ? "#E8600A" : "#2D3250",
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>
      )}

      {error && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: 10,
            padding: "12px",
            color: "#EF4444",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* --- STEP 1 --- */}
      {step === 1 && (
        <div className="slide-in">
          <h3
            className="syne"
            style={{ fontSize: 17, color: "#fff", marginBottom: 20 }}
          >
            School Credentials
          </h3>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "#8B92B8",
                marginBottom: 6,
              }}
            >
              SCHOOL NAME *
            </label>
            <input
              style={premiumInputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
              value={form.schoolName}
              onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "#8B92B8",
                marginBottom: 6,
              }}
            >
              AFFILIATION CODE / REG NO. *
            </label>
            <input
              style={premiumInputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Strictly required to onboard"
              value={form.affiliationNo}
              onChange={(e) =>
                setForm({ ...form, affiliationNo: e.target.value })
              }
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "#8B92B8",
                marginBottom: 6,
              }}
            >
              STREET ADDRESS *
            </label>
            <input
              style={premiumInputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
              value={form.addressLine1}
              onChange={(e) =>
                setForm({ ...form, addressLine1: e.target.value })
              }
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: "120px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#8B92B8",
                  marginBottom: 6,
                }}
              >
                CITY *
              </label>
              <input
                style={premiumInputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div style={{ flex: 1, minWidth: "120px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#8B92B8",
                  marginBottom: 6,
                }}
              >
                STATE *
              </label>
              <input
                style={premiumInputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
          </div>
          <button
            style={{
              width: "100%",
              background: "#E8600A",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "14px",
              fontSize: 15,
              fontWeight: 700,
              cursor:
                !form.schoolName ||
                !form.affiliationNo ||
                !form.addressLine1 ||
                !form.city ||
                !form.state
                  ? "not-allowed"
                  : "pointer",
              opacity:
                !form.schoolName ||
                !form.affiliationNo ||
                !form.addressLine1 ||
                !form.city ||
                !form.state
                  ? 0.5
                  : 1,
            }}
            onClick={() => setStep(2)}
            disabled={
              !form.schoolName ||
              !form.affiliationNo ||
              !form.addressLine1 ||
              !form.city ||
              !form.state
            }
          >
            Continue to Admin Setup →
          </button>
        </div>
      )}

      {/* --- STEP 2 --- */}
      {step === 2 && (
        <div className="slide-in">
          <h3
            className="syne"
            style={{ fontSize: 17, color: "#fff", marginBottom: 20 }}
          >
            Administrator Profile
          </h3>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "#8B92B8",
                marginBottom: 6,
              }}
            >
              ADMIN FULL NAME *
            </label>
            <input
              style={premiumInputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
              value={form.adminName}
              onChange={(e) => setForm({ ...form, adminName: e.target.value })}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "#8B92B8",
                marginBottom: 6,
              }}
            >
              EMAIL ADDRESS *
            </label>
            <input
              style={premiumInputStyle}
              type="email"
              onFocus={handleFocus}
              onBlur={handleBlur}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "#8B92B8",
                marginBottom: 6,
              }}
            >
              SECURE PASSWORD *
            </label>
            <input
              style={premiumInputStyle}
              type="password"
              placeholder="••••••••"
              onFocus={handleFocus}
              onBlur={handleBlur}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "#8B92B8",
                marginBottom: 6,
              }}
            >
              WHATSAPP NUMBER *
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  background: "#1A1D27",
                  border: "1.5px solid #2D3250",
                  borderRadius: 12,
                  padding: "0 16px",
                  color: "#8B92B8",
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 600,
                }}
              >
                +91
              </div>
              <input
                style={{ ...premiumInputStyle, flex: 1 }}
                type="tel"
                maxLength={10}
                onFocus={handleFocus}
                onBlur={handleBlur}
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })
                }
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 8,
                fontSize: 11,
                color: "#22C55E",
                fontWeight: 600,
              }}
            >
              <span>💬</span> 6-Digit identity OTP will drop on WhatsApp
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={{
                background: "transparent",
                color: "#8B92B8",
                border: "1.5px solid #2D3250",
                borderRadius: 12,
                padding: "14px 20px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
              }}
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Back
            </button>
            <button
              style={{
                flex: 1,
                background: "#E8600A",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "14px",
                fontSize: 14,
                fontWeight: 700,
                cursor:
                  loading ||
                  form.phone.length < 10 ||
                  !form.adminName ||
                  !form.email ||
                  !form.password
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  loading ||
                  form.phone.length < 10 ||
                  !form.adminName ||
                  !form.email ||
                  !form.password
                    ? 0.5
                    : 1,
              }}
              onClick={handleSendOTP}
              disabled={
                loading ||
                form.phone.length < 10 ||
                !form.adminName ||
                !form.email ||
                !form.password
              }
            >
              {loading ? "Requesting..." : "Send Verification Code"}
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 3: HIGHLY INTERACTIVE 6-DIGIT OTP SPLIT --- */}
      {step === 3 && (
        <div className="slide-in" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>🛡️</div>
          <h3
            className="syne"
            style={{ fontSize: 18, color: "#fff", margin: 0 }}
          >
            Security Verification
          </h3>
          <p
            style={{
              color: "#8B92B8",
              fontSize: 13,
              marginTop: 6,
              marginBottom: 24,
            }}
          >
            Enter the 6-digit WhatsApp code sent to +91 {form.phone}
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={otpRefs[index]}
                type="text"
                maxLength={1}
                value={digit}
                disabled={loading}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                style={{
                  width: 44,
                  height: 54,
                  background: "#1A1D27",
                  border: digit ? "2px solid #E8600A" : "1.5px solid #2D3250",
                  borderRadius: 12,
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#fff",
                  outline: "none",
                  transition: "all 0.2s",
                  opacity: loading ? 0.6 : 1,
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow =
                    "0 0 0 4px rgba(232, 96, 10, 0.15)";
                  e.target.style.borderColor = "#E8600A";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = "none";
                  if (!digit) e.target.style.borderColor = "#2D3250";
                }}
              />
            ))}
          </div>

          <button
            style={{
              width: "100%",
              background: "#E8600A",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "14px",
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 16,
              opacity: loading ? 1 : 0.5,
            }}
            disabled
          >
            {loading ? "Validating secure session..." : "Awaiting entry..."}
          </button>

          <button
            style={{
              background: "none",
              border: "none",
              color: "#8B92B8",
              fontSize: 12,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              textDecoration: "underline",
              opacity: loading ? 0.5 : 1,
            }}
            disabled={loading}
            onClick={() => {
              setStep(2);
              setOtp(["", "", "", "", "", ""]);
            }}
          >
            Modify WhatsApp Number
          </button>
        </div>
      )}

      {/* --- STEP 4: PREMIUM SUCCESS SCREEN --- */}
      {step === 4 && (
        <div
          className="slide-in"
          style={{ textAlign: "center", padding: "20px 0" }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h3
            className="syne"
            style={{ fontSize: 24, color: "#fff", margin: 0, fontWeight: 900 }}
          >
            Registration Successful!
          </h3>
          <p
            style={{
              color: "#8B92B8",
              fontSize: 14,
              marginTop: 12,
              marginBottom: 32,
              lineHeight: "1.6",
            }}
          >
            Your school has been securely onboarded to the <b>School Office</b>{" "}
            ecosystem. You can now login to your admin dashboard.
          </p>

          <button
            style={{
              width: "100%",
              background: "#E8600A",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "16px",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(232, 96, 10, 0.3)",
            }}
            onClick={() => {
              if (typeof onSwitchToLogin === "function") {
                onSwitchToLogin();
              } else {
                window.location.reload();
              }
            }}
          >
            Go to Login Page →
          </button>
        </div>
      )}

      {/* RETURN LINK (Hide on Step 4) */}
      {step < 4 && (
        <div
          style={{
            textAlign: "center",
            marginTop: 30,
            paddingTop: 20,
            borderTop: "1px solid #2D3250",
          }}
        >
          <span style={{ color: "#8B92B8", fontSize: 13 }}>
            Already onboarded?{" "}
          </span>
          <button
            onClick={() => {
              if (typeof onSwitchToLogin === "function") {
                onSwitchToLogin();
              } else {
                window.location.reload();
              }
            }}
            style={{
              background: "none",
              border: "none",
              color: "#E8600A",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Log In Here
          </button>
        </div>
      )}
    </div>
  );
};
