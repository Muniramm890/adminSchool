// path: src/modules/teachers/TeachersModule.tsx

import { useState, useRef, useEffect } from 'react';
import { TeacherSubjectsAndTimetable } from '../setup/TeacherSubjectsAndTimetable';
import { Avatar, TeacherCard } from './TeacherCard';
import { apiRequest } from '../../shared/api';
import { useSession, uploadToCloudinary } from '../../shared/context/AppContexts';
import { C } from '../../shared/theme';
import { FormGrid, FormRow, FF, SectionHeader, Modal } from '../../shared/ui/Common';
import { Icon } from '../../shared/ui/Icon';



export const TeachersModule = () => {
  // ── Core data ────────────────────────────────────────────────
  const [teachers, setTeachers] = useState([]);
  const { academicYears: academicYrs, currentYear } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Filters / view ───────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  // ── Modals ───────────────────────────────────────────────────
  const [modal, setModal] = useState(null); // 'add'|'edit'|'view'|'terminate'|'bulk'
  const [activeTab, setActiveTab] = useState("personal");
  const [selected, setSelected] = useState(null);
  const [viewDetail, setViewDetail] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // ── Bulk import ──────────────────────────────────────────────
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkProgress, setBulkProgress] = useState(null);
  const [bulkDone, setBulkDone] = useState(false);
  const fileRef = useRef(null);

  // ── Blank form ───────────────────────────────────────────────
  const blankForm = () => ({
    full_name: "",
    email: "",
    phone: "",
    gender: "",
    password: "",
    employee_code: "",
    join_date: new Date().toISOString().split("T")[0],
    department: "",
    designation: "",
    qualification: "",
    experience_years: 0,
    is_active: true,
    date_of_birth: "",
    avatar_url: "",
  });
  const [form, setForm] = useState(blankForm());
  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // 🔴 Photo Upload State & Handler
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingPhoto(true);
    try {
      // Direct cloud pe jayega aur URL laayega
      const secureUrl = await uploadToCloudinary(file);
      setF("avatar_url", secureUrl); // Form me URL save kar diya
    } catch (err) {
      alert("Failed to upload photo. Check Cloudinary details.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ── Load ─────────────────────────────────────────────────────
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const tRes = await apiRequest("/teachers");
      setTeachers(Array.isArray(tRes?.data) ? tRes.data : []);
    } catch (e) {
      console.error("Failed to load teachers", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived data ─────────────────────────────────────────────
  const departments = Array.from(
    new Set(teachers.map((t) => t.department).filter(Boolean))
  ).sort();
  

  const filtered = teachers.filter((t) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      t.full_name?.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.employee_code?.toLowerCase().includes(q);
    const matchDept = !filterDept || t.department === filterDept;
    const matchStatus =
      filterStatus === "active"
        ? t.is_active
        : filterStatus === "inactive"
        ? !t.is_active
        : true;
    return matchSearch && matchDept && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 0;
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [search, filterDept, filterStatus]);

  const statTotal = teachers.length;
  const statActive = teachers.filter((t) => t.is_active).length;
  const statDepts = departments.length;

  // ── Open modals ──────────────────────────────────────────────
  const openAdd = () => {
    setForm(blankForm());
    setActiveTab("personal");
    setModal("add");
  };

  const openEdit = (t) => {
    setForm({
      ...blankForm(),
      full_name: t.full_name || "",
      email: t.email || "",
      phone: t.phone || "",
      gender: t.gender || "",
      employee_code: t.employee_code || "",
      join_date: t.join_date?.split("T")[0] || "",
      department: t.department || "",
      designation: t.designation || "",
      qualification: t.qualification || "",
      experience_years: t.experience_years || 0,
      is_active: t.is_active !== undefined ? Boolean(t.is_active) : true,
      date_of_birth: t.date_of_birth?.split("T")[0] || "",
      avatar_url: t.avatar_url || "", // 🔴 Purani photo form mein set hogi
    });
    setSelected(t);
    setActiveTab("personal");
    setModal("edit");
  };

  const openView = async (t) => {
    setSelected(t);
    setViewDetail(null);
    setModal("view");
    setViewLoading(true);
    try {
      const res = await apiRequest(`/teachers/${t.user_id}`);
      setViewDetail(res?.data || t);
    } catch (e) {
      setViewDetail(t);
    } finally {
      setViewLoading(false);
    }
  };

  const openTerminate = (t) => {
    setSelected(t);
    setModal("terminate");
  };

  // ── Save (create / edit) ────────────────────────────────────
  const handleSave = async () => {
    if (!form.full_name?.trim() || !form.email?.trim()) {
      alert("Full name and email are required.");
      return;
    }
    setSaving(true);
    try {
      if (modal === "edit" && selected?.user_id) {
        await apiRequest(`/teachers/${selected.user_id}`, "PUT", {
          full_name: form.full_name.trim(),
          phone: form.phone ? String(form.phone).trim() : null,
          gender: form.gender || null,
          employee_code: form.employee_code ? String(form.employee_code).trim() : null,
          department: form.department || null,
          designation: form.designation || null,
          is_active: Boolean(form.is_active),
          date_of_birth: form.date_of_birth || null,
          avatar_url: form.avatar_url || null,
          qualification: form.qualification || null,
          experience_years: Number(form.experience_years) || 0,
        });
      } else {
        await apiRequest("/teachers", "POST", {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone ? String(form.phone).trim() : null,
          gender: form.gender || null,
          password: form.password?.trim() || undefined,
          employee_code: form.employee_code ? String(form.employee_code).trim() : null,
          join_date: form.join_date || null,
          department: form.department || null,
          designation: form.designation || null,
          qualification: form.qualification || null,
          experience_years: Number(form.experience_years) || 0,
          date_of_birth: form.date_of_birth || null,
          avatar_url: form.avatar_url || null, // 🔴 Naye teacher ke liye avatar_url add kiya
        });
      }
      setModal(null);
      await loadAll();
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Terminate / reactivate ──────────────────────────────────
  const handleTerminate = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiRequest(`/teachers/${selected.user_id}`, "DELETE");
      setModal(null);
      await loadAll();
    } catch (e) {
      alert("Termination failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async (t) => {
    try {
      await apiRequest(`/teachers/${t.user_id}`, "PUT", {
        full_name: t.full_name,
        phone: t.phone,
        gender: t.gender,
        employee_code: t.employee_code,
        department: t.department,
        designation: t.designation,
        is_active: true,
      });
      await loadAll();
    } catch (e) {
      alert("Reactivation failed: " + e.message);
    }
  };

  // ── Bulk CSV import ──────────────────────────────────────────
  const BULK_COLS = [
    "full_name",
    "email",
    "phone",
    "gender",
    "password",
    "employee_code",
    "join_date",
    "department",
    "designation",
    "qualification",
    "experience_years",
  ];

  const parseBulkCsv = (text) => {
    const lines = text.trim().split("\n");
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    return lines
      .slice(1)
      .map((line, i) => {
        const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
        const row = {};
        BULK_COLS.forEach((col, ci) => {
          const hi = header.indexOf(col);
          row[col] = hi >= 0 ? vals[hi] : vals[ci] || "";
        });
        row._line = i + 2;
        row._errors = [];
        if (!row.full_name) row._errors.push("full_name required");
        if (!row.email || !row.email.includes("@"))
          row._errors.push("valid email required");
        return row;
      })
      .filter((r) => r.full_name || r.email);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBulkRows(parseBulkCsv(ev.target.result));
      setBulkProgress(null);
      setBulkDone(false);
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    const valid = bulkRows.filter((r) => r._errors.length === 0);
    if (!valid.length) {
      alert("No valid rows to import.");
      return;
    }
    setBulkProgress({ done: 0, total: valid.length, failed: [] });
    setBulkDone(false);
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let i = 0; i < valid.length; i++) {
      const row = valid[i];
      try {
        await apiRequest("/teachers", "POST", {
          full_name: row.full_name,
          email: row.email,
          phone: row.phone || null,
          gender: row.gender || null,
          password: row.password || undefined,
          employee_code: row.employee_code || null,
          join_date: row.join_date || null,
          department: row.department || null,
          designation: row.designation || null,
          qualification: row.qualification || null,
          experience_years: Number(row.experience_years) || 0,
        });
        setBulkProgress((p) => ({ ...p, done: p.done + 1 }));
      } catch (e) {
        setBulkProgress((p) => ({
          ...p,
          done: p.done + 1,
          failed: [...p.failed, { ...row, _err: e.message }],
        }));
      }
      if ((i + 1) % 10 === 0) await sleep(1000);
    }

    setBulkDone(true);
    await loadAll();
  };

  const downloadFailedCsv = (failed) => {
    const lines = [
      [...BULK_COLS, "error_reason"].join(","),
      ...failed.map((r) =>
        [
          ...BULK_COLS.map(
            (c) => `"${(r[c] || "").toString().replace(/"/g, '""')}"`
          ),
          `"${r._err}"`,
        ].join(",")
      ),
    ];
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(lines.join("\n"));
    a.download = "failed_teachers_import.csv";
    a.click();
  };

  const downloadTemplate = () => {
    const lines = [
      BULK_COLS.join(","),
      "Ramesh Kumar Sharma,ramesh@school.edu,9876543210,Male,,EMP001,2023-04-01,Mathematics,PGT Mathematics,M.Sc B.Ed,8",
      "Sunita Devi,sunita@school.edu,9812345678,Female,,EMP002,2023-04-01,Science,TGT Science,B.Sc B.Ed,5",
    ];
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(lines.join("\n"));
    a.download = "teacher_import_template.csv";
    a.click();
  };

  // ── UI helpers ─────────────────────────────────────────────
  // 🔴 FIX: TabBtn is a plain function — always call as TabBtn({...}),
  // never as <TabBtn/>. Prevents input remount on every keystroke.
  const TabBtn = ({ id, label, icon }) => (
    <button
      key={id}
      onClick={() => setActiveTab(id)}
      style={{
        padding: "7px 13px",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        fontFamily: "'DM Sans',sans-serif",
        fontSize: 12.5,
        fontWeight: 600,
        background: activeTab === id ? `${C.primary}22` : "transparent",
        color: activeTab === id ? C.primary : C.textMuted,
        borderBottom:
          activeTab === id ? `2px solid ${C.primary}` : "2px solid transparent",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      <Icon name={icon} size={13} />
      {label}
    </button>
  );

  // 🔴 FIX: FormBody is a plain function — always call as {FormBody()},
  // never as <FormBody/>. This is what stops the cursor from jumping
  // out of the "Add Teacher" / "Edit Teacher" inputs after one letter.
  const FormBody = () => (
    <div>
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 16,
          borderBottom: `1px solid ${C.border}44`,
          flexWrap: "wrap",
        }}
      >
        {TabBtn({ id: "personal", label: "Personal", icon: "user" })}
        {TabBtn({ id: "employment", label: "Employment", icon: "academic" })}
        {TabBtn({ id: "profile", label: "Photo", icon: "dashboard" })}
        {modal === "add" &&
          TabBtn({ id: "security", label: "Password", icon: "setup" })}
      </div>

      {activeTab === "personal" && (
        <div>
          <FormGrid cols={2}>
            <FormRow label="Full Name *">
              <input
                className="input"
                value={form.full_name}
                onChange={(e) => setF("full_name", e.target.value)}
              />
            </FormRow>
            <FormRow label="Official Email *">
              <input
                className="input"
                type="email"
                value={form.email}
                disabled={modal === "edit"}
                style={modal === "edit" ? { opacity: 0.6 } : {}}
                onChange={(e) => setF("email", e.target.value)}
              />
            </FormRow>
          </FormGrid>
          <FormGrid cols={3}>
            <FF
              form={form}
              setF={setF}
              label="Phone / WhatsApp"
              name="phone"
              type="tel"
            />
            <FF
              form={form}
              setF={setF}
              label="Gender"
              name="gender"
              options={["", "Male", "Female", "Other"]}
            />
            <FF
              form={form}
              setF={setF}
              label="Date of Birth"
              name="date_of_birth"
              type="date"
              hint="Saved once backend adds this to update()"
            />
          </FormGrid>
        </div>
      )}

      {activeTab === "employment" && (
        <div>
          <FormGrid cols={2}>
            <FF
              form={form}
              setF={setF}
              label="Employee Code"
              name="employee_code"
              placeholder="EMP-001"
            />
            <FF
              form={form}
              setF={setF}
              label="Date of Joining"
              name="join_date"
              type="date"
            />
          </FormGrid>
          <FormGrid cols={2}>
            <FF
              form={form}
              setF={setF}
              label="Department"
              name="department"
              placeholder="Mathematics"
            />
            <FF
              form={form}
              setF={setF}
              label="Designation"
              name="designation"
              placeholder="PGT Mathematics"
            />
          </FormGrid>
          <FormGrid cols={2}>
            <FF
              form={form}
              setF={setF}
              label="Qualification"
              name="qualification"
              placeholder="M.Sc, B.Ed"
            />
            <FF
              form={form}
              setF={setF}
              label="Experience (Years)"
              name="experience_years"
              type="number"
            />
          </FormGrid>
          {modal === "edit" && (
            <FF
              form={form}
              setF={setF}
              label="Active Staff Member"
              name="is_active"
              type="checkbox"
            />
          )}
        </div>
      )}

    {activeTab === "profile" && (
        <div style={{ padding: "10px 0" }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 24, 
            background: C.surfaceAlt, 
            padding: 24, 
            borderRadius: 16, 
            border: `1px solid ${C.border}` 
          }}>
            {/* Live Preview Avatar */}
            <Avatar
              teacher={{
                avatar_url: form.avatar_url,
                full_name: form.full_name,
                gender: form.gender,
              }}
              size={80}
            />
            
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                Profile Photo
              </div>
              
              {/* Hidden File Input */}
              <input 
                type="file" 
                id="photo-upload" 
                accept="image/*" 
                style={{ display: "none" }} 
                onChange={handlePhotoUpload} 
                disabled={uploadingPhoto}
              />
              
              {/* Styled Upload Button */}
              <label 
                htmlFor="photo-upload" 
                className="btn btn-primary" 
                style={{ 
                  cursor: uploadingPhoto ? "wait" : "pointer", 
                  opacity: uploadingPhoto ? 0.7 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {uploadingPhoto ? (
                  <><span className="pulse" style={{ width: 8, height: 8, background: "#fff", borderRadius: "50%" }}/> Uploading...</>
                ) : (
                  <><Icon name="plus" size={14} /> Select Photo</>
                )}
              </label>
              
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 8 }}>
                Recommended: Square JPG or PNG, max 2MB.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "security" && modal === "add" && (
        <div>
          <div
            style={{
              padding: "12px 14px",
              background: `${C.blue}11`,
              border: `1px solid ${C.blue}22`,
              borderRadius: 10,
              marginBottom: 16,
              fontSize: 12,
              color: C.textMuted,
              lineHeight: 1.7,
            }}
          >
            Leave blank to use the default password (<b>teacher123</b>). Teacher
            can change it after first login.
          </div>
          <FormRow label="Initial Password">
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => setF("password", e.target.value)}
              placeholder="auto: teacher123"
            />
          </FormRow>
        </div>
      )}
    </div>
  );

  // ── RENDER ───────────────────────────────────────────────────
  return (
    <div className="slide-in">
      <SectionHeader
        title="Teacher & Staff Directory"
        sub={`${statTotal} staff on record`}
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setBulkRows([]);
                setBulkProgress(null);
                setBulkDone(false);
                setModal("bulk");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
              }}
            >
              <Icon name="download" size={14} /> Bulk Import
            </button>
            <button
              className="btn btn-primary"
              onClick={openAdd}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
              }}
            >
              <Icon name="plus" size={14} /> Add Teacher
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div
        className="grid-4"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 12,
          marginBottom: 18,
        }}
      >
        {[
          {
            label: "Total Staff",
            value: loading ? "—" : statTotal,
            color: C.blue,
            icon: "teachers",
          },
          {
            label: "Active",
            value: loading ? "—" : statActive,
            color: C.green,
            icon: "check",
          },
          {
            label: "Departments",
            value: loading ? "—" : statDepts,
            color: C.purple,
            icon: "academic",
          },
        ].map((k, i) => (
          <div key={i} className="kpi-card" style={{ padding: "14px 16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: C.textMuted,
                    textTransform: "uppercase",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    marginBottom: 4,
                  }}
                >
                  {k.label}
                </div>
                <div
                  className="syne"
                  style={{ fontSize: 26, fontWeight: 800, color: C.text }}
                >
                  {k.value}
                </div>
              </div>
              <div
                style={{
                  background: `${k.color}22`,
                  padding: 10,
                  borderRadius: 10,
                  color: k.color,
                }}
              >
                <Icon name={k.icon} size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="card" style={{ marginBottom: 14, padding: "12px 16px" }}>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <div
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <Icon name="search" size={14} color={C.textMuted} />
            </div>
            <input
              className="input"
              placeholder="Search by name, email, employee code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 32 }}
            />
          </div>
          <select
            className="select"
            style={{ width: 160 }}
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            className="select"
            style={{ width: 130 }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Terminated</option>
            <option value="">All</option>
          </select>
          <div
            style={{
              display: "flex",
              background: C.surfaceAlt,
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
              marginLeft: "auto",
            }}
          >
            {[
              ["grid", "chart"],
              ["table", "result"],
            ].map(([m, icon]) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                style={{
                  padding: "7px 11px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                  background: viewMode === m ? `${C.primary}22` : "transparent",
                  color: viewMode === m ? C.primary : C.textMuted,
                }}
              >
                <Icon name={icon} size={14} />
              </button>
            ))}
          </div>
          <div
            style={{
              fontSize: 12,
              color: C.textMuted,
              fontWeight: 600,
              minWidth: 70,
            }}
          >
            {filtered.length} found
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div
          style={{
            padding: 60,
            textAlign: "center",
            color: C.primary,
            fontWeight: 600,
          }}
        >
          <div className="pulse">Loading staff records…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 50, textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>👨‍🏫</div>
          <div
            className="syne"
            style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}
          >
            No staff found
          </div>
          <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 18 }}>
            {teachers.length === 0
              ? "Add your first teacher to get started."
              : "Adjust filters to see results."}
          </div>
          {teachers.length === 0 && (
            <button className="btn btn-primary" onClick={openAdd}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="plus" size={14} /> Add Teacher
              </span>
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          {pageData.map((t) =>
            TeacherCard({
              t,
              onView: openView,
              onEdit: openEdit,
              onTerminate: openTerminate,
              onReactivate: handleReactivate,
            })
          )}
        </div>
      ) : (
        <div
          className="card"
          style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}
        >
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}></th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Qualification</th>
                  <th>Exp</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((t) => (
                  <tr key={t.user_id}>
                    <td>
                      <Avatar teacher={t} size={32} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {t.full_name}
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>
                        {t.email}
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{t.department || "—"}</td>
                    <td style={{ fontSize: 12 }}>{t.designation || "—"}</td>
                    <td
                      style={{
                        fontSize: 12,
                        maxWidth: 140,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.qualification || "—"}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {t.experience_years != null
                        ? `${t.experience_years}y`
                        : "—"}
                    </td>
                    <td style={{ fontSize: 12, fontFamily: "monospace" }}>
                      {t.phone || "—"}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          t.is_active ? "badge-green" : "badge-red"
                        }`}
                      >
                        {t.is_active ? "Active" : "Terminated"}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: 4,
                          justifyContent: "center",
                        }}
                      >
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "4px 7px" }}
                          onClick={() => openView(t)}
                        >
                          <Icon name="eye" size={12} />
                        </button>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "4px 7px" }}
                          onClick={() => openEdit(t)}
                        >
                          <Icon name="edit" size={12} />
                        </button>
                        {t.is_active ? (
                          <button
                            className="btn btn-danger"
                            style={{ padding: "4px 7px" }}
                            onClick={() => openTerminate(t)}
                          >
                            <Icon name="trash" size={12} />
                          </button>
                        ) : (
                          <button
                            className="btn btn-success"
                            style={{ padding: "4px 7px" }}
                            onClick={() => handleReactivate(t)}
                          >
                            <Icon name="check" size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 4px",
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 12, color: C.textMuted }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className="btn btn-ghost"
              style={{ padding: "5px 12px", fontSize: 12 }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = page <= 3 ? i + 1 : page + i - 2;
              if (pg < 1 || pg > totalPages) return null;
              return (
                <button
                  key={pg}
                  className="btn btn-ghost"
                  onClick={() => setPage(pg)}
                  style={{
                    padding: "5px 10px",
                    fontSize: 12,
                    background: pg === page ? `${C.primary}22` : "transparent",
                    color: pg === page ? C.primary : C.textMuted,
                  }}
                >
                  {pg}
                </button>
              );
            })}
            <button
              className="btn btn-ghost"
              style={{ padding: "5px 12px", fontSize: 12 }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ════ MODAL: ADD / EDIT ════ */}
      <Modal
        open={modal === "add" || modal === "edit"}
        onClose={() => setModal(null)}
        title={
          modal === "edit" ? `Edit: ${selected?.full_name}` : "Add New Teacher"
        }
        width={680}
      >
        {FormBody()}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 20,
            justifyContent: "flex-end",
            borderTop: `1px solid ${C.border}33`,
            paddingTop: 16,
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={() => setModal(null)}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ minWidth: 150, opacity: saving ? 0.7 : 1 }}
          >
            {saving
              ? "Saving…"
              : modal === "edit"
              ? "Update Profile"
              : "Create Staff Account"}
          </button>
        </div>
      </Modal>

      {/* ════ MODAL: VIEW ════ */}
      <Modal
        open={modal === "view"}
        onClose={() => setModal(null)}
        title="Staff Profile"
        width={700}
      >
        {viewLoading ? (
          <div
            style={{ padding: 40, textAlign: "center", color: C.primary }}
            className="pulse"
          >
            Loading profile…
          </div>
        ) : (
          viewDetail &&
          (() => {
            const t = viewDetail;
            return (
              <div>
                <div
                  style={{
                    background: `linear-gradient(135deg,${C.surfaceAlt},${C.surface})`,
                    border: `1px solid ${C.border}`,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 18,
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <Avatar teacher={t} size={72} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="syne"
                        style={{ fontSize: 20, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      >
                        {t.full_name}
                      </div>
                      <div
                        style={{
                          color: C.primary,
                          fontWeight: 600,
                          fontSize: 14,
                          marginTop: 2,
                        }}
                      >
                        {t.designation || "Teacher"}
                        {t.department && (
                          <span style={{ color: C.textMuted, fontWeight: 400 }}>
                            {" "}
                            · {t.department}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          color: C.textMuted,
                          fontSize: 12,
                          marginTop: 4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.email}
                        {t.phone && <span> · {t.phone}</span>}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          marginTop: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        {t.is_active ? (
                          <span className="badge badge-green">Active</span>
                        ) : (
                          <span className="badge badge-red">Terminated</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  {[
                    ["Employee Code", t.employee_code || "—"],
                    [
                      "Experience",
                      t.experience_years != null
                        ? `${t.experience_years} years`
                        : "—",
                    ],
                    ["Qualification", t.qualification || "—"],
                    ["Gender", t.gender || "—"],
                    [
                      "Joined",
                      t.join_date
                        ? new Date(t.join_date).toLocaleDateString("en-IN")
                        : "—",
                    ],
                    [
                      "Date of Birth",
                      t.date_of_birth
                        ? new Date(t.date_of_birth).toLocaleDateString("en-IN")
                        : "Not set",
                    ],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        background: C.surfaceAlt,
                        borderRadius: 8,
                        padding: "8px 12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: C.textMuted,
                          textTransform: "uppercase",
                          fontWeight: 700,
                        }}
                      >
                        {k}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          marginTop: 2,
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

                {/* Read-only viewer — subjects/timetable already assigned elsewhere.
                    This is informational only, NOT part of the assignment system,
                    so it stays. */}
                <TeacherSubjectsAndTimetable
                  teacher={t}
                  academicYearId={currentYear?.id}
                />

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                    marginTop: 8,
                  }}
                >
                  <button
                    className="btn btn-ghost"
                    onClick={() => setModal(null)}
                  >
                    Close
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setModal(null);
                      openEdit(t);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Icon name="edit" size={13} /> Edit Profile
                  </button>
                </div>
              </div>
            );
          })()
        )}
      </Modal>

      {/* ════ MODAL: TERMINATE ════ */}
      <Modal
        open={modal === "terminate"}
        onClose={() => setModal(null)}
        title="Terminate Staff Member"
        width={460}
      >
        {selected && (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ marginBottom: 16 }}>
              <Avatar teacher={selected} size={60} />
            </div>
            <div
              className="syne"
              style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}
            >
              {selected.full_name}
            </div>
            <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 6 }}>
              {selected.designation || "Teacher"} · {selected.department || ""}
            </div>
            <div
              style={{
                padding: "12px 16px",
                background: `${C.red}11`,
                border: `1px solid ${C.red}22`,
                borderRadius: 10,
                marginBottom: 20,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: C.red,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                ⚠ This will:
              </div>
              <div
                style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.8 }}
              >
                • Mark the staff member inactive (soft delete — record is kept)
                <br />
                • Block their login to the ERP
                <br />• They can be reactivated later from this same screen
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                className="btn btn-ghost"
                onClick={() => setModal(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleTerminate}
                disabled={saving}
                style={{ minWidth: 160, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Processing…" : "Confirm Termination"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ════ MODAL: BULK IMPORT ════ */}
      <Modal
        open={modal === "bulk"}
        onClose={() => setModal(null)}
        title="Bulk CSV Import — Staff Onboarding"
        width={780}
      >
        <div>
          <div
            style={{
              padding: "10px 14px",
              background: `${C.blue}11`,
              border: `1px solid ${C.blue}22`,
              borderRadius: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: C.blue,
                marginBottom: 6,
              }}
            >
              Required CSV Columns:
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {BULK_COLS.map((c, i) => (
                <span
                  key={c}
                  style={{
                    fontSize: 10.5,
                    fontFamily: "monospace",
                    background: `${C.blue}22`,
                    color: C.blue,
                    padding: "2px 7px",
                    borderRadius: 4,
                  }}
                >
                  {i + 1}. {c}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
              * full_name and email are mandatory. Leave <code>password</code>{" "}
              blank to default to <b>teacher123</b>.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 16,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <button
              className="btn btn-ghost"
              onClick={downloadTemplate}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
              }}
            >
              <Icon name="download" size={13} /> Download Template
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <button
              className="btn btn-primary"
              onClick={() => fileRef.current?.click()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
              }}
            >
              <Icon name="plus" size={13} /> Upload CSV File
            </button>
            {bulkRows.length > 0 && !bulkProgress && (
              <button
                className="btn btn-primary"
                onClick={handleBulkImport}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12.5,
                  background: C.green,
                  marginLeft: "auto",
                }}
              >
                <Icon name="check" size={13} /> Import{" "}
                {bulkRows.filter((r) => r._errors.length === 0).length} Valid
              </button>
            )}
          </div>

          {bulkProgress && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Importing: {bulkProgress.done} / {bulkProgress.total}
                  {bulkProgress.failed.length > 0 && (
                    <span style={{ color: C.red }}>
                      {" "}
                      ({bulkProgress.failed.length} failed)
                    </span>
                  )}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: bulkDone ? C.green : C.primary,
                    fontWeight: 600,
                  }}
                >
                  {bulkDone
                    ? "✓ Done"
                    : `${Math.round(
                        (bulkProgress.done / bulkProgress.total) * 100
                      )}%`}
                </span>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.round(
                      (bulkProgress.done / bulkProgress.total) * 100
                    )}%`,
                    background: bulkDone
                      ? bulkProgress.failed.length > 0
                        ? C.yellow
                        : C.green
                      : C.primary,
                  }}
                />
              </div>
              {bulkDone && bulkProgress.failed.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{ fontSize: 13, color: C.red, fontWeight: 700 }}
                    >
                      ⚠ {bulkProgress.failed.length} records failed
                    </span>
                    <button
                      className="btn btn-danger"
                      onClick={() => downloadFailedCsv(bulkProgress.failed)}
                      style={{
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Icon name="download" size={12} /> Download Failed CSV
                    </button>
                  </div>
                  <div
                    style={{
                      maxHeight: 140,
                      overflowY: "auto",
                      border: `1px solid ${C.red}33`,
                      borderRadius: 8,
                    }}
                  >
                    {bulkProgress.failed.map((r, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 10px",
                          borderBottom: `1px solid ${C.border}22`,
                          fontSize: 12,
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>
                          {r.full_name} ({r.email})
                        </span>
                        <span style={{ color: C.red, fontSize: 11 }}>
                          {r._err}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {bulkDone && bulkProgress.failed.length === 0 && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "10px 14px",
                    background: `${C.green}11`,
                    border: `1px solid ${C.green}22`,
                    borderRadius: 8,
                    fontSize: 13,
                    color: C.green,
                    fontWeight: 600,
                  }}
                >
                  ✓ All {bulkProgress.total} staff members imported
                  successfully!
                </div>
              )}
            </div>
          )}

          {bulkRows.length > 0 && !bulkProgress && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  Preview —{" "}
                  <span style={{ color: C.green }}>
                    {bulkRows.filter((r) => r._errors.length === 0).length}{" "}
                    valid
                  </span>
                  {bulkRows.filter((r) => r._errors.length > 0).length > 0 && (
                    <span style={{ color: C.red }}>
                      , {bulkRows.filter((r) => r._errors.length > 0).length}{" "}
                      errors
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 12 }}
                  onClick={() => setBulkRows([])}
                >
                  Clear
                </button>
              </div>
              <div
                style={{
                  overflowX: "auto",
                  maxHeight: 280,
                  overflowY: "auto",
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                }}
              >
                <table className="table" style={{ fontSize: 11 }}>
                  <thead>
                    <tr>
                      <th>Line</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Dept</th>
                      <th>Designation</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkRows.map((row, i) => (
                      <tr
                        key={i}
                        style={{
                          background: row._errors.length
                            ? `${C.red}08`
                            : "transparent",
                        }}
                      >
                        <td style={{ color: C.textMuted }}>{row._line}</td>
                        <td style={{ fontWeight: 600 }}>{row.full_name}</td>
                        <td style={{ fontFamily: "monospace", fontSize: 10.5 }}>
                          {row.email}
                        </td>
                        <td>{row.department || "—"}</td>
                        <td>{row.designation || "—"}</td>
                        <td>
                          {row._errors.length === 0 ? (
                            <span
                              className="badge badge-green"
                              style={{ fontSize: 10 }}
                            >
                              ✓ Valid
                            </span>
                          ) : (
                            <span
                              className="badge badge-red"
                              style={{ fontSize: 10, cursor: "help" }}
                              title={row._errors.join(", ")}
                            >
                              ⚠ {row._errors[0]}
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

          {bulkRows.length === 0 && !bulkProgress && (
            <div
              style={{
                textAlign: "center",
                padding: "28px 0",
                color: C.textMuted,
                fontSize: 13,
              }}
            >
              Upload a CSV file to preview and validate before importing.
            </div>
          )}

          {bulkDone && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 14,
              }}
            >
              <button
                className="btn btn-primary"
                onClick={() => setModal(null)}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
