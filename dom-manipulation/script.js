// Initial quotes
let quotes = [
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

// Load categories dynamically
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

// Show random quote (with optional category filter)
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

  quoteDisplay.innerHTML = `
    <p>"${text}"</p>
    <small>— ${category}</small>
  `;
}

// Add a new quote dynamically
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");
  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (text && category) {
    quotes.push({ text, category });
    textInput.value = "";
    categoryInput.value = "";
    populateCategories();
    alert("✅ New quote added successfully!");
  } else {
    alert("⚠️ Please fill in both the quote and category.");
  }
}

// Event listeners
newQuoteBtn.addEventListener("click", () => showRandomQuote());
addQuoteBtn.addEventListener("click", addQuote);
filterQuotesBtn.addEventListener("click", () => {
  const selected = categorySelect.value;
  showRandomQuote(selected);
});

// Initialize
populateCategories();
showRandomQuote();
