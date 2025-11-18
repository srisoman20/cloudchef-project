console.log("🔥 Loaded NEW Bedrock-enabled app.js");

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
  const url = `${COGNITO_DOMAIN}/login?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}`;
  window.location.href = url;
};

// LOGOUT
logoutBtn.onclick = () => {
  const url = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(
    REDIRECT_URI
  )}`;
  window.location.href = url;
};

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
        <button onclick="removeIngredient(${i})" style="color:red;background:none;border:none;font-size:18px;cursor:pointer;">✗</button>
      </li>
    `
    )
    .join("");
}

// ============================
// GENERATE RECIPE (Bedrock AI)
// ============================
const API_GENERATE = "https://1x5z0afqn2.execute-api.us-west-2.amazonaws.com/Prod/generate";

async function generateRecipe() {
  const output = document.getElementById("output");
  output.innerHTML = "👩‍🍳 Generating recipes with AI...";

  try {
    // ✅ Ensure ingredients exist
    if (!ingredientArray.length) {
      output.innerHTML = "⚠️ Please add at least one ingredient first.";
      return;
    }

    // Combine ingredient name + quantity
    const ingredients = ingredientArray.map(i =>
      i.qty ? `${i.qty} ${i.name}` : i.name
    );

    console.log("✅ Ingredients sent to API:", ingredients);

    // ✅ Call your Lambda API
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

    // ============================
    // PARSE THE AI TEXT OUTPUT
    // ============================
    const recipeText = data.recipes.trim();
    console.log("🧾 Raw AI Recipe:", recipeText);

    // Split by “Recipe 1:”, “Recipe 2:”, etc.
    const recipeBlocks = recipeText
      .split(/(?:^|\n)Recipe\s*\d*[:.-]?\s*/i)
      .map(r => r.trim())
      .filter(r => r.length > 0);

    let fullHTML = "";

    recipeBlocks.forEach((block, idx) => {
      const lines = block.split("\n").map(l => l.trim()).filter(Boolean);

      // Extract title
      const titleLine = lines.find(
        l =>
          !/^description|^time|^prep|^ingredients|^instructions|^nutrition/i.test(
            l.toLowerCase()
          )
      );
      const title = titleLine || `Recipe ${idx + 1}`;

      // Description
      const description = (
        lines.find(l => l.toLowerCase().startsWith("description")) || ""
      )
        .replace(/^description[:\-]?\s*/i, "")
        .trim();

      // Time + servings (prevent duplicates)
      const timeMatch = lines.find(l =>
        l.toLowerCase().startsWith("time:")
      );
      const servingsMatch = lines.find(l =>
        l.toLowerCase().startsWith("servings:")
      );

      let prepInfo = "";
      if (timeMatch && servingsMatch) {
        const time = timeMatch.replace(/^time[:\-]?\s*/i, "").trim();
        const servings = servingsMatch.replace(/^servings[:\-]?\s*/i, "").trim();
        prepInfo = `⏱ Time: ${time} | 🍽 Servings: ${servings}`;
      } else if (timeMatch) {
        const time = timeMatch.replace(/^time[:\-]?\s*/i, "").trim();
        prepInfo = `⏱ Time: ${time}`;
      } else if (servingsMatch) {
        const servings = servingsMatch.replace(/^servings[:\-]?\s*/i, "").trim();
        prepInfo = `🍽 Servings: ${servings}`;
      }

      // Section arrays
      let ingredientsArr = [];
      let instructionsArr = [];
      let nutritionArr = [];
      let suggestionsArr = [];
      let currentSection = null;

      // Parse sections line-by-line
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

      // ============================
      // BUILD RECIPE CARD HTML
      // ============================
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
              ? (() => {
                  const nutritionHTML = nutritionArr
                    .map(n => {
                      const [label, value] = n.split(":").map(s => s.trim());
                      return `
                        <div class="nutrition-item">
                          <span class="nutrition-label">${label || ""}</span>
                          <span class="nutrition-value">${value || ""}</span>
                        </div>
                      `;
                    })
                    .join("");
                  return `
                    <div class="nutrition-section">
                      <h4>Nutrition Facts (per serving)</h4>
                      <div class="nutrition-grid">
                        ${nutritionHTML}
                      </div>
                    </div>
                  `;
          })()
        : ""
    }

    ${
      suggestionsArr.length
        ? `<div class="suggestion-box">
            <strong>💡 Suggestion:</strong> ${suggestionsArr.join(" ")}
          </div>`
        : ""
    }
  </div>
`;

    });

    // Render recipes
    output.innerHTML = fullHTML;

  } catch (error) {
    console.error("AI ERROR:", error);
    output.innerHTML = `<p style="color:red;">❌ Failed to generate recipes.</p>`;
  }
}




// ============================
// MULTI-IMAGE INGREDIENT DETECTION (BEDROCK VERSION)
// ============================
const API_ANALYZE =
  "https://1x5z0afqn2.execute-api.us-west-2.amazonaws.com/Prod/analyze";

  async function analyzeImage() {
    console.log("📸 analyzeImage() called");
  
    const fileInput = document.getElementById("imageUpload");
    const output = document.getElementById("output");
  
    if (!fileInput.files.length) {
      output.innerHTML = "⚠️ No images selected.";
      return;
    }
  
    output.textContent = "🔍 Detecting ingredients...";
  
    // Read single file only
    const file = fileInput.files[0];
  
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(file);
    });
  
    console.log("📸 Loaded:", file.name, "len:", base64.length);
  
    try {
      const response = await fetch(API_ANALYZE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: [base64] })
      });
  
      const data = await response.json();
      console.log("Analyze Response:", data);
  
      if (data.ingredients?.length > 0) {
  
        // Add detected items to ingredient list
        data.ingredients.forEach(item => {
          ingredientArray.push({
            name: item.name,
            qty: item.count
          });
        });
  
        renderIngredients();
  
        // Reset the file input
        fileInput.value = "";
  
        // Clear output message
        output.innerHTML = "";
  
      } else {
        output.innerHTML = `⚠️ No ingredients detected.`;
      }
  
    } catch (err) {
      console.error("Analyze Error:", err);
      output.innerHTML = "❌ Error analyzing image.";
    }
  }
  

// ============================
// SAVE RECIPE
// ============================
const API_SAVE =
  "https://q98mz40wlg.execute-api.us-west-1.amazonaws.com/Prod/saveRecipe";

async function saveRecipe() {
  const output = document.getElementById("output");
  output.innerHTML = "💾 Saving recipe...";

  try {
    const recipeData = {
      title: document.querySelector("#output h3")?.innerText || "Untitled Recipe",
      ingredients: ingredientArray.map((i) => i.name),
      quantities: ingredientArray.map((i) => i.qty),
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(API_SAVE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipeData),
    });

    const data = await response.json();
    console.log("SAVE RESPONSE:", data);

    output.innerHTML = `✅ ${data.message || "Recipe saved successfully!"}`;
  } catch (error) {
    console.error("SAVE ERROR:", error);
    output.innerHTML = `<p style="color:red;">❌ Failed to save recipe.</p>`;
  }
}

// ============================
// BUTTON LISTENERS
// ============================
document.getElementById("detectBtn").addEventListener("click", analyzeImage);
document.getElementById("generateBtn").addEventListener("click", generateRecipe);
document.getElementById("saveBtn").addEventListener("click", saveRecipe);

