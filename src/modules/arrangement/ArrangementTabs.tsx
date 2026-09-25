// path: src/modules/arrangement/ArrangementTabs.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { STATUS_LABEL_MAP, buildArrangementPlan, autoAssignSuggested, DOW_NAMES } from './ArrangementHelpers';
import { apiRequest } from '../../shared/api';
import { C } from '../../shared/theme';
import { FormRow, KpiCard } from '../../shared/ui/Common';
import { useDialog } from '../../shared/ui/DialogProvider';
import { Icon } from '../../shared/ui/Icon';
import { todayISO, daysAgoISO } from '../../shared/utils';



// ═══════════════════════════════════════════════════════════════
// TEACHER ARRANGEMENT CARD — one absent teacher, all their periods as rows
// ═══════════════════════════════════════════════════════════════
export const TeacherArrangementCard = ({ teacherName, status, periods, periodLabelOf, selections, onSelect }) => {
  const filledInCard = periods.filter((g) => selections[g.key] || g.confirmed_substitute_id).length;
  const initials = (teacherName || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: C.surfaceAlt, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.red}15`, color: C.red, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{teacherName}</div>
          <div style={{ fontSize: 11, color: C.textMuted }}>
            <span style={{ color: C.red, fontWeight: 700 }}>{STATUS_LABEL_MAP[status] || status}</span> today • {periods.length} period{periods.length > 1 ? "s" : ""}
          </div>
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 10px", borderRadius: 20, background: filledInCard === periods.length ? `${C.green}15` : `${C.yellow}15`, color: filledInCard === periods.length ? C.green : C.yellow, whiteSpace: "nowrap" }}>
          {filledInCard}/{periods.length} covered
        </span>
      </div>

      <div>
        {periods.map((g, i) => {
          const isFilled = !!selections[g.key] || !!g.confirmed_substitute_id;
          const currentValue = selections[g.key] || g.confirmed_substitute_id || "";
          const allOptions = [...g.suggested, ...g.others];
          return (
            <div key={g.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderTop: i === 0 ? "none" : `1px solid ${C.border}`, background: isFilled ? "transparent" : `${C.red}05` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{periodLabelOf(g.period_slot_id)}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{g.class_name} {g.section_name} — {g.subject_name}{g.room_no ? ` • Room ${g.room_no}` : ""}</div>
              </div>
              <div style={{ width: 210, flexShrink: 0 }}>
                {allOptions.length === 0 && !g.confirmed_substitute_id ? (
                  <span style={{ fontSize: 11, color: C.red, fontWeight: 700 }}>⚠ No teacher free</span>
                ) : (
                  <select
                    className="select"
                    style={{ fontSize: 12, width: "100%", borderColor: isFilled ? C.green : C.border, color: isFilled ? C.text : C.textMuted }}
                    value={currentValue}
                    onChange={(e) => onSelect(g.key, e.target.value || undefined)}
                  >
                    <option value="">— Select substitute —</option>
                    {g.suggested.length > 0 && (
                      <optgroup label="Suggested (same subject)">
                        {g.suggested.map((t) => <option key={t.teacher_id} value={t.teacher_id}>{t.full_name}</option>)}
                      </optgroup>
                    )}
                    {g.others.length > 0 && (
                      <optgroup label="Other available">
                        {g.others.map((t) => <option key={t.teacher_id} value={t.teacher_id}>{t.full_name}</option>)}
                      </optgroup>
                    )}
                  </select>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TODAY'S ARRANGEMENT TAB — grouped by absent teacher
// ═══════════════════════════════════════════════════════════════
export const TodayArrangementTab = ({ onSaved }) => {
  const { dialogAlert, dialogConfirm } = useDialog();
  const [date, setDate] = useState(todayISO());
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selections, setSelections] = useState({}); // { [gapKey]: substitute_teacher_id }
  const [saving, setSaving] = useState(false);
  

  const loadDraft = React.useCallback(async () => {
    setLoading(true);
    setSelections({});
    try {
      const res = await apiRequest(`/arrangement/draft?date=${date}`);
      setDraft(res.data);
      // Seed default selections with top suggested match, right away
      const rawPlan = buildArrangementPlan(res.data);
      setSelections(autoAssignSuggested(rawPlan.gaps));
    } catch (e) {
      dialogAlert("Failed to load arrangement draft: " + e.message, "Error");
    } finally {
      setLoading(false);
    }
  }, [date, dialogAlert]);

  useEffect(() => { loadDraft(); }, [loadDraft]);

  const plan = useMemo(() => buildArrangementPlan(draft), [draft]);

  // Re-rank live: once a selection is made for one gap, remove that teacher from other gaps' dropdowns in the SAME period
  const gapsWithLiveSelections = useMemo(() => {
    const takenPerPeriod = {};
    plan.gaps.forEach((g) => {
      const chosen = selections[g.key] || g.confirmed_substitute_id;
      if (chosen) {
        if (!takenPerPeriod[g.period_slot_id]) takenPerPeriod[g.period_slot_id] = new Set();
        takenPerPeriod[g.period_slot_id].add(chosen);
      }
    });
    return plan.gaps.map((g) => {
      const taken = takenPerPeriod[g.period_slot_id] || new Set();
      const currentChoice = selections[g.key] || g.confirmed_substitute_id;
      return {
        ...g,
        suggested: g.suggested.filter((t) => !taken.has(t.teacher_id) || t.teacher_id === currentChoice),
        others: g.others.filter((t) => !taken.has(t.teacher_id) || t.teacher_id === currentChoice),
      };
    });
  }, [plan, selections]);

  // Group periods by original (absent) teacher — this is the core structural change
  const groupedByTeacher = useMemo(() => {
    const groups = {};
    gapsWithLiveSelections.forEach((g) => {
      if (!groups[g.original_teacher_id]) {
        groups[g.original_teacher_id] = { teacher_id: g.original_teacher_id, teacher_name: g.original_teacher_name, status: g.original_status, periods: [] };
      }
      groups[g.original_teacher_id].periods.push(g);
    });
    return Object.values(groups).sort((a, b) => a.teacher_name.localeCompare(b.teacher_name));
  }, [gapsWithLiveSelections]);

  const filledCount = gapsWithLiveSelections.filter((g) => selections[g.key] || g.confirmed_substitute_id).length;
  const pendingCount = gapsWithLiveSelections.length - filledCount;

  const handleSelect = (gapKey, teacherId) => {
    setSelections((prev) => ({ ...prev, [gapKey]: teacherId }));
  };

  const handleResetToSuggested = () => {
    setSelections(autoAssignSuggested(plan.gaps));
  };

  const handleConfirm = async () => {
    const entries = gapsWithLiveSelections
      .filter((g) => selections[g.key])
      .map((g) => ({
        period_slot_id: g.period_slot_id, section_id: g.section_id, subject_id: g.subject_id,
        original_teacher_id: g.original_teacher_id, substitute_teacher_id: selections[g.key],
        original_status: g.original_status,
        is_suggested_match: g.suggested.some((t) => t.teacher_id === selections[g.key]),
      }));
    if (entries.length === 0) return dialogAlert("Select at least one substitute before confirming.", "Nothing to Save");

    const ok = await dialogConfirm(`Confirm and notify ${entries.length} teacher(s) for ${date}? This will save the arrangement and send app + email + WhatsApp alerts.`, "Confirm & Notify");
    if (!ok) return;
    setSaving(true);
    try {
      await apiRequest("/arrangement/confirm", "POST", { date, entries });
      let notifiedCount = 0;
      try {
        const notifyRes = await apiRequest("/arrangement/notify", "POST", { date });
        notifiedCount = notifyRes?.data?.notified ?? 0;
        const status = notifyRes?.data?.status;
        const results = notifyRes?.data?.results ?? [];
        if (status === "failed" || status === "partial") {
          const failLines = results
            .filter((r) => r.overall !== "sent")
            .map((r) => {
              const failedChannels = ["app", "email", "whatsapp"]
                .filter((ch) => r[ch]?.status === "failed")
                .map((ch) => `${ch}: ${r[ch].error || "failed"}`)
                .join(" | ");
              return `${r.teacher_name} — ${failedChannels}`;
            })
            .join("\n");
          await dialogAlert(
            `Saved. Notify ${status === "failed" ? "failed for all" : "partially failed for some"} teacher(s):\n\n${failLines}`,
            status === "failed" ? "Notify Failed" : "Partially Notified"
          );
          await loadDraft();
          onSaved();
          setSaving(false);
          return;
        }
      } catch (notifyErr) {
        await dialogAlert("Arrangement saved, but sending email/WhatsApp failed: " + notifyErr.message, "Partial Success");
        await loadDraft();
        onSaved();
        setSaving(false);
        return;
      }
      await dialogAlert(`Saved and notified ${notifiedCount} teacher(s) via app, email and WhatsApp.`, "Done");
      await loadDraft();
      onSaved();
      setSaving(false);
    } catch (e) {
      dialogAlert("Save failed: " + e.message, "Error");
    } finally {
      setSaving(false);
    }
  };

 

  const periodLabel = (id) => {
    const p = draft?.period_slots.find((x) => x.id === id);
    return p ? `${p.label} • ${p.start_time?.slice(0, 5)}–${p.end_time?.slice(0, 5)}` : "Period";
  };

  return (
    <div className="slide-in">
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <FormRow label="Arrangement Date">
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FormRow>
        <button className="btn btn-ghost" onClick={loadDraft} disabled={loading} style={{ height: 42, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="refresh" size={14} /> Refresh
        </button>
        {plan.gaps.length > 0 && (
          <button className="btn btn-ghost" onClick={handleResetToSuggested} style={{ height: 42, display: "flex", alignItems: "center", gap: 8, color: C.primary }}>
            <Icon name="check" size={14} /> Reset to Suggested
          </button>
        )}
      </div>

      {loading ? (
        <div className="card pulse" style={{ padding: 40, textAlign: "center" }}>Scanning timetable for {DOW_NAMES[new Date(date).getDay()]}...</div>
      ) : plan.gaps.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: C.green }}>
          <Icon name="check" size={28} color={C.green} />
          <p style={{ marginTop: 10, fontWeight: 700 }}>No arrangement needed — all teachers present, or no periods affected.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
            <KpiCard label="Teachers Unavailable" value={plan.unavailableCount} icon="alert" color={C.red} />
            <KpiCard label="Periods Needing Cover" value={plan.gaps.length} icon="calendar" color={C.yellow} />
            <KpiCard label="Filled" value={`${filledCount} / ${plan.gaps.length}`} sub={pendingCount > 0 ? `${pendingCount} pending` : "All covered"} icon="check" color={pendingCount === 0 ? C.green : C.blue} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
            {groupedByTeacher.map((grp) => (
              <TeacherArrangementCard
                key={grp.teacher_id}
                teacherName={grp.teacher_name}
                status={grp.status}
                periods={grp.periods}
                periodLabelOf={periodLabel}
                selections={selections}
                onSelect={handleSelect}
              />
            ))}
          </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={handleConfirm} disabled={saving} style={{ padding: "12px 28px", fontSize: 14 }}>
              {saving ? "Saving & Notifying..." : `Confirm & Notify (${filledCount})`}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// HISTORY TAB
// ═══════════════════════════════════════════════════════════════
export const ArrangementHistoryTab = ({ history, onRefresh }) => {
  const { dialogConfirm, dialogAlert } = useDialog();
  const [dateFrom, setDateFrom] = useState(daysAgoISO(30));
  const [dateTo, setDateTo] = useState(todayISO());

  const filtered = history.filter((h) => {
    const d = h.substitution_date?.slice(0, 10); // normalize to YYYY-MM-DD before comparing
    return d >= dateFrom && d <= dateTo;
  });

  const handleCancel = async (row) => {
    const ok = await dialogConfirm(`Cancel this substitution for ${row.substitute_teacher_name}?`, "Cancel Substitution");
    if (!ok) return;
    try {
      await apiRequest(`/arrangement/${row.id}`, "DELETE");
      onRefresh();
    } catch (e) {
      dialogAlert("Cancel failed: " + e.message, "Error");
    }
  };

  return (
    <div className="slide-in">
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <FormRow label="From"><input className="input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></FormRow>
        <FormRow label="To"><input className="input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></FormRow>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: C.textMuted }}>No substitutions in this range.</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: C.surfaceAlt, textAlign: "left" }}>
                {["Date", "Period", "Class", "Subject", "Original", "Substitute", "Notified", ""].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", fontSize: 10.5, fontWeight: 800, color: C.textMuted, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 14px" }}>{r.substitution_date?.slice(0, 10)}</td>
                  <td style={{ padding: "10px 14px" }}>{r.period_label}</td>
                  <td style={{ padding: "10px 14px" }}>{r.class_name} {r.section_name}</td>
                  <td style={{ padding: "10px 14px" }}>{r.subject_name || "—"}</td>
                  <td style={{ padding: "10px 14px", color: C.textMuted }}>{r.original_teacher_name}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 700 }}>{r.substitute_teacher_name}</td>
                  <td style={{ padding: "10px 14px" }}>
                    {r.notify_status === "sent" ? (
                      <span style={{ color: C.green, fontSize: 11, fontWeight: 700 }}>✓ Sent</span>
                    ) : r.notify_status === "partial" ? (
                      <span style={{ color: "#d97706", fontSize: 11, fontWeight: 700 }} title="Some channels (app/email/WhatsApp) failed — check CommHub message history">⚠ Partial</span>
                    ) : r.notify_status === "failed" ? (
                      <span style={{ color: C.red, fontSize: 11, fontWeight: 700 }} title="All channels failed — check CommHub message history">✗ Failed</span>
                    ) : (
                      <span style={{ color: C.textFaint, fontSize: 11 }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    <button className="btn btn-ghost" style={{ fontSize: 11, padding: "4px 10px", color: C.red }} onClick={() => handleCancel(r)}>
                      <Icon name="close" size={11} />
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
