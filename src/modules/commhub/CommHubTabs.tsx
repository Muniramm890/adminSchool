// path: src/modules/commhub/CommHubTabs.tsx

import { useState, useEffect, useMemo } from 'react';
import { ROLE_META } from '../usermanagement/UserManagementModule';
import { apiRequest } from '../../shared/api';
import { C } from '../../shared/theme';
import { FormGrid, FormRow, Modal } from '../../shared/ui/Common';
import { Icon } from '../../shared/ui/Icon';



// =========================================================
// COMMUNICATION HUB -- targeted notices across App / Email, with attachments
// (No WhatsApp -- Meta blocks freeform business-initiated messages outside approved templates)
// =========================================================
export const TARGET_TYPE_META = {
  all_school: { label: "Whole School" },
  grade: { label: "Entire Class/Grade" },
  section: { label: "Specific Section" },
  gender_in_section: { label: "Boys/Girls in a Section" },
  student: { label: "Individual Student" },
  subject_teachers: { label: "Teachers of a Subject" },
  class_teachers: { label: "Class Teacher(s)" },
  role: { label: "Staff by Role" },
};

// Mirrors backend ATTACHMENT_CHANNEL_MATRIX -- keep both in sync if it ever changes
export const ATTACHMENT_CHANNEL_MATRIX = {
  none: ["app", "email", "sms"],
  image: ["app", "email"],
  pdf: ["app", "email"],
  document: ["app", "email"],
  video: ["app"],
};
export const detectAttachmentType = (file) => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  return "document";
};

// -- Single target-row editor (used inside the target list builder) --
export const TargetRow = ({ target, onChange, onRemove, grades, sections, subjects }) => {
  const sectionsForGrade = target.grade_id ? sections.filter((s) => s.grade_id === target.grade_id) : sections;

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: 12, background: C.bgAlt, borderRadius: 10, marginBottom: 8, flexWrap: "wrap" }}>
      <select className="select" style={{ width: 190 }} value={target.target_type} onChange={(e) => onChange({ ...target, target_type: e.target.value })}>
        {Object.entries(TARGET_TYPE_META).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
      </select>

      {(target.target_type === "grade" || target.target_type === "section" || target.target_type === "gender_in_section" || target.target_type === "class_teachers") && (
        <select className="select" style={{ width: 140 }} value={target.grade_id || ""} onChange={(e) => onChange({ ...target, grade_id: e.target.value, section_id: "" })}>
          <option value="">Select grade</option>
          {grades.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
        </select>
      )}

      {(target.target_type === "section" || target.target_type === "gender_in_section" || target.target_type === "class_teachers") && (
        <select className="select" style={{ width: 140 }} value={target.section_id || ""} onChange={(e) => onChange({ ...target, section_id: e.target.value })}>
          <option value="">Select section</option>
          {sectionsForGrade.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>
      )}

      {target.target_type === "gender_in_section" && (
        <select className="select" style={{ width: 110 }} value={target.gender || ""} onChange={(e) => onChange({ ...target, gender: e.target.value })}>
          <option value="">Gender</option>
          <option value="male">Boys</option>
          <option value="female">Girls</option>
        </select>
      )}

      {target.target_type === "subject_teachers" && (
        <select className="select" style={{ width: 170 }} value={target.subject_id || ""} onChange={(e) => onChange({ ...target, subject_id: e.target.value })}>
          <option value="">Select subject</option>
          {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>
      )}

      {target.target_type === "role" && (
        <select className="select" style={{ width: 150 }} value={target.role || ""} onChange={(e) => onChange({ ...target, role: e.target.value })}>
          <option value="">Select role</option>
          {Object.entries(ROLE_META).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
        </select>
      )}

      {target.target_type === "student" && (
        <StudentPicker value={target.student_id} label={target.student_label} onPick={(id, label) => onChange({ ...target, student_id: id, student_label: label })} />
      )}

      <button className="btn btn-ghost" style={{ padding: "6px 10px", marginLeft: "auto" }} onClick={onRemove} title="Remove">
        <Icon name="trash" size={13} />
      </button>
    </div>
  );
};

// -- Tiny debounced student search-and-pick control --
export const StudentPicker = ({ value, label, onPick }) => {
  const [q, setQ] = useState(label || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!q || q.length < 2 || q === label) { setResults([]); return; }
    const t = setTimeout(() => {
      apiRequest(`/students?search=${encodeURIComponent(q)}&limit=8`)
        .then((res) => setResults(Array.isArray(res?.data) ? res.data : []))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line

  return (
    <div style={{ position: "relative", width: 220 }}>
      <input
        className="input" placeholder="Search student name..."
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, zIndex: 20, maxHeight: 180, overflowY: "auto", boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }}>
          {results.map((s) => (
            <div
              key={s.id}
              style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13 }}
              onClick={() => { onPick(s.id, `${s.first_name} ${s.last_name}`); setQ(`${s.first_name} ${s.last_name}`); setOpen(false); }}
            >
              {s.first_name} {s.last_name} <span style={{ color: C.textMuted }}>({s.admission_no})</span>
            </div>
          ))}
        </div>
      )}
      {value && <div style={{ fontSize: 11, color: C.green, marginTop: 3 }}>Selected</div>}
    </div>
  );
};

export const ComposeMessageTab = ({ academicYearId, onSent }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [channels, setChannels] = useState({ app: true, email: false, sms: false });
  const [targets, setTargets] = useState([{ target_type: "all_school" }]);
  const [files, setFiles] = useState([]);

  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!academicYearId) return;
    Promise.all([
      apiRequest(`/setup/grades`),
      apiRequest(`/setup/sections?academic_year_id=${academicYearId}`),
      apiRequest(`/setup/subjects`),
    ]).then(([gRes, secRes, subRes]) => {
      setGrades(gRes?.data || []);
      setSections(secRes?.data || []);
      setSubjects(subRes?.data || []);
    }).catch((e) => console.error(e.message));
  }, [academicYearId]);

  // Strictest attachment type present decides which channels are even selectable
  const strictestType = useMemo(() => {
    if (files.length === 0) return "none";
    const rank = { none: 0, image: 1, pdf: 1, document: 1, video: 2 };
    let worst = "none";
    files.forEach((f) => { const t = detectAttachmentType(f); if (rank[t] > rank[worst]) worst = t; });
    return worst;
  }, [files]);

  const allowedChannels = ATTACHMENT_CHANNEL_MATRIX[strictestType];

  // Auto-uncheck any channel that becomes invalid the moment attachments change
  useEffect(() => {
    setChannels((p) => {
      const next = { ...p };
      Object.keys(next).forEach((k) => { if (next[k] && !allowedChannels.includes(k)) next[k] = false; });
      return next;
    });
  }, [strictestType]); // eslint-disable-line

  const toggleChannel = (ch) => setChannels((p) => ({ ...p, [ch]: !p[ch] }));

  const addTarget = () => setTargets((p) => [...p, { target_type: "section" }]);
  const updateTarget = (idx, t) => setTargets((p) => p.map((x, i) => (i === idx ? t : x)));
  const removeTarget = (idx) => setTargets((p) => p.filter((_, i) => i !== idx));

  const handleFilePick = (e) => {
    const picked = Array.from(e.target.files || []);
    if (files.length + picked.length > 3) { setError("Max 3 attachments per message"); return; }
    setFiles((p) => [...p, ...picked]);
    setError("");
  };
  const removeFile = (i) => setFiles((p) => p.filter((_, idx) => idx !== i));

  const cleanTargets = () => targets.map((t) => ({
    target_type: t.target_type,
    grade_id: t.grade_id || undefined,
    section_id: t.section_id || undefined,
    subject_id: t.subject_id || undefined,
    student_id: t.student_id || undefined,
    gender: t.gender || undefined,
    role: t.role || undefined,
  }));

  const handlePreview = async () => {
    setPreviewing(true);
    setError("");
    try {
      const res = await apiRequest("/comm/preview", "POST", { academic_year_id: academicYearId, targets: cleanTargets() });
      setPreview(res?.data || null);
    } catch (e) { setError(e.message); }
    finally { setPreviewing(false); }
  };

  const selectedChannels = Object.entries(channels).filter(([, v]) => v).map(([k]) => k);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { setError("Title aur message likhna zaroori hai"); return; }
    if (selectedChannels.length === 0) { setError("Kam se kam ek channel select karo"); return; }

    setSending(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("body", body.trim());
      fd.append("category", category);
      fd.append("channels", JSON.stringify(selectedChannels));
      fd.append("targets", JSON.stringify(cleanTargets()));
      fd.append("academic_year_id", academicYearId);
      files.forEach((f) => fd.append("attachments", f));

      const res = await apiRequest("/comm/messages", "POST", fd, true);
      setResult(res?.data || null);
      setTitle(""); setBody(""); setTargets([{ target_type: "all_school" }]); setFiles([]); setPreview(null);
      setTimeout(() => onSent?.(), 1200);
    } catch (e) { setError(e.message); }
    finally { setSending(false); }
  };

  return (
    <div>
      <FormGrid cols={1}>
        <FormRow label="Title">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. PTM on Saturday" />
        </FormRow>
        <FormRow label="Message">
          <textarea className="input" rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message..." />
        </FormRow>
        <FormRow label="Category">
          <select className="select" style={{ width: 200 }} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="general">General</option>
            <option value="exam">Exam</option>
            <option value="fee">Fee</option>
            <option value="event">Event</option>
            <option value="emergency">Emergency</option>
          </select>
        </FormRow>
      </FormGrid>

      <div style={{ margin: "18px 0" }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}>Attachment (optional -- max 3, image/PDF/document/video)</div>
        <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,video/*" onChange={handleFilePick} disabled={files.length >= 3} />
        {files.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: C.bgAlt, borderRadius: 8, fontSize: 12 }}>
                {f.name}
                <button onClick={() => removeFile(i)} style={{ border: "none", background: "none", cursor: "pointer", color: C.red }}>x</button>
              </div>
            ))}
          </div>
        )}
        {strictestType !== "none" && (
          <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 6 }}>
            "{strictestType}" attachment ke sath sirf yeh channels valid hain: <strong>{allowedChannels.join(", ")}</strong>
          </div>
        )}
      </div>

      <div style={{ margin: "18px 0" }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}>Send Via</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { k: "app", label: "In-App Notification" },
            { k: "email", label: "Email" },
            { k: "sms", label: "SMS (coming soon)", alwaysDisabled: true },
          ].map((c) => {
            const disabled = c.alwaysDisabled || !allowedChannels.includes(c.k);
            return (
              <label key={c.k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
                <input type="checkbox" checked={channels[c.k]} disabled={disabled} onChange={() => toggleChannel(c.k)} />
                {c.label}
              </label>
            );
          })}
        </div>
      </div>

      <div style={{ margin: "18px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>Send To</div>
          <button className="btn btn-ghost" style={{ fontSize: 12.5, padding: "5px 10px" }} onClick={addTarget}>+ Add another audience</button>
        </div>
        {targets.map((t, i) => (
          <TargetRow key={i} target={t} grades={grades} sections={sections} subjects={subjects}
            onChange={(nt) => updateTarget(i, nt)} onRemove={() => removeTarget(i)} />
        ))}
      </div>

      {error && <div style={{ color: C.red, fontSize: 12.5, marginBottom: 12 }}>{error}</div>}

      {result && (
        <div style={{ padding: 14, background: `${C.green}11`, border: `1px solid ${C.green}33`, borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          Sent -- status: <strong>{result.status}</strong>, recipients: <strong>{result.recipient_count}</strong>
          {result.attachment_count > 0 && <span>, attachments: <strong>{result.attachment_count}</strong></span>}
        </div>
      )}

      {preview && (
        <div style={{ padding: 12, background: `${C.blue}11`, border: `1px solid ${C.blue}33`, borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          Yeh message <strong>{preview.total}</strong> logon tak jayega -- <strong>{preview.students}</strong> students, <strong>{preview.staff}</strong> staff.
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-ghost" onClick={handlePreview} disabled={previewing}>
          {previewing ? "Checking..." : "Preview Recipients"}
        </button>
        <button className="btn btn-primary" onClick={handleSend} disabled={sending} style={{ minWidth: 140, opacity: sending ? 0.7 : 1 }}>
          {sending ? "Sending..." : "Send Now"}
        </button>
      </div>
    </div>
  );
};

export const MessageHistoryTab = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [viewers, setViewers] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/comm/messages?limit=30");
      setMessages(Array.isArray(res?.data) ? res.data : []);
    } catch (e) { console.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (id) => {
    try {
      const res = await apiRequest(`/comm/messages/${id}`);
      setDetail(res?.data || null);
    } catch (e) { console.error(e.message); }
  };

  const openViewers = async (id) => {
    try {
      const res = await apiRequest(`/comm/messages/${id}/viewers`);
      setViewers(res?.data || null);
    } catch (e) { console.error(e.message); }
  };

  const statusColor = (s) => (s === "sent" ? C.green : s === "partial" ? (C.orange || C.red) : s === "failed" ? C.red : C.textMuted);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Loading...</div>;

  return (
    <div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr><th>Title</th><th>Category</th><th>Files</th><th>Recipients</th><th>Sent</th><th>Failed</th><th>Status</th><th>Date</th><th></th><th></th></tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id}>
                <td>{m.title}</td>
                <td>{m.category}</td>
                <td>{m.attachment_count > 0 ? m.attachment_count : "--"}</td>
                <td>{m.recipient_count}</td>
                <td style={{ color: C.green }}>{m.sent_count}</td>
                <td style={{ color: m.failed_count > 0 ? C.red : C.textMuted }}>{m.failed_count}</td>
                <td><span style={{ color: statusColor(m.status), fontWeight: 600, textTransform: "capitalize" }}>{m.status}</span></td>
                <td>{new Date(m.created_at).toLocaleDateString("en-IN")}</td>
                <td><button className="btn btn-ghost" style={{ fontSize: 12, padding: "4px 8px" }} onClick={() => openDetail(m.id)}>View</button></td>
                <td><button className="btn btn-ghost" style={{ fontSize: 12, padding: "4px 8px" }} onClick={() => openViewers(m.id)}>Viewers</button></td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr><td colSpan={10} style={{ textAlign: "center", padding: 30, color: C.textMuted }}>Koi message abhi tak nahi bheja gaya</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title || ""} width={520}>
        {detail && (
          <div>
            <p style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 14 }}>{detail.body}</p>
            <div style={{ fontSize: 12, marginBottom: 10 }}>
              <strong>Channels:</strong> {detail.channels?.join(", ") || "--"}
            </div>
            {detail.attachments?.length > 0 && (
              <div style={{ fontSize: 12, marginBottom: 14 }}>
                <strong>Attachments:</strong>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                  {detail.attachments.map((a) => (
                    <a key={a.id} href={a.file_url} target="_blank" rel="noopener noreferrer" style={{ color: C.blue }}>
                      {a.file_name} ({a.file_type}, {(a.file_size_bytes / 1024 / 1024).toFixed(1)} MB)
                    </a>
                  ))}
                </div>
              </div>
            )}
            <table className="table">
              <thead><tr><th>Channel</th><th>Status</th><th>Count</th></tr></thead>
              <tbody>
                {detail.delivery_stats?.map((d, i) => (
                  <tr key={i}><td>{d.channel}</td><td>{d.status}</td><td>{d.cnt}</td></tr>
                ))}
                {(!detail.delivery_stats || detail.delivery_stats.length === 0) && (
                  <tr><td colSpan={3} style={{ textAlign: "center", padding: 16, color: C.textMuted }}>No delivery data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <Modal open={!!viewers} onClose={() => setViewers(null)} title="Viewers" width={420}>
        {viewers && (
          <div>
            <div style={{ fontSize: 12.5, color: C.textMuted, marginBottom: 10 }}>
              {viewers.seen} / {viewers.total} seen (in-app only)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 350, overflowY: "auto" }}>
              {viewers.viewers.map((v, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${C.border || "#eee"}` }}>
                  <span>{v.name} <span style={{ color: C.textMuted, fontSize: 11 }}>({v.recipient_type})</span></span>
                  <span style={{ color: v.is_read ? C.green : C.textMuted }}>{v.is_read ? "Seen" : "Not seen"}</span>
                </div>
              ))}
              {viewers.viewers.length === 0 && (
                <div style={{ textAlign: "center", padding: 20, color: C.textMuted }}>No in-app recipients</div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
