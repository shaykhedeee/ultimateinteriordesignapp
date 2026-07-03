
"use client";

import { useEffect, useState } from "react";

const API = "http://127.0.0.1:5055/api";

export default function SettingsPanel() {
  const [form, setForm] = useState({
    liveImageGen: "false",
    primaryImageProvider: "library-reuse",
    fallbackOrder: "pollinations,mock",
    spendMode: "smart-cost",
    reuseThreshold: "86",
    maxAutoRenderVariants: "2",
    ollamaModel: "openchat",
    auraProvider: "auto",
    freeFirst: "true"
  });

  const [settings, setSettings] = useState(null);
  const [status, setStatus] = useState(null);
  const [providerStatus, setProviderStatus] = useState(null);
  const [chip, setChip] = useState({ msg: "", kind: "idle" });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line
  }, []);

  async function refresh() {
    await Promise.all([loadSettings(), loadProviderStatus()]);
  }

  async function loadSettings() {
    try {
      const res = await fetch(`${API}/settings/providers`);
      const data = await res.json();
      setSettings(data);
      if (data?.settings) {
        setForm((prev) => ({
          ...prev,
          ...data.settings
        }));
      }
    } catch (e) {
      console.warn(e);
    }
  }

  async function loadProviderStatus() {
    try {
      const res = await fetch(`${API}/providers/status`);
      const data = await res.json();
      setProviderStatus(data);
      setStatus(null);
    } catch (e) {
      setStatus(`Provider status failed: ${e.message}`);
    }
  }

  async function saveSettings(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/settings/providers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: form })
      });
      const data = await res.json();
      showChip(data?.success ? "Settings saved" : `Save failed: ${data?.error || 'unknown'}`, data?.success ? "ok" : "error");
      await loadSettings();
      await loadProviderStatus();
    } catch (e) {
      showChip(`Save failed: ${e.message}`, "error");
    }
  }

  async function testChat() {
    try {
      const res = await fetch(`${API}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Check available design tools and status.", history: [] })
      });
      const data = await res.json();
      showChip(`Chat test: ${data?.reply || data?.error || 'no response'}`, res.ok ? "ok" : "error");
    } catch (e) {
      showChip(`Chat test failed: ${e.message}`, "error");
    }
  }

  function showChip(msg, kind = "idle") {
    setChip({ msg, kind });
    setTimeout(() => setChip((p) => p.msg ? { msg: "", kind: "idle" } : p), 2350);
  }

  const field = (key, label, type = "text") => (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <input
        type={type}
        value={form[key] || ""}
        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
        style={styles.input}
        aria-label={label}
      />
    </label>
  );

  return (
    <div style={styles.wrap} aria-label="Settings panel">
      <form onSubmit={saveSettings} style={styles.card}>
        <h1 style={styles.h1}>Provider & Model Settings</h1>

        <div style={styles.chipWrap} aria-live="polite" aria-atomic="true">
          <span role="status" style={{ ...styles.chip, ...(chip.kind === "ok" ? styles.chipOk : chip.kind === "error" ? styles.chipErr : styles.chipIdle) }}>{chip.msg}</span>
        </div>

        <section style={styles.section}>
          <h2 style={styles.h2}>Image Generation</h2>
          {field("liveImageGen", "Live Image Generation", "checkbox")}
          <label style={styles.field}>
            <span style={styles.label}>Primary Image Provider</span>
            <select value={form.primaryImageProvider} onChange={(e) => setForm((p) => ({ ...p, primaryImageProvider: e.target.value }))} style={styles.input} aria-label="Primary Image Provider">
              <option value="library-reuse">Library reuse</option>
              <option value="gemini-imagen">Gemini Imagen</option>
              <option value="openai-gpt-image-1">OpenAI GPT Image</option>
              <option value="openai">OpenAI DALL-E</option>
              <option value="huggingface">HuggingFace</option>
              <option value="stability-sdxl">Stability SDXL</option>
              <option value="stability-flux">Stability Flux</option>
              <option value="freepik">Freepik</option>
              <option value="pollinations">Pollinations</option>
              <option value="pexels">Pexels</option>
              <option value="curated">Curated</option>
              <option value="mock">Mock</option>
            </select>
          </label>
          {field("fallbackOrder", "Fallback Order (comma separated)")}
          {field("spendMode", "Spend Mode")}
          {field("reuseThreshold", "Reuse Threshold")}
          {field("maxAutoRenderVariants", "Max Auto Render Variants")}
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>LLM / AURA</h2>
          {field("ollamaModel", "Ollama Model")}
          <label style={styles.field}>
            <span style={styles.label}>AURA Provider</span>
            <select value={form.auraProvider} onChange={(e) => setForm((p) => ({ ...p, auraProvider: e.target.value }))} style={styles.input} aria-label="AURA Provider">
              <option value="auto">Auto</option>
              <option value="ollama">Ollama</option>
              <option value="openrouter">OpenRouter</option>
              <option value="gemini">Gemini</option>
              <option value="offline">Offline</option>
            </select>
          </label>
          {field("freeFirst", "Prefer Free Providers", "checkbox")}
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Provider Status</h2>
          <pre style={styles.pre}>{JSON.stringify(providerStatus, null, 2)}</pre>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Saved Settings</h2>
          <pre style={styles.pre}>{JSON.stringify(settings, null, 2)}</pre>
        </section>

        <div style={styles.actions}>
          <button type="submit" style={styles.primary}>Save Settings</button>
          <button type="button" onClick={loadProviderStatus} style={styles.secondary}>Refresh Status</button>
          <button type="button" onClick={testChat} style={styles.secondary}>Test Chat</button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  wrap: { minHeight: "100vh", background: "#0b0f14", color: "#e6e8ec", padding: 24, fontFamily: "Outfit, Plus Jakarta Sans, Arial, sans-serif" },
  card: { maxWidth: 980, margin: "0 auto", background: "#11161dff", border: "1px solid #1f2937", borderRadius: 18, padding: 22, boxShadow: "0 20px 60px rgba(0,0,0,0.45)" },
  h1: { margin: "0 0 14px 0", fontSize: 26, fontWeight: 700, letterSpacing: 0.2 },
  h2: { margin: "18px 0 8px 0", fontSize: 16, fontWeight: 600, color: "#cbd5e1" },
  section: { padding: "14px 0", borderTop: "1px solid #1a2230" },
  field: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14, margin: "10px 0" },
  label: { fontSize: 14, color: "#cbd5e1", opacity: 0.92 },
  input: { background: "#0b0f14", color: "#e6e8ec", border: "1px solid #243044", borderRadius: 10, padding: "10px 12px", minWidth: 260, outline: "none" },
  pre: { background: "#0b0f14", color: "#b6c3d6", padding: 16, borderRadius: 12, border: "1px solid #1f2937", overflowX: "auto" },
  actions: { display: "flex", gap: 12, marginTop: 18 },
  primary: { background: "#2563eb", color: "#fff", border: "none", borderRadius: 12, padding: "12px 16px", fontWeight: 600, cursor: "pointer" },
  secondary: { background: "#1f2937", color: "#e6e8ec", border: "1px solid #243044", borderRadius: 12, padding: "12px 16px", fontWeight: 600, cursor: "pointer" },
  chipWrap: { minHeight: 28, margin: "8px 0" },
  chip: { display: "inline-block", padding: "8px 12px", borderRadius: 999, fontSize: 13, fontWeight: 600 },
  chipIdle: { background: "#1f2937", color: "#cbd5e1" },
  chipOk: { background: "#052e16", color: "#4ade80" },
  chipErr: { background: "#3b0d0d", color: "#fca5a5" }
};
