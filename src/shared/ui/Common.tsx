// path: src/shared/ui/Common.tsx

import { C } from '../theme';
import { Mark } from './Brand';
import { Icon } from './Icon';



export const KpiCard = ({ label, value, sub, icon, color, trend }) => (
  <div className="kpi-card">
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 80,
        height: 80,
        background: `radial-gradient(circle at 100% 0%,${
          color || C.primary
        }22,transparent 70%)`,
        borderRadius: "0 16px 0 0",
      }}
    />
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <div>
        <div
          style={{
            color: C.textMuted,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          {label}
        </div>
        <div
          className="syne"
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: C.text,
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        {sub && (
          <div style={{ color: C.textMuted, fontSize: 12, marginTop: 6 }}>
            {sub}
          </div>
        )}
        {trend !== undefined && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 6,
              fontSize: 12,
              color: trend >= 0 ? C.green : C.red,
            }}
          >
            <span>
              {trend >= 0 ? "↑" : "↓"}
              {Math.abs(trend)}%
            </span>
            <span style={{ color: C.textMuted }}>vs last month</span>
          </div>
        )}
      </div>
      <div
        style={{
          background: `${color || C.primary}22`,
          padding: 12,
          borderRadius: 12,
          color: color || C.primary,
        }}
      >
        <Icon name={icon || "chart"} size={20} />
      </div>
    </div>
  </div>
);

export const SectionHeader = ({ title, sub, action }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 20,
      flexWrap: "wrap",
      gap: 12,
    }}
  >
    <div>
      <h2
        className="syne"
        style={{ fontSize: 20, fontWeight: 700, color: C.text }}
      >
        {title}
      </h2>
      {sub && (
        <p style={{ color: C.textMuted, fontSize: 13, marginTop: 3 }}>{sub}</p>
      )}
    </div>
    {action && (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{action}</div>
    )}
  </div>
);

export const LogoLoader = ({ size = 44, label }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "24px 0", width: "100%" }}>
    <div className="logo-loader-spin"><Mark size={size} /></div>
    {label && <div style={{ fontSize: 12.5, fontWeight: 700, color: C.primary }}>{label}</div>}
  </div>
);

export const Modal = ({ open, onClose, title, children, width = 600, zIndex = 1000 }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" style={{ zIndex: zIndex }} onClick={onClose}>

      <div
        className="modal"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3 className="syne" style={{ fontSize: 17, fontWeight: 700 }}>
            {title}
          </h3>
          <button
            className="btn btn-ghost"
            style={{ padding: "6px 10px" }}
            onClick={onClose}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const FormRow = ({ label, children, cols = 1 }) => (
  <div style={{ marginBottom: 14 }}>
    <label
      style={{
        display: "block",
        fontSize: 12,
        fontWeight: 600,
        color: C.textMuted,
        marginBottom: 5,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

export const FormGrid = ({ children, cols = 2 }) => (
  <div
    className="form-grid-responsive"
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${cols},1fr)`,
      gap: 14,
    }}
  >
    {children}
  </div>
);

export const Field = ({ label, name, type = "text", options, form, setF }) => (
  <FormRow label={label}>
    {options ? (
      <select
        className="select"
        value={form[name] || ""}
        onChange={(e) => setF(name, e.target.value)}
      >
        {options.map((o) => (
          <option
            key={o.v !== undefined ? o.v : o}
            value={o.v !== undefined ? o.v : o}
          >
            {o.l !== undefined ? o.l : o}
          </option>
        ))}
      </select>
    ) : type === "checkbox" ? (
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        <input
          type="checkbox"
          checked={!!form[name]}
          onChange={(e) => setF(name, e.target.checked)}
          style={{ width: 15, height: 15, cursor: "pointer" }}
        />
        <span style={{ color: C.textMuted }}>Yes</span>
      </label>
    ) : (
      <input
        className="input"
        type={type}
        value={form[name] || ""}
        onChange={(e) => setF(name, e.target.value)}
      />
    )}
  </FormRow>
);

// ✅ Module-level — TeachersModule ke BAHAR
export const FF = ({
  label,
  name,
  type = "text",
  options,
  placeholder,
  hint,
  form,
  setF,
    }) => (
     <FormRow label={label}>
       {options ? (
         <select
          className="select"
           value={form[name] || ""}
           onChange={(e) => setF(name, e.target.value)}
            >
        {options.map((o) => (
          <option key={o.v ?? o} value={o.v ?? o}>
            {o.l ?? o}
          </option>
        ))}
      </select>
    ) : type === "checkbox" ? (
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        <input
          type="checkbox"
          checked={!!form[name]}
          onChange={(e) => setF(name, e.target.checked)}
          style={{
            width: 15,
            height: 15,
            cursor: "pointer",
            accentColor: C.primary,
          }}
        />
        <span style={{ color: C.textMuted }}>Yes</span>
      </label>
    ) : (
      <input
        className="input"
        type={type}
        placeholder={placeholder || ""}
        value={form[name] || ""}
        onChange={(e) => setF(name, e.target.value)}
      />
    )}
    {hint && (
      <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 4 }}>
        {hint}
      </div>
    )}
  </FormRow>
);
