// Initial quotes
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
const categoryFilter = document.getElementById("categoryFilter");

// Save quotes to local storage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Populate categories dynamically
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  // Restore last selected filter from local storage
  const lastFilter = localStorage.getItem("selectedCategory");
  if (lastFilter) {
    categoryFilter.value = lastFilter;
  }
}

// Show random quote
function showRandomQuote(filterCategory = "all") {
  let filteredQuotes = filterCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === filterCategory);

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category yet!";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const { text, category } = filteredQuotes[randomIndex];
  quoteDisplay.innerHTML = `<p>"${text}"</p><small>— ${category}</small>`;

  // Save last viewed quote to session storage
  sessionStorage.setItem("lastQuote", JSON.stringify({ text, category }));
}

// Add a new quote
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
    alert("⚠️ Please fill in both the quote and category.");
  }
}

// Filter quotes based on selected category
function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem("selectedCategory", selected);
  showRandomQuote(selected);
}

// Export quotes to JSON file
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Import quotes from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    const importedQuotes = JSON.parse(e.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    alert("✅ Quotes imported successfully!");
  };
  fileReader.readAsText(event.target.files[0]);
}

// Event listeners
newQuoteBtn.addEventListener("click", () => {
  const selected = categoryFilter.value;
  showRandomQuote(selected);
});
addQuoteBtn.addEventListener("click", addQuote);

// Initialize app
populateCategories();
const lastCategory = localStorage.getItem("selectedCategory") || "all";
showRandomQuote(lastCategory);
