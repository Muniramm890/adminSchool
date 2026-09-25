// path: src/modules/fees/FeeTabs.tsx

import { useState, useEffect } from 'react';
import { toPaise, rupees } from './feeUtils';
import { apiRequest } from '../../shared/api';
import { useSession } from '../../shared/context/AppContexts';
import { C } from '../../shared/theme';
import { Modal, FormRow, FormGrid } from '../../shared/ui/Common';
import { Icon } from '../../shared/ui/Icon';
import { todayISO } from '../../shared/utils';



// ── STRUCTURES TAB ──
export const FeeStructuresTab = () => {
  const [grades, setGrades] = useState([]);
  const [categories, setCategories] = useState([]);
  const { academicYears: academicYrs, currentYear } = useSession();
  const [gradeId, setGradeId] = useState("");
  const [rows, setRows] = useState({}); // category_id -> {amount, frequency, due_day_of_month, late_fee, grace_days}
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", is_recurring: true });
  const [genModal, setGenModal] = useState(false);
  const [genForm, setGenForm] = useState({ scope: "all", title: "", due_date: "", month_index: "" });
  const [generating, setGenerating] = useState(false);

  
  const selectedGrade = grades.find((g) => g.id === gradeId);

  const loadBase = async () => {
    setLoading(true);
    try {
      const [gRes, cRes] = await Promise.all([
        apiRequest("/setup/grades"),
        apiRequest("/fees/categories"),
      ]);
      setGrades(gRes?.data || []);
      setCategories(cRes?.data || []);
      if (gRes?.data?.length) setGradeId((p) => p || gRes.data[0].id);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { loadBase(); }, []);

  const loadStructures = async () => {
    if (!currentYear) return;
    try {
      const res = await apiRequest(`/fees/structures?academic_year_id=${currentYear.id}`);
      const list = res?.data || [];
      const byGrade = {};
      list.forEach((s) => {
        if (!byGrade[s.grade_id]) byGrade[s.grade_id] = {};
        byGrade[s.grade_id][s.fee_category_id] = s;
      });
      window.__feeStructAll = byGrade; // cache across grade switches
      applyGradeRows(gradeId, byGrade);
    } catch (e) { console.error(e); }
  };
  useEffect(() => { if (currentYear) loadStructures(); }, [currentYear?.id]); // eslint-disable-line

  const applyGradeRows = (gid, byGradeOverride) => {
    const byGrade = byGradeOverride || window.__feeStructAll || {};
    const existing = byGrade[gid] || {};
    const next = {};
    categories.forEach((c) => {
      const ex = existing[c.id];
      next[c.id] = {
        amount: ex ? (ex.amount_paise / 100).toFixed(0) : "",
        frequency: ex?.frequency || "monthly",
        due_day_of_month: ex?.due_day_of_month || 10,
        late_fee: ex ? (ex.late_fee_paise / 100).toFixed(0) : "0",
        grace_days: ex?.grace_days || 0,
      };
    });
    setRows(next);
  };
  useEffect(() => { if (gradeId && categories.length) applyGradeRows(gradeId); }, [gradeId, categories.length]); // eslint-disable-line

  const updateRow = (catId, field, value) => setRows((prev) => ({ ...prev, [catId]: { ...prev[catId], [field]: value } }));

  const handleAddCategory = async () => {
    if (!newCat.name.trim()) return;
    try {
      await apiRequest("/fees/categories", "POST", newCat);
      setNewCat({ name: "", is_recurring: true });
      setShowAddCat(false);
      const cRes = await apiRequest("/fees/categories");
      setCategories(cRes?.data || []);
    } catch (e) { alert("Failed: " + e.message); }
  };

  const buildEntries = (gid) => categories
    .filter((c) => rows[c.id]?.amount && parseFloat(rows[c.id].amount) > 0)
    .map((c) => ({
      grade_id: gid,
      fee_category_id: c.id,
      amount_paise: toPaise(rows[c.id].amount),
      frequency: rows[c.id].frequency,
      due_day_of_month: Number(rows[c.id].due_day_of_month) || 10,
      late_fee_paise: toPaise(rows[c.id].late_fee || 0),
      grace_days: Number(rows[c.id].grace_days) || 0,
    }));

  const handleSave = async (copyToAll = false) => {
    if (!currentYear) return alert("No active academic year found.");
    setSaving(true);
    try {
      let entries = buildEntries(gradeId);
      if (copyToAll) {
        entries = grades.flatMap((g) => buildEntries(g.id).map((e) => ({ ...e, grade_id: g.id })));
      }
      if (!entries.length) { alert("Enter at least one amount before saving."); setSaving(false); return; }
      await apiRequest("/fees/structures/bulk", "PUT", { academic_year_id: currentYear.id, entries });
      alert(copyToAll ? "✅ Applied to all classes!" : `✅ Fee structure saved for ${selectedGrade?.name}`);
      await loadStructures();
    } catch (e) { alert("Save failed: " + e.message); } finally { setSaving(false); }
  };

  const handleGenerate = async () => {
    if (!genForm.title || !genForm.due_date) return alert("Title and due date are required.");
    setGenerating(true);
    try {
      const res = await apiRequest("/fees/generate-invoices", "POST", {
        grade_id: genForm.scope === "grade" ? gradeId : null,
        academic_year_id: currentYear.id,
        month_index: genForm.month_index || null,
        title: genForm.title,
        due_date: genForm.due_date,
      });
      alert(`✅ ${res?.data?.generated || 0} invoices generated successfully!`);
      setGenModal(false);
      setGenForm({ scope: "all", title: "", due_date: "", month_index: "" });
    } catch (e) { alert("Failed: " + e.message); } finally { setGenerating(false); }
  };

  if (loading) return <div className="pulse" style={{ textAlign: "center", color: C.primary, padding: 40 }}>Loading fee structures…</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1 }}>
          {grades.map((g) => (
            <button key={g.id} onClick={() => setGradeId(g.id)} style={{
              padding: "8px 16px", borderRadius: 10, cursor: "pointer",
              border: `1.5px solid ${gradeId === g.id ? C.primary : C.border}`,
              background: gradeId === g.id ? `${C.primary}22` : C.surfaceAlt,
              color: gradeId === g.id ? C.primary : C.text, fontWeight: 700, fontSize: 12.5,
            }}>
              {g.name}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setGenModal(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="fee" size={14} /> Generate Invoices
        </button>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 className="syne" style={{ fontSize: 15, fontWeight: 700 }}>{selectedGrade?.name} — Fee Breakdown</h3>
          <button className="btn btn-ghost" onClick={() => setShowAddCat(true)} style={{ fontSize: 12 }}><Icon name="plus" size={12} /> New Category</button>
        </div>

        {categories.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: C.textMuted }}>No fee categories yet — add Tuition, Transport, Exam Fee, etc.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead><tr><th>Category</th><th>Amount (₹)</th><th>Frequency</th><th>Due Day</th><th>Late Fee (₹)</th><th>Grace Days</th></tr></thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700 }}>{c.name}</td>
                    <td><input className="input" type="number" style={{ width: 110 }} value={rows[c.id]?.amount || ""} onChange={(e) => updateRow(c.id, "amount", e.target.value)} placeholder="0" /></td>
                    <td>
                      <select className="select" style={{ width: 110 }} value={rows[c.id]?.frequency || "monthly"} onChange={(e) => updateRow(c.id, "frequency", e.target.value)}>
                        <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option>
                        <option value="half_yearly">Half-Yearly</option><option value="annual">Annual</option><option value="one_time">One-Time</option>
                      </select>
                    </td>
                    <td><input className="input" type="number" style={{ width: 70 }} min={1} max={28} value={rows[c.id]?.due_day_of_month || 10} onChange={(e) => updateRow(c.id, "due_day_of_month", e.target.value)} /></td>
                    <td><input className="input" type="number" style={{ width: 90 }} value={rows[c.id]?.late_fee || "0"} onChange={(e) => updateRow(c.id, "late_fee", e.target.value)} /></td>
                    <td><input className="input" type="number" style={{ width: 70 }} value={rows[c.id]?.grace_days || 0} onChange={(e) => updateRow(c.id, "grace_days", e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18, borderTop: `1px solid ${C.border}33`, paddingTop: 16 }}>
          <button className="btn btn-ghost" onClick={() => handleSave(true)} disabled={saving}>Apply to All Classes</button>
          <button className="btn btn-primary" onClick={() => handleSave(false)} disabled={saving} style={{ minWidth: 160, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : `Save for ${selectedGrade?.name || "..."}`}
          </button>
        </div>
      </div>

      <Modal open={showAddCat} onClose={() => setShowAddCat(false)} title="New Fee Category" width={380}>
        <FormRow label="Category Name">
          <input className="input" placeholder="e.g. Tuition Fee, Transport" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} />
        </FormRow>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 16 }}>
          <input type="checkbox" checked={newCat.is_recurring} onChange={(e) => setNewCat({ ...newCat, is_recurring: e.target.checked })} />
          Recurring charge (vs one-time)
        </label>
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleAddCategory}>Add Category</button>
      </Modal>

      <Modal open={genModal} onClose={() => setGenModal(false)} title="Generate Invoices" width={440}>
        <FormRow label="Scope">
          <select className="select" value={genForm.scope} onChange={(e) => setGenForm({ ...genForm, scope: e.target.value })}>
            <option value="all">All Classes</option>
            <option value="grade">Only {selectedGrade?.name}</option>
          </select>
        </FormRow>
        <FormRow label="Invoice Title">
          <input className="input" placeholder="e.g. November Fee 2024" value={genForm.title} onChange={(e) => setGenForm({ ...genForm, title: e.target.value })} />
        </FormRow>
        <FormGrid cols={2}>
          <FormRow label="Due Date"><input className="input" type="date" value={genForm.due_date} onChange={(e) => setGenForm({ ...genForm, due_date: e.target.value })} /></FormRow>
          <FormRow label="Month (Optional)">
            <select className="select" value={genForm.month_index} onChange={(e) => setGenForm({ ...genForm, month_index: e.target.value })}>
              <option value="">—</option>
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </FormRow>
        </FormGrid>
        <div style={{ padding: 12, background: `${C.yellow}11`, border: `1px solid ${C.yellow}33`, borderRadius: 10, fontSize: 12, color: C.yellow, marginBottom: 16 }}>
          This creates one invoice per student, summing all category amounts set in the fee structure above.
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleGenerate} disabled={generating}>
          {generating ? "Generating…" : "Generate Now"}
        </button>
      </Modal>
    </div>
  );
};

// ── RECEIPTS TAB ──
export const FeeReceiptsTab = ({ setReceiptViewerUrl }) => {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [voidTarget, setVoidTarget] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const downloadReceipt = async (paymentId) => {
    setDownloadingId(paymentId);
    try {
      const res = await apiRequest(`/fees/payments/${paymentId}/receipt`);
      if (res?.data?.receipt_url) setReceiptViewerUrl(res.data.receipt_url);
    } catch (e) {
      alert("Failed to generate receipt: " + e.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, from, to, limit: 50 });
      const res = await apiRequest(`/fees/payments?${params.toString()}`);
      setRows(res?.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search, from, to]); // eslint-disable-line

  const handleVoid = async () => {
    if (!voidReason.trim()) return;
    setVoiding(true);
    try {
      await apiRequest(`/fees/payments/${voidTarget.id}`, "DELETE", { void_reason: voidReason });
      setVoidTarget(null); setVoidReason("");
      await load();
    } catch (e) { alert("Void failed: " + e.message); } finally { setVoiding(false); }
  };

  const totalShown = rows.filter((r) => !r.is_void).reduce((s, r) => s + Number(r.amount_paise), 0);

  return (
    <div>
      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input className="input" style={{ flex: 1, minWidth: 200 }} placeholder="Search receipt no. or student…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <input className="input" type="date" style={{ width: 150 }} value={from} onChange={(e) => setFrom(e.target.value)} />
        <span style={{ color: C.textMuted }}>to</span>
        <input className="input" type="date" style={{ width: 150 }} value={to} onChange={(e) => setTo(e.target.value)} max={todayISO()} />
        <div className="syne" style={{ fontWeight: 800, color: C.green, fontSize: 15 }}>{rupees(totalShown)} collected</div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="pulse" style={{ padding: 40, textAlign: "center", color: C.primary }}>Loading transactions…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>No transactions found.</div>
        ) : (
          <table className="table">
            <thead><tr><th>Receipt</th><th>Student</th><th>Date</th><th>Amount</th><th>Method</th><th>Collected By</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} style={{ opacity: p.is_void ? 0.45 : 1 }}>
                  <td style={{ fontFamily: "monospace", fontSize: 11 }}>{p.receipt_no}</td>
                  <td style={{ fontWeight: 600 }}>{p.student_name}</td>
                  <td style={{ fontSize: 12 }}>{new Date(p.payment_date).toLocaleDateString("en-IN")}</td>
                  <td className="syne" style={{ fontWeight: 700 }}>{rupees(p.amount_paise)}</td>
                  <td style={{ fontSize: 12 }}>{p.payment_method}</td>
                  <td style={{ fontSize: 11, color: C.textMuted }}>{p.collected_by_name || "—"}</td>
                  <td>{p.is_void ? <span className="badge badge-red">Void</span> : <span className="badge badge-green">Active</span>}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-ghost" style={{ padding: "3px 8px", fontSize: 10 }} onClick={() => downloadReceipt(p.id)} disabled={p.is_void}>
                        <Icon name="download" size={11} /> Receipt
                      </button>
                      {!p.is_void && <button className="btn btn-danger" style={{ padding: "3px 8px", fontSize: 10 }} onClick={() => setVoidTarget(p)}>Void</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!voidTarget} onClose={() => setVoidTarget(null)} title="Void Payment Receipt" width={420}>
        {voidTarget && (
          <div>
            <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 14 }}>
              Voiding <b style={{ color: C.text }}>{voidTarget.receipt_no}</b> ({rupees(voidTarget.amount_paise)}) will restore the amount to pending balance.
            </div>
            <FormRow label="Reason for Voiding *">
              <textarea className="input" rows={3} value={voidReason} onChange={(e) => setVoidReason(e.target.value)} style={{ resize: "vertical" }} />
            </FormRow>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setVoidTarget(null)} disabled={voiding}>Cancel</button>
              <button className="btn btn-danger" onClick={handleVoid} disabled={voiding || !voidReason.trim()}>{voiding ? "Voiding…" : "Confirm Void"}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
