/**
 * script.js — Sync + conflict resolution demo
 *
 * Behavior:
 * - Loads quotes (from localStorage or default hard-coded)
 * - Periodically (or manually) fetches server "quotes" from a simulation endpoint
 * - Detects differences between server and local
 * - If differences exist, notifies user and allows:
 *     - Apply server changes (server-wins)
 *     - Keep local changes
 * - Server fetch mapping uses jsonplaceholder posts for simulation
 *
 * Replace SERVER_URL with your real API if available.
 */

// ----- Configuration -----
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts?_limit=6"; // simulation endpoint
const SYNC_INTERVAL_MS = 30000; // 30s auto-sync
const LOCAL_KEY = "dqg_quotes_v1";

// ----- DOM elements -----
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const importFileInput = document.getElementById("importFile");
const exportBtn = document.getElementById("exportBtn");
const syncBanner = document.getElementById("syncBanner");
const manualSyncBtn = document.getElementById("manualSyncBtn");
const toggleAutoSyncBtn = document.getElementById("toggleAutoSyncBtn");
const syncStatus = document.getElementById("syncStatus");
const conflictArea = document.getElementById("conflictArea");
const conflictDetails = document.getElementById("conflictDetails");
const applyServerBtn = document.getElementById("applyServerBtn");
const keepLocalBtn = document.getElementById("keepLocalBtn");

// ----- In-memory state -----
let quotes = [];
let autoSyncTimer = null;
let lastServerData = null; // cache last server snapshot for diffing

// ----- Helpers -----
function saveLocal() {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(quotes));
}

function loadLocal() {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(q => q.text && q.category)) {
      quotes = parsed;
      return true;
    }
  } catch (e) { /* ignore */ }
  return false;
}

function defaultQuotes() {
  return [
    { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
    { text: "Life is what happens when you're busy making other plans.", category: "Life" },
    { text: "Success is not final; failure is not fatal: it is the courage to continue that counts.", category: "Success" },
    { text: "Happiness depends upon ourselves.", category: "Happiness" }
  ];
}

function escapeHtml(s="") {
  return String(s).replace(/[&<>"'`=\/]/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#x2F;','`':'&#x60;','=':'&#x3D;'
  })[c]);
}

// ----- UI helpers -----
function showBanner(message, type="info", timeout=7000) {
  syncBanner.textContent = message;
  syncBanner.className = `banner ${type === "warn" ? "warn" : "info"}`;
  syncBanner.style.display = "block";
  if (timeout) {
    setTimeout(() => {
      syncBanner.style.display = "none";
    }, timeout);
  }
}

function clearBanner() {
  syncBanner.style.display = "none";
}

// ----- Display quote (random) -----
function showRandomQuote() {
  if (!quotes.length) {
    quoteDisplay.innerHTML = `<p>No quotes available.</p>`;
    return;
  }
  const idx = Math.floor(Math.random() * quotes.length);
  const q = quotes[idx];
  quoteDisplay.innerHTML = `<blockquote>"${escapeHtml(q.text)}"</blockquote><small>— ${escapeHtml(q.category)}</small>`;
  // store last viewed index in sessionStorage
  sessionStorage.setItem("dqg_last_view", JSON.stringify({ index: idx, time: Date.now() }));
}

// ----- Add Quote -----
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const catInput = document.getElementById("newQuoteCategory");
  const text = textInput.value && textInput.value.trim();
  const category = catInput.value && catInput.value.trim();
  if (!text || !category) {
    alert("Please fill both text and category.");
    return;
  }
  quotes.push({ text, category });
  saveLocal();
  showBanner("Local quote added and saved locally.", "info", 3000);
  textInput.value = ""; catInput.value = "";
}

// ----- Import / Export (existing) -----
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "quotes_export.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return showBanner("No import file selected.", "warn");
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!Array.isArray(parsed)) throw new Error("Imported JSON must be an array.");
      const valid = parsed.filter(it => it && typeof it.text === "string" && typeof it.category === "string");
      if (!valid.length) throw new Error("No valid quote objects in file.");
      // Merge imported into local
      quotes = quotes.concat(valid);
      saveLocal();
      showBanner(`Imported ${valid.length} quotes and saved to local storage.`, "info");
    } catch (err) {
      showBanner("Import failed: " + (err.message || err), "warn");
    }
  };
  reader.readAsText(file);
}

// ----- Server interaction (simulation using jsonplaceholder) -----
// Map server data to quote objects for simulation
async function fetchServerQuotes() {
  try {
    const res = await fetch(SERVER_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Network error: " + res.status);
    const data = await res.json();
    // data is an array of posts: map to quotes: use body as text, title as category (or fixed)
    const mapped = data.map(item => {
      return {
        text: item.body ? String(item.body).slice(0, 200) : String(item.title || "Server quote"),
        category: item.title ? String(item.title).slice(0, 30) : "Server"
      };
    });
    return mapped;
  } catch (err) {
    console.warn("fetchServerQuotes failed:", err);
    throw err;
  }
}

// Diff algorithm: returns object { added:[], removed:[], conflicts:[] }
function diffServerLocal(serverList, localList) {
  const added = [];    // present on server but not locally
  const removed = [];  // present locally but not on server
  const conflicts = []; // same text but different category

  // We'll match by exact text
  const localByText = new Map(localList.map(q => [q.text, q]));
  const serverByText = new Map(serverList.map(q => [q.text, q]));

  // server -> check added or conflicts
  for (const s of serverList) {
    const local = localByText.get(s.text);
    if (!local) {
      added.push(s);
    } else if (local.category !== s.category) {
      conflicts.push({ text: s.text, localCategory: local.category, serverCategory: s.category });
    }
  }

  // local -> check removed
  for (const l of localList) {
    if (!serverByText.has(l.text)) {
      removed.push(l);
    }
  }

  return { added, removed, conflicts };
}

// Apply server changes (server wins): overwrite local with server list
function applyServerChanges(serverList) {
  quotes = serverList.slice(); // copy
  saveLocal();
  lastServerData = serverList.slice();
  showBanner("Applied server data (server-wins). Local storage updated.", "info");
  renderConflictArea(false);
  showRandomQuote();
}

// Keep local (do nothing aside from dismiss conflict area)
function keepLocalData() {
  showBanner("Kept local data. No changes applied.", "info");
  renderConflictArea(false);
}

// Render conflict area UI
function renderConflictArea(show, details={}) {
  if (!show) {
    conflictArea.style.display = "none";
    conflictDetails.innerHTML = "";
    return;
  }
  conflictArea.style.display = "block";
  const { added=[], removed=[], conflicts=[] } = details;
  let html = `<strong>Sync result:</strong><ul>`;
  if (added.length) html += `<li>${added.length} quote(s) available on server but not locally.</li>`;
  if (removed.length) html += `<li>${removed.length} quote(s) exist locally but not on server.</li>`;
  if (conflicts.length) html += `<li>${conflicts.length} conflict(s) (same text, different category).</li>`;
  html += `</ul><p class="small">You can accept server changes (server wins) or keep local data.</p>`;
  conflictDetails.innerHTML = html;
}

// Manual sync and auto sync logic
async function performSync(auto=false) {
  syncStatus.textContent = auto ? "Auto-sync: fetching..." : "Sync: fetching...";
  try {
    const serverData = await fetchServerQuotes();
    lastServerData = serverData;
    const diff = diffServerLocal(serverData, quotes);
    const changesCount = diff.added.length + diff.removed.length + diff.conflicts.length;
    if (changesCount === 0) {
      showBanner("No updates from server.", "info", 2000);
      syncStatus.textContent = `Last sync: ${new Date().toLocaleTimeString()}`;
      renderConflictArea(false);
      return;
    }
    // show conflict area with details
    renderConflictArea(true, diff);
    // notify user
    showBanner(`Server has ${changesCount} change(s). Choose resolution below.`, "warn", 8000);
    syncStatus.textContent = `Last sync found ${changesCount} change(s)`;
    // buttons wired to applyServerChanges() and keepLocalData()
    // if auto sync, we will apply server changes automatically (server-wins) to keep things simple
    if (auto) {
      // apply server wins automatically
      applyServerChanges(serverData);
      syncStatus.textContent = `Auto-sync applied server changes at ${new Date().toLocaleTimeString()}`;
    } else {
      // wait for user to choose (applyServerBtn / keepLocalBtn handlers)
      // when user chooses, they will call applyServerChanges(serverData) or keepLocalData()
      applyServerBtn.onclick = () => applyServerChanges(serverData);
      keepLocalBtn.onclick = () => keepLocalData();
    }
  } catch (err) {
    showBanner("Sync failed: " + (err.message || err), "warn", 5000);
    syncStatus.textContent = "Sync failed";
    console.warn(err);
  }
}

// Start/Stop auto sync
function startAutoSync() {
  if (autoSyncTimer) return;
  autoSyncTimer = setInterval(() => performSync(true), SYNC_INTERVAL_MS);
  toggleAutoSyncBtn.textContent = "Stop Auto Sync";
  showBanner("Auto-sync started.", "info", 2500);
}
function stopAutoSync() {
  if (!autoSyncTimer) return;
  clearInterval(autoSyncTimer);
  autoSyncTimer = null;
  toggleAutoSyncBtn.textContent = "Start Auto Sync";
  showBanner("Auto-sync stopped.", "info", 2500);
}

// ----- Wiring UI events -----
newQuoteBtn.addEventListener("click", showRandomQuote);
addQuoteBtn.addEventListener("click", addQuote);
importFileInput && importFileInput.addEventListener("change", importFromJsonFile);
exportBtn && exportBtn.addEventListener("click", exportToJsonFile);
manualSyncBtn.addEventListener("click", () => performSync(false));
toggleAutoSyncBtn.addEventListener("click", () => {
  if (autoSyncTimer) stopAutoSync(); else startAutoSync();
});

// ----- Initialization -----
function init() {
  // Load local or defaults
  if (!loadLocal()) {
    quotes = defaultQuotes();
    saveLocal();
  }
  // Show a quote
  showRandomQuote();
  syncStatus.textContent = "Ready";
  // Optionally start auto-sync automatically? (we keep it manual by default)
  // startAutoSync();
}

document.addEventListener("DOMContentLoaded", init);
