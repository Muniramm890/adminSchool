// path: src/modules/transport/TransportTabs.tsx

import { useState, useEffect } from 'react';
import { apiRequest } from '../../shared/api';
import { C } from '../../shared/theme';
import { Modal, FormGrid, FormRow } from '../../shared/ui/Common';
import { useDialog } from '../../shared/ui/DialogProvider';
import { Icon } from '../../shared/ui/Icon';



// ══════════════════════════════════════════════════════════════════════════
// TRANSPORT MANAGEMENT MODULE
// Reuses: Modal, FormRow, KpiCard, .card/.table/.badge/.btn classes, useDialog, apiRequest
// ══════════════════════════════════════════════════════════════════════════

export const paiseToRupee = (p) => (Number(p || 0) / 100).toFixed(0);

// ── VEHICLES (Level 1) ──────────────────────────────────────────────────
export const TransportVehiclesTab = () => {
  const { dialogAlert, dialogConfirm } = useDialog();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'new' | row-object
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await apiRequest("/transport/vehicles"); setRows(res?.data || []); }
    catch (e) { dialogAlert("Failed to load vehicles: " + e.message, "Error"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ vehicle_type: "bus", seating_capacity: 40, gps_provider: "generic_webhook" }); setModal("new"); };
  const openEdit = (row) => { setForm({ ...row }); setModal(row); };
  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.registration_no || !form.vehicle_type || !form.seating_capacity) {
      dialogAlert("Registration No, Vehicle Type and Seating Capacity are required.", "Missing Info"); return;
    }
    setSaving(true);
    try {
      if (modal === "new") await apiRequest("/transport/vehicles", "POST", form);
      else await apiRequest(`/transport/vehicles/${modal.id}`, "PUT", form);
      setModal(null); await load();
    } catch (e) { dialogAlert("Save failed: " + e.message, "Error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (row) => {
    const ok = await dialogConfirm(`Remove vehicle ${row.registration_no}?`, "Confirm Remove");
    if (!ok) return;
    try { await apiRequest(`/transport/vehicles/${row.id}`, "DELETE"); await load(); }
    catch (e) { dialogAlert("Failed: " + e.message, "Error"); }
  };

  const expiryBadge = (date) => {
    if (!date) return <span style={{ color: C.textFaint, fontSize: 11 }}>—</span>;
    const days = Math.ceil((new Date(date) - new Date()) / 86400000);
    const cls = days < 0 ? "badge-red" : days <= 30 ? "badge-yellow" : "badge-green";
    return <span className={`badge ${cls}`} style={{ fontSize: 10.5 }}>{date} {days < 0 ? "(expired)" : days <= 30 ? `(${days}d left)` : ""}</span>;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button className="btn btn-primary" onClick={openNew}><Icon name="plus" size={13} /> Add Vehicle</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead><tr>
              <th>Reg. No</th><th>Type</th><th>Capacity</th><th>Fitness Cert.</th><th>Insurance</th><th>GPS Device</th><th>Status</th><th style={{ textAlign: "center" }}>Actions</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 30, color: C.textMuted }}>Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 30, color: C.textMuted }}>No vehicles added yet.</td></tr>
              ) : rows.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 700 }}>{v.registration_no}</td>
                  <td style={{ textTransform: "capitalize", fontSize: 12 }}>{v.vehicle_type}</td>
                  <td style={{ fontSize: 12 }}>{v.seating_capacity} seats</td>
                  <td>{expiryBadge(v.fitness_expiry?.slice?.(0, 10))}</td>
                  <td>{expiryBadge(v.insurance_expiry?.slice?.(0, 10))}</td>
                  <td style={{ fontSize: 11, fontFamily: "monospace" }}>{v.device_imei || "—"}</td>
                  <td><span className={`badge ${v.status === "active" ? "badge-green" : "badge-yellow"}`}>{v.status}</span></td>
                  <td style={{ textAlign: "center" }}>
                    <button className="btn btn-ghost" style={{ padding: "5px 9px" }} onClick={() => openEdit(v)}><Icon name="edit" size={13} /></button>
                    <button className="btn btn-ghost" style={{ padding: "5px 9px" }} onClick={() => handleDelete(v)}><Icon name="trash" size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "new" ? "Add Vehicle" : "Edit Vehicle"} width={640}>
        {modal && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", marginBottom: 10 }}>Basic Info</div>
            <FormGrid cols={2}>
              <FormRow label="Registration No"><input className="input" value={form.registration_no || ""} disabled={modal !== "new"} onChange={(e) => setF("registration_no", e.target.value)} placeholder="RJ-14-PA-1234" /></FormRow>
              <FormRow label="Vehicle Type">
                <select className="select" value={form.vehicle_type || "bus"} onChange={(e) => setF("vehicle_type", e.target.value)}>
                  <option value="bus">Bus</option><option value="van">Van</option>
                </select>
              </FormRow>
              <FormRow label="Seating Capacity"><input className="input" type="number" value={form.seating_capacity || ""} onChange={(e) => setF("seating_capacity", Number(e.target.value))} /></FormRow>
              <FormRow label="Status">
                <select className="select" value={form.status || "active"} onChange={(e) => setF("status", e.target.value)}>
                  <option value="active">Active</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive</option>
                </select>
              </FormRow>
            </FormGrid>

            <div style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", margin: "16px 0 10px" }}>Documents & Compliance</div>
            <FormGrid cols={2}>
              <FormRow label="Fitness Cert. No"><input className="input" value={form.fitness_cert_no || ""} onChange={(e) => setF("fitness_cert_no", e.target.value)} /></FormRow>
              <FormRow label="Fitness Expiry"><input className="input" type="date" value={form.fitness_expiry?.slice?.(0, 10) || ""} onChange={(e) => setF("fitness_expiry", e.target.value)} /></FormRow>
              <FormRow label="Insurance No"><input className="input" value={form.insurance_no || ""} onChange={(e) => setF("insurance_no", e.target.value)} /></FormRow>
              <FormRow label="Insurance Expiry"><input className="input" type="date" value={form.insurance_expiry?.slice?.(0, 10) || ""} onChange={(e) => setF("insurance_expiry", e.target.value)} /></FormRow>
              <FormRow label="PUC No"><input className="input" value={form.puc_no || ""} onChange={(e) => setF("puc_no", e.target.value)} /></FormRow>
              <FormRow label="PUC Expiry"><input className="input" type="date" value={form.puc_expiry?.slice?.(0, 10) || ""} onChange={(e) => setF("puc_expiry", e.target.value)} /></FormRow>
              <FormRow label="Permit No"><input className="input" value={form.permit_no || ""} onChange={(e) => setF("permit_no", e.target.value)} /></FormRow>
              <FormRow label="Permit Expiry"><input className="input" type="date" value={form.permit_expiry?.slice?.(0, 10) || ""} onChange={(e) => setF("permit_expiry", e.target.value)} /></FormRow>
            </FormGrid>

            <div style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", margin: "16px 0 10px" }}>IoT / GPS Setup</div>
            <FormGrid cols={2}>
              <FormRow label="GPS Provider / Protocol">
                <select className="select" value={form.gps_provider || "generic_webhook"} onChange={(e) => setF("gps_provider", e.target.value)}>
                  <option value="teltonika">Teltonika</option><option value="concox">Concox</option>
                  <option value="gt06">GT06</option><option value="generic_webhook">Generic / Webhook</option>
                </select>
              </FormRow>
              <FormRow label="Device IMEI / Tracking ID"><input className="input" value={form.device_imei || ""} onChange={(e) => setF("device_imei", e.target.value)} placeholder="15-digit IMEI" /></FormRow>
              <FormRow label="SIM Number"><input className="input" value={form.sim_number || ""} onChange={(e) => setF("sim_number", e.target.value)} /></FormRow>
              <FormRow label="Traccar Device ID (uniqueId)"><input className="input" value={form.traccar_device_id || ""} onChange={(e) => setF("traccar_device_id", e.target.value)} placeholder="matches Traccar's device uniqueId" /></FormRow>
            </FormGrid>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => setModal(null)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Vehicle"}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ── STAFF: DRIVERS & CONDUCTORS (Level 1) ───────────────────────────────
export const TransportStaffTab = () => {
  const { dialogAlert, dialogConfirm } = useDialog();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await apiRequest("/transport/staff"); setRows(res?.data || []); }
    catch (e) { dialogAlert("Failed to load staff: " + e.message, "Error"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ role: "driver" }); setModal("new"); };
  const openEdit = (row) => { setForm({ ...row }); setModal(row); };
  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.full_name || !form.phone) { dialogAlert("Name and Phone are required.", "Missing Info"); return; }
    setSaving(true);
    try {
      if (modal === "new") await apiRequest("/transport/staff", "POST", form);
      else await apiRequest(`/transport/staff/${modal.id}`, "PUT", form);
      setModal(null); await load();
    } catch (e) { dialogAlert("Save failed: " + e.message, "Error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (row) => {
    const ok = await dialogConfirm(`Remove ${row.full_name}?`, "Confirm Remove");
    if (!ok) return;
    try { await apiRequest(`/transport/staff/${row.id}`, "DELETE"); await load(); }
    catch (e) { dialogAlert("Failed: " + e.message, "Error"); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button className="btn btn-primary" onClick={openNew}><Icon name="plus" size={13} /> Add Driver/Conductor</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>License No</th><th>License Expiry</th><th>Verified</th><th>Status</th><th style={{ textAlign: "center" }}>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 30, color: C.textMuted }}>Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 30, color: C.textMuted }}>No drivers/conductors added yet.</td></tr>
              ) : rows.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                  <td style={{ textTransform: "capitalize" }}><span className={`badge ${s.role === "driver" ? "badge-green" : "badge-yellow"}`}>{s.role}</span></td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{s.phone}</td>
                  <td style={{ fontSize: 12 }}>{s.license_no || "—"}</td>
                  <td style={{ fontSize: 12 }}>{s.license_expiry?.slice?.(0, 10) || "—"}</td>
                  <td>{s.is_verified ? <span className="badge badge-green">Verified</span> : <span className="badge badge-red">Unverified</span>}</td>
                  <td><span className={`badge ${s.status === "active" ? "badge-green" : "badge-yellow"}`}>{s.status}</span></td>
                  <td style={{ textAlign: "center" }}>
                    <button className="btn btn-ghost" style={{ padding: "5px 9px" }} onClick={() => openEdit(s)}><Icon name="edit" size={13} /></button>
                    <button className="btn btn-ghost" style={{ padding: "5px 9px" }} onClick={() => handleDelete(s)}><Icon name="trash" size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "new" ? "Add Driver/Conductor" : "Edit Staff"} width={480}>
        {modal && (
          <div>
            <FormRow label="Full Name"><input className="input" value={form.full_name || ""} onChange={(e) => setF("full_name", e.target.value)} /></FormRow>
            <FormRow label="Role">
              <select className="select" value={form.role || "driver"} onChange={(e) => setF("role", e.target.value)}>
                <option value="driver">Driver</option><option value="conductor">Conductor</option>
              </select>
            </FormRow>
            <FormGrid cols={2}>
              <FormRow label="Phone"><input className="input" value={form.phone || ""} onChange={(e) => setF("phone", e.target.value)} /></FormRow>
              <FormRow label="License No"><input className="input" value={form.license_no || ""} onChange={(e) => setF("license_no", e.target.value)} /></FormRow>
              <FormRow label="License Expiry"><input className="input" type="date" value={form.license_expiry?.slice?.(0, 10) || ""} onChange={(e) => setF("license_expiry", e.target.value)} /></FormRow>
              <FormRow label="Status">
                <select className="select" value={form.status || "active"} onChange={(e) => setF("status", e.target.value)}>
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </FormRow>
            </FormGrid>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, marginBottom: 14 }}>
              <input type="checkbox" checked={!!form.is_verified} onChange={(e) => setF("is_verified", e.target.checked)} /> Documents Verified
            </label>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setModal(null)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ── ROUTES & STOPS (Level 1) ────────────────────────────────────────────
export const TransportRoutesTab = () => {
  const { dialogAlert, dialogConfirm } = useDialog();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routeModal, setRouteModal] = useState(null);
  const [routeForm, setRouteForm] = useState({});
  const [stopsModal, setStopsModal] = useState(null); // route row whose stops are being managed
  const [stops, setStops] = useState([]);
  const [stopForm, setStopForm] = useState(null); // null | 'new' | stop-row
  const [saving, setSaving] = useState(false);

  const loadRoutes = async () => {
    setLoading(true);
    try { const res = await apiRequest("/transport/routes"); setRoutes(res?.data || []); }
    catch (e) { dialogAlert("Failed to load routes: " + e.message, "Error"); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadRoutes(); }, []);

  const openNewRoute = () => { setRouteForm({ shift: "morning" }); setRouteModal("new"); };
  const handleSaveRoute = async () => {
    if (!routeForm.name) { dialogAlert("Route name is required.", "Missing Info"); return; }
    setSaving(true);
    try {
      if (routeModal === "new") await apiRequest("/transport/routes", "POST", routeForm);
      else await apiRequest(`/transport/routes/${routeModal.id}`, "PUT", routeForm);
      setRouteModal(null); await loadRoutes();
    } catch (e) { dialogAlert("Save failed: " + e.message, "Error"); }
    finally { setSaving(false); }
  };
  const handleDeleteRoute = async (row) => {
    const ok = await dialogConfirm(`Remove route "${row.name}"?`, "Confirm Remove");
    if (!ok) return;
    try { await apiRequest(`/transport/routes/${row.id}`, "DELETE"); await loadRoutes(); }
    catch (e) { dialogAlert("Failed: " + e.message, "Error"); }
  };

  const openStops = async (route) => {
    setStopsModal(route);
    try { const res = await apiRequest(`/transport/routes/${route.id}/stops`); setStops(res?.data || []); }
    catch (e) { dialogAlert("Failed to load stops: " + e.message, "Error"); }
  };
  const reloadStops = async () => {
    const res = await apiRequest(`/transport/routes/${stopsModal.id}/stops`); setStops(res?.data || []);
  };

  const openNewStop = () => { setStopForm({}); };
  const handleSaveStop = async () => {
    if (!stopForm.stop_name || stopForm.monthly_fare == null) { dialogAlert("Stop name and monthly fare are required.", "Missing Info"); return; }
    setSaving(true);
    try {
      if (stopForm.id) await apiRequest(`/transport/stops/${stopForm.id}`, "PUT", stopForm);
      else await apiRequest(`/transport/routes/${stopsModal.id}/stops`, "POST", stopForm);
      setStopForm(null); await reloadStops();
    } catch (e) { dialogAlert("Save failed: " + e.message, "Error"); }
    finally { setSaving(false); }
  };
  const handleDeleteStop = async (stop) => {
    const ok = await dialogConfirm(`Remove stop "${stop.stop_name}"?`, "Confirm Remove");
    if (!ok) return;
    try { await apiRequest(`/transport/stops/${stop.id}`, "DELETE"); await reloadStops(); }
    catch (e) { dialogAlert("Failed: " + e.message, "Error"); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button className="btn btn-primary" onClick={openNewRoute}><Icon name="plus" size={13} /> Add Route</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {loading ? (
          <div style={{ color: C.textMuted, fontSize: 13 }}>Loading…</div>
        ) : routes.length === 0 ? (
          <div style={{ color: C.textMuted, fontSize: 13 }}>No routes created yet.</div>
        ) : routes.map((r) => (
          <div key={r.id} className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{r.name}</div>
                <div style={{ fontSize: 11.5, color: C.textMuted, textTransform: "capitalize", marginTop: 2 }}>{r.shift} shift · {r.stop_count} stops</div>
              </div>
              <span className={`badge ${r.status === "active" ? "badge-green" : "badge-yellow"}`}>{r.status}</span>
            </div>
            <div style={{ fontSize: 12, marginTop: 10, color: C.textMuted }}>
              Current Bus: <b style={{ color: C.text }}>{r.current_vehicle || "Not assigned"}</b>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn btn-ghost" style={{ flex: 1, fontSize: 12 }} onClick={() => openStops(r)}>Manage Stops</button>
              <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={() => { setRouteForm({ ...r }); setRouteModal(r); }}><Icon name="edit" size={13} /></button>
              <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={() => handleDeleteRoute(r)}><Icon name="trash" size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!routeModal} onClose={() => setRouteModal(null)} title={routeModal === "new" ? "Add Route" : "Edit Route"} width={420}>
        {routeModal && (
          <div>
            <FormRow label="Route Name"><input className="input" value={routeForm.name || ""} onChange={(e) => setRouteForm((f) => ({ ...f, name: e.target.value }))} placeholder="Route 4 - Civil Lines" /></FormRow>
            <FormRow label="Shift">
              <select className="select" value={routeForm.shift || "morning"} onChange={(e) => setRouteForm((f) => ({ ...f, shift: e.target.value }))}>
                <option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option>
              </select>
            </FormRow>
            {routeModal !== "new" && (
              <FormRow label="Status">
                <select className="select" value={routeForm.status || "active"} onChange={(e) => setRouteForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </FormRow>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => setRouteModal(null)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveRoute} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!stopsModal} onClose={() => setStopsModal(null)} title={stopsModal ? `Stops — ${stopsModal.name}` : ""} width={640}>
        {stopsModal && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={openNewStop}><Icon name="plus" size={12} /> Add Stop</button>
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              <table className="table">
                <thead><tr><th>#</th><th>Stop</th><th>Pickup</th><th>Drop</th><th>Fare/mo</th><th style={{ textAlign: "center" }}>Actions</th></tr></thead>
                <tbody>
                  {stops.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: 20, color: C.textMuted }}>No stops added yet.</td></tr>
                  ) : stops.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontSize: 12 }}>{s.sequence_no}</td>
                      <td style={{ fontWeight: 600, fontSize: 12.5 }}>{s.stop_name}</td>
                      <td style={{ fontSize: 12 }}>{s.pickup_time || "—"}</td>
                      <td style={{ fontSize: 12 }}>{s.drop_time || "—"}</td>
                      <td style={{ fontSize: 12, fontWeight: 700 }}>₹{paiseToRupee(s.monthly_fare_paise)}</td>
                      <td style={{ textAlign: "center" }}>
                        <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={() => setStopForm({ ...s, monthly_fare: paiseToRupee(s.monthly_fare_paise) })}><Icon name="edit" size={12} /></button>
                        <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={() => handleDeleteStop(s)}><Icon name="trash" size={12} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!stopForm} onClose={() => setStopForm(null)} title={stopForm?.id ? "Edit Stop" : "Add Stop"} width={420} zIndex={1100}>
        {stopForm && (
          <div>
            <FormRow label="Stop Name"><input className="input" value={stopForm.stop_name || ""} onChange={(e) => setStopForm((f) => ({ ...f, stop_name: e.target.value }))} placeholder="Stop A - Market Chowk" /></FormRow>
            <FormGrid cols={2}>
              <FormRow label="Pickup Time"><input className="input" type="time" value={stopForm.pickup_time || ""} onChange={(e) => setStopForm((f) => ({ ...f, pickup_time: e.target.value }))} /></FormRow>
              <FormRow label="Drop Time"><input className="input" type="time" value={stopForm.drop_time || ""} onChange={(e) => setStopForm((f) => ({ ...f, drop_time: e.target.value }))} /></FormRow>
              <FormRow label="Monthly Fare (₹)"><input className="input" type="number" value={stopForm.monthly_fare || ""} onChange={(e) => setStopForm((f) => ({ ...f, monthly_fare: e.target.value }))} placeholder="800" /></FormRow>
            </FormGrid>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => setStopForm(null)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveStop} disabled={saving}>{saving ? "Saving…" : "Save Stop"}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ── TRIP / ROUTE ALLOCATION (Level 2) — the "1-click replace" screen ────
export const TransportTripsTab = () => {
  const { dialogAlert, dialogConfirm } = useDialog();
  const [assignments, setAssignments] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // route row being (re)assigned
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [a, r, v, s] = await Promise.all([
        apiRequest("/transport/trip-assignments"),
        apiRequest("/transport/routes"),
        apiRequest("/transport/vehicles"),
        apiRequest("/transport/staff"),
      ]);
      setAssignments(a?.data || []); setRoutes(r?.data || []); setVehicles(v?.data || []); setStaff(s?.data || []);
    } catch (e) { dialogAlert("Failed to load: " + e.message, "Error"); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadAll(); }, []);

  const assignmentFor = (routeId) => assignments.find((a) => a.route_id === routeId);
  const drivers = staff.filter((s) => s.role === "driver" && s.status === "active");
  const conductors = staff.filter((s) => s.role === "conductor" && s.status === "active");
  const activeVehicles = vehicles.filter((v) => v.status === "active");

  const openAssign = (route) => {
    const existing = assignmentFor(route.id);
    setForm({ route_id: route.id, vehicle_id: existing?.vehicle_id || "", driver_id: existing?.driver_id || "", conductor_id: existing?.conductor_id || "" });
    setModal(route);
  };

  const handleSave = async () => {
    if (!form.vehicle_id || !form.driver_id) { dialogAlert("Vehicle and Driver are required.", "Missing Info"); return; }
    const isReplace = !!assignmentFor(form.route_id);
    if (isReplace) {
      const ok = await dialogConfirm("This will replace the currently assigned bus/driver for this route. Student allocations stay untouched. Continue?", "Confirm Replace");
      if (!ok) return;
    }
    setSaving(true);
    try {
      await apiRequest("/transport/trip-assignments", "POST", form);
      setModal(null); await loadAll();
    } catch (e) { dialogAlert("Save failed: " + e.message, "Error"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead><tr><th>Route</th><th>Shift</th><th>Vehicle</th><th>Driver</th><th>Conductor</th><th style={{ textAlign: "center" }}>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 30, color: C.textMuted }}>Loading…</td></tr>
              ) : routes.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 30, color: C.textMuted }}>Create a route first (Routes & Stops tab).</td></tr>
              ) : routes.map((r) => {
                const a = assignmentFor(r.id);
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700 }}>{r.name}</td>
                    <td style={{ textTransform: "capitalize", fontSize: 12 }}>{r.shift}</td>
                    <td style={{ fontSize: 12 }}>{a?.registration_no || <span style={{ color: C.textFaint }}>Not assigned</span>}</td>
                    <td style={{ fontSize: 12 }}>{a?.driver_name || "—"}</td>
                    <td style={{ fontSize: 12 }}>{a?.conductor_name || "—"}</td>
                    <td style={{ textAlign: "center" }}>
                      <button className="btn btn-primary" style={{ fontSize: 11.5, padding: "6px 12px" }} onClick={() => openAssign(r)}>{a ? "Replace" : "Assign"}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal ? `Trip Assignment — ${modal.name}` : ""} width={460}>
        {modal && (
          <div>
            <FormRow label="Vehicle">
              <select className="select" value={form.vehicle_id || ""} onChange={(e) => setForm((f) => ({ ...f, vehicle_id: e.target.value }))}>
                <option value="">-- Select Vehicle --</option>
                {activeVehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_no} ({v.seating_capacity} seats)</option>)}
              </select>
            </FormRow>
            <FormRow label="Driver">
              <select className="select" value={form.driver_id || ""} onChange={(e) => setForm((f) => ({ ...f, driver_id: e.target.value }))}>
                <option value="">-- Select Driver --</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </FormRow>
            <FormRow label="Conductor (optional)">
              <select className="select" value={form.conductor_id || ""} onChange={(e) => setForm((f) => ({ ...f, conductor_id: e.target.value }))}>
                <option value="">-- None --</option>
                {conductors.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </FormRow>
            <div style={{ fontSize: 11.5, color: C.textMuted, marginBottom: 12 }}>Student transport allocations are linked to the route, not the bus — swapping here never disturbs them.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setModal(null)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Assignment"}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ── STUDENT ALLOCATION (Level 3) — stop select → auto bus + auto fee ────
export const TransportAllocationsTab = () => {
  const { dialogAlert, dialogConfirm } = useDialog();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [form, setForm] = useState({});
  const [studentQuery, setStudentQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const res = await apiRequest("/transport/allocations"); setRows(res?.data || []); }
    catch (e) { dialogAlert("Failed to load allocations: " + e.message, "Error"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = async () => {
    setForm({}); setPreview(null); setStudentQuery(""); setModal(true);
    try {
      const [s, r] = await Promise.all([apiRequest("/students"), apiRequest("/transport/routes")]);
      setStudents(s?.data || s || []); setRoutes(r?.data || []);
    } catch (e) { dialogAlert("Failed to load: " + e.message, "Error"); }
  };

  const onRouteChange = async (routeId) => {
    setForm((f) => ({ ...f, route_id: routeId, stop_id: "" })); setStops([]);
    if (!routeId) return;
    const res = await apiRequest(`/transport/routes/${routeId}/stops`);
    setStops(res?.data || []);
  };

  const onStopChange = (stopId) => {
    setForm((f) => ({ ...f, stop_id: stopId }));
    const stop = stops.find((s) => s.id === stopId);
    if (stop) setPreview({ fare: paiseToRupee(stop.monthly_fare_paise) });
  };

  const filteredStudents = students.filter((s) => {
    const name = `${s.first_name || ""} ${s.last_name || ""} ${s.admission_no || ""}`.toLowerCase();
    return !studentQuery || name.includes(studentQuery.toLowerCase());
  }).slice(0, 30);

  const handleAllocate = async () => {
    if (!form.student_id || !form.route_id || !form.stop_id) { dialogAlert("Select student, route and stop.", "Missing Info"); return; }
    setSaving(true);
    try {
      const res = await apiRequest("/transport/allocations", "POST", form);
      await dialogAlert(`Allocated. Bus: ${res?.data?.assigned_vehicle || "not yet assigned"} · Fee: ₹${res?.data?.monthly_fee}/mo (applies from next invoice generation).`, "Done");
      setModal(false); await load();
    } catch (e) { dialogAlert("Failed: " + e.message, "Error"); }
    finally { setSaving(false); }
  };

  const handleRemove = async (row) => {
    const ok = await dialogConfirm(`Remove ${row.student_name} from transport?`, "Confirm Remove");
    if (!ok) return;
    try { await apiRequest(`/transport/allocations/${row.student_id}`, "DELETE"); await load(); }
    catch (e) { dialogAlert("Failed: " + e.message, "Error"); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button className="btn btn-primary" onClick={openNew}><Icon name="plus" size={13} /> Allocate Student</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead><tr><th>Student</th><th>Admission No</th><th>Route</th><th>Stop</th><th>Bus</th><th>Fee/mo</th><th style={{ textAlign: "center" }}>Actions</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 30, color: C.textMuted }}>Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 30, color: C.textMuted }}>No students allocated yet.</td></tr>
              ) : rows.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600, fontSize: 12.5 }}>{a.student_name}</td>
                  <td style={{ fontSize: 12 }}>{a.admission_no}</td>
                  <td style={{ fontSize: 12 }}>{a.route_name}</td>
                  <td style={{ fontSize: 12 }}>{a.stop_name}</td>
                  <td style={{ fontSize: 12 }}>{a.assigned_vehicle || <span style={{ color: C.textFaint }}>—</span>}</td>
                  <td style={{ fontSize: 12, fontWeight: 700 }}>₹{paiseToRupee(a.monthly_fee_paise)}</td>
                  <td style={{ textAlign: "center" }}>
                    <button className="btn btn-ghost" style={{ padding: "5px 9px" }} onClick={() => handleRemove(a)}><Icon name="trash" size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Allocate Student to Transport" width={480}>
        <div>
          <FormRow label="Search Student">
            <input className="input" value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} placeholder="Name or admission no." />
          </FormRow>
          {studentQuery && (
            <div style={{ maxHeight: 140, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 14 }}>
              {filteredStudents.map((s) => (
                <div key={s.id} onClick={() => { setForm((f) => ({ ...f, student_id: s.id })); setStudentQuery(`${s.first_name} ${s.last_name || ""} (${s.admission_no || ""})`); }}
                  style={{ padding: "8px 12px", fontSize: 12.5, cursor: "pointer", background: form.student_id === s.id ? C.surfaceAlt : "transparent", borderBottom: `1px solid ${C.border}` }}>
                  {s.first_name} {s.last_name || ""} <span style={{ color: C.textMuted }}>· {s.admission_no || "—"}</span>
                </div>
              ))}
              {filteredStudents.length === 0 && <div style={{ padding: 12, fontSize: 12, color: C.textMuted }}>No matches</div>}
            </div>
          )}

          <FormRow label="Route">
            <select className="select" value={form.route_id || ""} onChange={(e) => onRouteChange(e.target.value)}>
              <option value="">-- Select Route --</option>
              {routes.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.shift})</option>)}
            </select>
          </FormRow>
          <FormRow label="Pickup/Drop Stop">
            <select className="select" value={form.stop_id || ""} onChange={(e) => onStopChange(e.target.value)} disabled={!stops.length}>
              <option value="">-- Select Stop --</option>
              {stops.map((s) => <option key={s.id} value={s.id}>{s.stop_name} ({s.pickup_time || "—"}) · ₹{paiseToRupee(s.monthly_fare_paise)}/mo</option>)}
            </select>
          </FormRow>

          {preview && (
            <div style={{ background: C.surfaceAlt, borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 12.5 }}>
              Monthly Transport Fee: <b>₹{preview.fare}</b> — will auto-apply from the next invoice generation run.
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setModal(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAllocate} disabled={saving}>{saving ? "Saving…" : "Allocate"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ── LIVE TRACKING (self-hosted Traccar, per-school) ─────────────────────
export const TransportLiveTab = () => {
  const { dialogAlert } = useDialog();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { const res = await apiRequest("/transport/gps/live"); setPositions(res?.data || []); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); const iv = setInterval(load, 15000); return () => clearInterval(iv); }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: C.textMuted }}>Auto-refreshes every 15s from your school's Traccar server.</div>
        <button className="btn btn-ghost" onClick={load}><Icon name="refresh" size={13} /> Refresh</button>
      </div>

      {error && (
        <div className="card" style={{ padding: 16, marginBottom: 14, borderColor: C.red }}>
          <div style={{ color: C.red, fontSize: 12.5, fontWeight: 600 }}>{error}</div>
          <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 4 }}>Set up your Traccar connection in the Settings tab.</div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead><tr><th>Vehicle</th><th>Speed</th><th>Ignition</th><th>Last Update</th><th>Location</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 30, color: C.textMuted }}>Loading…</td></tr>
              ) : positions.length === 0 && !error ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 30, color: C.textMuted }}>No live positions yet — check device IMEIs are correctly set on your vehicles.</td></tr>
              ) : positions.map((p) => (
                <tr key={p.vehicle_id}>
                  <td style={{ fontWeight: 700 }}>{p.registration_no}</td>
                  <td style={{ fontSize: 12 }}>{p.speed_kmh} km/h</td>
                  <td>{p.ignition_on ? <span className="badge badge-green">ON</span> : <span className="badge badge-red">OFF</span>}</td>
                  <td style={{ fontSize: 11.5, color: C.textMuted }}>{p.recorded_at ? new Date(p.recorded_at).toLocaleTimeString() : "—"}</td>
                  <td>
                    {p.latitude && p.longitude ? (
                      <a href={`https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=16/${p.latitude}/${p.longitude}`} target="_blank" rel="noreferrer" style={{ color: C.primary, fontSize: 12, fontWeight: 600 }}>
                        View on Map ↗
                      </a>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── GPS SETTINGS — each school connects its own self-hosted Traccar ─────
export const TransportSettingsTab = () => {
  const { dialogAlert } = useDialog();
  const [form, setForm] = useState({ traccar_base_url: "", traccar_username: "", traccar_password: "" });
  const [saved, setSaved] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try { const res = await apiRequest("/transport/gps/settings"); if (res?.data) setSaved(res.data); }
      catch (e) { /* not configured yet */ }
    })();
  }, []);

  const handleSave = async () => {
    if (!form.traccar_base_url || !form.traccar_username || !form.traccar_password) {
      dialogAlert("All fields are required.", "Missing Info"); return;
    }
    setSaving(true);
    try {
      await apiRequest("/transport/gps/settings", "PUT", form);
      setSaved({ traccar_base_url: form.traccar_base_url, traccar_username: form.traccar_username });
      setForm((f) => ({ ...f, traccar_password: "" }));
      dialogAlert("Traccar connection saved.", "Done");
    } catch (e) { dialogAlert("Failed: " + e.message, "Error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="card" style={{ padding: 20, maxWidth: 520 }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Self-Hosted Traccar Connection</div>
      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>
        Point this school at its own Traccar server — supports 200+ GPS protocols (Concox, Teltonika, Coban, Sinotrack) out of the box.
      </div>
      {saved && (
        <div style={{ background: C.surfaceAlt, borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 12 }}>
          Currently connected: <b>{saved.traccar_base_url}</b> ({saved.traccar_username})
        </div>
      )}
      <FormRow label="Traccar Server URL"><input className="input" value={form.traccar_base_url} onChange={(e) => setForm((f) => ({ ...f, traccar_base_url: e.target.value }))} placeholder="https://your-school-traccar.example.com" /></FormRow>
      <FormRow label="Username"><input className="input" value={form.traccar_username} onChange={(e) => setForm((f) => ({ ...f, traccar_username: e.target.value }))} /></FormRow>
      <FormRow label="Password"><input className="input" type="password" value={form.traccar_password} onChange={(e) => setForm((f) => ({ ...f, traccar_password: e.target.value }))} placeholder={saved ? "Enter to update" : ""} /></FormRow>
      <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ width: "100%", marginTop: 6 }}>{saving ? "Saving…" : "Save Connection"}</button>
    </div>
  );
};
