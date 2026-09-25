// path: src/modules/students/StudentCard.tsx

import { useRef, useEffect, useState } from 'react';
import { apiRequest } from '../../shared/api';
import { C } from '../../shared/theme';
import { Modal, FormGrid, FormRow } from '../../shared/ui/Common';
import { Icon } from '../../shared/ui/Icon';




 // 🔴 UPGRADED: Professional Seamless Auto-Scrolling Marquee Effect
export const useAutoScroll = (dependency) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || el.children.length === 0) return;

    const innerWrapper = el.children[0];
    // Purana clone clean karein agar pehle se hai
    const existingClone = el.querySelector('.scroll-clone');
    if (existingClone) existingClone.remove();

    let reqId;
    let isPaused = false; // 🔴 Flag to control scroll state robustly

    const scroll = () => {
      // Sirf tabhi DOM update karo jab paused NAHI hai aur content bada hai
      if (!isPaused && innerWrapper.scrollHeight > el.clientHeight) {
        // Seamless loop ke liye content duplicate karte hain
        if (!el.querySelector('.scroll-clone')) {
          const clone = innerWrapper.cloneNode(true);
          clone.classList.add('scroll-clone');
          el.appendChild(clone);
        }

        el.scrollTop += 0.6; // Scroll speed
        
        // Jaise hi original content cross ho jaye, chup chap 0 par wapas aa jao
        if (el.scrollTop >= innerWrapper.scrollHeight) {
          el.scrollTop = 0;
        }
      }
      // Loop chalta rahega, bas paused mode me DOM update skip ho jayega
      reqId = requestAnimationFrame(scroll); 
    };

    const startTimeout = setTimeout(() => { 
      reqId = requestAnimationFrame(scroll); 
    }, 500);

    const handlePause = () => { isPaused = true; };
    const handlePlay = () => { isPaused = false; };

    el.addEventListener("mouseenter", handlePause);
    el.addEventListener("mouseleave", handlePlay);
    el.addEventListener("touchstart", handlePause, { passive: true });
    el.addEventListener("touchend", handlePlay);

    return () => {
      clearTimeout(startTimeout);
      cancelAnimationFrame(reqId);
      el.removeEventListener("mouseenter", handlePause);
      el.removeEventListener("mouseleave", handlePlay);
      el.removeEventListener("touchstart", handlePause);
      el.removeEventListener("touchend", handlePlay);
    };
  }, [dependency]);
  return ref;
};


// 🔴 Issue TC / mark-as-left modal — single-student exit, wired from Students grid
export const IssueTCModal = ({ student, onClose, onDone }) => {
  const [reason, setReason] = useState("");
  const [exitType, setExitType] = useState("tc");
  const [tcNumber, setTcNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (student) {
      setReason("");
      setExitType("tc");
      setTcNumber("");
      setError("");
    }
  }, [student]);

  const handleSubmit = async () => {
    if (!reason.trim()) { setError("Reason likhna zaroori hai"); return; }
    setSaving(true);
    setError("");
    try {
      await apiRequest(`/students/${student.id}/tc`, "POST", {
        exit_type: exitType,
        reason: reason.trim(),
        tc_number: tcNumber.trim() || null,
      });
      onDone();
    } catch (e) {
      setError(e.message || "TC issue nahi ho paya");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!student} onClose={onClose} title="Issue TC / Mark as Left" width={460}>
      {student && (
        <div>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>
            <strong style={{ color: C.text }}>
              {student.first_name} {student.last_name}
            </strong>{" "}
            ({student.admission_no}) ko school se exit mark karne wale hain — yeh
            action <strong>reverse nahi ho sakta</strong> normal flow se.
          </div>

          <FormGrid cols={1}>
            <FormRow label="Exit Type">
              <select className="select" value={exitType} onChange={(e) => setExitType(e.target.value)}>
                <option value="tc">Transfer Certificate (TC)</option>
                <option value="graduated">Graduated / Passed Out</option>
                <option value="expelled">Expelled</option>
              </select>
            </FormRow>
            <FormRow label="TC Number (optional)">
              <input
                className="input"
                value={tcNumber}
                onChange={(e) => setTcNumber(e.target.value)}
                placeholder="e.g. TC/2026/045"
              />
            </FormRow>
            <FormRow label="Reason">
              <textarea
                className="input"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for leaving..."
              />
            </FormRow>
          </FormGrid>

          {error && (
            <div style={{ color: C.red, fontSize: 12.5, marginTop: 8 }}>{error}</div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleSubmit}
              disabled={saving}
              style={{ minWidth: 130, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Processing…" : "Confirm Exit"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export const StudentCard = ({ s, gradeName, secName, onView, onEdit, onDelete, onIssueTC }) => {
  const enr = s.enrolment;
  const primary = s.guardians?.[0];
  const fullName = [s.first_name, s.middle_name, s.last_name]
    .filter(Boolean)
    .join(" ");
  const isFemale = s.gender === "Female";
  const col = isFemale ? C.purple : C.blue;

  return (
    <div
      key={s.id}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        overflow: "hidden",
        transition: "transform 0.18s, border-color 0.18s",
      }}
    >
      <div
        style={{
          height: 4,
          background: s.is_active
            ? `linear-gradient(90deg,${C.primary},${C.primaryDark})`
            : `linear-gradient(90deg,${C.textMuted},${C.border})`,
        }}
      />
      <div style={{ padding: "16px 16px 12px" }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          {s.photo_url ? (
            <img 
              src={s.photo_url} 
              alt={fullName} 
              style={{ 
                width: 44, 
                height: 44, 
                borderRadius: "50%", 
                objectFit: "cover", 
                border: `2px solid ${col}55`, 
                flexShrink: 0 
              }} 
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                flexShrink: 0,
                background: `${col}33`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 700,
                color: col,
                border: `2px solid ${col}55`,
              }}
            >
              {(s.first_name?.[0] || "?").toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="syne"
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: C.text,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {fullName}
            </div>
            <div style={{ fontSize: 11.5, color: C.primary, marginTop: 2 }}>
              {enr
                ? `${gradeName(enr.grade_id)} ${secName(enr.section_id)}`
                : "Not enrolled"}
            </div>
            {s.admission_no && (
              <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 1 }}>
                Adm# {s.admission_no}
              </div>
            )}
          </div>
          <span
            className={`badge ${s.is_active ? "badge-green" : "badge-red"}`}
            style={{ fontSize: 10 }}
          >
            {s.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
            marginBottom: 12,
          }}
        >
          {[
            ["Roll No.", enr?.roll_no || "—"],
            [
              "DOB",
              s.date_of_birth
                ? new Date(s.date_of_birth).toLocaleDateString("en-IN")
                : "—",
            ],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                background: C.surfaceAlt,
                borderRadius: 7,
                padding: "5px 8px",
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  color: C.textMuted,
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                {k}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {v}
              </div>
            </div>
          ))}
        </div>

        {primary && (
          <div
            style={{
              fontSize: 11.5,
              color: C.textMuted,
              marginBottom: 10,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            👤 {primary.full_name} · {primary.phone}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 6,
            borderTop: `1px solid ${C.border}33`,
            paddingTop: 10,
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={() => onView(s)}
            style={{
              flex: 1,
              fontSize: 11,
              padding: "6px 4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <Icon name="eye" size={12} /> View
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => onEdit(s)}
            style={{
              flex: 1,
              fontSize: 11,
              padding: "6px 4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <Icon name="edit" size={12} /> Edit
          </button>
          {s.is_active && onIssueTC && (
            <button
              className="btn btn-ghost"
              onClick={() => onIssueTC(s)}
              style={{ fontSize: 11, padding: "6px 8px", color: C.red }}
              title="Issue TC / Mark as Left"
            >
              <Icon name="file" size={12} />
            </button>
          )}
          <button
            className="btn btn-danger"
            onClick={() => onDelete(s)}
            style={{ fontSize: 11, padding: "6px 8px" }}
            title="Delete"
          >
            <Icon name="trash" size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
