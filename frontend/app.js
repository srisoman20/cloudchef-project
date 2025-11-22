console.log("🔥 Loaded CloudChef app.js with Grocery System (USERNAME LOGIN VERSION)");
// ============================
// COGNITO CONFIG (FIXED VERSION)
// ============================
const CLIENT_ID = "4c9mk38r0drvestg77l0no5th6";
const COGNITO_DOMAIN = "https://us-west-1xj65bt4pz.auth.us-west-1.amazoncognito.com";
const REDIRECT_URI = "https://main.d1o5l2tvmd4zsn.amplifyapp.com/";


const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeMessage = document.getElementById("welcomeMessage");

let user = null;
let currentUsername = null;

// LOGIN BUTTON
loginBtn.onclick = () => {
  const url = `${COGNITO_DOMAIN}/login?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=openid+email`;
  window.location.href = url;
};

// LOGOUT BUTTON
logoutBtn.onclick = () => {
  localStorage.removeItem("username");
  localStorage.removeItem("idToken");

  const url = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(
    REDIRECT_URI
  )}`;
  window.location.href = url;
};

// Get auth code
function getQueryParam(n) {
  return new URL(window.location.href).searchParams.get(n);
}

const code = getQueryParam("code");

// Exchange auth code for tokens
async function exchangeCodeForTokens(code) {
  const res = await fetch("https://vfqmp41009.execute-api.us-west-1.amazonaws.com/Prod/exchangeToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });

  if (!res.ok) {
    console.error("Token exchange FAILED", await res.text());
    return null;
  }

  return res.json(); // { idToken, accessToken, refreshToken }
}


// Parse JWT safely
function parseJwt(token) {
  if (!token) return null; // 🔥 FIXED
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    console.error("JWT parse error:", e, token);
    return null;
  }
}

// ================================
//  REQUIRE LOGIN FOR PROTECTED PAGES
// ================================
function requireLogin() {
  if (!currentUsername) {
    alert("Please sign in to access this page.");
    return false;
  }
  return true;
}

// ============================
// CHATBOX MESSAGE RENDERING
// ============================

function addMessage(sender, text) {
  const chatMessages = document.getElementById("chatMessages");

  const div = document.createElement("div");
  div.className = sender === "user" ? "chat-user" : "chat-bot";
  div.textContent = text;

  chatMessages.appendChild(div);

  // Auto-scroll chatbox
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showLoadingMessage() {
  const chatMessages = document.getElementById("chatMessages");

  // If loader already exists, do not add another one
  if (document.getElementById("aiLoader")) return;

  const loader = document.createElement("div");
  loader.id = "aiLoader";
  loader.className = "chat-bot loader-container";
  loader.innerHTML = `
    CloudChef is preparing updated recipes...
    <span class="typing-dots">
      <span></span><span></span><span></span>
    </span>
  `;

  chatMessages.appendChild(loader);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideLoadingMessage() {
  const loader = document.getElementById("aiLoader");
  if (loader) loader.remove();
}

// ============================
// NUTRITION-BASED RECIPE GENERATOR
// ============================
const API_NUTRITION =
  "https://1x5z0afqn2.execute-api.us-west-2.amazonaws.com/Prod/CloudChefNutritionAPI";
  

  async function generateNutritionRecipes() {
    const calories = document.getElementById("caloriesGoal").value;
    const protein = document.getElementById("proteinGoal").value;
    const carbs = document.getElementById("carbsGoal").value;
    const fat = document.getElementById("fatGoal").value;
  
    const out = document.getElementById("nutritionOutput");
    out.innerHTML = `
      <div class="nutrition-loading">
        🥗 Finding recipes that match your goals 
        <span class="loading-dots">
          <span></span><span></span><span></span>
        </span>
      </div>
    `;
    const res = await fetch(API_NUTRITION, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        calories,
        protein,
        carbs,
        fat
      })
    });
  
    const data = await res.json();
  
    if (!data.recipes) {
      out.innerHTML = "⚠️ No recipes found.";
      return;
    }
  
    out.innerHTML = data.recipes
      .map((r, index) => {
        return `
        <div class="recipe-card">
          
          <!-- HEADER -->
          <div class="recipe-header">
            <h2>${r.title}</h2>
            ${r.description ? `<p class="recipe-desc">${r.description}</p>` : ""}
          </div>
  
          <!-- GRID (shows macros like instructions/ingredients layout) -->
          <div class="recipe-grid">
            <div class="recipe-col ingredients">
              <h3>🧂 Ingredients</h3>
              <ul>
                ${r.ingredients && r.ingredients.length 
                  ? r.ingredients.map(i => `<li>${i}</li>`).join("")
                  : `<li>See description above</li>`}
              </ul>
            </div>
  
            <div class="recipe-col instructions">
              <h3>👩‍🍳 Instructions</h3>
              <ol>
                ${r.instructions && r.instructions.length
                  ? r.instructions.map(step => `<li>${step}</li>`).join("")
                  : `<li>Combine ingredients and enjoy!</li>`}
              </ol>
            </div>
          </div>
  
          <!-- NUTRITION GRID -->
          <div class="nutrition-section">
            <h4>Nutrition Facts (per serving)</h4>
            <div class="nutrition-grid">
              <div class="nutrition-item">
                <span class="nutrition-label">Calories</span>
                <span class="nutrition-value">${r.calories}</span>
              </div>
              <div class="nutrition-item">
                <span class="nutrition-label">Protein</span>
                <span class="nutrition-value">${r.protein}g</span>
              </div>
              <div class="nutrition-item">
                <span class="nutrition-label">Carbs</span>
                <span class="nutrition-value">${r.carbs}g</span>
              </div>
              <div class="nutrition-item">
                <span class="nutrition-label">Fat</span>
                <span class="nutrition-value">${r.fat}g</span>
              </div>
            </div>
          </div>
  
  
        </div>
        `;
      })
      .join("");
  }
  


// INIT AUTH


async function initAuth() {
  if (code) {
    const tokenData = await exchangeCodeForTokens(code);
  
    if (!tokenData || !tokenData.idToken) {
      console.error("❌ No idToken returned.");
      return;
    }
  
    const idToken = tokenData.idToken;
    const payload = parseJwt(idToken);

    if (!payload) {
      console.error("❌ JWT payload empty.");
      return;
    }

    // 🔥 SAVE REAL USER ID (SUB)
    const userId = payload.sub;
    localStorage.setItem("userId", userId);
    localStorage.setItem("userId", payload.sub);


    // Display name
    const username =
      payload["cognito:username"] ||
      payload.username ||
      payload.email ||
      payload.sub;

    console.log("USERNAME FROM COGNITO:", username);

    currentUsername = username;
    localStorage.setItem("username", username);
    localStorage.setItem("idToken", idToken);

    user = { username };

    welcomeMessage.textContent = `Welcome!`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    const storedUserId = localStorage.getItem("userId");


    loadGroceryList();

    const cleanURL = window.location.origin + window.location.pathname;
    window.history.replaceState({}, "", cleanURL);

  } else {
    const stored = localStorage.getItem("username");
    const storedUserId = localStorage.getItem("userId");
    
    if (stored) {
      user = { username: stored };
      currentUsername = stored;
  
      // 🔥 FIX: Restore userId on refresh
      currentUserId = storedUserId;
    
      // 🔥 FIX: Restore userId on refresh
      currentUserId = storedUserId;
  
      welcomeMessage.textContent = `Welcome!`;
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
    
      loadGroceryList();
    }
  }
}





// ============================
// PAGE NAVIGATION
// ============================
const mainPage = document.getElementById("mainPage");
const savedPage = document.getElementById("savedPage");
const groceryPage = document.getElementById("groceryPage");
const nutritionPage = document.getElementById("nutritionPage");


document.getElementById("nav-generate").onclick = () => showPage("main");
document.getElementById("nav-saved").onclick = () => {
  if (!requireLogin()) return;

  showPage("savedPage");
  highlightNav("nav-saved");
};
document.getElementById("nav-grocery").onclick = () => {
  if (!requireLogin()) return;

  showPage("groceryPage");
  highlightNav("nav-grocery");
};
document.getElementById("nav-nutrition").onclick = () => showPage("nutrition");


function showPage(page) {
  mainPage.classList.add("hidden");
  savedPage.classList.add("hidden");
  groceryPage.classList.add("hidden");
  nutritionPage.classList.add("hidden");
  


  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));

  if (page === "main") {
    mainPage.classList.remove("hidden");
    document.getElementById("nav-generate").classList.add("active");
  } else if (page === "saved") {
    savedPage.classList.remove("hidden");
    document.getElementById("nav-saved").classList.add("active");
    loadSavedRecipes();
  } else if (page === "grocery") {
    groceryPage.classList.remove("hidden");
    document.getElementById("nav-grocery").classList.add("active");
  }
  else if (page === "nutrition") {
    nutritionPage.classList.remove("hidden");
    document.getElementById("nav-nutrition").classList.add("active");
  }
  
}

// ============================
// INGREDIENT INPUT SYSTEM
// ============================
let ingredientArray = [];

function addIngredient() {
  const name = document.getElementById("ingredientName").value.trim();
  const qtyRaw = document.getElementById("ingredientQty").value.trim();

  if (!name) return;

  // Convert qty to a number (or default to 1)
  const qty = qtyRaw === "" ? 1 : Number(qtyRaw);

  // Look for existing ingredient
  const existing = ingredientArray.find(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  );

  if (existing) {
    // Merge quantities
    existing.qty = Number(existing.qty || 0) + qty;
  } else {
    ingredientArray.push({ name, qty });
  }

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
    .map(
      (ing, i) => `
      <li>
        <span>${ing.name} — <strong>${ing.qty || "1"}</strong></span>
        <button onclick="removeIngredient(${i})" 
          style="color:red;background:none;border:none;font-size:18px;cursor:pointer;">✗</button>
      </li>`
    )
    .join("");
}

// ============================
// SIMPLE NAV HIGHLIGHT FIX
// ============================
function highlightNav(page) {
  const links = document.querySelectorAll(".nav-link");
  links.forEach(l => l.classList.remove("active-nav"));

  const active = document.getElementById(`nav-${page}`);
  if (active) active.classList.add("active-nav");
}

// ============================
// UPDATED GENERATE RECIPE (with Save Buttons)
// ============================

const API_GENERATE = "https://1x5z0afqn2.execute-api.us-west-2.amazonaws.com/Prod/generate";

let generatedRecipes = []; // <- NEW: stores all recipes generated in this batch

async function generateRecipe() {
  const output = document.getElementById("output");
  output.innerHTML = `
  👩‍🍳 Generating recipes for your ingredients
  <span class="ai-loader">
    <span></span><span></span><span></span>
  </span>
`;
  generatedRecipes = []; // reset each time

  try {
    if (!ingredientArray.length) {
      output.innerHTML = "⚠️ Please add at least one ingredient first.";
      return;
    }

    const ingredients = ingredientArray.map(i =>
      i.qty ? `${i.qty} ${i.name}` : i.name
    );

    const response = await fetch(API_GENERATE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients })
    });

    // ----- API ERROR HANDLING (500, 429, 502, timeout, etc.) -----
    if (!response.ok) {
      output.innerHTML = `
        <div class="error-box">
          <strong>⚠️ Recipe generation failed</strong><br>
          The AI service is unavailable or overloaded. Please try again.
        </div>`;
      return;
    }

    const data = await response.json();

    // ----- Missing recipes field -----
    if (!data.recipes || typeof data.recipes !== "string") {
      output.innerHTML = `
        <div class="error-box">
          <strong>⚠️ Invalid response from AI</strong><br>
          Try again with different ingredients.
        </div>`;
      return;
    }

    const recipeText = data.recipes.trim();

    // ----- AI REFUSAL / ERROR DETECTION -----
    const lower = recipeText.toLowerCase();
    if (
      lower.includes("i apologize") ||
      lower.includes("cannot") ||
      lower.includes("unable") ||
      lower.includes("sorry") ||
      lower.includes("not allowed")
    ) {
      output.innerHTML = `
        <div class="error-box">
          <strong>⚠️ AI could not generate recipes</strong><br>
          ${recipeText}
        </div>`;
      return;
    }

    // ============================================================
    // SAFE PARSING OF RECIPE BLOCKS
    // ============================================================
    let recipeBlocks = [];
    try {
      recipeBlocks = recipeText
        .split(/(?:^|\n)Recipe\s*\d*[:.-]?\s*/i)
        .map(r => r.trim())
        .filter(r => r.length > 0);
    } catch (err) {
      console.error("❌ Recipe split error:", err);
      output.innerHTML = `
        <div class="error-box">
          <strong>⚠️ Could not understand AI output</strong><br>
          Try again or change your ingredients.
        </div>`;
      return;
    }

    if (!recipeBlocks.length) {
      output.innerHTML = `
        <div class="error-box">
          <strong>⚠️ No valid recipes found</strong><br>
          Try generating again.
        </div>`;
      return;
    }

    // ============================================================
    // YOUR ORIGINAL PARSER — WRAPPED IN SAFETY
    // ============================================================
    let fullHTML = "";

    for (let idx = 0; idx < recipeBlocks.length; idx++) {
      try {
        const block = recipeBlocks[idx];
        const lines = block.split("\n").map(l => l.trim()).filter(Boolean);

        // --- Title ---
        const titleLine = lines.find(
          l =>
            !/^description|^time|^prep|^ingredients|^instructions|^nutrition/i.test(
              l.toLowerCase()
            )
        );
        const title = titleLine || `Recipe ${idx + 1}`;

        // --- Description ---
        const description = (
          lines.find(l => l.toLowerCase().startsWith("description")) || ""
        )
          .replace(/^description[:\-]?\s*/i, "")
          .trim();

        // --- Prep Info ---
        let prepInfo = "";

        const timeMatch = lines.find(l => l.toLowerCase().startsWith("time:"));
        const servingsMatch = lines.find(l => l.toLowerCase().startsWith("servings:"));

        let time = "";
        let servings = "";

        if (timeMatch) time = timeMatch.replace(/^time[:\-]?\s*/i, "").trim();
        if (servingsMatch) servings = servingsMatch.replace(/^servings[:\-]?\s*/i, "").trim();

        if (time && servings) prepInfo = `⏱ Time: ${time} | 🍽 Servings: ${servings}`;
        else if (time) prepInfo = `⏱ Time: ${time}`;
        else if (servings) prepInfo = `🍽 Servings: ${servings}`;

        // --- Sections ---
        let ingredientsArr = [];
        let instructionsArr = [];
        let nutritionArr = [];
        let suggestionsArr = [];
        let currentSection = null;

        for (const line of lines) {
          const lower = line.toLowerCase();

          if (lower.startsWith("ingredients")) {
            currentSection = "ingredients";
            continue;
          }
          if (lower.startsWith("instructions")) {
            currentSection = "instructions";
            continue;
          }
          if (lower.startsWith("nutrition facts")) {
            currentSection = "nutrition";
            continue;
          }
          if (lower.startsWith("suggestion")) {
            suggestionsArr.push(line.replace(/^suggestion[:\-]?\s*/i, "").trim());
            continue;
          }

          if (currentSection === "ingredients" && line) {
            const clean = line.replace(/^[-•\s]+/, "").trim();
            if (clean) ingredientsArr.push(clean);
          } else if (currentSection === "instructions" && line) {
            const clean = line.replace(/^(\d+[\.\)]\s*)/, "").trim();
            if (clean && !/^suggestion/i.test(clean)) instructionsArr.push(clean);
          } else if (currentSection === "nutrition" && line) {
            const clean = line.replace(/^[-•\s]+/, "").trim();
            if (clean) nutritionArr.push(clean);
          }
        }

        // Build recipe object
        const recipeObject = {
          title,
          description,
          ingredients: ingredientsArr,
          instructions: instructionsArr,
          nutrition: nutritionArr,
          suggestions: suggestionsArr,
          prepInfo
        };

        generatedRecipes.push(recipeObject);
        const recipeIndex = generatedRecipes.length - 1;

        // Build HTML
        fullHTML += `
          <div class="recipe-card">
            <div class="recipe-header">
              <h2>${title}</h2>
              ${description ? `<p class="recipe-desc">${description}</p>` : ""}
              ${prepInfo ? `<div class="prep-info"><span>${prepInfo}</span></div>` : ""}
            </div>

            <div class="recipe-grid">
              <div class="recipe-col ingredients">
                <h3>🧂 Ingredients</h3>
                <ul>${ingredientsArr.map(i => `<li>${i}</li>`).join("")}</ul>
              </div>

              <div class="recipe-col instructions">
                <h3>👩‍🍳 Instructions</h3>
                <ol>${instructionsArr.map(s => `<li>${s}</li>`).join("")}</ol>
              </div>
            </div>

            ${
              nutritionArr.length
                ? `
                  <div class="nutrition-section">
                    <h4>Nutrition Facts (per serving)</h4>
                    <div class="nutrition-grid">
                      ${nutritionArr
                        .map(n => {
                          const [label, value] = n.split(":").map(s => s.trim());
                          return `
                            <div class="nutrition-item">
                              <span class="nutrition-label">${label || ""}</span>
                              <span class="nutrition-value">${value || ""}</span>
                            </div>
                          `;
                        })
                        .join("")}
                    </div>
                  </div>
                `
                : ""
            }

            ${
              suggestionsArr.length
                ? `<div class="suggestion-box">
                    <strong>💡 Suggestion:</strong> ${suggestionsArr.join(" ")}
                  </div>`
                : ""
            }

            <button class="save-recipe-btn" onclick="saveGeneratedRecipe(${recipeIndex})">
              ⭐ Save Recipe
            </button>
          </div>
        `;
      } catch (err) {
        console.error("Recipe parse error:", err);
        output.innerHTML = `
          <div class="error-box">
            <strong>⚠️ A recipe block could not be parsed.</strong><br>
            Try again.
          </div>`;
        return;
      }
    }

    output.innerHTML = fullHTML;
    document.getElementById("chatbox").classList.remove("hidden");

  } catch (error) {
    console.error("AI ERROR:", error);
    output.innerHTML = `
      <div class="error-box">
        <strong>❌ Unexpected failure</strong><br>
        Please try again.
      </div>`;
  }

  document.getElementById("chatbox").classList.remove("hidden");
}


function renderRecipesFromText(recipeText) {
  const output = document.getElementById("output");
  output.innerHTML = "";
  generatedRecipes = []; // reset each time

  const recipeBlocks = recipeText
    .split(/(?:^|\n)Recipe\s*\d*[:.-]?\s*/i)
    .map(r => r.trim())
    .filter(r => r.length > 0);

  let fullHTML = "";

  recipeBlocks.forEach((block, idx) => {
    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);

    // --- Title ---
    const titleLine = lines.find(
      l =>
        !/^description|^time|^prep|^ingredients|^instructions|^nutrition/i.test(
          l.toLowerCase()
        )
    );
    const title = titleLine || `Recipe ${idx + 1}`;

    // --- Description ---
    const description = (
      lines.find(l => l.toLowerCase().startsWith("description")) || ""
    )
      .replace(/^description[:\-]?\s*/i, "")
      .trim();

    // --- Prep Info ---
    let prepInfo = "";

    const timeMatch = lines.find(l => l.toLowerCase().startsWith("time:"));
    const servingsMatch = lines.find(l => l.toLowerCase().startsWith("servings:"));

    let time = "";
    let servings = "";

    if (timeMatch) {
      time = timeMatch.replace(/^time[:\-]?\s*/i, "").trim();
    }

    if (servingsMatch) {
      servings = servingsMatch.replace(/^servings[:\-]?\s*/i, "").trim();
    }

    if (time && servings) {
      prepInfo = `⏱ Time: ${time} | 🍽 Servings: ${servings}`;
    } else if (time) {
      prepInfo = `⏱ Time: ${time}`;
    } else if (servings) {
      prepInfo = `🍽 Servings: ${servings}`;
    }

    // --- Sections ---
    let ingredientsArr = [];
    let instructionsArr = [];
    let nutritionArr = [];
    let suggestionsArr = [];
    let currentSection = null;

    for (const line of lines) {
      const lower = line.toLowerCase();

      if (lower.startsWith("ingredients")) {
        currentSection = "ingredients";
        continue;
      }
      if (lower.startsWith("instructions")) {
        currentSection = "instructions";
        continue;
      }
      if (lower.startsWith("nutrition facts")) {
        currentSection = "nutrition";
        continue;
      }
      if (lower.startsWith("suggestion")) {
        suggestionsArr.push(line.replace(/^suggestion[:\-]?\s*/i, "").trim());
        continue;
      }

      // Fill arrays based on section
      if (currentSection === "ingredients" && line) {
        const clean = line.replace(/^[-•\s]+/, "").trim();
        if (clean) ingredientsArr.push(clean);
      } else if (currentSection === "instructions" && line) {
        const clean = line.replace(/^(\d+[\.\)]\s*)/, "").trim();
        if (clean && !/^suggestion/i.test(clean)) instructionsArr.push(clean);
      } else if (currentSection === "nutrition" && line) {
        const clean = line.replace(/^[-•\s]+/, "").trim();
        if (clean) nutritionArr.push(clean);
      }
    }

    // --- Build Recipe Object for Saving ---
    const recipeObject = {
      title,
      description,
      ingredients: ingredientsArr,
      instructions: instructionsArr,
      nutrition: nutritionArr,
      suggestions: suggestionsArr,
      prepInfo
    };

    generatedRecipes.push(recipeObject);
    const recipeIndex = generatedRecipes.length - 1;

    // --- Build HTML (EXACT MATCH to your generateRecipe version) ---
    fullHTML += `
      <div class="recipe-card">
        <div class="recipe-header">
          <h2>${title}</h2>
          ${description ? `<p class="recipe-desc">${description}</p>` : ""}
          ${prepInfo ? `<div class="prep-info"><span>${prepInfo}</span></div>` : ""}
        </div>

        <div class="recipe-grid">
          <div class="recipe-col ingredients">
            <h3>🧂 Ingredients</h3>
            <ul>${ingredientsArr.map(i => `<li>${i}</li>`).join("")}</ul>
          </div>

          <div class="recipe-col instructions">
            <h3>👩‍🍳 Instructions</h3>
            <ol>${instructionsArr.map(s => `<li>${s}</li>`).join("")}</ol>
          </div>
        </div>

        ${
          nutritionArr.length
            ? `
              <div class="nutrition-section">
                <h4>Nutrition Facts (per serving)</h4>
                <div class="nutrition-grid">
                  ${nutritionArr
                    .map(n => {
                      const [label, value] = n.split(":").map(s => s.trim());
                      return `
                        <div class="nutrition-item">
                          <span class="nutrition-label">${label || ""}</span>
                          <span class="nutrition-value">${value || ""}</span>
                        </div>
                      `;
                    })
                    .join("")}
                </div>
              </div>
            `
            : ""
        }

        ${
          suggestionsArr.length
            ? `<div class="suggestion-box">
                <strong>💡 Suggestion:</strong> ${suggestionsArr.join(" ")}
                
              </div>`
            : ""
        }

        <button class="save-recipe-btn" onclick="saveGeneratedRecipe(${recipeIndex})">
          ⭐ Save Recipe
        </button>
      </div>
    `;
  });

  output.innerHTML = fullHTML;
}


const API_SAVE_RECIPE =
  "https://vfqmp41009.execute-api.us-west-1.amazonaws.com/Prod/saveRecipe";

async function saveGeneratedRecipe(index) {
  if (!user) {
    alert("Please sign in to save recipes.");
    return;
  }

  const recipe = generatedRecipes[index];

  const payload = {
    username: currentUsername,
    recipeId: Date.now().toString(),
    ...recipe
  };

  try {
    const res = await fetch(API_SAVE_RECIPE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error(await res.text());
      alert("❌ Failed to save recipe.");
      return;
    }

    alert("✅ Recipe saved!");
  } catch (err) {
    console.error(err);
    alert("❌ Error saving recipe.");
  }
}

// ==================================
// SAVED RECIPES API ENDPOINTS + CODE
// ==================================
const API_GET_SAVED =
  "https://vfqmp41009.execute-api.us-west-1.amazonaws.com/Prod/getRecipes";

const API_DELETE_SAVED =
  "https://vfqmp41009.execute-api.us-west-1.amazonaws.com/Prod/deleteRecipe";

async function loadSavedRecipes() {
  if (!currentUsername) {
    console.warn("User not logged in");
    return;
  }

  const container = document.getElementById("savedPage");
  const emptyMsg = container.querySelector(".empty-msg");

  // Clear old recipes
  container.querySelectorAll(".saved-recipe-card").forEach(e => e.remove());

  try {
    const res = await fetch(`${API_GET_SAVED}?username=${currentUsername}`);
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      emptyMsg.style.display = "block";
      return;
    }

    emptyMsg.style.display = "none";

    data.items.forEach(item => {
      const card = document.createElement("div");
      card.className = "saved-recipe-card";
      card.innerHTML = `
        <div class="recipe-card">
          <div class="recipe-header">
            <h2>${item.title}</h2>
            ${item.description ? `<p>${item.description}</p>` : ""}
            ${item.prepInfo ? `<p><strong>${item.prepInfo}</strong></p>` : ""}
          </div>

          <div class="recipe-grid">
            <div class="recipe-col ingredients">
              <h3>🧂 Ingredients</h3>
              <ul>${item.ingredients.map(i => `<li>${i}</li>`).join("")}</ul>
            </div>

            <div class="recipe-col instructions">
              <h3>👩‍🍳 Instructions</h3>
              <ol>${item.instructions.map(s => `<li>${s}</li>`).join("")}</ol>
            </div>
          </div>

          ${
            item.nutrition?.length
              ? `
                <div class="nutrition-section">
                  <h4>Nutrition</h4>
                  <div class="nutrition-grid">
                    ${item.nutrition
                      .map(n => `<div class="nutrition-item">${n}</div>`)
                      .join("")}
                  </div>
                </div>`
              : ""
          }

          ${
            item.suggestions?.length
              ? `<div class="suggestion-box"><strong>Suggestion:</strong> ${item.suggestions.join(
                  " "
                )}</div>`
              : ""
          }

          <button class="save-recipe-btn delete-btn"
            onclick="deleteSavedRecipe('${item.userId}', '${item.recipeID}')">
            ❌ Delete Recipe
          </button>
        </div>
      `;

      container.appendChild(card);
    });
  } catch (err) {
    console.error("LOAD ERROR", err);
  }
}

async function deleteSavedRecipe(userId, recipeID) {
  try {
    const res = await fetch(API_DELETE_SAVED, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, recipeID })
    });

    if (!res.ok) {
      alert("❌ Failed to delete recipe");
      return;
    }

    alert("🗑️ Recipe deleted");
    loadSavedRecipes();
  } catch (err) {
    console.error("DELETE ERROR:", err);
  }
}




// ============================
// MULTI-IMAGE INGREDIENT DETECTION
// ============================
const API_ANALYZE =
  "https://1x5z0afqn2.execute-api.us-west-2.amazonaws.com/Prod/analyze";

async function analyzeImage() {
  const fileInput = document.getElementById("imageUpload");
  const detectStatus = document.getElementById("detectStatus");

  if (!fileInput.files.length) {
    detectStatus.innerHTML = "⚠️ No image selected.";
    return;
  }

  // Show animation
  detectStatus.innerHTML = `
    Detecting ingredients 
    <span class="detect-dots">
      <span></span><span></span><span></span>
    </span>
  `;

  const file = fileInput.files[0];

  const base64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  });

  try {
    const response = await fetch(API_ANALYZE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images: [base64] }),
    });

    const data = await response.json();

    if (data.ingredients?.length > 0) {
      // ---------------------------
      // MERGE DUPLICATE INGREDIENTS
      // ---------------------------
      data.ingredients.forEach((i) => {
        const existing = ingredientArray.find(
          (item) => item.name.toLowerCase() === i.name.toLowerCase()
        );

        if (existing) {
          existing.qty = Number(existing.qty || 0) + Number(i.count || 0);
        } else {
          ingredientArray.push({ name: i.name, qty: i.count });
        }
      });

      renderIngredients();
      fileInput.value = "";

      detectStatus.innerHTML = "✅ Ingredients detected!";
    } else {
      detectStatus.innerHTML = "⚠️ No ingredients detected.";
    }

  } catch (err) {
    console.error(err);
    detectStatus.innerHTML = "❌ Error detecting ingredients.";
  }
}


// ============================
// GROCERY SYSTEM (FIXES ADDED)
// ============================
const API_GROCERY_ADD =
  "https://vfqmp41009.execute-api.us-west-1.amazonaws.com/Prod/addGrocery";
const API_GROCERY_GET =
  "https://vfqmp41009.execute-api.us-west-1.amazonaws.com/Prod/getGrocery";
const API_GROCERY_REMOVE =
  "https://vfqmp41009.execute-api.us-west-1.amazonaws.com/Prod/removeGrocery";

// Add ingredients from recipe card
async function addIngredientsToGrocery(items) {
  if (!user) {
    alert("Please sign in to add groceries.");
    return;
  }

  const res = await fetch(API_GROCERY_ADD, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: currentUsername,
      items: items   // ✔ correct; items is passed in as parameter
    })    
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ Failed:", text);
    alert("❌ Failed to add grocery item.");
    return;
  }

  alert("Added to grocery list!");
  loadGroceryList();
}
// Add suggestion ingredients to grocery list
function addSuggestionToGrocery(suggestionText) {
  if (!suggestionText) return;

  // Extract ingredients (words like onions, bell peppers)
  const items = suggestionText
    .toLowerCase()
    .replace(/[^\w\s]/g, "")      // Remove punctuation
    .split(" ")
    .filter(word =>
      ["onion", "onions", "pepper", "peppers", "bell", "garlic", "tomato", "tomatoes"].includes(word)
    );

  if (!items.length) {
    alert("No valid grocery items detected.");
    return;
  }

  addIngredientsToGrocery(items);
}


// Manual add
async function manualAddGrocery() {
  const input = document.getElementById("manualGrocery");
  const item = input.value.trim();
  if (!item) return;

  await addIngredientsToGrocery([item]);
  input.value = "";
}

// Load grocery list
async function loadGroceryList() {
  if (!user) return;

  const res = await fetch(`${API_GROCERY_GET}?username=${currentUsername}`);
  const data = await res.json();

  const items = data.items || [];   // ← FIX

  const list = document.getElementById("groceryList");
  list.innerHTML = items
    .map(
      (item) => `
      <li>
        ${item}
        <button onclick="removeGroceryItem('${item}')"
          style="color:red;background:none;border:none;font-size:16px;cursor:pointer;">❌</button>
      </li>`
    )
    .join("");
}


// Remove grocery item
async function removeGroceryItem(itemName) {
  await fetch(API_GROCERY_REMOVE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: currentUsername,
      items: [itemName]   // ✔ SEND THE ITEM WE WANT TO DELETE
    })
  });

  loadGroceryList();
}

// ============================
// CLOUDCHEF CHATBOX
// ============================

// Your new AWS API endpoint (after you create Lambda)
const API_CHAT = "https://1x5z0afqn2.execute-api.us-west-2.amazonaws.com/Prod/chatbox";

// Chatbox elements
const chatbox = document.getElementById("chatbox");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");

// Send user message
document.getElementById("chatSend").onclick = sendChatMessage;
chatInput.addEventListener("keypress", e => {
  if (e.key === "Enter") sendChatMessage();
});

async function sendChatMessage() {
  const msg = chatInput.value.trim();
  if (!msg) return;

  addMessage("user", msg);
  chatInput.value = "";

  showLoadingMessage();

  let data;
  try {
    const payload = {
      userPrompt: msg,
      recipes: generatedRecipes
    };

    const res = await fetch(API_CHAT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    // Network / API failure
    if (!res.ok) {
      hideLoadingMessage();
      addMessage("bot", "❌ Sorry, I wasn't able to update the recipes. Please try again.");
      return;  // STOP EXECUTION
    }

    data = await res.json();
  } catch (err) {
    hideLoadingMessage();
    addMessage("bot", "❌ Network error, please try again.");
    return; // STOP EXECUTION
  }

  hideLoadingMessage();

  // Invalid AI response
  if (!data || !data.reply || typeof data.reply !== "string") {
    addMessage("bot", "❌ I couldn't update the recipes with that request.");
    return;  // STOP EXECUTION
  }

  const lower = data.reply.toLowerCase();

  // Error / apology patterns ALWAYS stay inside chatbox
  if (
    lower.includes("i apologize") ||
    lower.includes("i'm sorry") ||
    lower.includes("cannot") ||
    lower.includes("unable") ||
    lower.includes("don't have") ||
    lower.includes("haven't specified") ||
    lower.includes("please provide")
  ) {
    addMessage("bot", data.reply);
    return;  // STOP EXECUTION — DO NOT UPDATE RECIPES
  }

  // Check if Claude actually returned recipes (detect keyword patterns)
  const looksLikeRecipe =
    lower.includes("recipe 1") ||
    lower.includes("ingredients") && lower.includes("instructions");

  if (!looksLikeRecipe) {
    // Treat as normal conversation → chatbox only
    addMessage("bot", data.reply);
    return;
  }

  // SUCCESS — valid updated recipes
  addMessage("bot", "Updated recipes generated!");
  renderRecipesFromText(data.reply);
}




// ============================
// BUTTON LISTENERS
// ============================
document.getElementById("detectBtn").addEventListener("click", analyzeImage);
document.getElementById("generateBtn").addEventListener("click", generateRecipe);
// document.getElementById("saveBtn").addEventListener("click", saveRecipe);
document.getElementById("nutritionGenerateBtn").addEventListener("click", generateNutritionRecipes);

// Upload Image button behavior
document.getElementById("uploadBtn").onclick = () => {
  document.getElementById("imageUpload").click();
};

// Show selected file name
document.getElementById("imageUpload").addEventListener("change", function () {
  const fileNameSpan = document.getElementById("uploadFilename");
  if (this.files.length > 0) {
    fileNameSpan.textContent = this.files[0].name;
  } else {
    fileNameSpan.textContent = "No file chosen";
  }
});


initAuth();