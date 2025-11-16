// ============================
// YOUR EXISTING CODE (UNCHANGED)
// ============================

// --- API URLs (replace with your deployed endpoints later) ---
const API_GENERATE = "https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/generate";
const API_ANALYZE = "https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/analyze";

async function generateRecipe() {
  const ingredients = document.getElementById("ingredients").value;
  const outputDiv = document.getElementById("output");
  outputDiv.innerHTML = "⏳ Generating recipe...";

  try {
    const res = await fetch(API_GENERATE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients }),
    });
    const data = await res.json();

    outputDiv.innerHTML = `
      <h3>${data.title || "Generated Recipe"}</h3>
      <p><strong>Ingredients:</strong> ${data.ingredients}</p>
      <p><strong>Steps:</strong> ${data.steps}</p>
      <p><strong>Nutrition:</strong> ${data.nutrition || "Approx. info unavailable"}</p>
    `;
  } catch (err) {
    outputDiv.innerHTML = "❌ Error generating recipe.";
    console.error(err);
  }
}

async function analyzeImage() {
  const fileInput = document.getElementById("imageUpload");
  const outputDiv = document.getElementById("output");

  if (!fileInput.files.length) {
    outputDiv.innerHTML = "⚠️ Please select an image first.";
    return;
  }

  const file = fileInput.files[0];
  outputDiv.innerHTML = "🔍 Analyzing image...";

  // Mock detection (no Rekognition in free tier)
  try {
    const detected = ["tomato", "onion", "pasta"];
    document.getElementById("ingredients").value = detected.join(", ");
    outputDiv.innerHTML = `✅ Detected ingredients: ${detected.join(", ")}`;
  } catch (err) {
    outputDiv.innerHTML = "❌ Error analyzing image.";
    console.error(err);
  }
}



// ============================
// COGNITO LOGIN SYSTEM
// ============================

// Your Cognito config:
const CLIENT_ID = "12lhjh1sc8pp2crquvgalf9bl2";
const COGNITO_DOMAIN = "https://cloudchef-login.auth.us-west-1.amazoncognito.com";
const REDIRECT_URI = "https://main.d1o5l2tvmd4zsn.amplifyapp.com/";

// Buttons
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeMessage = document.getElementById("welcomeMessage");

// LOGIN → redirect to Hosted UI
loginBtn.onclick = () => {
  const url =
    `${COGNITO_DOMAIN}/login?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  window.location.href = url;
};

// LOGOUT → redirect back to site
logoutBtn.onclick = () => {
  const url =
    `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(REDIRECT_URI)}`;
  window.location.href = url;
};

// Helper: read ?code= from URL
function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

const code = getQueryParam("code");

// After successful login
if (code) {
  welcomeMessage.textContent = "Welcome! You are logged in 🎉";
  loginBtn.style.display = "none";
  logoutBtn.style.display = "inline-block";
} else {
  loginBtn.style.display = "inline-block";
  logoutBtn.style.display = "none";
}

