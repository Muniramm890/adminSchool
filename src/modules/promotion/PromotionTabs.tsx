// path: src/modules/promotion/PromotionTabs.tsx

import { useState, useEffect } from 'react';
import { apiRequest } from '../../shared/api';
import { useSession } from '../../shared/context/AppContexts';
import { C } from '../../shared/theme';
import { KpiCard, FormRow } from '../../shared/ui/Common';



export const PromotionOverviewTab = ({ overview, loading, totals, toYearId, onPromoteSection }) => {
  const [gradeFilter, setGradeFilter] = useState("");
  const rows = overview?.by_grade_section || [];
  const filteredRows = gradeFilter ? rows.filter((r) => r.grade_id === gradeFilter) : rows;
  const grades = [...new Map(rows.map((r) => [r.grade_id, r.grade_name])).entries()];

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Loading overview…</div>;
  if (!overview) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Session select karo upar se.</div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 24 }}>
        <KpiCard label="Total Students" value={totals.total} icon="students" color={C.blue} />
        <KpiCard label="Pending" value={totals.pending} icon="warning" color={C.orange || C.red} />
        <KpiCard label="Promoted" value={totals.promoted} icon="arrow_right" color={C.green} />
        <KpiCard label="Retained" value={totals.retained} icon="refresh" color={C.purple || C.blue} />
        <KpiCard label="TC Issued" value={totals.tc} icon="file" color={C.red} />
        <KpiCard label="Graduated" value={totals.graduated} icon="trophy" color={C.green} />
      </div>

      {!toYearId && (
        <div style={{ padding: "10px 14px", background: `${C.orange || C.red}11`, border: `1px solid ${C.orange || C.red}33`, borderRadius: 10, marginBottom: 16, fontSize: 12.5, color: C.textMuted }}>
          "To Session" select nahi kiya — promoted/retained/TC breakdown sirf tab dikhega jab dono session select honge. Grade-wise pending count phir bhi neeche visible hai.
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <select className="select" style={{ width: 220 }} value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
          <option value="">All Grades</option>
          {grades.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Grade</th>
                <th>Section</th>
                <th>Total</th>
                <th>Processed</th>
                <th>Pending</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.section_id}>
                  <td>{r.grade_name}</td>
                  <td>{r.section_name}</td>
                  <td>{r.total_students}</td>
                  <td>{r.processed}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: r.pending > 0 ? (C.orange || C.red) : C.green }}>
                      {r.pending}
                    </span>
                  </td>
                  <td>
                    {r.pending > 0 && (
                      <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 10px" }} onClick={onPromoteSection}>
                        Promote This Section →
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 30, color: C.textMuted }}>Koi section nahi mila</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const PromoteStudentsTab = ({ fromYearId, toYearId, onDone }) => {
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState("");
  const [students, setStudents] = useState([]);
  const [suggestedSection, setSuggestedSection] = useState(null);
  const [toSections, setToSections] = useState([]); // sections available in the "to" year
  const [rowActions, setRowActions] = useState({}); // { student_id: { action, to_section_id, roll_no, reason, enrolment_id } }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!fromYearId) return;
    apiRequest(`/setup/sections?academic_year_id=${fromYearId}`)
      .then((res) => setSections(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setSections([]));
  }, [fromYearId]);

  useEffect(() => {
    if (!toYearId) { setToSections([]); return; }
    apiRequest(`/setup/sections?academic_year_id=${toYearId}`)
      .then((res) => setToSections(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setToSections([]));
  }, [toYearId]);

  const loadStudents = async () => {
    if (!sectionId || !fromYearId) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await apiRequest(`/promotion/section-students?section_id=${sectionId}&academic_year_id=${fromYearId}`);
      const list = res?.data?.students || [];
      setStudents(list);
      setSuggestedSection(res?.data?.suggested_next_section || null);
      const defaultActions = {};
      list.forEach((s) => {
        defaultActions[s.student_id] = {
          action: "promote",
          to_section_id: res?.data?.suggested_next_section?.id || "",
          roll_no: s.roll_no || "",
          reason: "",
          enrolment_id: s.enrolment_id,
        };
      });
      setRowActions(defaultActions);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStudents(); }, [sectionId]); // eslint-disable-line

  const setAction = (studentId, patch) => {
    setRowActions((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...patch } }));
  };

  const applyToAll = (action) => {
    setRowActions((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((sid) => {
        next[sid] = { ...next[sid], action, to_section_id: suggestedSection?.id || next[sid].to_section_id };
      });
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!fromYearId || !toYearId) { setError("From aur To dono session select karo"); return; }
    const actions = Object.entries(rowActions).map(([student_id, a]) => ({
      student_id,
      enrolment_id: a.enrolment_id,
      action: a.action,
      to_section_id: a.action === "promote" ? a.to_section_id : undefined,
      roll_no: a.roll_no,
      reason: a.reason,
    }));
    const invalidPromote = actions.find((a) => a.action === "promote" && !a.to_section_id);
    if (invalidPromote) { setError("Kuch students ke liye 'Promote to Section' select nahi hua"); return; }

    setSaving(true);
    setError("");
    try {
      const res = await apiRequest("/promotion/run", "POST", {
        from_academic_year_id: fromYearId,
        to_academic_year_id: toYearId,
        actions,
      });
      setResult(res?.data?.counts || null);
      setStudents([]);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
        <FormRow label="Section (from current session)">
          <select className="select" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">Select section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.grade_name ? `${s.grade_name} - ${s.name}` : s.name}</option>
            ))}
          </select>
        </FormRow>
        {students.length > 0 && (
          <>
            <button className="btn btn-ghost" onClick={() => applyToAll("promote")}>Set all → Promote</button>
            <button className="btn btn-ghost" onClick={() => applyToAll("retain")}>Set all → Retain</button>
          </>
        )}
      </div>

      {error && <div style={{ color: C.red, fontSize: 12.5, marginBottom: 12 }}>{error}</div>}

      {result && (
        <div style={{ padding: 14, background: `${C.green}11`, border: `1px solid ${C.green}33`, borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          ✅ Done — Promoted: <strong>{result.promoted}</strong>, Retained: <strong>{result.retained}</strong>, TC: <strong>{result.tc}</strong>, Graduated: <strong>{result.graduated}</strong>
          {result.skipped > 0 && <span> ({result.skipped} skipped — already processed)</span>}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Loading students…</div>
      ) : students.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
          {sectionId ? "Sab students is section ke already processed hain." : "Ek section select karo upar se."}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Student</th>
                  <th>Last Result</th>
                  <th>Action</th>
                  <th>Promote To Section</th>
                  <th>New Roll No</th>
                  <th>Reason (TC/Graduate)</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const a = rowActions[s.student_id] || {};
                  return (
                    <tr key={s.student_id}>
                      <td>{s.roll_no}</td>
                      <td>{s.first_name} {s.last_name}</td>
                      <td>{s.percentage != null ? `${s.percentage}% (${s.result_grade || "-"})` : "—"}</td>
                      <td>
                        <select className="select" style={{ width: 120 }} value={a.action} onChange={(e) => setAction(s.student_id, { action: e.target.value })}>
                          <option value="promote">Promote</option>
                          <option value="retain">Retain</option>
                          <option value="tc">Issue TC</option>
                          <option value="graduate">Graduate</option>
                        </select>
                      </td>
                      <td>
                        {a.action === "promote" ? (
                          <select className="select" style={{ width: 150 }} value={a.to_section_id || ""} onChange={(e) => setAction(s.student_id, { to_section_id: e.target.value })}>
                            <option value="">Select</option>
                            {toSections.map((ts) => (
                              <option key={ts.id} value={ts.id}>{ts.grade_name ? `${ts.grade_name} - ${ts.name}` : ts.name}</option>
                            ))}
                          </select>
                        ) : "—"}
                      </td>
                      <td>
                        {(a.action === "promote" || a.action === "retain") ? (
                          <input className="input" style={{ width: 70 }} value={a.roll_no || ""} onChange={(e) => setAction(s.student_id, { roll_no: e.target.value })} />
                        ) : "—"}
                      </td>
                      <td>
                        {(a.action === "tc" || a.action === "graduate") ? (
                          <input className="input" style={{ width: 160 }} value={a.reason || ""} placeholder="Reason" onChange={(e) => setAction(s.student_id, { reason: e.target.value })} />
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: 16, display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving} style={{ minWidth: 180, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Processing…" : `Confirm for ${students.length} Students`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const SectionTransferTab = () => {
  const { currentYear } = useSession();
  const [sections, setSections] = useState([]);
  const [fromSectionId, setFromSectionId] = useState("");
  const [students, setStudents] = useState([]);
  const [moves, setMoves] = useState({}); // { student_id: { to_section_id, roll_no, enrolment_id } }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!currentYear) return;
    apiRequest(`/setup/sections?academic_year_id=${currentYear.id}`)
      .then((res) => setSections(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setSections([]));
  }, [currentYear]);

  const loadStudents = async () => {
    if (!fromSectionId || !currentYear) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await apiRequest(`/promotion/section-students?section_id=${fromSectionId}&academic_year_id=${currentYear.id}`);
      const list = res?.data?.students || [];
      setStudents(list);
      const m = {};
      list.forEach((s) => { m[s.student_id] = { to_section_id: "", roll_no: s.roll_no || "", enrolment_id: s.enrolment_id }; });
      setMoves(m);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStudents(); }, [fromSectionId]); // eslint-disable-line

  const setMove = (sid, patch) => setMoves((p) => ({ ...p, [sid]: { ...p[sid], ...patch } }));

  const handleTransfer = async (studentId) => {
    const m = moves[studentId];
    if (!m?.to_section_id) return;
    try {
      await apiRequest("/promotion/section-change", "POST", {
        student_id: studentId,
        enrolment_id: m.enrolment_id,
        to_section_id: m.to_section_id,
        roll_no: m.roll_no,
      });
      setStudents((prev) => prev.filter((s) => s.student_id !== studentId));
      setMsg("Section update ho gaya ✅");
    } catch (e) {
      setMsg(e.message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: 12.5, color: C.textMuted }}>
        Isi session ke andar student ko ek section se doosre section me move karo — koi nayi history entry nahi banti, sirf current section badalta hai.
      </div>
      <FormRow label="From Section">
        <select className="select" value={fromSectionId} onChange={(e) => setFromSectionId(e.target.value)}>
          <option value="">Select section</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>{s.grade_name ? `${s.grade_name} - ${s.name}` : s.name}</option>
          ))}
        </select>
      </FormRow>

      {msg && <div style={{ fontSize: 12.5, color: C.textMuted, margin: "10px 0" }}>{msg}</div>}

      {loading ? (
        <div style={{ padding: 30, textAlign: "center", color: C.textMuted }}>Loading…</div>
      ) : students.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr><th>Roll</th><th>Student</th><th>Move To Section</th><th>New Roll No</th><th></th></tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.student_id}>
                  <td>{s.roll_no}</td>
                  <td>{s.first_name} {s.last_name}</td>
                  <td>
                    <select className="select" style={{ width: 150 }} value={moves[s.student_id]?.to_section_id || ""} onChange={(e) => setMove(s.student_id, { to_section_id: e.target.value })}>
                      <option value="">Select</option>
                      {sections.filter((sec) => sec.id !== fromSectionId && sec.grade_id === sections.find((f) => f.id === fromSectionId)?.grade_id).map((sec) => (
                        <option key={sec.id} value={sec.id}>{sec.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input className="input" style={{ width: 70 }} value={moves[s.student_id]?.roll_no || ""} onChange={(e) => setMove(s.student_id, { roll_no: e.target.value })} />
                  </td>
                  <td>
                    <button className="btn btn-primary" style={{ fontSize: 12, padding: "5px 10px" }} onClick={() => handleTransfer(s.student_id)} disabled={!moves[s.student_id]?.to_section_id}>
                      Move
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export const PromotionHistoryTab = ({ history, loading }) => {
  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>Loading history…</div>;
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>From Session</th>
              <th>To Session</th>
              <th>Promoted</th>
              <th>Retained</th>
              <th>TC</th>
              <th>Graduated</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id}>
                <td>{new Date(h.created_at).toLocaleDateString()}</td>
                <td>{h.from_year_name}</td>
                <td>{h.to_year_name}</td>
                <td>{h.total_promoted}</td>
                <td>{h.total_retained}</td>
                <td>{h.total_tc}</td>
                <td>{h.total_graduated}</td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 30, color: C.textMuted }}>Koi promotion run abhi tak nahi hua</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
