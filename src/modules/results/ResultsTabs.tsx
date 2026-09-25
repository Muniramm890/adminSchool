// path: src/modules/results/ResultsTabs.tsx

import { useState, useEffect } from 'react';
import { MarksEntryTab } from '../exams/ExamTabs';
import { PdfViewerModal } from '../fees/PdfViewerModal';
import { apiRequest } from '../../shared/api';
import { C } from '../../shared/theme';
import { KpiCard, Modal } from '../../shared/ui/Common';
import { Icon } from '../../shared/ui/Icon';


// end ExamManagementModule
// ═══════════════════════════════════════════════════════════════



// ═══════════════════════════════════════════════════════════════
// MODULE: RESULTS
// ═══════════════════════════════════════════════════════════════


export const RESULT_TABS = [
  { id: "overview", label: "Overview" },
  { id: "classwise", label: "Class-wise" },
  { id: "sectionwise", label: "Section-wise" },
  { id: "subjectwise", label: "Subject-wise" },
  { id: "teacherwise", label: "Teacher-wise" },
  { id: "toppers", label: "Toppers" },
  { id: "student", label: "Student Report Card" },
];

export const GRADE_COLORS = [C.primary, C.purple, C.blue, C.green, C.yellow];



// ─────────────────────────────────────────────────────────────
export const ResultsOverviewTab = ({ examGroupId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiRequest(`/results/overview?exam_group_id=${examGroupId}`)
      .then((res) => setData(res?.data || null))
      .catch((e) => { console.error(e); setData(null); })
      .finally(() => setLoading(false));
  }, [examGroupId]);

  if (loading) return <div className="pulse" style={{ textAlign: "center", color: C.primary, padding: 30 }}>Loading…</div>;
  if (!data || !data.total_appeared) return <div className="card" style={{ padding: 30, textAlign: "center", color: C.textMuted }}>No data yet — compute results first.</div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 16 }}>
        <KpiCard label="Appeared" value={data.total_appeared} color={C.primary} />
        <KpiCard label="Passed" value={data.total_pass} color={C.green} sub={`${data.pass_percent}% pass rate`} />
        <KpiCard label="Failed" value={data.total_fail} color={C.red || "#e11d48"} />
        <KpiCard label="Incomplete" value={data.total_incomplete} color={C.yellow} sub="Marks pending entry" />
        <KpiCard label="Average %" value={`${data.avg_percentage}%`} color={C.purple} />
        <KpiCard label="Highest %" value={`${data.highest_percentage ?? "-"}%`} color={C.blue} />
      </div>
      {data.topper && (
        <div className="card" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 34 }}>🏆</div>
          <div>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, textTransform: "uppercase" }}>School Topper</div>
            <div className="syne" style={{ fontSize: 16, fontWeight: 700 }}>{data.topper.full_name}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>
              {data.topper.grade_name} - {data.topper.section_name} · {data.topper.percentage}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
export const ResultsClassWiseTab = ({ examGroupId }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiRequest(`/results/class-wise?exam_group_id=${examGroupId}`)
      .then((res) => setRows(Array.isArray(res?.data) ? res.data : []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [examGroupId]);

  if (loading) return <div className="pulse" style={{ textAlign: "center", color: C.primary, padding: 30 }}>Loading…</div>;
  if (!rows.length) return <div className="card" style={{ padding: 30, textAlign: "center", color: C.textMuted }}>No data yet.</div>;

  return (
    <div className="card">
      <h3 className="syne" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Class-wise Average Performance</h3>
      <div style={{ width: "100%", height: 300, marginBottom: 20 }}>
        <ResponsiveContainer>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="grade_name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="avg_percentage" name="Avg %" radius={[6, 6, 0, 0]}>
              {rows.map((_, i) => <Cell key={i} fill={GRADE_COLORS[i % GRADE_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ overflowX: "auto" }}>
      <table className="table" style={{ minWidth: 420 }}>
        <thead><tr><th>Class</th><th>Students</th><th>Pass %</th><th>Avg %</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.grade_id}>
              <td>{r.grade_name}</td><td>{r.total_students}</td><td>{r.pass_percent}%</td><td>{r.avg_percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
export const ResultsSectionWiseTab = ({ examGroupId }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drill, setDrill] = useState(null);
  const [drillRows, setDrillRows] = useState([]);
    const [drillSubjects, setDrillSubjects] = useState([]);
  const [drillLoading, setDrillLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiRequest(`/results/section-wise?exam_group_id=${examGroupId}`)
      .then((res) => setRows(Array.isArray(res?.data) ? res.data : []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [examGroupId]);

  const openDrill = async (row) => {
    setDrill(row);
    setDrillLoading(true);
    try {
      // Same API used by Exam Management → "Results & Publish" tab
      const res = await apiRequest(`/exams/${examGroupId}/results?section_id=${row.section_id}`);
      setDrillRows(Array.isArray(res?.data?.rows) ? res.data.rows : []);
      setDrillSubjects(Array.isArray(res?.data?.subjects) ? res.data.subjects : []);
    } catch (e) { console.error(e); } finally { setDrillLoading(false); }
  };

  if (loading) return <div className="pulse" style={{ textAlign: "center", color: C.primary, padding: 30 }}>Loading…</div>;

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ minWidth: 560 }}>
          <thead><tr><th>Class</th><th>Section</th><th>Students</th><th>Pass %</th><th>Avg %</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.section_id}>
                <td>{r.grade_name}</td><td>Section {r.section_name}</td><td>{r.total_students}</td>
                <td>{r.pass_percent}%</td><td>{r.avg_percentage}%</td>
                <td>
                  <button className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => openDrill(r)}>
                    View Students
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {drill && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <h3 className="syne" style={{ fontSize: 15, fontWeight: 700 }}>
              {drill.grade_name} - Section {drill.section_name} — Student Results
            </h3>
            <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={() => setDrill(null)}>Close</button>
          </div>
          {drillLoading ? (
            <div className="pulse" style={{ textAlign: "center", color: C.primary, padding: 20 }}>Loading…</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ minWidth: 620 + drillSubjects.length * 90 }}>
              <thead>
                <tr>
                  <th>Rank</th><th>Roll</th><th>Name</th>
                  {drillSubjects.map((sub) => (<th key={sub.id}>{sub.name}</th>))}
                  <th>Total</th><th>%</th><th>Grade</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {drillRows.map((s) => (
                  <tr key={s.student_id}>
                    <td>{s.class_rank ?? "-"}</td>
                    <td>{s.roll_no || "-"}</td>
                    <td>{s.first_name} {s.last_name || ""}</td>
                    {drillSubjects.map((sub) => {
                      const m = s.marks?.[sub.id];
                      if (!m) return <td key={sub.id}>-</td>;
                      if (m.status !== "present") return <td key={sub.id} style={{ color: C.red }}>{m.val}</td>;
                      return <td key={sub.id}>{m.val ?? "-"}</td>;
                    })}
                    <td>{s.status === "incomplete" ? "-" : `${s.total_marks}/${s.max_total}`}</td>
                    <td>{s.percentage ?? "-"}</td>
                    <td>{s.grade || "-"}</td>
                    <td>
                      <span className={`badge ${s.status === "pass" ? "badge-green" : s.status === "fail" ? "badge-red" : "badge-purple"}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
export const ResultsSubjectWiseTab = ({ examGroupId }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiRequest(`/results/subject-wise?exam_group_id=${examGroupId}`)
      .then((res) => setRows(Array.isArray(res?.data) ? res.data : []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [examGroupId]);

  if (loading) return <div className="pulse" style={{ textAlign: "center", color: C.primary, padding: 30 }}>Loading…</div>;
  if (!rows.length) return <div className="card" style={{ padding: 30, textAlign: "center", color: C.textMuted }}>No data yet.</div>;

  return (
    <div className="card">
      <h3 className="syne" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Subject-wise Performance</h3>
      <div style={{ width: "100%", height: 300, marginBottom: 20 }}>
        <ResponsiveContainer>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="subject_name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="avg_percentage" name="Avg %" fill={C.primary} radius={[6, 6, 0, 0]} />
            <Bar dataKey="pass_percent" name="Pass %" fill={C.green} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ overflowX: "auto" }}>
      <table className="table" style={{ minWidth: 640 }}>
        <thead><tr><th>Subject</th><th>Attempted</th><th>Absent</th><th>Pass %</th><th>Avg %</th><th>Highest</th><th>Lowest</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.subject_id}>
              <td>{r.subject_name}</td><td>{r.total_attempted}</td><td>{r.absent_count}</td>
              <td>{r.pass_percent}%</td><td>{r.avg_percentage}%</td>
              <td>{r.highest_marks ?? "-"}</td><td>{r.lowest_marks ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
export const ResultsTeacherWiseTab = ({ examGroupId }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiRequest(`/results/teacher-wise?exam_group_id=${examGroupId}`)
      .then((res) => setRows(Array.isArray(res?.data) ? res.data : []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [examGroupId]);

  const byTeacher = {};
  rows.forEach((r) => {
    if (!byTeacher[r.teacher_user_id]) byTeacher[r.teacher_user_id] = { name: r.teacher_name, total: 0, count: 0 };
    byTeacher[r.teacher_user_id].total += r.avg_percentage;
    byTeacher[r.teacher_user_id].count += 1;
  });
  const chartData = Object.values(byTeacher).map((t) => ({
    name: t.name, avg_percentage: Math.round((t.total / t.count) * 100) / 100,
  }));

  if (loading) return <div className="pulse" style={{ textAlign: "center", color: C.primary, padding: 30 }}>Loading…</div>;
  if (!rows.length) return <div className="card" style={{ padding: 30, textAlign: "center", color: C.textMuted }}>No data yet — check that Timetable has teacher assignments for these subjects.</div>;

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="syne" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
          Teacher-wise Average (across all their classes)
        </h3>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="avg_percentage" name="Avg %" fill={C.purple} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <h3 className="syne" style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Class-wise Breakdown</h3>
        <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ minWidth: 640 }}>
          <thead><tr><th>Teacher</th><th>Subject</th><th>Class</th><th>Attempted</th><th>Pass %</th><th>Avg %</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.teacher_name}</td><td>{r.subject_name}</td><td>{r.grade_name} - {r.section_name}</td>
                <td>{r.total_attempted}</td><td>{r.pass_percent}%</td><td>{r.avg_percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
export const ResultsToppersTab = ({ examGroupId }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    setLoading(true);
    apiRequest(`/results/toppers?exam_group_id=${examGroupId}&limit=${limit}`)
      .then((res) => setRows(Array.isArray(res?.data) ? res.data : []))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [examGroupId, limit]);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 className="syne" style={{ fontSize: 15, fontWeight: 700 }}>🏆 School Toppers</h3>
        <select className="select" style={{ width: 100 }} value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
          {[5, 10, 20, 50].map((v) => <option key={v} value={v}>Top {v}</option>)}
        </select>
      </div>
      {loading ? (
        <div className="pulse" style={{ textAlign: "center", color: C.primary, padding: 20 }}>Loading…</div>
      ) : !rows.length ? (
        <div style={{ padding: 30, textAlign: "center", color: C.textMuted }}>No data yet.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ minWidth: 480 }}>
          <thead><tr><th>Rank</th><th>Name</th><th>Class</th><th>%</th><th>Grade</th></tr></thead>
          <tbody>
            {rows.map((s, i) => (
              <tr key={s.student_id}>
                <td>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : s.school_rank}</td>
                <td>{s.student_name}</td>
                <td>{s.grade_name} - {s.section_name}</td>
                <td>{s.percentage}%</td>
                <td>{s.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
};

   // ─────────────────────────────────────────────────────────────
   // ─────────────────────────────────────────────────────────────

export const ResultsStudentReportTab = ({ examGroupId, examName, school }) => {
  const [reportPdfUrl, setReportPdfUrl] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [availableSections, setAvailableSections] = useState([]);
  const [sectionId, setSectionId] = useState("");
  const [studentsList, setStudentsList] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [search, setSearch] = useState("");

  const [report, setReport] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch available sections (Only those which have computed results for this Exam)
  useEffect(() => {
    if (!examGroupId) return;
    setLoading(true);
    apiRequest(`/results/section-wise?exam_group_id=${examGroupId}`)
      .then((res) => {
        const secs = Array.isArray(res?.data) ? res.data : [];
        setAvailableSections(secs);
        if (secs.length > 0) {
          setSectionId(secs[0].section_id);
        } else {
          setSectionId("");
        }
        setStudentId("");
        setReport(null);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [examGroupId]);

    // 2. Fetch students only for the selected section
  useEffect(() => {
    if (!sectionId || !examGroupId) {
      setStudentsList([]);
      return;
    }
    setLoading(true);
    apiRequest(`/results/section-results?exam_group_id=${examGroupId}&section_id=${sectionId}`)
      .then((res) => {
        setStudentsList(Array.isArray(res?.data) ? res.data : []);
        setStudentId("");
        setReport(null);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [sectionId, examGroupId]);

  // 3. Fetch Report Card & Trend for the selected student
  useEffect(() => {
    if (!studentId || !examGroupId) {
      setReport(null);
      setTrend([]);
      return;
    }
    setLoading(true);
    Promise.all([
      apiRequest(`/results/student/${studentId}/report-card?exam_group_id=${examGroupId}`).catch(() => null),
      apiRequest(`/results/student/${studentId}/trend`).catch(() => null),
    ])
      .then(([repRes, trendRes]) => {
        setReport(repRes?.data || null);
        setTrend(Array.isArray(trendRes?.data) ? trendRes.data : []);
      })
      .finally(() => setLoading(false));
  }, [studentId, examGroupId]);

  // Filter students based on the search box
  const filteredStudents = studentsList.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (s.student_name || "").toLowerCase();
    const roll = String(s.roll_no || "").toLowerCase(); 
    return name.includes(q) || roll.includes(q);
  });

  const selectedStudentMeta = studentsList.find(s => s.student_id === studentId);

  const handleGenerateSingle = async () => {
    if (!studentId || !examGroupId) return;
    setGeneratingPdf(true);
    try {
      const res = await apiRequest(`/results/student/${studentId}/report-card/pdf?exam_group_id=${examGroupId}`);
      if (res?.data?.url) setReportPdfUrl(res.data.url);
      else alert("PDF generation failed.");
    } catch (e) {
      alert("Failed to generate report card: " + e.message);
    } finally {
      setGeneratingPdf(false);
    }
  };
  
  const handleGenerateBulk = async () => {
    if (!sectionId || !examGroupId) return;
    setBulkGenerating(true);
    try {
      const res = await apiRequest(`/results/report-cards/bulk?section_id=${sectionId}&exam_group_id=${examGroupId}`);
      if (res?.data?.url) setReportPdfUrl(res.data.url);
      else alert("Bulk generation failed.");
    } catch (e) {
      alert("Failed to generate bulk report cards: " + e.message);
    } finally {
      setBulkGenerating(false);
    }
  };

  return (
    <div>
            <div className="card" style={{ marginBottom: 16, padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select
            className="select"
            style={{ width: 200 }}
            value={sectionId}
            onChange={(e) => { setSectionId(e.target.value); setSearch(""); }}
            disabled={availableSections.length === 0}
          >
            {availableSections.length === 0 && <option value="">No Results Computed Yet</option>}
            {availableSections.length > 0 && <option value="">-- Class & Section --</option>}
            {availableSections.map((s) => (
              <option key={s.section_id} value={s.section_id}>{s.grade_name} — Sec {s.section_name}</option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Search name/roll…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={!sectionId}
            style={{ width: 160 }}
          />
          <select
            className="select"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled={!sectionId}
            style={{ flex: 1, minWidth: 180 }}
          >
            <option value="">-- Select Student --</option>
            {filteredStudents.map((s) => (
              <option key={s.student_id} value={s.student_id}>{s.roll_no ? `${s.roll_no} - ` : ""}{s.student_name}</option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={handleGenerateSingle}
            disabled={!studentId || !report || generatingPdf}
            style={{ display: "flex", alignItems: "center", gap: 6, opacity: (!studentId || !report || generatingPdf) ? 0.5 : 1 }}
          >
            <Icon name="download" size={14} /> {generatingPdf ? "Generating…" : "Report Card"}
          </button>
          <button
            className="btn btn-ghost"
            onClick={handleGenerateBulk}
            disabled={!sectionId || bulkGenerating}
            style={{ display: "flex", alignItems: "center", gap: 6, opacity: (!sectionId || bulkGenerating) ? 0.5 : 1 }}
          >
            <Icon name="students" size={14} /> {bulkGenerating ? "Generating…" : `Print All (${studentsList.length})`}
          </button>
        </div>
      </div>

      <PdfViewerModal
        url={reportPdfUrl}
        onClose={() => setReportPdfUrl(null)}
        title="Report Card"
        pageSize="A4"
      />

      {!studentId ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
          {availableSections.length === 0 
            ? "No results have been processed for this Exam yet. Please go to 'Results & Publish' to compute them."
            : "Select a class, section, and student to view their report card and exam trend."}
        </div>
      ) : loading ? (
        <div className="pulse" style={{ textAlign: "center", color: C.primary, padding: 30 }}>Loading Report Card…</div>
      ) : (
        <>
          {trend.length > 1 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 className="syne" style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
                Performance Trend — {selectedStudentMeta?.student_name}
              </h3>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="exam_name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="percentage" stroke={C.primary} strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {!report ? (
            <div className="card" style={{ padding: 30, textAlign: "center", color: C.textMuted }}>
              No result data found for this student in the selected exam.
            </div>
          ) : (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h3 className="syne" style={{ fontSize: 18, fontWeight: 800 }}>
                    {selectedStudentMeta?.student_name}
                  </h3>
                  <span className={`badge ${report.status === "pass" ? "badge-green" : "badge-red"}`}>
                    {report.status?.toUpperCase()}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="syne" style={{ fontSize: 24, fontWeight: 800, color: C.primary }}>{report.percentage}%</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>
                    Grade <b style={{color: C.text}}>{report.grade}</b> · Class Rank <b style={{color: C.text}}>#{report.class_rank}</b> · School Rank <b style={{color: C.text}}>#{report.school_rank}</b>
                  </div>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
              <table className="table" style={{ minWidth: 520 }}>
                <thead><tr><th>Subject</th><th>Marks Obtained</th><th>Max Marks</th><th>Status</th></tr></thead>
                <tbody>
                {report.subjects?.map((s, i) => (
                    <tr key={i}>
                      <td>
                        {s.subject_name} 
                        {s.is_grade_only ? <span style={{fontSize: 9, marginLeft: 6, color: C.textMuted}}>(Graded)</span> : null}
                      </td>
                      <td className="syne" style={{ fontWeight: 700 }}>
                        {s.status === "absent" ? "AB" : s.is_grade_only ? (s.grade_obtained || "-") : (s.marks_obtained ?? "-")}
                      </td>
                      <td>{s.is_grade_only ? "-" : s.max_marks}</td>
                      <td>
                        {s.is_grade_only ? (
                           <span className="badge badge-yellow">Evaluated</span>
                        ) : (
                           <span className={`badge ${s.status === "absent" ? "badge-red" : Number(s.marks_obtained) >= Number(s.passing_marks) ? "badge-green" : "badge-red"}`}>
                             {s.status === "absent" ? "Absent" : Number(s.marks_obtained) >= Number(s.passing_marks) ? "Pass" : "Fail"}
                           </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};




// 🔴 NEW: Quick Marks Modal Wrapper for Results Module
export const QuickMarksModal = ({ examId, onClose }) => {
  const [examSections, setExamSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest(`/exams/${examId}`);
        setExamSections(Array.isArray(res?.data?.sections) ? res.data.sections : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [examId]);

  return (
    <Modal open={true} onClose={onClose} title="Quick Marks Entry" width={900}>
      {loading ? (
        <div className="pulse" style={{ padding: 40, textAlign: "center", color: C.primary }}>
          Loading classes for this exam...
        </div>
      ) : examSections.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
          No classes assigned to this exam yet.
        </div>
      ) : (
        <div style={{ paddingBottom: 20 }}>
          {/* 🔴 Calling the exact same tab from ExamManagementModule! */}
          <MarksEntryTab examId={examId} examSections={examSections} />
        </div>
      )}
    </Modal>
  );
};
