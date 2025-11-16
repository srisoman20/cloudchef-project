// lambda-analyzeImage/index.js
exports.handler = async (event) => {
  // Mock analysis for now (replace with AWS Rekognition)
  const detectedIngredients = ["tomato", "onion", "pasta"];

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients: detectedIngredients })
  };
};
