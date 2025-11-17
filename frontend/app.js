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
const API_GENERATE = "https://q98mz40wlg.execute-api.us-west-1.amazonaws.com/Prod/generate";

async function generateRecipe() {
  const output = document.getElementById("output");
  output.innerHTML = "⏳ Generating recipe...";

  try {
    const response = await fetch(API_GENERATE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredients: ingredientArray.map(i => i.name),
        quantity: ingredientArray.map(i => i.qty)
      })
    });

    const apiResponse = await response.json();

    // apiResponse = { statusCode, headers, body: "string" }
    let data = apiResponse.body;

    if (typeof data === "string") {
      data = JSON.parse(data);
    }

    output.innerHTML = `
      <h3>${data.title}</h3>
      <p><strong>Ingredients:</strong> ${data.ingredients}</p>
      <p><strong>Steps:</strong> ${data.steps}</p>
      <p><strong>Nutrition:</strong> ${data.nutrition}</p>
      <p><strong>Message:</strong> ${data.message}</p>
    `;

  } catch (err) {
    console.error("ERROR:", err);
    output.innerHTML = `<p style="color:red;">❌ Error calling CloudChef API.</p>`;
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
    const response = await fetch(API_ANALYZE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    // Add this: visually confirm that the API call reached AWS
    if (response.ok) {
      output.innerHTML = "✅ AWS Analyze API connected! Fetching results...";
    } else {
      output.innerHTML = "⚠️ API call reached server, but response not OK.";
    }

    const apiResponse = await response.json();
    let data = apiResponse.body;
    if (typeof data === "string") data = JSON.parse(data);

    const detected = data.ingredients || data.detectedIngredients || [];

    detected.forEach(item => {
      if (!ingredientArray.some(i => i.name === item)) {
        ingredientArray.push({ name: item, qty: "1" });
      }
    });

    renderIngredients();
    output.innerHTML = `✅ Detected (from AWS): ${detected.join(", ")}`;
  } catch (err) {
    console.error("ERROR:", err);
    output.innerHTML = `<p style="color:red;">❌ AWS Analyze API call failed.</p>`;
  }
}

