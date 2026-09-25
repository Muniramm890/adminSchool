// path: src/modules/exams/ExamTabs.tsx

import { useState, useEffect, useRef } from 'react';
import { MARK_STATUS_OPTIONS, EXAM_STATUS_META } from './examConstants';
import { useGradeSubjects } from '../setup/TeacherSubjectsAndTimetable';
import { apiRequest } from '../../shared/api';
import { C } from '../../shared/theme';
import { Modal } from '../../shared/ui/Common';
import { useDialog } from '../../shared/ui/DialogProvider';
import { Icon } from '../../shared/ui/Icon';



// ═══════════════════════════════════════════════════════════════
// DATE SHEET TAB — per exam, pick a class, tick which subjects are
// part of this exam, set date/time/marks via dropdowns+pickers.
// ═══════════════════════════════════════════════════════════════
export const DateSheetTab = ({ examId, examSections, grades }) => {
  const [sectionId, setSectionId] = useState(examSections[0]?.id || "");
  const currentSection = examSections.find((s) => s.id === sectionId);
  const gradeId = currentSection?.grade_id;
  const { subjects: classSubjects } = useGradeSubjects(gradeId);

  const [rows, setRows] = useState({}); // subject_id -> {included, exam_date, start_time, duration_minutes, max_marks, passing_marks}
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkMax, setBulkMax] = useState(80);
  const [bulkDuration, setBulkDuration] = useState(120);

  const load = async () => {
    if (!sectionId) return;
    setLoading(true);
    try {
      const res = await apiRequest(
        `/exams/${examId}/datesheet?section_id=${sectionId}`
      );
      const existing = Array.isArray(res?.data) ? res.data : [];
      const map = {};
      existing.forEach((r) => {
        map[r.subject_id] = {
          included: true,
          is_grade_only: !!r.is_grade_only, // 🔴 FIX: Checkbox state loaded from DB
          exam_date: r.exam_date?.split("T")[0] || "",
          start_time: r.start_time || "09:00",
          duration_minutes: r.duration_minutes || 120,
          max_marks: r.max_marks ?? 80,         // 🔴 FIX: Preserves 0 instead of defaulting to 80
          passing_marks: r.passing_marks ?? 33, // 🔴 FIX: Preserves 0 instead of defaulting to 33
        };
      });
      setRows(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [sectionId]); // eslint-disable-line

  const toggleRow = (subjectId) => {
    setRows((prev) => {
      const cur = prev[subjectId];
      if (cur?.included) {
        return { ...prev, [subjectId]: { ...cur, included: false } };
      }
      return {
        ...prev,
        [subjectId]: {
          included: true,
          exam_date: cur?.exam_date || "",
          start_time: cur?.start_time || "09:00",
          duration_minutes: cur?.duration_minutes || bulkDuration,
          max_marks: cur?.max_marks || bulkMax,
          passing_marks:
            cur?.passing_marks ||
            Math.round((cur?.max_marks || bulkMax) * 0.33),
        },
      };
    });
  };

  const setRowField = (subjectId, field, value) => {
    setRows((prev) => ({
      ...prev,
      [subjectId]: { ...prev[subjectId], [field]: value },
    }));
  };

  const applyBulkToAll = () => {
    setRows((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((sid) => {
        if (next[sid]?.included) {
          next[sid] = {
            ...next[sid],
            max_marks: bulkMax,
            duration_minutes: bulkDuration,
          };
        }
      });
      return next;
    });
  };

  const handleSave = async () => {
    const entries = Object.entries(rows)
      .filter(([, r]) => r.included)
      .map(([subject_id, r]) => ({
        section_id: sectionId,
        subject_id,
        exam_date: r.exam_date || null,
        start_time: r.start_time,
        duration_minutes: Number(r.duration_minutes) || 0,
        max_marks: Number(r.max_marks) || 0,
        passing_marks: Number(r.passing_marks) || 0,
        is_grade_only: !!r.is_grade_only // 
      }));

    if (entries.some((e) => !e.exam_date)) {
      alert("Please set an exam date for every ticked subject.");
      return;
    }

    setSaving(true);
    try {
      await apiRequest(`/exams/${examId}/datesheet`, "PUT", {
        section_id: sectionId,
        entries,
      });
      alert("✅ Date sheet saved!");
      await load();
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

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
              CLASS / SECTION
            </label>
            <select
              className="select"
              style={{ width: 220 }}
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
            >
              {examSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.grade_name} — {s.name}
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
              BULK MAX MARKS
            </label>
            <select
              className="select"
              style={{ width: 110 }}
              value={bulkMax}
              onChange={(e) => setBulkMax(Number(e.target.value))}
            >
              {[20, 25, 40, 50, 80, 100].map((v) => (
                <option key={v} value={v}>
                  {v}
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
              BULK DURATION
            </label>
            <select
              className="select"
              style={{ width: 130 }}
              value={bulkDuration}
              onChange={(e) => setBulkDuration(Number(e.target.value))}
            >
              {[60, 90, 120, 150, 180].map((v) => (
                <option key={v} value={v}>
                  {v} min
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-ghost" onClick={applyBulkToAll}>
            Apply to Ticked Subjects
          </button>
          <button
            className="btn btn-primary"
            style={{ marginLeft: "auto" }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Date Sheet"}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div
            className="pulse"
            style={{ padding: 30, textAlign: "center", color: C.primary }}
          >
            Loading subjects…
          </div>
        ) : classSubjects.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: C.textMuted }}>
          No subjects configured for this class. Set them up in School Setup →
          Subjects tab first.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ minWidth: 760 }}>
            <thead>
            <tr>
                <th style={{ width: 40 }}></th>
                <th>Subject</th>
                <th>Grade Only?</th> {/* 🔴 NEW COLUMN */}
                <th>Date</th>
                <th>Start Time</th>
                <th>Duration</th>
                <th>Max Marks</th>
                <th>Passing</th>
              </tr>
            </thead>
            <tbody>
              {classSubjects.map((sub) => {
                const r = rows[sub.id] || {};
                return (
                  <tr key={sub.id} style={{ background: r.is_grade_only ? `${C.yellow}11` : "transparent" }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={!!r.included}
                        onChange={() => toggleRow(sub.id)}
                        style={{
                          width: 16,
                          height: 16,
                          cursor: "pointer",
                          accentColor: C.primary,
                        }}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{sub.name}</td>
                    {/* 🔴 NEW: Grade Only Checkbox */}
                    <td>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 700, color: r.is_grade_only ? C.yellow : C.textMuted }}>
                      <input
                          type="checkbox"
                          checked={!!r.is_grade_only}
                          disabled={!r.included}
                          onChange={(e) => {
                            const isGrade = e.target.checked;
                            setRows(prev => ({
                              ...prev,
                              [sub.id]: {
                                ...prev[sub.id],
                                is_grade_only: isGrade,
                                max_marks: isGrade ? 0 : 80,
                                passing_marks: isGrade ? 0 : 26
                              }
                            }));
                          }}
                          style={{ accentColor: C.yellow }}
                        />
                        Yes
                      </label>
                    </td>
                    <td>
                      <input
                        className="input"
                        type="date"
                        style={{ width: 150 }}
                        disabled={!r.included}
                        value={r.exam_date || ""}
                        onChange={(e) =>
                          setRowField(sub.id, "exam_date", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="input"
                        type="time"
                        style={{ width: 110 }}
                        disabled={!r.included}
                        value={r.start_time || "09:00"}
                        onChange={(e) =>
                          setRowField(sub.id, "start_time", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <select
                        className="select"
                        style={{ width: 110 }}
                        disabled={!r.included}
                        value={r.duration_minutes || 120}
                        onChange={(e) =>
                          setRowField(
                            sub.id,
                            "duration_minutes",
                            e.target.value
                          )
                        }
                      >
                        {[60, 90, 120, 150, 180].map((v) => (
                          <option key={v} value={v}>
                            {v} min
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="select"
                        style={{ width: 90 }}
                        disabled={!r.included || r.is_grade_only}
                        value={r.is_grade_only ? 0 : (r.max_marks ?? 80)} // 🔴 FIX: Using ?? instead of ||
                        onChange={(e) =>
                          setRowField(sub.id, "max_marks", e.target.value)
                        }
                      >
                        {r.is_grade_only && <option value={0}>0 (NIL)</option>} {/* 🔴 FIX: Show NIL */}
                        {[20, 25, 40, 50, 80, 100].map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="select"
                        style={{ width: 90 }}
                        disabled={!r.included || r.is_grade_only}
                        value={r.is_grade_only ? 0 : (r.passing_marks ?? Math.round((r.max_marks || 80) * 0.33))}
                        onChange={(e) =>
                          setRowField(sub.id, "passing_marks", e.target.value)
                        }
                      >
                        {r.is_grade_only && <option value={0}>0 (NIL)</option>}
                        {Array.from({ length: 10 }, (_, i) =>
                          Math.round((r.max_marks || 80) * (0.2 + i * 0.05))
                        ).map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
};


  // ═══════════════════════════════════════════════════════════════
 // MARKS ENTRY TAB — FIXED WITH BULK CSV IMPORT & STRICT VALIDATION
 // ═══════════════════════════════════════════════════════════════
export const MarksEntryTab = ({ examId, examSections }) => {
  const [sectionId, setSectionId] = useState(examSections[0]?.id || "");
  const [datesheet, setDatesheet] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [roster, setRoster] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 🔴 Master Grading Scale State
  const [validGrades, setValidGrades] = useState([]);

  useEffect(() => {
    apiRequest("/setup/grading-scale")
      .then(res => {
        const scale = Array.isArray(res?.data) ? res.data : [];
        setValidGrades(scale.map(s => s.grade_label.toUpperCase()));
      })
      .catch(e => {
        console.error("Failed to load grading scale", e);
        setValidGrades(["A+", "A", "B+", "B", "C", "D", "E"]); // Fallback
      });
  }, []);

  // 🔴 CSV Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState(null); // { validPayloads: [], errors: [], previewRows: [] }
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const activeSubjectMeta = datesheet.find((d) => d.subject_id === subjectId);

  // 1. Load Datesheet (Subjects allowed for this exam)
  useEffect(() => {
    (async () => {
      if (!sectionId) return;
      try {
        const res = await apiRequest(`/exams/${examId}/datesheet?section_id=${sectionId}`);
        const list = Array.isArray(res?.data) ? res.data : [];
        setDatesheet(list);
        setSubjectId(list[0]?.subject_id || "");
      } catch (e) { console.error(e); }
    })();
  }, [sectionId, examId]);

  // 2. Load Single Subject Roster
  const loadRoster = async () => {
    if (!sectionId || !subjectId) return;
    setLoading(true);
    try {
      const res = await apiRequest(`/exams/${examId}/marks-roster?section_id=${sectionId}&subject_id=${subjectId}`);
      setRoster(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      console.error(e); setRoster([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoster(); }, [sectionId, subjectId]); // eslint-disable-line

  const setEntry = (studentId, field, value) => {
    setRoster((prev) => prev.map((r) => r.student_id === studentId ? { ...r, [field]: value } : r));
  };

  const markAllAbsent = () => {
    setRoster((prev) => prev.map((r) => ({ ...r, status: "absent", marks_obtained: 0 })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest(`/exams/${examId}/marks`, "POST", {
        exam_subject_id: activeSubjectMeta?.id,
        entries: roster.map((r) => ({
          student_id: r.student_id,
          marks_obtained: r.status === "present" ? Number(r.marks_obtained) || 0 : 0,
          status: r.status || "present",
          remarks: r.remarks || null,
        })),
      });
      alert("✅ Marks saved successfully!");
      await loadRoster();
    } catch (e) { alert("Save failed: " + e.message); } finally { setSaving(false); }
  };

  // ═══════════════════════════════════════════════════════════════
  // 🔴 BULK IMPORT LOGIC (SMART TEMPLATE & VALIDATION)
  // ═══════════════════════════════════════════════════════════════

  const downloadTemplate = async () => {
    if (!sectionId || datesheet.length === 0) return alert("Datesheet not set for this class.");
    
    // Fetch all students for this section to build the template
    let students = [];
    try {
      const res = await apiRequest(`/students?section_id=${sectionId}&limit=200`);
      students = Array.isArray(res?.data) ? res.data : [];
      
      // 🔴 FIX: Sort students strictly by Roll Number (Handles both '1,2,10' and 'A1, B1')
      students.sort((a, b) => {
        const rollA = String(a.enrolment?.roll_no || "");
        const rollB = String(b.enrolment?.roll_no || "");
        return rollA.localeCompare(rollB, undefined, { numeric: true });
      });

    } catch (e) {
      return alert("Failed to fetch students for template.");
    }

    // Prepare CSV Structure
    const headers = ["Student_ID(DO_NOT_EDIT)", "Roll_No", "Student_Name"];
    datesheet.forEach(d => headers.push(`${d.subject_name} (Max:${d.max_marks})`));

    let csvContent = headers.join(",") + "\n";

    students.forEach(s => {
      const name = [s.first_name, s.last_name].filter(Boolean).join(" ");
      const roll = s.enrolment?.roll_no || "";
      let row = [`"${s.id}"`, `"${roll}"`, `"${name}"`];
      // Empty columns for subjects
      datesheet.forEach(() => row.push(""));
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const secMeta = examSections.find(s => s.id === sectionId);
    link.href = url;
    link.download = `Marks_Template_${secMeta?.grade_name}_Sec${secMeta?.name}.csv`;
    link.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processCSV(ev.target.result);
    reader.readAsText(file);
    e.target.value = ""; // reset
  };

  const processCSV = (csvText) => {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) return alert("Invalid or empty CSV file.");

    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const subjectMap = [];
    
    headers.forEach((h, idx) => {
      if (idx < 3) return; 
      
      // 🔴 FIX: Clean up ALL double spaces and invisible characters before matching
      const rawSubName = h.split(/\s*\(/)[0]; // Splits before the first bracket, handling any spaces
      const subName = rawSubName.replace(/\s+/g, ' ').trim().toLowerCase();
      
      const matchedSubject = datesheet.find(d => 
        (d.subject_name || "").replace(/\s+/g, ' ').trim().toLowerCase() === subName
      );
      
      if (matchedSubject) {
        subjectMap.push({ index: idx, meta: matchedSubject });
      }
    });

    if (subjectMap.length === 0) return alert("No matching subjects found in CSV headers. Please use the downloaded template.");

    const errors = [];
    const previewRows = [];
    const validPayloadsBySubject = {};
    subjectMap.forEach(sm => validPayloadsBySubject[sm.meta.id] = []);

    // 🔴 FIX: Now using dynamically loaded validGrades
    const VALID_GRADES = validGrades.length > 0 ? validGrades : ["A+", "A", "B+", "B", "C", "D", "E"];

    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const studentId = vals[0];
      const studentName = vals[2] || "Unknown";

      if (!studentId || studentId.length < 5) continue;

      let rowHasError = false;
      const previewMarks = {};

      subjectMap.forEach(sm => {
        const rawMark = vals[sm.index];
        if (!rawMark || rawMark === "") return; // Skip empty cells

        let status = "present";
        let markVal = 0;
        let gradeVal = null;
        let displayVal = rawMark;

        const rawUpper = rawMark.toUpperCase();

        // 🔴 1. Check for Special Statuses (AB, L, TC)
        if (rawUpper === "AB" || rawUpper === "ABSENT") {
          status = "absent"; displayVal = "AB";
        } else if (rawUpper === "L" || rawUpper === "LEAVE") {
          status = "leave"; displayVal = "L";
        } else if (rawUpper === "TC") {
          status = "tc"; displayVal = "TC";
        } 
        // 🔴 2. If Present, check if subject is Grade-Only
        else if (sm.meta.is_grade_only) {
          if (VALID_GRADES.includes(rawUpper)) {
            gradeVal = rawUpper; displayVal = rawUpper;
          } else {
            errors.push(`Row ${i+1} (${studentName}): Invalid grade '${rawMark}' for ${sm.meta.subject_name}. Allowed: ${VALID_GRADES.join(", ")}`);
            rowHasError = true;
          }
        } 
        // 🔴 3. Standard Subject (Marks)
        else {
          markVal = parseFloat(rawMark);
          if (isNaN(markVal)) {
            errors.push(`Row ${i+1} (${studentName}): Invalid mark '${rawMark}' for ${sm.meta.subject_name}. Use AB, L, or TC if not present.`);
            rowHasError = true;
          } else if (markVal > sm.meta.max_marks || markVal < 0) {
            errors.push(`Row ${i+1} (${studentName}): ${markVal} exceeds max marks (${sm.meta.max_marks}) for ${sm.meta.subject_name}`);
            rowHasError = true;
          } else {
            displayVal = markVal;
          }
        }

        previewMarks[sm.meta.subject_name] = displayVal;

        if (!rowHasError) {
          validPayloadsBySubject[sm.meta.id].push({
            student_id: studentId,
            marks_obtained: markVal,
            grade_obtained: gradeVal,
            status: status,
            remarks: null
          });
        }
      });

      if (!rowHasError && Object.keys(previewMarks).length > 0) {
        previewRows.push({ name: studentName, marks: previewMarks });
      }
    }

    setImportData({ validPayloadsBySubject, errors, previewRows });
    setShowImportModal(true);
  };

  const confirmBulkImport = async () => {
    if (!importData) return;
    setImporting(true);
    try {
      const subjectKeys = Object.keys(importData.validPayloadsBySubject);
      let successCount = 0;

      // Smart loop: Hit existing backend API for each subject present in the CSV
      for (const examSubjectId of subjectKeys) {
        const entries = importData.validPayloadsBySubject[examSubjectId];
        if (entries.length > 0) {
          await apiRequest(`/exams/${examId}/marks`, "POST", {
            exam_subject_id: examSubjectId,
            entries: entries
          });
          successCount += entries.length;
        }
      }

      alert(`🎉 Bulk Import Successful! ${successCount} mark entries saved.`);
      setShowImportModal(false);
      setImportData(null);
      await loadRoster(); // Reload the UI grid
    } catch (e) {
      alert("Import failed during saving: " + e.message);
    } finally {
      setImporting(false);
    }
  };


  const filteredRoster = roster.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) || String(r.roll_no).includes(q);
  });

  const entered = roster.filter((r) => r.marks_obtained !== null && r.marks_obtained !== undefined).length;

  return (
    <div>
      {/* 🔴 OPTIMIZED: Compact, Responsive, One-Liner Header */}
      <div className="card" style={{ marginBottom: 16, padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          
          {/* Filters (Class, Subject, Search) */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: "1 1 50%" }}>
            <select
              className="select"
              style={{ minWidth: 160, flex: 1, padding: "8px 12px" }}
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
            >
              {examSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.grade_name} — Sec {s.name}
                </option>
              ))}
            </select>

            <select
              className="select"
              style={{ minWidth: 160, flex: 1, padding: "8px 12px" }}
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={!datesheet.length}
            >
              {datesheet.length === 0 && <option value="">No subjects found</option>}
              {datesheet.map((d) => (
                <option key={d.subject_id} value={d.subject_id}>{d.subject_name}</option>
              ))}
            </select>

            <div style={{ position: "relative", minWidth: 180, flex: 1 }}>
              <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <Icon name="search" size={14} color={C.textMuted} />
              </div>
              <input
                className="input"
                placeholder="Search student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ padding: "8px 12px 8px 32px", width: "100%" }}
              />
            </div>
          </div>

          {/* Dynamic Meta & Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginLeft: "auto" }}>
            
            {activeSubjectMeta && (
              <div style={{ display: "flex", gap: 8, fontSize: 11, background: C.surfaceAlt, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}` }}>
                <span style={{ color: C.textMuted }}>Max: <b style={{ color: C.text }}>{activeSubjectMeta.max_marks}</b></span>
                <span style={{ color: C.textMuted }}>Pass: <b style={{ color: C.text }}>{activeSubjectMeta.passing_marks}</b></span>
                <span style={{ color: C.textMuted }}>Done: <b style={{ color: C.primary }}>{entered}/{roster.length}</b></span>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              {/* 🔴 NEW: Bulk Actions */}
              <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                <button className="btn btn-ghost" style={{ border: "none", borderRadius: 0, padding: "8px 12px" }} title="Download Template" onClick={downloadTemplate}>
                  <Icon name="download" size={14} />
                </button>
                <button className="btn btn-ghost" style={{ border: "none", borderRadius: 0, borderLeft: `1px solid ${C.border}`, padding: "8px 12px" }} title="Upload CSV" onClick={() => fileRef.current?.click()}>
                  <Icon name="setup" size={14} /> CSV
                </button>
                <input type="file" accept=".csv" ref={fileRef} style={{ display: "none" }} onChange={handleFileUpload} />
              </div>

              <button className="btn btn-ghost" style={{ fontSize: 12, padding: "8px 12px" }} onClick={markAllAbsent}>Mark Absent</button>
              <button className="btn btn-primary" style={{ fontSize: 12, padding: "8px 16px" }} onClick={handleSave} disabled={saving || !activeSubjectMeta}>
                {saving ? "Saving…" : "Save Marks"}
              </button>
            </div>

          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="pulse" style={{ padding: 30, textAlign: "center", color: C.primary }}>Loading roster…</div>
        ) : !activeSubjectMeta ? (
          <div style={{ padding: 30, textAlign: "center", color: C.textMuted }}>No subjects scheduled for this class yet.</div>
        ) : filteredRoster.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: C.textMuted }}>No students found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>Roll</th>
                  <th>Student</th>
                  <th style={{ width: 160 }}>Status</th>
                  <th style={{ width: 120 }}>Marks (/{activeSubjectMeta.max_marks})</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoster.map((r) => (
                  <tr key={r.student_id}>
                    <td style={{ color: C.textMuted }}>{r.roll_no || "—"}</td>
                    <td style={{ fontWeight: 600 }}>{[r.first_name, r.last_name].filter(Boolean).join(" ")}</td>
                    <td>
                      <select className="select" value={r.status || "present"} onChange={(e) => setEntry(r.student_id, "status", e.target.value)}>
                        {MARK_STATUS_OPTIONS.map((o) => (<option key={o.v} value={o.v}>{o.l}</option>))}
                      </select>
                    </td>
                    {/* 🔴 SMART INPUT: Numbers for core subjects, Dropdown for Grade-Only */}
                    <td>
                      {activeSubjectMeta.is_grade_only ? (
                        <select
                          className="select"
                          disabled={r.status !== "present"}
                          value={r.status === "present" ? r.grade_obtained ?? "" : ""}
                          onChange={(e) => setEntry(r.student_id, "grade_obtained", e.target.value)}
                          style={{ fontWeight: 800, color: C.yellow, width: 100 }}
                        >
                          <option value="">- Grade -</option>
                          {/* 🔴 FIX: Dropdown mapped from Master Scale */}
                          {(validGrades.length > 0 ? validGrades : ["A+", "A", "B+", "B", "C", "D", "E"]).map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="input"
                          type="number"
                          min={0}
                          max={activeSubjectMeta.max_marks}
                          disabled={r.status !== "present"}
                          value={r.status === "present" ? r.marks_obtained ?? "" : 0}
                          onChange={(e) => setEntry(r.student_id, "marks_obtained", e.target.value)}
                          style={{ fontWeight: 800, color: C.primary, width: 100 }}
                        />
                      )}
                    </td>
                    <td>
                      <input className="input" placeholder="optional" value={r.remarks || ""} onChange={(e) => setEntry(r.student_id, "remarks", e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🔴 MODAL: BULK IMPORT PREVIEW & VALIDATION */}
      <Modal open={showImportModal} onClose={() => setShowImportModal(false)} title="Bulk Marks Import" width={750}>
        {importData && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: importData.errors.length > 0 ? `${C.red}11` : `${C.green}11`, borderRadius: 10, border: `1px solid ${importData.errors.length > 0 ? C.red : C.green}`, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: importData.errors.length > 0 ? C.red : C.green }}>
                {importData.errors.length > 0 ? "⚠ Validation Errors Found" : "✅ Data is valid and ready to import"}
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>
                Valid Rows: {importData.previewRows.length} | Errors: {importData.errors.length}
              </div>
            </div>

            {importData.errors.length > 0 && (
              <div style={{ background: C.surfaceAlt, border: `1px solid ${C.red}44`, borderRadius: 8, padding: 12, maxHeight: 150, overflowY: "auto", marginBottom: 16 }}>
                {importData.errors.map((err, i) => (
                  <div key={i} style={{ fontSize: 12, color: C.red, marginBottom: 4, fontWeight: 600 }}>• {err}</div>
                ))}
              </div>
            )}

            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: C.text }}>Valid Data Preview</h4>
            <div style={{ maxHeight: 300, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 8 }}>
              <table className="table" style={{ fontSize: 11 }}>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Extracted Marks (Subject-wise)</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.previewRows.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {Object.entries(r.marks).map(([sub, mark]) => (
                            <span key={sub} style={{ background: C.surfaceAlt, padding: "2px 6px", borderRadius: 4, border: `1px solid ${C.border}` }}>
                              {sub}: <b style={{ color: C.primary }}>{mark}</b>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {importData.previewRows.length === 0 && (
                    <tr><td colSpan={2} style={{ textAlign: "center", color: C.textMuted, padding: 20 }}>No valid data found to import.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setShowImportModal(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={confirmBulkImport} 
                disabled={importing || importData.previewRows.length === 0 || importData.errors.length > 0}
                style={{ opacity: (importing || importData.previewRows.length === 0 || importData.errors.length > 0) ? 0.6 : 1 }}
              >
                {importing ? "Importing..." : "Confirm & Import Marks"}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// RESULTS & PUBLISH TAB
// ═══════════════════════════════════════════════════════════════
export const ResultsPublishTab = ({ exam, examSections, onExamUpdated }) => {
  const { dialogConfirm } = useDialog();
  const [sectionId, setSectionId] = useState(examSections[0]?.id || "");
  const [results, setResults] = useState([]);
  const [subjectCols, setSubjectCols] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // student row to reset
  const [confirmPublish, setConfirmPublish] = useState(false);

  const load = async () => {
    if (!sectionId) return;
    setLoading(true);
    try {
      const res = await apiRequest(
        `/exams/${exam.id}/results?section_id=${sectionId}`
      );
      setResults(Array.isArray(res?.data?.rows) ? res.data.rows : []);
      setSubjectCols(
        Array.isArray(res?.data?.subjects) ? res.data.subjects : []
      );
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [sectionId]); // eslint-disable-line

      // 🔴 FIXED: Now points to the unified Result Engine and passes section_id
  const handleProcess = async () => {
    if (!sectionId) return alert("Please select a class/section first.");
    if (!(await dialogConfirm("Compute/Recompute results for this specific class?", "Recompute Results"))) return;
    setProcessing(true);
    try {
      // 🔴 Nayi API jo section_id ke sath hit hogi
      const res = await apiRequest(`/results/compute/${exam.id}`, "POST", {
        section_id: sectionId, 
      });
      await load(); // Table reload
      alert(`✅ ${res?.message || "Results computed successfully!"}`);
    } catch (e) {
      alert("Processing failed: " + e.message);
    } finally {
      setProcessing(false);
    }
  };

  const handlePublish = async (publish) => {
    try {
      await apiRequest(
        `/exams/${exam.id}/${publish ? "publish" : "unpublish"}`,
        "PUT"
      );
      onExamUpdated({ ...exam, status: publish ? "published" : "completed" });
      setConfirmPublish(false);
    } catch (e) {
      alert("Failed: " + e.message);
    }
  };

  const handleDeleteResult = async () => {
    if (!confirmDelete) return;
    try {
      await apiRequest(
        `/exams/${exam.id}/results/${confirmDelete.student_id}`,
        "DELETE"
      );
      setConfirmDelete(null);
      await load();
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  };

  const gradeColor = (g) => {
    if (["A+", "A"].includes(g)) return C.green;
    if (["B+", "B"].includes(g)) return C.blue;
    if (g === "C") return C.yellow;
    return C.red;
  };

  const passCount = results.filter((r) => r.percentage >= 33).length;
  const gradeDist = ["A+", "A", "B+", "B", "C", "D", "F"]
    .map((g) => ({
      name: g,
      value: results.filter((r) => r.grade === g).length,
    }))
    .filter((d) => d.value > 0);

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <select
            className="select"
            style={{ width: 220 }}
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
          >
            {examSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.grade_name} — {s.name}
              </option>
            ))}
          </select>
          <span
            className="badge"
            style={{
              background: `${EXAM_STATUS_META[exam.status]?.color}22`,
              color: EXAM_STATUS_META[exam.status]?.color,
            }}
          >
            {EXAM_STATUS_META[exam.status]?.label}
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              className="btn btn-ghost"
              onClick={handleProcess}
              disabled={processing}
            >
              {processing ? "Computing…" : "Process / Recompute Results"}
            </button>
            {exam.status === "published" ? (
              <button
                className="btn btn-ghost"
                onClick={() => handlePublish(false)}
              >
                Unpublish (Edit Mode)
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => setConfirmPublish(true)}
                disabled={results.length === 0}
              >
                Publish Results
              </button>
            )}
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div
          className="grid-2"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: 20,
            marginBottom: 20,
          }}
        >
          <div className="card">
            <h3
              className="syne"
              style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}
            >
              Grade Distribution
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={gradeDist}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {gradeDist.map((d, i) => (
                    <Cell key={i} fill={gradeColor(d.name)} />
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
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div
            className="card"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 14,
            }}
          >
            {[
              ["Students", results.length, C.blue],
              ["Passed", passCount, C.green],
              [
                "Pass Rate",
                `${Math.round((passCount / results.length) * 100)}%`,
                C.primary,
              ],
              [
                "Class Topper",
                `${Math.max(...results.map((r) => r.percentage))}%`,
                C.yellow,
              ],
            ].map(([l, v, c]) => (
              <div
                key={l}
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span style={{ fontSize: 12, color: C.textMuted }}>{l}</span>
                <span
                  className="syne"
                  style={{ fontSize: 16, fontWeight: 800, color: c }}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div
            className="pulse"
            style={{ padding: 30, textAlign: "center", color: C.primary }}
          >
            Loading results…
          </div>
        ) : results.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: C.textMuted }}>
            No results yet — enter marks for all subjects, then click "Process /
            Recompute Results".
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Student</th>
                  {subjectCols.map((s) => (
                    <th key={s.id} style={{ fontSize: 10 }}>
                      {s.name}
                    </th>
                  ))}
                  <th>Total</th>
                  <th>%</th>
                  <th>Grade</th>
                  <th>Rank</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.student_id}>
                    <td style={{ color: C.textMuted }}>{r.roll_no || "—"}</td>
                    <td style={{ fontWeight: 600 }}>
                      {[r.first_name, r.last_name].filter(Boolean).join(" ")}
                    </td>
                    {subjectCols.map((s) => {
                    const markData = r.marks?.[s.id];
                    return (
                      <td 
                        key={s.id} 
                        style={{ 
                          fontSize: 12, 
                          color: markData?.status && markData.status !== 'present' ? C.red : C.text,
                          fontWeight: markData?.status && markData.status !== 'present' ? 700 : 400
                        }}
                      >
                        {markData?.val ?? "—"}
                      </td>
                    );
                  })}
                    <td className="syne" style={{ fontWeight: 700 }}>
                      {r.total_marks}/{r.max_total}
                    </td>
                    <td
                      className="syne"
                      style={{
                        fontWeight: 700,
                        color:
                          r.percentage >= 60
                            ? C.green
                            : r.percentage >= 33
                            ? C.yellow
                            : C.red,
                      }}
                    >
                      {r.percentage}%
                    </td>
                    <td>
                      <span
                        style={{
                          background: `${gradeColor(r.grade)}22`,
                          color: gradeColor(r.grade),
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {r.grade}
                      </span>
                    </td>
                    <td>#{r.class_rank}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        style={{ padding: "4px 8px" }}
                        title="Delete this student's result"
                        onClick={() => setConfirmDelete(r)}
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm publish */}
      <Modal
        open={confirmPublish}
        onClose={() => setConfirmPublish(false)}
        title="Publish Results?"
        width={420}
      >
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📢</div>
          <div
            style={{
              color: C.textMuted,
              fontSize: 13,
              marginBottom: 22,
              lineHeight: 1.6,
            }}
          >
            Once published, this class's results become final and visible on
            report cards. You can unpublish later to make corrections.
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              className="btn btn-ghost"
              onClick={() => setConfirmPublish(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handlePublish(true)}
            >
              Yes, Publish
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete one student's result */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Result?"
        width={420}
      >
        {confirmDelete && (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>⚠️</div>
            <div
              style={{
                color: C.textMuted,
                fontSize: 13,
                marginBottom: 22,
                lineHeight: 1.6,
              }}
            >
              This will remove the processed result for{" "}
              <b style={{ color: C.text }}>
                {confirmDelete.first_name} {confirmDelete.last_name}
              </b>
              . Their entered marks stay intact — you can recompute anytime.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                className="btn btn-ghost"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteResult}>
                Delete Result
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// GRADING SCALE TAB — school-wide grade bands, add/remove rows
// ═══════════════════════════════════════════════════════════════
export const GradingScaleTab = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/setup/grading-scale");
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(
        data.length
          ? data
          : [
              { grade_label: "A+", min_percent: 90, max_percent: 100 },
              { grade_label: "A", min_percent: 80, max_percent: 89 },
              { grade_label: "B+", min_percent: 70, max_percent: 79 },
              { grade_label: "B", min_percent: 60, max_percent: 69 },
              { grade_label: "C", min_percent: 50, max_percent: 59 },
              { grade_label: "D", min_percent: 33, max_percent: 49 },
              { grade_label: "F", min_percent: 0, max_percent: 32 },
            ]
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const updateRow = (i, field, value) => {
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r))
    );
  };

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      { grade_label: "", min_percent: 0, max_percent: 0 },
    ]);
  const removeRow = (i) =>
    setRows((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest("/setup/grading-scale", "PUT", { scale: rows });
      alert("✅ Grading scale saved!");
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div
        className="pulse"
        style={{ padding: 30, textAlign: "center", color: C.primary }}
      >
        Loading…
      </div>
    );

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <div>
          <h3 className="syne" style={{ fontSize: 15, fontWeight: 700 }}>
            Grading Scale
          </h3>
          <p style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>
            Used to auto-assign grades when results are processed.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={addRow}>
          <Icon name="plus" size={13} /> Add Band
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Grade Label</th>
            <th>Min %</th>
            <th>Max %</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>
                <input
                  className="input"
                  style={{ width: 90 }}
                  value={r.grade_label}
                  onChange={(e) => updateRow(i, "grade_label", e.target.value)}
                />
              </td>
              <td>
                <select
                  className="select"
                  style={{ width: 90 }}
                  value={r.min_percent}
                  onChange={(e) =>
                    updateRow(i, "min_percent", Number(e.target.value))
                  }
                >
                  {Array.from({ length: 21 }, (_, k) => k * 5).map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  className="select"
                  style={{ width: 90 }}
                  value={r.max_percent}
                  onChange={(e) =>
                    updateRow(i, "max_percent", Number(e.target.value))
                  }
                >
                  {Array.from({ length: 21 }, (_, k) => k * 5).map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <button
                  className="btn btn-danger"
                  style={{ padding: "4px 8px" }}
                  onClick={() => removeRow(i)}
                >
                  <Icon name="trash" size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div
        style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}
      >
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Grading Scale"}
        </button>
      </div>
    </div>
  );
};
