console.log("🔥 Loaded CloudChef app.js with Grocery System (USERNAME LOGIN VERSION)");
// ============================
// COGNITO CONFIG (FIXED VERSION)
// ============================
const CLIENT_ID = "4c9mk38r0drvestg77l0no5th6";
const CLIENT_SECRET = "3cve697td0ldnkjao0tim7mttlbignm4fu3i371mp47qsnlvh8k";
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
  const url = `${COGNITO_DOMAIN}/oauth2/token`;

  const creds = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${creds}`
    },
    body: body.toString(),
  });

  if (!res.ok) {
    console.error("❌ Token exchange failed:", await res.text());
    return null;
  }

  return res.json();
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
  
    if (!tokenData || !tokenData.id_token) {
      console.error("❌ No id_token returned.");
      return;
    }
  
    const idToken = tokenData.id_token;
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

      currentUsername = username;   // ⭐ FIX: now available everywhere
      localStorage.setItem("username", username);
      localStorage.setItem("idToken", idToken);
      
      user = { username };
      

    welcomeMessage.textContent = `Welcome!`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";

    // load groceries immediately
    loadGroceryList();

    // Clean URL
    const cleanURL = window.location.origin + window.location.pathname;
    window.history.replaceState({}, "", cleanURL);

  } else {
    const stored = localStorage.getItem("username");
    if (stored) {
      user = { username: stored };
      currentUsername = stored;   // ⭐⭐ Fixes the entire problem!
      
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
// GENERATE RECIPE (Bedrock AI)
// ============================
const API_SAVE = "https://q98mz40wlg.execute-api.us-west-1.amazonaws.com/Prod/saveRecipe"
const API_GENERATE = "https://1x5z0afqn2.execute-api.us-west-2.amazonaws.com/Prod/generate";

async function generateRecipe() {
  const output = document.getElementById("output");
  output.innerHTML = "👩‍🍳 Generating recipes with AI...";

  try {
    if (!ingredientArray.length) {
      output.innerHTML = "⚠️ Please add at least one ingredient first.";
      return;
    }

    const ingredients = ingredientArray.map(i =>
      i.qty ? `${i.qty} ${i.name}` : i.name
    );

    console.log("✅ Ingredients sent to API:", ingredients);

    const response = await fetch(API_GENERATE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients }),
    });

    const data = await response.json();
    console.log("🤖 AI RESPONSE:", data);

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
    window.generatedRecipes = [];

    recipeBlocks.forEach((block, idx) => {
      const lines = block.split("\n").map(l => l.trim()).filter(Boolean);

      const titleLine = lines.find(l => !/^description|^time|^ingredients|^instructions|^nutrition/i.test(l.toLowerCase()));
      const title = titleLine || `Recipe ${idx + 1}`;

      const description = (lines.find(l => l.toLowerCase().startsWith("description")) || "")
        .replace(/^description[:\-]?\s*/i, "")
        .trim();

      // ✅ FIX: Combine time + servings into a single line if both exist
      const timeServingLine = lines.find(l =>
        l.toLowerCase().includes("time") && l.toLowerCase().includes("servings")
      );
      const prepInfo = timeServingLine
        ? timeServingLine.replace(/^time[:\-]?\s*/i, "").trim()
        : "";

      let ingredientsArr = [];
      let instructionsArr = [];
      let nutritionArr = [];
      let suggestion = "";

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
          suggestion = line.replace(/^suggestion[:\-]?\s*/i, "").trim();
          continue;
        }

        if (currentSection === "ingredients" && line) {
          const clean = line.replace(/^[-•\s]+/, "").trim();
          if (clean) ingredientsArr.push(clean);
        } else if (currentSection === "instructions" && line) {
          const clean = line.replace(/^(\d+[\.\)]\s*)/, "").trim();
          if (clean) instructionsArr.push(clean);
        } else if (currentSection === "nutrition" && line) {
          const clean = line.replace(/^[-•\s]+/, "").trim();
          if (clean) nutritionArr.push(clean);
        }
      }

      window.generatedRecipes.push({ title, ingredientsArr, instructionsArr, nutritionArr, suggestion });

      fullHTML += `
        <div class="recipe-card" id="recipe-${idx}">
          <h2>${title}</h2>
          ${description ? `<p class="recipe-desc">${description}</p>` : ""}
          ${prepInfo ? `<p class="prep-info">⏱ ${prepInfo}</p>` : ""}

          <div class="recipe-grid">
            <div class="recipe-col ingredients">
              <h3>🧂 Ingredients</h3>
              <ul>${ingredientsArr.map(i => `<li>${i}</li>`).join("")}</ul>
            </div>
            <div class="recipe-col instructions">
              <h3>👩‍🍳 Instructions</h3>
              <ol>${instructionsArr.map(step => `<li>${step}</li>`).join("")}</ol>
            </div>
          </div>

          ${
            nutritionArr.length
              ? `
                <div class="nutrition-section">
                  <h4>Nutrition Facts (per serving)</h4>
                  <div class="nutrition-grid">
                    ${nutritionArr
                      .map((n) => {
                        const [label, value] = n.split(":").map((x) => x.trim());
                        return `
                          <div class="nutrition-item">
                            <span class="nutrition-label">${label || ""}</span>
                            <strong class="nutrition-value">${value || ""}</strong>
                          </div>`;
                      })
                      .join("")}
                  </div>
                </div>`
              : ""
          }

          ${
            suggestion
              ? `<div class="suggestion-box">
                  <strong>💡 Suggestion:</strong> ${suggestion}
                  <button class="suggestion-btn" onclick="addSuggestionToGrocery('${suggestion.replace(/'/g, "\\'")}')">
                    ➕ Add Ingredients to Grocery
                  </button>
                </div>`
              : ""
          }

          <div class="save-section">
            <button class="save-btn" onclick="saveRecipeFromCard(${idx}, '${title.replace(/'/g, "\\'")}')">
              💾 Save Recipe
            </button>
          </div>
        </div>`;
    });

    output.innerHTML = fullHTML;

  } catch (error) {
    console.error("AI ERROR:", error);
    output.innerHTML = `<p style="color:red;">❌ Failed to generate recipes.</p>`;
  }
}



// helper for generate recipe
async function saveRecipeFromCard(index, title) {
  const recipe = window.generatedRecipes[index];
  if (!recipe) {
    alert("❌ No recipe data found.");
    return;
  }
function addSuggestionToGrocery(suggestion) {
  alert("🛒 Added to grocery list: " + suggestion);
  // Later, you can extend this to actually save to DynamoDB or localStorage.
}


  // ✅ Get Cognito token from localStorage
  const token = localStorage.getItem("idToken");
  if (!token) {
    alert("⚠️ Please sign in before saving recipes.");
    return;
  }

  const recipeData = {
    title: recipe.title,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    nutrition: recipe.nutrition,
    suggestion: recipe.suggestion || "",
  };

  try {
    const response = await fetch(API_SAVE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // ✅ send JWT for user verification
      },
      body: JSON.stringify(recipeData),
    });

    const data = await response.json();
    if (response.ok) {
      alert("✅ Recipe saved successfully!");
    } else {
      console.error("Lambda Error:", data);
      alert("❌ Failed to save recipe: " + data.message);
    }
  } catch (error) {
    console.error("SAVE ERROR:", error);
    alert("❌ Failed to save recipe.");
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

// // ============================
// // SAVE RECIPE
// // ============================
// const API_SAVE =
//   "https://q98mz40wlg.execute-api.us-west-1.amazonaws.com/Prod/saveRecipe";

// async function saveRecipe() {
//   const output = document.getElementById("output");
//   output.innerHTML = "💾 Saving recipe...";

//   try {
//     const recipeData = {
//       title: document.querySelector("#output h3")?.innerText || "Untitled Recipe",
//       ingredients: ingredientArray.map((i) => i.name),
//       quantities: ingredientArray.map((i) => i.qty),
//       timestamp: new Date().toISOString(),
//     };

//     const response = await fetch(API_SAVE, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(recipeData),
//     });

//     const data = await response.json();
//     output.innerHTML = `✅ ${data.message}`;
//   } catch (e) {
//     console.error(e);
//     output.innerHTML = "❌ Failed to save recipe.";
//   }
// }

// ============================
// GROCERY SYSTEM (FIXES ADDED)
// ============================
const API_GROCERY_ADD =
  "https://q98mz40wlg.execute-api.us-west-1.amazonaws.com/Prod/addGrocery";
const API_GROCERY_GET =
  "https://q98mz40wlg.execute-api.us-west-1.amazonaws.com/Prod/getGrocery";
const API_GROCERY_REMOVE =
  "https://q98mz40wlg.execute-api.us-west-1.amazonaws.com/Prod/removeGrocery";

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
document.getElementById("saveBtn").addEventListener("click", saveRecipe);

initAuth();

