// path: src/modules/timetable/TimetableModule.tsx

import { useState, useEffect } from 'react';
import { BuildTimetableTab, TeacherWeeklyViewTab } from './TimetableTabs';
import { useSession } from '../../shared/context/AppContexts';
import { C } from '../../shared/theme';
import { SectionHeader } from '../../shared/ui/Common';



export const TimetableModule = () => {
  const [tab, setTab] = useState("build"); // 'build' | 'teacherview'
  const { academicYears, currentYear } = useSession(); // 🔴 global list, no duplicate fetch
  const [academicYearId, setAcademicYearId] = useState(""); // local override — module apna session switch kar sake

  useEffect(() => {
    if (currentYear && !academicYearId) setAcademicYearId(currentYear.id);
  }, [currentYear]); // eslint-disable-line

  return (
    <div className="slide-in">
      <SectionHeader
        title="Timetable Management"
        sub="Build weekly schedules, assign teachers, and prevent double-booking automatically"
        action={
          academicYears.length > 0 && (
            <select
              className="select"
              style={{ width: 180 }}
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
            >
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                  {y.is_current ? " (Current)" : ""}
                </option>
              ))}
            </select>
          )
        }
      />

      <div
        style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}
      >
      {[
          { id: "build", label: "Class-wise Timetable" },
          { id: "teacherview", label: "Teacher-wise View" },
        ].map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!academicYearId ? (
        <div
          className="card"
          style={{ padding: 40, textAlign: "center", color: C.textMuted }}
        >
          No academic year found. Please create one in Setup first.
        </div>
      ) : (
        <>

        {tab === "build" && (
            <BuildTimetableTab academicYearId={academicYearId} />
          )}
          {tab === "teacherview" && (
            <TeacherWeeklyViewTab academicYearId={academicYearId} />
          )}
        </>
      )}
    </div>
  );
};
