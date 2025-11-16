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

  // In the free-tier prototype, we’ll mock this function instead of uploading
  try {
    // For actual Rekognition integration, you’d send the file to S3 first
    // For now, just simulate detected ingredients
    const detected = ["tomato", "onion", "pasta"];
    document.getElementById("ingredients").value = detected.join(", ");
    outputDiv.innerHTML = `✅ Detected ingredients: ${detected.join(", ")}`;
  } catch (err) {
    outputDiv.innerHTML = "❌ Error analyzing image.";
    console.error(err);
  }
}
