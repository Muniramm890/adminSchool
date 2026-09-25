// path: src/modules/core/Sidebar.tsx

import { C } from '../../shared/theme';
import { Mark } from '../../shared/ui/Brand';
import { Icon } from '../../shared/ui/Icon';



// ═══════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════
export const NAV_ITEMS = [
  {
    group: "MAIN",
    items: [{ id: "dashboard", label: "Dashboard", icon: "dashboard" }],
  },
  {
    group: "ACADEMIC SETUP",
    items: [
      { id: "setup", label: "School Setup", icon: "setup" },
      { id: "students", label: "Students", icon: "students" },
      { id: "teachers", label: "Teachers", icon: "teachers" },
      { id: "promotion", label: "Promotion & TC", icon: "arrow_right" },
      { id: "TransportModule", label:"Transport",icon: "bus"},
      { id: "commhub", label: "Communication Hub", icon: "bell" },
    ],
  },
  {
    group: "DAILY OPS",
    items: [
      { id: "attendance", label: "Attendance", icon: "attendance" },
      { id: "arrangement", label: "Substitution", icon: "refresh" },
      { id: "timetable", label: "Timetable", icon: "timetable" },
      { id: "tests", label: "Quick Tests", icon: "test" },
      { id: "homework", label: "Homework", icon: "homework" },
    ],
  },
  {
    group: "FINANCE & RESULTS",
    items: [
      { id: "fees", label: "Fee Management", icon: "fee" },
      { id: "payroll", label: "Payroll", icon: "wallet" },
      { id: "exams", label: "Exam Management", icon: "test" },
      { id: "results", label: "Results", icon: "result" },
    ],
  },
  {
    group: "ANALYTICS",
    items: [
      { id: "leaderboard", label: "Leaderboard", icon: "trophy" },
      { id: "analytics", label: "Academic Analytics", icon: "academic" },
    ],
  },
  {
    group: "ADMINISTRATION",
    superAdminOnly: true,
    items: [
      { id: "usermanagement", label: "User Management", icon: "user" },
      { id: "auditlogs", label: "Audit Logs", icon: "attendance" },
    ],
  },
];


export const Sidebar = ({ active, onNav, collapsed, school, userRole }) => (
   <div
    style={{
      width: collapsed ? 70 : 230,
      background: C.surface,
      borderRight: `1px solid ${C.border}`,
      height: "100vh",
      overflow: "hidden auto",
      flexShrink: 0,
      transition: "width 0.3s",
      display: "flex",
      flexDirection: "column",
      position: "sticky",
      top: 0,
    }}
  >
        <div
      style={{
        padding: "18px 14px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        overflow: "hidden",
      }}
    >
      {school.logo_url ? (
        <img
          src={school.logo_url}
          alt=""
          style={{ width: 32, height: 32, borderRadius: 8, objectFit: "contain", flexShrink: 0 }}
        />
      ) : (
        <div style={{ flexShrink: 0 }}><Mark size={32} /></div>
      )}
      {!collapsed && (
        <div style={{ overflow: "hidden" }}>
          <div
            className="syne"
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: C.text,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.3,
            }}
          >
            {school.name}
          </div>
          <div
            style={{
              fontSize: 10,
              color: C.primary,
              marginTop: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {school.tagline || "smart ERP for Smart Schools"}
          </div>
        </div>
      )}
    </div>
    <div style={{ flex: 1, padding: "8px 8px", overflowY: "auto" }}>
      {NAV_ITEMS.filter((g) => !g.superAdminOnly || userRole === "school_admin").map((g) => (
        <div key={g.group}>
          {!collapsed && <div className="sidebar-group">{g.group}</div>}
          {g.items.map((item) => (
            <button
              key={item.id}
              className={`sidebar-link ${active === item.id ? "active" : ""}`}
              onClick={() => onNav(item.id)}
              title={collapsed ? item.label : ""}
            >
              <Icon name={item.icon} size={17} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </div>
      ))}
    </div>
    <div style={{ padding: 12, borderTop: `1px solid ${C.border}` }}>
      {!collapsed && (
        <div style={{ fontSize: 11, color: C.textMuted, textAlign: "center" }}>
          {school.tagline}
        </div>
      )}
    </div>
  </div>
);
