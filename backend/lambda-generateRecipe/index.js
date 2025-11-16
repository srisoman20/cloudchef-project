// lambda-generateRecipe/index.js
exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const ingredients = body.ingredients || "unknown ingredients";

  // Mock recipe generation (replace with Bedrock call later)
  const recipe = {
    title: `AI Recipe for ${ingredients}`,
    ingredients: ingredients,
    steps: "Mix ingredients, cook for 15 minutes, and enjoy!",
    nutrition: "Approx. 400 calories per serving"
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recipe)
  };
};
