// ========== Dynamic Quote Generator with Web Storage + JSON Import/Export ==========

// Default quotes
let quotes = [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Success is not final; failure is not fatal: it is the courage to continue that counts.", category: "Success" },
  { text: "Happiness depends upon ourselves.", category: "Happiness" }
];

// DOM Elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const categorySelect = document.getElementById("categorySelect");
const filterQuotesBtn = document.getElementById("filterQuotes");
const importFileInput = document.getElementById("importFile");

// ---------- Local Storage Handling ----------
function saveQuotes() {
  localStorage.setItem("quotesData", JSON.stringify(quotes));
}

function loadQuotes() {
  const saved = localStorage.getItem("quotesData");
  if (saved) quotes = JSON.parse(saved);
}

// ---------- Category Dropdown ----------
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categorySelect.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// ---------- Show Random Quote ----------
function showRandomQuote(filterCategory = "all") {
  const filtered = filterCategory === "all" ? quotes : quotes.filter(q => q.category === filterCategory);
  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes found for this category!";
    return;
  }
  const randomIndex = Math.floor(Math.random() * filtered.length);
  const { text, category } = filtered[randomIndex];
  quoteDisplay.innerHTML = `
    <p>"${text}"</p>
    <small>— ${category}</small>
  `;
  sessionStorage.setItem("lastQuoteIndex", randomIndex);
}

// ---------- Add Quote ----------
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (text && category) {
    quotes.push({ text, category });
    saveQuotes();
    populateCategories();
    alert("✅ Quote added successfully!");
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
  } else {
    alert("⚠️ Please fill in both fields!");
  }
}

// ---------- Export Quotes to JSON ----------
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();
  URL.revokeObjectURL(url);
}

// ---------- Import Quotes from JSON ----------
function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (!Array.isArray(importedQuotes)) throw new Error("Invalid JSON format!");
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      alert("✅ Quotes imported successfully!");
    } catch (error) {
      alert("⚠️ Failed to import JSON file: " + error.message);
    }
  };

  reader.readAsText(file);
}

// ---------- Event Listeners ----------
newQuoteBtn.addEventListener("click", () => showRandomQuote());
addQuoteBtn.addEventListener("click", addQuote);
filterQuotesBtn.addEventListener("click", () => {
  const selected = categorySelect.value;
  showRandomQuote(selected);
});

// ---------- Initialize ----------
loadQuotes();
populateCategories();
showRandomQuote();

// Expose functions for checker
window.importFromJsonFile = importFromJsonFile;
window.exportToJsonFile = exportToJsonFile;
