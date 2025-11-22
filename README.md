# CloudChef

CloudChef is a serverless web application that generates recipes using AI based on user-provided ingredients, nutrition goals, or chat-based refinements. The application runs fully on AWS services and uses Amazon Bedrock (Claude 3.5 Sonnet) for all recipe generation.

## Features

### 1. Ingredient-Based Recipe Generation
- Users can type ingredients or detect them from an uploaded image.
- A Bedrock Vision model identifies ingredients and quantities.
- Duplicate ingredient entries are automatically merged.

### 2. Nutrition-Based Recipes
- Users input calories, protein, carbs, and fat.
- Claude generates recipes that match the exact nutrition targets.

### 3. Chat-Based Recipe Refinement
- Users send natural language prompts (e.g., “make it spicier”).
- Claude updates the recipe set while keeping structure.
- If the AI response is invalid, the message stays inside the chatbox instead of overwriting recipe cards.

### 4. User Accounts (Cognito)
- Login/logout with Hosted UI.
- Saved Recipes and Grocery List require authentication.
- Each user's data is isolated in DynamoDB.

### 5. Saved Recipes & Grocery List
- Save, delete, and retrieve recipes.
- Grocery list supports adding/removing items.

## Architecture Overview

- **Frontend:** HTML, CSS, JavaScript (Amplify Hosting)
- **Auth:** Amazon Cognito
- **API Layer:** API Gateway
- **Backend:** AWS Lambda (Node.js)
- **AI Models:** Amazon Bedrock (Claude 3.5 Sonnet + Vision)
- **Database:** DynamoDB

## Main Lambda Functions

- `analyzeImage` – Detects ingredients from uploaded photos.
- `generateRecipes` – Generates recipes from ingredient lists.
- `generateNutrition` – Creates recipes based on nutrition goals.
- `chatRefine` – Updates recipes based on chat prompts.
- `saveRecipe`, `getRecipes`, `deleteRecipe` – CRUD for saved recipes.
- `groceryHandlers` – Grocery list add/remove operations.
