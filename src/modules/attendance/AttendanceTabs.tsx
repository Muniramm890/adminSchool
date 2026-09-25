// path: src/modules/attendance/AttendanceTabs.tsx

import { useState, useEffect } from 'react';
import { StatusPicker } from './StatusPicker';
import { apiRequest } from '../../shared/api';
import { C } from '../../shared/theme';
import { KpiCard } from '../../shared/ui/Common';
import { todayISO, STATUS_KEYS, STATUS_META, daysAgoISO } from '../../shared/utils';





// ═══════════════════════════════════════════════════════════════
// SHARED: Grade/Section selector (students side)
// ═══════════════════════════════════════════════════════════════
export const useGradesAndSections = () => {
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [gRes, sRes] = await Promise.all([
          apiRequest("/setup/grades"),
          apiRequest("/setup/sections"),
        ]);
        setGrades(Array.isArray(gRes?.data) ? gRes.data : []);
        setSections(Array.isArray(sRes?.data) ? sRes.data : []);
      } catch (e) {
        console.error("Failed to load grades/sections", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { grades, sections, loading };
};

// ═══════════════════════════════════════════════════════════════
// STUDENTS — TAB 1: MARK ATTENDANCE
// ═══════════════════════════════════════════════════════════════
export const StudentMarkTab = () => {
  const { grades, sections } = useGradesAndSections();
  const [gradeId, setGradeId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [roster, setRoster] = useState([]);
  const [counts, setCounts] = useState({ P: 0, A: 0, L: 0, OD: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [uploadingStudentPhoto, setUploadingStudentPhoto] = useState(false);

  

  const filteredSections = sections.filter((s) => s.grade_id === gradeId);

  useEffect(() => {
    if (grades.length && !gradeId) setGradeId(grades[0].id);
  }, [grades]); // eslint-disable-line

  useEffect(() => {
    if (gradeId && filteredSections.length && !sectionId) {
      setSectionId(filteredSections[0].id);
    }
  }, [gradeId, sections]); // eslint-disable-line

  const loadRoster = async () => {
    if (!sectionId || !date) return;
    setLoading(true);
    try {
      const res = await apiRequest(
        `/attendance/students/roster?section_id=${sectionId}&date=${date}`
      );
      setRoster(res?.data?.students || []);
      setCounts(res?.data?.counts || { P: 0, A: 0, L: 0, OD: 0 });
    } catch (e) {
      console.error("Roster load failed", e);
      setRoster([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, [sectionId, date]); // eslint-disable-line

  const setStatus = (studentId, status) => {
    setRoster((prev) => {
      const next = prev.map((r) =>
        r.student_id === studentId ? { ...r, status } : r
      );
      const c = { P: 0, A: 0, L: 0, OD: 0 };
      next.forEach((r) => {
        c[r.status] = (c[r.status] || 0) + 1;
      });
      setCounts(c);
      return next;
    });
  };

  const markAll = (status) => {
    setRoster((prev) => prev.map((r) => ({ ...r, status })));
    const c = { P: 0, A: 0, L: 0, OD: 0 };
    c[status] = roster.length;
    setCounts(c);
  };

  const handleSave = async () => {
    if (!roster.length) return;
    setSaving(true);
    try {
      await apiRequest("/attendance/students/mark", "POST", {
        section_id: sectionId,
        date,
        entries: roster.map((r) => ({
          student_id: r.student_id,
          status: r.status,
          remarks: r.remarks || null,
        })),
      });
      alert("✅ Attendance saved successfully!");
    } catch (e) {
      alert("❌ Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const total = roster.length || 1;

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: C.textMuted,
                marginBottom: 4,
              }}
            >
              CLASS
            </label>
            <select
              className="select"
              style={{ width: 150 }}
              value={gradeId}
              onChange={(e) => {
                setGradeId(e.target.value);
                setSectionId("");
              }}
            >
              <option value="">-- Select --</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: C.textMuted,
                marginBottom: 4,
              }}
            >
              SECTION
            </label>
            <select
              className="select"
              style={{ width: 120 }}
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              disabled={!gradeId}
            >
              <option value="">-- Select --</option>
              {filteredSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: C.textMuted,
                marginBottom: 4,
              }}
            >
              DATE
            </label>
            <input
              className="input"
              type="date"
              style={{ width: 150 }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={todayISO()}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              marginLeft: "auto",
              flexWrap: "wrap",
            }}
          >
            {STATUS_KEYS.map((s) => (
              <div key={s} style={{ textAlign: "center" }}>
                <div
                  className="syne"
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: STATUS_META[s].color,
                  }}
                >
                  {counts[s] || 0}
                </div>
                <div style={{ fontSize: 10, color: C.textMuted }}>
                  {STATUS_META[s].label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}
      >
        <button className="btn btn-success" onClick={() => markAll("P")}>
          Mark All Present
        </button>
        <button className="btn btn-danger" onClick={() => markAll("A")}>
          Mark All Absent
        </button>
        <button className="btn btn-ghost" onClick={() => markAll("L")}>
          Mark All Leave
        </button>
        <button
          className="btn btn-primary"
          style={{ marginLeft: "auto" }}
          onClick={handleSave}
          disabled={saving || loading}
        >
          {saving ? "Saving…" : "Save Attendance"}
        </button>
      </div>

      {roster.length > 0 && (
        <div
          className="progress-bar"
          style={{ marginBottom: 16, display: "flex" }}
        >
          {STATUS_KEYS.map((s) => (
            <div
              key={s}
              style={{
                width: `${((counts[s] || 0) / total) * 100}%`,
                background: STATUS_META[s].color,
                height: "100%",
              }}
            />
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div
            style={{ padding: 40, textAlign: "center", color: C.primary }}
            className="pulse"
          >
            Loading roster…
          </div>
        ) : roster.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
            No students found for this class/section.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Student</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r) => (
                  <tr key={r.student_id}>
                    <td style={{ color: C.textMuted, fontSize: 12 }}>
                      {r.roll_no || "—"}
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background:
                              r.gender === "GIRL"
                                ? `${C.purple}33`
                                : `${C.blue}33`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            color: r.gender === "GIRL" ? C.purple : C.blue,
                          }}
                        >
                          {(r.first_name?.[0] || "?").toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>
                          {[r.first_name, r.middle_name, r.last_name]
                            .filter(Boolean)
                            .join(" ")}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <StatusPicker
                        value={r.status}
                        onChange={(s) => setStatus(r.student_id, s)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// STUDENTS — TAB 2: CLASS ANALYSIS
// ═══════════════════════════════════════════════════════════════
export const StudentClassAnalysisTab = () => {
  const { grades, sections } = useGradesAndSections();
  const [gradeId, setGradeId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [from, setFrom] = useState(daysAgoISO(29));
  const [to, setTo] = useState(todayISO());
  const [data, setData] = useState({ students: [], trend: [] });
  const [loading, setLoading] = useState(false);

  const filteredSections = sections.filter((s) => s.grade_id === gradeId);

  useEffect(() => {
    if (grades.length && !gradeId) setGradeId(grades[0].id);
  }, [grades]); // eslint-disable-line
  useEffect(() => {
    if (gradeId && filteredSections.length && !sectionId)
      setSectionId(filteredSections[0].id);
  }, [gradeId, sections]); // eslint-disable-line

  const load = async () => {
    if (!sectionId) return;
    setLoading(true);
    try {
      const res = await apiRequest(
        `/attendance/students/analysis?section_id=${sectionId}&from=${from}&to=${to}`
      );
      setData(res?.data || { students: [], trend: [] });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [sectionId, from, to]); // eslint-disable-line

  const defaulters = data.students.filter((s) => s.percentage < 75);

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <select
            className="select"
            style={{ width: 150 }}
            value={gradeId}
            onChange={(e) => {
              setGradeId(e.target.value);
              setSectionId("");
            }}
          >
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <select
            className="select"
            style={{ width: 120 }}
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
          >
            {filteredSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            className="input"
            type="date"
            style={{ width: 150 }}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span style={{ alignSelf: "center", color: C.textMuted }}>to</span>
          <input
            className="input"
            type="date"
            style={{ width: 150 }}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            max={todayISO()}
          />
        </div>
      </div>

      <div
        className="grid-2"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <div className="card">
          <h3
            className="syne"
            style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}
          >
            Attendance % Trend
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.trend}>
              <defs>
                <linearGradient id="attTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" tick={{ fill: C.textMuted, fontSize: 9 }} />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: C.textMuted, fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: C.text,
                }}
                formatter={(v) => `${v}%`}
              />
              <Area
                type="monotone"
                dataKey="percentage"
                stroke={C.primary}
                fill="url(#attTrendGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3
            className="syne"
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 14,
              color: C.red,
            }}
          >
            ⚠ Defaulters (Below 75%)
          </h3>
          {defaulters.length === 0 ? (
            <div
              style={{
                color: C.textMuted,
                fontSize: 13,
                padding: "20px 0",
                textAlign: "center",
              }}
            >
              No defaulters — great attendance! ✓
            </div>
          ) : (
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {defaulters.map((s) => (
                <div
                  key={s.student_id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: `1px solid ${C.border}22`,
                    fontSize: 13,
                  }}
                >
                  <span>
                    {[s.first_name, s.last_name].filter(Boolean).join(" ")}
                  </span>
                  <span style={{ color: C.red, fontWeight: 700 }}>
                    {s.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3
          className="syne"
          style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}
        >
          Student-wise Breakdown
        </h3>
        {loading ? (
          <div
            className="pulse"
            style={{ textAlign: "center", color: C.primary, padding: 20 }}
          >
            Loading…
          </div>
        ) : (
          <>
            {(data.dates || []).length > 45 && (
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>
                {data.dates.length} dates in this range — scroll horizontally to see the full register.
              </div>
            )}
            <div style={{ overflowX: "auto", maxWidth: "100%" }}>
              <table className="table" style={{ minWidth: 420 + (data.dates || []).length * 34 }}>
                <thead>
                  <tr>
                    <th style={{ position: "sticky", left: 0, background: C.surface, zIndex: 2 }}>Roll</th>
                    <th style={{ position: "sticky", left: 44, background: C.surface, zIndex: 2 }}>Student</th>
                    {(data.dates || []).map((d) => (
                      <th key={d} style={{ fontSize: 10, fontWeight: 600, textAlign: "center", padding: "6px 4px", whiteSpace: "nowrap" }}>
                        {new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </th>
                    ))}
                    <th style={{ textAlign: "center" }}>P</th>
                    <th style={{ textAlign: "center" }}>A</th>
                    <th style={{ textAlign: "center" }}>L</th>
                    <th style={{ textAlign: "center" }}>OD</th>
                    <th style={{ textAlign: "center" }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.students.map((s) => (
                    <tr key={s.student_id}>
                      <td style={{ color: C.textMuted, position: "sticky", left: 0, background: C.surface, zIndex: 1 }}>{s.roll_no || "—"}</td>
                      <td style={{ fontWeight: 600, position: "sticky", left: 44, background: C.surface, zIndex: 1, whiteSpace: "nowrap" }}>
                        {[s.first_name, s.last_name].filter(Boolean).join(" ")}
                      </td>
                      {(data.dates || []).map((d) => {
                        const st = s.daily?.[d];
                        return (
                          <td key={d} style={{ textAlign: "center", padding: "6px 4px" }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: st ? STATUS_META[st]?.color || C.textMuted : C.border,
                              }}
                            >
                              {st || "·"}
                            </span>
                          </td>
                        );
                      })}
                      <td style={{ color: C.green, textAlign: "center" }}>{s.present_days}</td>
                      <td style={{ color: C.red, textAlign: "center" }}>{s.absent_days}</td>
                      <td style={{ color: C.yellow, textAlign: "center" }}>{s.leave_days}</td>
                      <td style={{ color: C.blue, textAlign: "center" }}>{s.od_days}</td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          className="syne"
                          style={{
                            fontWeight: 700,
                            color:
                              s.percentage >= 90
                                ? C.green
                                : s.percentage >= 75
                                ? C.yellow
                                : C.red,
                          }}
                        >
                          {s.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// STUDENTS — TAB 3: SCHOOL OVERVIEW
// ═══════════════════════════════════════════════════════════════
export const StudentSchoolOverviewTab = () => {
  const [date, setDate] = useState(todayISO());
  const [from, setFrom] = useState(daysAgoISO(6));
  const [to, setTo] = useState(todayISO());
  const [data, setData] = useState({ today: {}, gradeWise: [], trend: [] });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(
        `/attendance/students/school-overview?date=${date}&from=${from}&to=${to}`
      );
      setData(res?.data || { today: {}, gradeWise: [], trend: [] });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [date, from, to]); // eslint-disable-line

  const t = data.today || {};
  const pieData = STATUS_KEYS.map((s) => ({
    name: STATUS_META[s].label,
    value:
      t[
        s === "P"
          ? "present"
          : s === "A"
          ? "absent"
          : s === "L"
          ? "leave"
          : "od"
      ] || 0,
    key: s,
  }));

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: C.textMuted,
                marginBottom: 4,
              }}
            >
              TODAY'S DATE
            </label>
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={todayISO()}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: C.textMuted,
                marginBottom: 4,
              }}
            >
              TREND FROM
            </label>
            <input
              className="input"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: C.textMuted,
                marginBottom: 4,
              }}
            >
              TO
            </label>
            <input
              className="input"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              max={todayISO()}
            />
          </div>
        </div>
      </div>

      <div
        className="grid-4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {STATUS_KEYS.map((s) => (
          <KpiCard
            key={s}
            label={STATUS_META[s].label + " Today"}
            value={
              loading
                ? "—"
                : t[
                    s === "P"
                      ? "present"
                      : s === "A"
                      ? "absent"
                      : s === "L"
                      ? "leave"
                      : "od"
                  ] || 0
            }
            icon={s === "P" ? "check" : s === "A" ? "warning" : "attendance"}
            color={STATUS_META[s].color}
          />
        ))}
      </div>

      <div
        className="grid-2"
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <div className="card">
          <h3
            className="syne"
            style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}
          >
            School-wide Attendance Trend
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.trend}>
              <defs>
                <linearGradient id="studentTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="day" tick={{ fill: C.textMuted, fontSize: 11 }} />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: C.textMuted, fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: C.text,
                }}
                formatter={(v) => `${v}%`}
              />
              <Area
                type="monotone"
                dataKey="percentage"
                stroke={C.primary}
                fill="url(#studentTrendGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3
            className="syne"
            style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}
          >
            Today's Mix
          </h3>
          {loading ? (
            <div
              className="pulse"
              style={{
                height: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.primary,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Loading today's mix…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={STATUS_META[d.key].color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    color: C.text,
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 8 }}
                  formatter={(v) => (
                    <span style={{ color: C.textMuted, fontSize: 11 }}>{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card">
        <h3
          className="syne"
          style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}
        >
          Class-wise Average Attendance
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.gradeWise} barSize={22}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis
              dataKey="grade_name"
              tick={{ fill: C.textMuted, fontSize: 10 }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: C.textMuted, fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                color: C.text,
              }}
              formatter={(v) => `${v}%`}
            />
            <Bar dataKey="percentage" fill={C.primary} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// STUDENTS — TAB 4: INDIVIDUAL STUDENT
// ═══════════════════════════════════════════════════════════════
export const StudentIndividualTab = () => {
  const { grades, sections } = useGradesAndSections();
  const [gradeId, setGradeId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [studentsList, setStudentsList] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [from, setFrom] = useState(daysAgoISO(29));
  const [to, setTo] = useState(todayISO());
  const [history, setHistory] = useState({
    records: [],
    counts: {},
    percentage: 0,
    totalMarked: 0,
  });
  const [loading, setLoading] = useState(false);

  const filteredSections = sections.filter((s) => s.grade_id === gradeId);

  useEffect(() => {
    if (!sectionId) {
      setStudentsList([]);
      return;
    }
    (async () => {
      try {
        const res = await apiRequest(
          `/students?section_id=${sectionId}&limit=200`
        );
        setStudentsList(Array.isArray(res?.data) ? res.data : []);
      } catch (e) {
        setStudentsList([]);
      }
    })();
  }, [sectionId]);

  const loadHistory = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await apiRequest(
        `/attendance/students/${studentId}/history?from=${from}&to=${to}`
      );
      setHistory(
        res?.data || { records: [], counts: {}, percentage: 0, totalMarked: 0 }
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadHistory();
  }, [studentId, from, to]); // eslint-disable-line

  const recordMap = {};
  history.records.forEach((r) => {
    recordMap[r.attendance_date?.split("T")[0]] = r.status;
  });

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <select
            className="select"
            style={{ width: 150 }}
            value={gradeId}
            onChange={(e) => {
              setGradeId(e.target.value);
              setSectionId("");
              setStudentId("");
            }}
          >
            <option value="">-- Class --</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <select
            className="select"
            style={{ width: 120 }}
            value={sectionId}
            onChange={(e) => {
              setSectionId(e.target.value);
              setStudentId("");
            }}
            disabled={!gradeId}
          >
            <option value="">-- Section --</option>
            {filteredSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className="select"
            style={{ width: 220 }}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled={!sectionId}
          >
            <option value="">-- Select Student --</option>
            {studentsList.map((s) => (
              <option key={s.id} value={s.id}>
                {[s.first_name, s.last_name].filter(Boolean).join(" ")}
              </option>
            ))}
          </select>
          <input
            className="input"
            type="date"
            style={{ width: 150 }}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span style={{ alignSelf: "center", color: C.textMuted }}>to</span>
          <input
            className="input"
            type="date"
            style={{ width: 150 }}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            max={todayISO()}
          />
        </div>
      </div>

      {!studentId ? (
        <div
          className="card"
          style={{ padding: 40, textAlign: "center", color: C.textMuted }}
        >
          Select a class, section and student to view their attendance record.
        </div>
      ) : loading ? (
        <div
          className="card pulse"
          style={{ padding: 40, textAlign: "center", color: C.primary }}
        >
          Loading history…
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                gap: 20,
                flexWrap: "wrap",
                justifyContent: "space-around",
              }}
            >
              {STATUS_KEYS.map((s) => (
                <div key={s} style={{ textAlign: "center" }}>
                  <div
                    className="syne"
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      color: STATUS_META[s].color,
                    }}
                  >
                    {history.counts[s] || 0}
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>
                    {STATUS_META[s].label}
                  </div>
                </div>
              ))}
              <div style={{ textAlign: "center" }}>
                <div
                  className="syne"
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: history.percentage >= 75 ? C.primary : C.red,
                  }}
                >
                  {history.percentage}%
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>Overall</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3
              className="syne"
              style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}
            >
              Day-by-Day Calendar
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7,1fr)",
                gap: 6,
                maxWidth: 460,
              }}
            >
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: "center",
                    fontSize: 11,
                    color: C.textMuted,
                    fontWeight: 600,
                    padding: "4px 0",
                  }}
                >
                  {d}
                </div>
              ))}
              {(() => {
                const start = new Date(from);
                const days = [];
                const startPad = start.getDay();
                for (let i = 0; i < startPad; i++) days.push(null);
                const cur = new Date(from);
                const end = new Date(to);
                while (cur <= end) {
                  days.push(cur.toISOString().split("T")[0]);
                  cur.setDate(cur.getDate() + 1);
                }
                return days.map((d, i) => {
                  const status = d ? recordMap[d] : null;
                  const meta = status ? STATUS_META[status] : null;
                  return (
                    <div
                      key={i}
                      title={d || ""}
                      style={{
                        aspectRatio: "1",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 600,
                        background: !d
                          ? "transparent"
                          : meta
                          ? `${meta.color}33`
                          : C.surfaceAlt,
                        color: !d
                          ? "transparent"
                          : meta
                          ? meta.color
                          : C.textMuted,
                        border: `1px solid ${
                          !d
                            ? "transparent"
                            : meta
                            ? meta.color + "55"
                            : C.border
                        }`,
                      }}
                    >
                      {d ? new Date(d).getDate() : ""}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TEACHERS — TAB 1: MARK ATTENDANCE
// ═══════════════════════════════════════════════════════════════
export const StaffMarkTab = () => {
  const [date, setDate] = useState(todayISO());
  const [roster, setRoster] = useState([]);
  const [counts, setCounts] = useState({ P: 0, A: 0, L: 0, OD: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadRoster = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/attendance/staff/roster?date=${date}`);
      setRoster(res?.data?.teachers || []);
      setCounts(res?.data?.counts || { P: 0, A: 0, L: 0, OD: 0 });
    } catch (e) {
      console.error(e);
      setRoster([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadRoster();
  }, [date]); // eslint-disable-line

  const setStatus = (userId, status) => {
    setRoster((prev) => {
      const next = prev.map((r) =>
        r.user_id === userId ? { ...r, status } : r
      );
      const c = { P: 0, A: 0, L: 0, OD: 0 };
      next.forEach((r) => {
        c[r.status] = (c[r.status] || 0) + 1;
      });
      setCounts(c);
      return next;
    });
  };

  const markAll = (status) => {
    setRoster((prev) => prev.map((r) => ({ ...r, status })));
    const c = { P: 0, A: 0, L: 0, OD: 0 };
    c[status] = roster.length;
    setCounts(c);
  };

  const handleSave = async () => {
    if (!roster.length) return;
    setSaving(true);
    try {
      await apiRequest("/attendance/staff/mark", "POST", {
        date,
        entries: roster.map((r) => ({
          user_id: r.user_id,
          status: r.status,
          remarks: r.remarks || null,
        })),
      });
      alert("✅ Staff attendance saved successfully!");
    } catch (e) {
      alert("❌ Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const total = roster.length || 1;

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                color: C.textMuted,
                marginBottom: 4,
              }}
            >
              DATE
            </label>
            <input
              className="input"
              type="date"
              style={{ width: 170 }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={todayISO()}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: 16,
              marginLeft: "auto",
              flexWrap: "wrap",
            }}
          >
            {STATUS_KEYS.map((s) => (
              <div key={s} style={{ textAlign: "center" }}>
                <div
                  className="syne"
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: STATUS_META[s].color,
                  }}
                >
                  {counts[s] || 0}
                </div>
                <div style={{ fontSize: 10, color: C.textMuted }}>
                  {STATUS_META[s].label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}
      >
        <button className="btn btn-success" onClick={() => markAll("P")}>
          Mark All Present
        </button>
        <button className="btn btn-danger" onClick={() => markAll("A")}>
          Mark All Absent
        </button>
        <button className="btn btn-ghost" onClick={() => markAll("L")}>
          Mark All Leave
        </button>
        <button
          className="btn btn-primary"
          style={{ marginLeft: "auto" }}
          onClick={handleSave}
          disabled={saving || loading}
        >
          {saving ? "Saving…" : "Save Attendance"}
        </button>
      </div>

      {roster.length > 0 && (
        <div
          className="progress-bar"
          style={{ marginBottom: 16, display: "flex" }}
        >
          {STATUS_KEYS.map((s) => (
            <div
              key={s}
              style={{
                width: `${((counts[s] || 0) / total) * 100}%`,
                background: STATUS_META[s].color,
                height: "100%",
              }}
            />
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div
            style={{ padding: 40, textAlign: "center", color: C.primary }}
            className="pulse"
          >
            Loading staff list…
          </div>
        ) : roster.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
            No teachers found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Department</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r) => (
                  <tr key={r.user_id}>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background:
                              r.gender === "Female"
                                ? `${C.purple}33`
                                : `${C.blue}33`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            color: r.gender === "Female" ? C.purple : C.blue,
                          }}
                        >
                          {(r.full_name?.[0] || "?").toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>
                          {r.full_name}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: C.textMuted }}>
                      {r.department || "—"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <StatusPicker
                        value={r.status}
                        onChange={(s) => setStatus(r.user_id, s)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TEACHERS — TAB 2: STAFF ANALYSIS
// ═══════════════════════════════════════════════════════════════
export const StaffAnalysisTab = () => {
  const [from, setFrom] = useState(daysAgoISO(29));
  const [to, setTo] = useState(todayISO());
  const [data, setData] = useState({ teachers: [], trend: [] });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(
        `/attendance/staff/analysis?from=${from}&to=${to}`
      );
      setData(res?.data || { teachers: [], trend: [] });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [from, to]); // eslint-disable-line

  const defaulters = data.teachers.filter((t) => t.percentage < 85);

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            className="input"
            type="date"
            style={{ width: 150 }}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span style={{ alignSelf: "center", color: C.textMuted }}>to</span>
          <input
            className="input"
            type="date"
            style={{ width: 150 }}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            max={todayISO()}
          />
        </div>
      </div>

      <div
        className="grid-2"
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <div className="card">
          <h3
            className="syne"
            style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}
          >
            Staff Attendance Trend
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.trend}>
              <defs>
                <linearGradient id="staffTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.blue} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="day" tick={{ fill: C.textMuted, fontSize: 11 }} />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: C.textMuted, fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: C.text,
                }}
                formatter={(v) => `${v}%`}
              />
              <Area
                type="monotone"
                dataKey="percentage"
                stroke={C.blue}
                fill="url(#staffTrendGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3
            className="syne"
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 14,
              color: C.red,
            }}
          >
            ⚠ Frequently Absent (Below 85%)
          </h3>
          {defaulters.length === 0 ? (
            <div
              style={{
                color: C.textMuted,
                fontSize: 13,
                padding: "20px 0",
                textAlign: "center",
              }}
            >
              All staff regular ✓
            </div>
          ) : (
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {defaulters.map((t) => (
                <div
                  key={t.user_id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: `1px solid ${C.border}22`,
                    fontSize: 13,
                  }}
                >
                  <span>{t.full_name}</span>
                  <span style={{ color: C.red, fontWeight: 700 }}>
                    {t.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3
          className="syne"
          style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}
        >
          Teacher-wise Breakdown
        </h3>
        {loading ? (
          <div
            className="pulse"
            style={{ textAlign: "center", color: C.primary, padding: 20 }}
          >
            Loading…
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Department</th>
                  <th>P</th>
                  <th>A</th>
                  <th>L</th>
                  <th>OD</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {data.teachers.map((t) => (
                  <tr key={t.user_id}>
                    <td style={{ fontWeight: 600 }}>{t.full_name}</td>
                    <td style={{ fontSize: 12, color: C.textMuted }}>
                      {t.department || "—"}
                    </td>
                    <td style={{ color: C.green }}>{t.present_days}</td>
                    <td style={{ color: C.red }}>{t.absent_days}</td>
                    <td style={{ color: C.yellow }}>{t.leave_days}</td>
                    <td style={{ color: C.blue }}>{t.od_days}</td>
                    <td>
                      <span
                        className="syne"
                        style={{
                          fontWeight: 700,
                          color:
                            t.percentage >= 90
                              ? C.green
                              : t.percentage >= 75
                              ? C.yellow
                              : C.red,
                        }}
                      >
                        {t.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TEACHERS — TAB 3: INDIVIDUAL TEACHER
// ═══════════════════════════════════════════════════════════════
export const StaffIndividualTab = () => {
  const [teachersList, setTeachersList] = useState([]);
  const [userId, setUserId] = useState("");
  const [from, setFrom] = useState(daysAgoISO(29));
  const [to, setTo] = useState(todayISO());
  const [history, setHistory] = useState({
    records: [],
    counts: {},
    percentage: 0,
    totalMarked: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest("/teachers");
        setTeachersList(Array.isArray(res?.data) ? res.data : []);
      } catch (e) {
        setTeachersList([]);
      }
    })();
  }, []);

  const loadHistory = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await apiRequest(
        `/attendance/staff/${userId}/history?from=${from}&to=${to}`
      );
      setHistory(
        res?.data || { records: [], counts: {}, percentage: 0, totalMarked: 0 }
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadHistory();
  }, [userId, from, to]); // eslint-disable-line

  const recordMap = {};
  history.records.forEach((r) => {
    recordMap[r.attendance_date?.split("T")[0]] = r.status;
  });

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <select
            className="select"
            style={{ width: 220 }}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">-- Select Teacher --</option>
            {teachersList.map((t) => (
              <option key={t.user_id} value={t.user_id}>
                {t.full_name}
              </option>
            ))}
          </select>
          <input
            className="input"
            type="date"
            style={{ width: 150 }}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span style={{ alignSelf: "center", color: C.textMuted }}>to</span>
          <input
            className="input"
            type="date"
            style={{ width: 150 }}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            max={todayISO()}
          />
        </div>
      </div>

      {!userId ? (
        <div
          className="card"
          style={{ padding: 40, textAlign: "center", color: C.textMuted }}
        >
          Select a teacher to view their attendance record.
        </div>
      ) : loading ? (
        <div
          className="card pulse"
          style={{ padding: 40, textAlign: "center", color: C.primary }}
        >
          Loading history…
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                gap: 20,
                flexWrap: "wrap",
                justifyContent: "space-around",
              }}
            >
              {STATUS_KEYS.map((s) => (
                <div key={s} style={{ textAlign: "center" }}>
                  <div
                    className="syne"
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      color: STATUS_META[s].color,
                    }}
                  >
                    {history.counts[s] || 0}
                  </div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>
                    {STATUS_META[s].label}
                  </div>
                </div>
              ))}
              <div style={{ textAlign: "center" }}>
                <div
                  className="syne"
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: history.percentage >= 85 ? C.primary : C.red,
                  }}
                >
                  {history.percentage}%
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>Overall</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3
              className="syne"
              style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}
            >
              Day-by-Day Calendar
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7,1fr)",
                gap: 6,
                maxWidth: 460,
              }}
            >
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: "center",
                    fontSize: 11,
                    color: C.textMuted,
                    fontWeight: 600,
                    padding: "4px 0",
                  }}
                >
                  {d}
                </div>
              ))}
              {(() => {
                const start = new Date(from);
                const days = [];
                const startPad = start.getDay();
                for (let i = 0; i < startPad; i++) days.push(null);
                const cur = new Date(from);
                const end = new Date(to);
                while (cur <= end) {
                  days.push(cur.toISOString().split("T")[0]);
                  cur.setDate(cur.getDate() + 1);
                }
                return days.map((d, i) => {
                  const status = d ? recordMap[d] : null;
                  const meta = status ? STATUS_META[status] : null;
                  return (
                    <div
                      key={i}
                      title={d || ""}
                      style={{
                        aspectRatio: "1",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 600,
                        background: !d
                          ? "transparent"
                          : meta
                          ? `${meta.color}33`
                          : C.surfaceAlt,
                        color: !d
                          ? "transparent"
                          : meta
                          ? meta.color
                          : C.textMuted,
                        border: `1px solid ${
                          !d
                            ? "transparent"
                            : meta
                            ? meta.color + "55"
                            : C.border
                        }`,
                      }}
                    >
                      {d ? new Date(d).getDate() : ""}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
