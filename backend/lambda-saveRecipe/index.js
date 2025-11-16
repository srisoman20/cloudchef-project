// lambda-saveRecipe/index.js
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const { userId = "demo-user", title, ingredients, steps } = body;

  const params = {
    TableName: "CloudChefRecipes",
    Item: {
      userId,
      timestamp: Date.now(),
      title,
      ingredients,
      steps
    }
  };

  await dynamo.put(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Recipe saved successfully" })
  };
};
