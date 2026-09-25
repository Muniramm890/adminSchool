// path: src/modules/core/SchoolERP.tsx

import { useState, useEffect } from 'react';
import { AnalyticsModule } from '../analytics/AnalyticsModule';
import { ArrangementModule } from '../arrangement/ArrangementModule';
import { AttendanceModule } from '../attendance/AttendanceModule';
import { AuditLogModule } from '../auditlog/AuditLogModule';
import { NotificationModal } from '../auth/NotificationModal';
import { ProfileModal } from '../auth/ProfileModal';
import { CommHubModule } from '../commhub/CommHubModule';
import { Sidebar, NAV_ITEMS } from './Sidebar';
import { DashboardModule } from '../dashboard/DashboardModule';
import { ExamManagementModule } from '../exams/ExamManagementModule';
import { FeesModule } from '../fees/FeesModule';
import { HomeworkModule } from '../homework/HomeworkModule';
import { LeaderboardModule } from '../leaderboard/LeaderboardModule';
import { PayrollModule } from '../payroll/PayrollModule';
import { PromotionModule } from '../promotion/PromotionModule';
import { ResultsModule } from '../results/ResultsModule';
import { SetupModule } from '../setup/SetupModule';
import { StudentsModule } from '../students/StudentsModule';
import { TeachersModule } from '../teachers/TeachersModule';
import { TestsModule } from '../tests/TestsModule';
import { TimetableModule } from '../timetable/TimetableModule';
import { TransportModule } from '../transport/TransportModule';
import { UserManagementModule } from '../usermanagement/UserManagementModule';
import { apiRequest } from '../../shared/api';
import { useAuth, useSession } from '../../shared/context/AppContexts';
import { SCHOOL_CONFIG } from '../../shared/mockData';
import { injectStyles, C } from '../../shared/theme';
import { Icon } from '../../shared/ui/Icon';



// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════





export const SchoolERP = () => {
  const { user, logout } = useAuth();
  const { academicYears, academicYearId, setAcademicYearId, sessionLoading } = useSession();
  const [activeModule, setActiveModule] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [school, setSchool] = useState(SCHOOL_CONFIG);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await apiRequest("/notifications/unread-count");
        setUnreadCount(res?.data?.count || 0);
      } catch (e) { /* silent */ }
    };
    fetchUnread();
    const iv = setInterval(fetchUnread, 30000); // 30s poll
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    injectStyles();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest("/setup/school");
        const d = res?.data;
        if (d) {
          setSchool((prev) => ({
            ...prev,
            name: d.name || prev.name,
            tagline: d.tagline || prev.tagline,
            address:
              [d.address_line1, d.city, d.state].filter(Boolean).join(", ") ||
              prev.address,
            phone: d.phone || prev.phone,
            email: d.email || prev.email,
            logo_url: d.logo_url || prev.logo_url,
            watermark_url: d.watermark_url || prev.watermark_url,
            address_line1: d.address_line1 || prev.address_line1,
            city: d.city || prev.city,
            state: d.state || prev.state,
            pincode: d.pincode || prev.pincode,
            website: d.website || prev.website,
          }));
        }
      } catch (e) {
        console.error("Failed to load school info", e);
      }
    })();
  }, []);

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <DashboardModule school={school} />;
      case "setup":
        return (
          <SetupModule
            school={school}
            onUpdateSchool={(s) => {
              setSchool(s);
            }}
          />
        );
      case "students":
        return <StudentsModule />;
      case "teachers":
        return <TeachersModule />;
      case "promotion":
        return <PromotionModule />;
      case "TransportModule":
        return <TransportModule/>;
      case "commhub":
          return <CommHubModule />;
      case "attendance":
        return <AttendanceModule />;
      case "arrangement":
          return <ArrangementModule school={school} />;
      case "exams":
        return <ExamManagementModule />;
        case "fees":
          return <FeesModule school={school} />;
        case "payroll":
            return <PayrollModule school={school} />;
        case "results":
          return <ResultsModule school={school} />;
      case "leaderboard":
        return <LeaderboardModule />;
      case "analytics":
        return <AnalyticsModule />;
      case "timetable":
        return <TimetableModule />;
      case "tests":
          return <TestsModule school={school} />;
      case "homework":
          return <HomeworkModule school={school} />;
      case "usermanagement":
            return <UserManagementModule />;
          case "auditlogs":
            return <AuditLogModule />;
      default:
        return <DashboardModule school={school} />;
    }
  };

  const handleNav = (id) => {
    setActiveModule(id);
    setMobileSidebarOpen(false);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'DM Sans',sans-serif",
        background: C.bg,
      }}
    >
      {/* Desktop Sidebar */}
      <div className="sidebar-desktop" style={{ flexShrink: 0 }}>
        <Sidebar
          active={activeModule}
          onNav={handleNav}
          collapsed={sidebarCollapsed}
          school={school}
          userRole={user?.role}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}
        >
          <div
            style={{ background: "#00000077", flex: 1 }}
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div
            style={{
              width: 240,
              background: C.surface,
              height: "100%",
              overflowY: "auto",
            }}
          >
            <Sidebar
              active={activeModule}
              onNav={handleNav}
              collapsed={false}
              school={school}
              userRole={user?.role}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Topbar */}
        <div
          style={{
            background: C.surface,
            borderBottom: `1px solid ${C.border}`,
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <button
            className="mobile-menu-btn btn btn-ghost"
            style={{ padding: "7px 9px" }}
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Icon name="menu" size={18} />
          </button>
          <button
            className="hide-mobile btn btn-ghost"
            style={{ padding: "7px 9px" }}
            onClick={() => setSidebarCollapsed((p) => !p)}
          >
            <Icon name="menu" size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <div
              className="syne"
              style={{ fontSize: 14, fontWeight: 700, color: C.text }}
            >
              {NAV_ITEMS.flatMap((g) => g.items).find(
                (i) => i.id === activeModule
              )?.label || "Dashboard"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!sessionLoading && academicYears.length > 0 && (
              <select
                className="select"
                style={{ width: 150 }}
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                title="Academic Session"
              >
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                    {y.is_current ? " (Current)" : ""}
                  </option>
                ))}
              </select>
            )}
            <div style={{ position: "relative" }}>
              <button
                className="btn btn-ghost"
                style={{ padding: "7px 9px", position: "relative" }}
                onClick={() => setShowNotifModal(true)}
              >
                <Icon name="bell" size={17} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 5,
                      right: 5,
                      width: 7,
                      height: 7,
                      background: C.red,
                      borderRadius: "50%",
                    }}
                  />
                )}
              </button>
            </div>
            <div
              onClick={() => setShowProfileModal(true)}
              title="View / Edit Profile"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: C.surfaceAlt,
                borderRadius: 10,
                padding: "6px 12px",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.border)}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.surfaceAlt)}
            >
              <span style={{ fontSize: 18 }}>👨‍💼</span>
              <div className="hide-mobile">
                <div style={{ fontSize: 12, fontWeight: 600 }}>Principal</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>
                  {school.name.split(" ")[0]}
                </div>
              </div>
            </div>
            <button
              className="btn btn-danger"
              onClick={logout}
              style={{ padding: "6px 12px", fontSize: 12, marginLeft: 8 }}
            >
              Logout
            </button>
          </div>
        </div>

         {/* Module Area */}
         <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {renderModule()}
        </div>
      </div>

      <ProfileModal open={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <NotificationModal open={showNotifModal} onClose={() => setShowNotifModal(false)} onUnreadChange={setUnreadCount} />
    </div>
  );
};
