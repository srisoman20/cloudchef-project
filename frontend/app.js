// ============================
// COGNITO CONFIG
// ============================
const CLIENT_ID = "12lhjh1sc8pp2crquvgalf9bl2";
const COGNITO_DOMAIN = "https://cloudchef-login.auth.us-west-1.amazoncognito.com";
const REDIRECT_URI = "https://main.d1o5l2tvmd4zsn.amplifyapp.com/";

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeMessage = document.getElementById("welcomeMessage");

// LOGIN
loginBtn.onclick = () => {
  const url = `${COGNITO_DOMAIN}/login?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  window.location.href = url;
};

// LOGOUT
logoutBtn.onclick = () => {
  const url = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(REDIRECT_URI)}`;
  window.location.href = url;
};

// READ LOGIN CODE
function getQueryParam(n) {
  return new URL(window.location.href).searchParams.get(n);
}

const code = getQueryParam("code");

if (code) {
  welcomeMessage.textContent = "Welcome! You are logged in 🎉";
  loginBtn.style.display = "none";
  logoutBtn.style.display = "inline-block";
} else {
  loginBtn.style.display = "inline-block";
  logoutBtn.style.display = "none";
}



// ============================
// PAGE NAVIGATION
// ============================
const mainPage = document.getElementById("mainPage");
const savedPage = document.getElementById("savedPage");
const groceryPage = document.getElementById("groceryPage");

document.getElementById("nav-generate").onclick = () => showPage("main");
document.getElementById("nav-saved").onclick = () => showPage("saved");
document.getElementById("nav-grocery").onclick = () => showPage("grocery");

function showPage(page) {
  mainPage.classList.add("hidden");
  savedPage.classList.add("hidden");
  groceryPage.classList.add("hidden");

  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));

  if (page === "main") {
    mainPage.classList.remove("hidden");
    document.getElementById("nav-generate").classList.add("active");

  } else if (page === "saved") {
    savedPage.classList.remove("hidden");
    document.getElementById("nav-saved").classList.add("active");

  } else if (page === "grocery") {
    groceryPage.classList.remove("hidden");
    document.getElementById("nav-grocery").classList.add("active");
  }
}



// ============================
// INGREDIENT INPUT SYSTEM
// ============================
let ingredientArray = [];

function addIngredient() {
  const name = document.getElementById("ingredientName").value.trim();
  const qty = document.getElementById("ingredientQty").value.trim();

  if (!name) return;

  ingredientArray.push({ name, qty });
  renderIngredients();

  document.getElementById("ingredientName").value = "";
  document.getElementById("ingredientQty").value = "";
}

function removeIngredient(i) {
  ingredientArray.splice(i, 1);
  renderIngredients();
}

function renderIngredients() {
  const list = document.getElementById("ingredientList");
  list.innerHTML = ingredientArray
    .map((ing, i) => `
      <li>
        <span>${ing.name} — <strong>${ing.qty || "1"}</strong></span>
        <button onclick="removeIngredient(${i})" style="color:red;background:none;border:none;font-size:18px;cursor:pointer;">✗</button>
      </li>
    `)
    .join("");
}

// ============================
// GENERATE RECIPE (real API call)
// ============================
const API_GENERATE = "https://1x5z0afqn2.execute-api.us-west-2.amazonaws.com/Prod/generate";

async function generateRecipe() {
  const output = document.getElementById("output");
  output.innerHTML = "👩‍🍳 Generating recipes with AI...";

  try {
    // Read ingredients directly from the text input
    const ingredientInput = document.querySelector('input[placeholder="Ingredient (e.g., tomato)"]').value;
    const ingredients = ingredientInput
      .split(",")
      .map(i => i.trim())
      .filter(i => i.length > 0);

    console.log("Ingredients sent to API:", ingredients);

    const response = await fetch(API_GENERATE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients })
    });

    const data = await response.json();
    console.log("AI RESPONSE:", data);

    if (data.recipes) {
      output.innerHTML = `<div class="ai-response">${data.recipes.replace(/\n/g, "<br>")}</div>`;
    } else {
      output.innerHTML = "⚠️ No recipes returned from AI.";
    }

  } catch (error) {
    console.error("AI ERROR:", error);
    output.innerHTML = `<p style="color:red;">❌ Failed to generate recipes.</p>`;
  }
}




// ============================
// DETECT INGREDIENTS (real API call)
// ============================
const API_ANALYZE = "https://q98mz40wlg.execute-api.us-west-1.amazonaws.com/Prod/analyze";

async function analyzeImage() {
  const output = document.getElementById("output");
  output.innerHTML = "🔍 Detecting ingredients...";

  try {
    const response = await fetch("https://q98mz40wlg.execute-api.us-west-1.amazonaws.com/Prod/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: "ping" })
    });

    const data = await response.json();
    console.log("API RESPONSE:", data);

    // ✅ This is the key change: your Lambda already returns { message, ingredients }
    const detected = data.ingredients || [];

    // Display results in the UI
    if (detected.length > 0) {
      output.innerHTML = `✅ ${data.message} Detected: ${detected.join(", ")}`;
    } else {
      output.innerHTML = `⚠️ ${data.message || "Connected but no ingredients returned."}`;
    }

  } catch (error) {
    console.error("ERROR:", error);
    output.innerHTML = `<p style="color:red;">❌ AWS Analyze API call failed.</p>`;
  }
}


// ============================
// SAVE RECIPE (real API call)
// ============================
const API_SAVE = "https://q98mz40wlg.execute-api.us-west-1.amazonaws.com/Prod/saveRecipe";

async function saveRecipe() {
  const output = document.getElementById("output");
  output.innerHTML = "💾 Saving recipe...";

  try {
    const recipeData = {
      title: document.querySelector("#output h3")?.innerText || "Untitled Recipe",
      ingredients: ingredientArray.map(i => i.name),
      quantities: ingredientArray.map(i => i.qty),
      timestamp: new Date().toISOString()
    };

    const response = await fetch(API_SAVE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipeData)
    });

    const data = await response.json();
    console.log("SAVE RESPONSE:", data);

    output.innerHTML = `✅ ${data.message || "Recipe saved successfully!"}`;

  } catch (error) {
    console.error("SAVE ERROR:", error);
    output.innerHTML = `<p style="color:red;">❌ Failed to save recipe.</p>`;
  }
}


