// path: src/shared/utils.ts

import { C } from './theme';



export const STATUS_META = {
  P: { label: "Present", color: C.green },
  A: { label: "Absent", color: C.red },
  L: { label: "Leave", color: C.yellow },
  OD: { label: "On Duty", color: C.blue },
};

export const STATUS_KEYS = ["P", "A", "L", "OD"];
// Local-date formatter (no UTC shift) — avoids the midnight-IST off-by-one bug
export const toLocalISO = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
export const todayISO = () => toLocalISO(new Date());
export const daysAgoISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toLocalISO(d);
};

  // 🔴 Recent Activity helpers — module level, DashboardModule ke bahar
 
export const ACTIVITY_META = {
  LOGIN: { icon: "user", color: C.cyan, title: "System Login", desc: (d, user) => `By ${user}` },
  LOGOUT: { icon: "user", color: C.textMuted, title: "System Logout", desc: (d, user) => `By ${user}` },
  ATTENDANCE_MARKED: { 
    icon: "attendance", color: C.green, 
    title: "Student Attendance", 
    desc: (d, user) => `${d.section_name ? `Class ${d.section_name}` : "Unknown Class"}${d.count ? ` (${d.count} students)` : ""} • By ${user}` 
  },
  STAFF_ATTENDANCE_MARKED: { 
    icon: "attendance", color: C.green, 
    title: "Staff Attendance", 
    desc: (d, user) => `${d.count ? `${d.count} staff members` : "Marked"} • By ${user}` 
  },
  FEE_PAID: { 
    icon: "fee", color: C.primary, 
    title: "Fee Collected", 
    desc: (d, user) => `₹${d.amount || ""} from ${d.studentName || "Student"} • By ${user}` 
  },
  NOTICE_CREATED: { 
    icon: "warning", color: C.yellow, 
    title: "New Notice", 
    desc: (d, user) => `${d.title || "Published"} • By ${user}` 
  },
  TEST_CREATED: { 
    icon: "test", color: C.blue, 
    title: "Test Created", 
    desc: (d, user) => `${d.testName || "New test"} • By ${user}` 
  },
  EXAM_CREATED: { 
    icon: "test", color: C.blue, 
    title: "Exam Scheduled", 
    desc: (d, user) => `${d.examName || "New exam"} • By ${user}` 
  },
  STUDENT_ADDED: { 
    icon: "students", color: C.purple, 
    title: "New Admission", 
    desc: (d, user) => `${d.studentName || "Student enrolled"} • By ${user}` 
  },
  HOMEWORK_ASSIGNED: { 
    icon: "timetable", color: C.cyan, 
    title: "Homework Assigned", 
    desc: (d, user) => `${d.subject || "Subject"} • By ${user}` 
  },
};
export const timeAgo = (iso) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};


// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════

export const DAY_SHORT = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};
