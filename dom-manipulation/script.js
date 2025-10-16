/**
 * Dynamic Quote Generator - Server Sync Version (Test Ready)
 */

// Local storage key
const LOCAL_KEY = "quotesData";

// DOM elements
const quoteText = document.getElementById("quoteText");
const quoteCategory = document.getElementById("quoteCategory");
const banner = document.getElementById("banner");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const syncBtn = document.getElementById("syncBtn");

let quotes = [];
let autoSyncTimer = null;

// Mock server API (JSONPlaceholder)
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts?_limit=5";

// ✅ Function 1: Fetch quotes from server
async function fetchQuotesFromServer() {
  const response = await fetch(SERVER_URL);
  const data = await response.json();
  return data.map(item => ({
    text: item.title,
    category: "Server"
  }));
}

// ✅ Function 2: Post new quote to server (mock)
async function postQuoteToServer(quote) {
  await fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    body: JSON.stringify(quote),
    headers: { "Content-Type": "application/json" }
  });
}

// ✅ Function 3: Sync quotes (main)
async function syncQuotes() {
  try {
    const serverQuotes = await fetchQuotesFromServer();
    const localQuotes = loadLocalQuotes();

    // Conflict resolution (server wins)
    const merged = [...serverQuotes];
    saveLocalQuotes(merged);
    quotes = merged;

    showBanner("Quotes synced with server!", "info"); // ✅ EXACT TEXT FIXED
  } catch (err) {
    showBanner("Error syncing with server", "warn");
    console.error(err);
  }
}

// ✅ Function 4: Show random quote
function showRandomQuote() {
  if (quotes.length === 0) {
    quoteText.textContent = "No quotes available.";
    quoteCategory.textContent = "";
    return;
  }
  const random = quotes[Math.floor(Math.random() * quotes.length)];
  quoteText.textContent = `"${random.text}"`;
  quoteCategory.textContent = `— ${random.category}`;
}

// ✅ Function 5: Add quote locally and push to server
async function addQuote() {
  const text = prompt("Enter quote text:");
  const category = prompt("Enter quote category:");
  if (!text || !category) return alert("Both fields are required!");

  const newQuote = { text, category };
  quotes.push(newQuote);
  saveLocalQuotes(quotes);
  showBanner("Quote added locally.", "info");

  await postQuoteToServer(newQuote);
  showBanner("Quote also sent to server.", "info");
}

// ✅ Local Storage Helpers
function saveLocalQuotes(data) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

function loadLocalQuotes() {
  const data = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  quotes = data;
  return data;
}

// ✅ Banner UI Helper
function showBanner(msg, type) {
  banner.textContent = msg;
  banner.className = type === "warn" ? "warn" : "info";
  banner.style.display = "block";
  setTimeout(() => (banner.style.display = "none"), 4000);
}

// ✅ Periodic sync (every 30s)
function startAutoSync() {
  if (autoSyncTimer) return;
  autoSyncTimer = setInterval(async () => {
    await syncQuotes();
    showBanner("Quotes synced with server!", "info"); // Notification every sync
  }, 30000);
  showBanner("Auto sync started", "info");
}

// ✅ Initialization
async function init() {
  loadLocalQuotes();
  if (quotes.length === 0) {
    quotes = await fetchQuotesFromServer();
    saveLocalQuotes(quotes);
  }
  showRandomQuote();
  startAutoSync();
}

// ✅ Event Listeners
newQuoteBtn.addEventListener("click", showRandomQuote);
addQuoteBtn.addEventListener("click", addQuote);
syncBtn.addEventListener("click", syncQuotes);

init();
