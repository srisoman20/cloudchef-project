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

    loadGroceryList();

    const cleanURL = window.location.origin + window.location.pathname;
    window.history.replaceState({}, "", cleanURL);

  } else {
    const stored = localStorage.getItem("username");
    if (stored) {
      user = { username: stored };
      currentUsername = stored;

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

document.getElementById("nav-generate").onclick = () => showPage("main");
document.getElementById("nav-saved").onclick = () => showPage("saved");
document.getElementById("nav-grocery").onclick = () => showPage("grocery");

function showPage(page) {
  mainPage.classList.add("hidden");
  savedPage.classList.add("hidden");
  groceryPage.classList.add("hidden");

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
// UPDATED GENERATE RECIPE (with Save Buttons)
// ============================

const API_GENERATE = "https://1x5z0afqn2.execute-api.us-west-2.amazonaws.com/Prod/generate";

let generatedRecipes = []; // <- NEW: stores all recipes generated in this batch

async function generateRecipe() {
  const output = document.getElementById("output");
  output.innerHTML = "👩‍🍳 Generating recipes with AI...";
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

    const data = await response.json();

    if (!data.recipes) {
      output.innerHTML = "⚠️ No recipes returned from AI.";
      return;
    }

    const recipeText = data.recipes.trim();
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

      // --- Build HTML ---
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
                  <button class="suggestion-btn"
                    onclick="addSuggestionToGrocery('${suggestionsArr.join(" ")}')">
                    ➕ Add Ingredients to Grocery
                  </button>
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

  } catch (error) {
    console.error("AI ERROR:", error);
    output.innerHTML = `<p style="color:red;">❌ Failed to generate recipes.</p>`;
  }
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
  const output = document.getElementById("output");

  if (!fileInput.files.length) {
    output.innerHTML = "⚠️ No images selected.";
    return;
  }

  output.textContent = "🔍 Detecting ingredients...";

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
      data.ingredients.forEach((i) =>
        ingredientArray.push({ name: i.name, qty: i.count })
      );
      renderIngredients();
      fileInput.value = "";
      output.innerHTML = "";
    } else {
      output.innerHTML = "⚠️ No ingredients detected.";
    }
  } catch (err) {
    console.error(err);
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
// BUTTON LISTENERS
// ============================
document.getElementById("detectBtn").addEventListener("click", analyzeImage);
document.getElementById("generateBtn").addEventListener("click", generateRecipe);
// document.getElementById("saveBtn").addEventListener("click", saveRecipe);

initAuth();
