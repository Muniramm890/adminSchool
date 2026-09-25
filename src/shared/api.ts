// path: src/shared/api.ts




// ═══════════════════════════════════════════════════════════════
// AUTHENTICATION LOGIC & LOGIN UI (ADDED AT BOTTOM)
// ═══════════════════════════════════════════════════════════════

export const API_BASE_URL =
  "https://waapi-h6e7b5g9cmfthkhn.centralindia-01.azurewebsites.net/api"; // 🔴 YAHAN APNI AZURE WEB APP KI LINK DAALEIN

  let authLogoutRef = null; // module-level, AuthProvider isko set karega

  export const apiRequest = async (endpoint, method = "GET", body = null, isFormData = false) => {
    try {
      const token = localStorage.getItem("erp_token");
      const headers = { Accept: "application/json" };
      if (!isFormData) headers["Content-Type"] = "application/json";
      if (token && token !== "undefined" && token !== "null") {
        headers["Authorization"] = `Bearer ${token}`;
      }
  
      const config = { method, headers };
      if (body) config.body = isFormData ? body : JSON.stringify(body);
  
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      if (response.status === 204) return null;
      const data = await response.json();
  
      if (response.status === 401) {
        localStorage.removeItem("erp_token");
        if (authLogoutRef) authLogoutRef();       // React state se logout
        // 🔴 window.location.reload() fallback HATA DIYA — ye hi reload-loop
        // ka source tha. Ab error throw hoga, jo AuthProvider ke apne
        // try/catch mein already handle ho raha hai (token clear + setUser(null)
        // + setLoading(false)) — koi hard page-reload ki zaroorat nahi.
        throw new Error("Session expired. Please login again.");
      }
  
      if (!response.ok) throw new Error(data.message || data.error || "API Error");
      return data;
    } catch (error) {
      console.error(`Error on ${endpoint}:`, error.message);
      throw error;
    }
  };





// 🟢 NEW: SECURE AZURE PROXY API (For Quick Tests)
export const gasRequest = async (action, payload = {}) => {
  try {
    // Frontend अब सीधे अपने ही Azure Backend को कॉल करेगा
    // Azure बैकग्राउंड में GAS से बात करके रिज़ल्ट लाएगा
    const data = await apiRequest("/quick-tests/gas-sync", "POST", {
      action: action,
      payload: payload
    });
    
    if (!data.status && !data.success) {
      throw new Error(data.message || "Proxy API Error");
    }
    
    return data;
  } catch (error) {
    console.error(`Secure Proxy Error on [${action}]:`, error.message);
    throw error;
  }
};
