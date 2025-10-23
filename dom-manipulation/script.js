// Load quotes from localStorage or use default
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Success is not final; failure is not fatal: it is the courage to continue that counts.", category: "Success" },
  { text: "Happiness depends upon ourselves.", category: "Happiness" }
];

// DOM elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const categorySelect = document.getElementById("categorySelect");
const filterQuotesBtn = document.getElementById("filterQuotes");

// ✅ Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Populate categories dynamically
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

// ✅ Display random quote
function displayRandomQuote(filterCategory = "all") {
  let filteredQuotes = filterCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === filterCategory);

  if (filteredQuotes.length === 0) {
    quoteDisplay.innerHTML = "No quotes available for this category yet!";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const { text, category } = filteredQuotes[randomIndex];
  quoteDisplay.innerHTML = `<p>"${text}"</p><small>— ${category}</small>`;
}

// ✅ Add new quote dynamically
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");
  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (text && category) {
    quotes.push({ text, category });
    saveQuotes();
    textInput.value = "";
    categoryInput.value = "";
    populateCategories();
    alert("✅ New quote added successfully!");
  } else {
    alert("⚠️ Please fill in both fields!");
  }
}

// ✅ Export quotes to JSON file
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  alert("✅ Quotes exported successfully!");
}

// ✅ Import quotes from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        alert("✅ Quotes imported successfully!");
      } else {
        alert("⚠️ Invalid JSON file format.");
      }
    } catch (error) {
      alert("⚠️ Error reading JSON file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// ✅ Event listeners
newQuoteBtn.addEventListener("click", () => displayRandomQuote());
addQuoteBtn.addEventListener("click", addQuote);
filterQuotesBtn.addEventListener("click", () => {
  const selected = categorySelect.value;
  displayRandomQuote(selected);
});

// Initialize
populateCategories();
displayRandomQuote();
