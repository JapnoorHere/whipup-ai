import { initializeApp } from 'firebase/app';
import { getAI, getGenerativeModel } from 'firebase/ai';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Load Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.storageBucket) {
  throw new Error('Missing required Firebase configuration in environment variables. Check your .env file.');
}

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_FALLBACK';

const generateImageURL = async (prompt) => {
  try {
    const generationConfig = {
      temperature: 1.0,
      responseModalities: ['IMAGE', 'TEXT'],
      responseMimeType: 'text/plain',
    };

    const ai = getAI(firebaseApp);
    const model = getGenerativeModel(ai, {
      model: 'gemini-2.0-flash-preview-image-generation',
      generationConfig,
    });

    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
    });

    const response = result.response;
    const parts = response.candidates?.[0]?.content?.parts;

    if (!parts || !Array.isArray(parts)) {
      throw new Error('Invalid response structure from Gemini API.');
    }

    let base64Data, mimeType;
    for (const part of parts) {
      if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
        base64Data = part.inlineData.data;
        mimeType = part.inlineData.mimeType;
        break;
      }
    }
    if (!base64Data || !mimeType) {
      throw new Error('No image data found in response.');
    }

    // Convert base64 to Blob
    const byteString = atob(base64Data);
    const byteArray = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: mimeType });

    // Generate a unique filename
    const timestamp = Date.now();
    const promptHash = btoa(prompt).slice(0, 10).replace(/[^a-zA-Z0-9]/g, '');
    const fileExtension = mimeType.split('/')[1];
    const storagePath = `recipe-images/${timestamp}_${promptHash}.${fileExtension}`;
    const storageRef = ref(storage, storagePath);

    // Upload to Firebase Storage
    await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error(`Error generating or uploading image for prompt "${prompt}":`, error.message);
    return null;
  }
};

const replaceImagesWithURLs = async (data, originalIngredients = []) => {
  if (!data.ingredients || !Array.isArray(data.ingredients)) {
    console.warn('replaceImagesWithURLs: No ingredients array.');
    return data;
  }

  // Create a map of original ingredients for comparison
  const originalIngredientMap = new Map();
  originalIngredients.forEach(ing => {
    const name = typeof ing.name === 'object' ? ing.name.en : ing.name || 'unknown';
    originalIngredientMap.set(name, ing.image);
  });

  const imageTasks = data.ingredients.map(async (ingredient) => {
    const englishName =
      typeof ingredient.name === 'object' && ingredient.name.en
        ? ingredient.name.en
        : typeof ingredient.name === 'string'
        ? ingredient.name
        : 'food item';

    // Check if this ingredient existed in the original recipe
    const originalImage = originalIngredientMap.get(englishName);

    // If ingredient is unchanged and already has a URL, preserve it
    if (
      originalImage &&
      typeof originalImage === 'string' &&
      originalImage.startsWith('https://')
    ) {
      ingredient.image = originalImage;
      console.log(`Preserved existing image URL for "${englishName}": ${ingredient.image}`);
      return;
    }

    // Otherwise, generate a new image URL
    let descriptiveImagePrompt = ingredient.image;
    if (
      descriptiveImagePrompt &&
      descriptiveImagePrompt !== 'null' &&
      descriptiveImagePrompt.trim() !== '' &&
      !descriptiveImagePrompt.startsWith('https://')
    ) {
      const generatedUrl = await generateImageURL(descriptiveImagePrompt);
      ingredient.image = generatedUrl || null;
      if (!generatedUrl) {
        console.warn(
          `Failed to generate image for "${englishName}" with prompt: ${descriptiveImagePrompt}`
        );
      } else {
        console.log(`Generated new image URL for "${englishName}": ${ingredient.image}`);
      }
    } else {
      const defaultPrompt = `simple clear photo of ${englishName || 'ingredient'}`;
      const generatedUrl = await generateImageURL(defaultPrompt);
      ingredient.image = generatedUrl || null;
      if (!generatedUrl) {
        console.warn(
          `Failed to generate image for "${englishName}" with default prompt: ${defaultPrompt}`
        );
      } else {
        console.log(`Generated new image URL for "${englishName}": ${ingredient.image}`);
      }
    }
  });

  await Promise.all(imageTasks);
  return data;
};

const callGeminiAPI = async (userPrompt, completeSystemInstruction) => {
  const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody = {
    contents: [{ parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.5,
      topP: 0.9,
      topK: 35,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
    systemInstruction: {
      parts: [{ text: completeSystemInstruction }],
    },
  };

  console.log(
    'Sending to Gemini API (Frontend):',
    JSON.stringify(
      { prompt: userPrompt, systemInstruction: 'See below' },
      null,
      2
    )
  );

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBodyText = await response.text();
    console.error(
      'Gemini API Error - Status:',
      response.status,
      'Response Text:',
      errorBodyText
    );
    let errorJson = {};
    try {
      errorJson = JSON.parse(errorBodyText);
    } catch (e) {
      // Ignore if not JSON
    }
    const errorMessage =
      errorJson?.error?.message ||
      response.statusText ||
      `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  const jsonData = await response.json();
  console.log('Raw response.json() from Gemini:', JSON.stringify(jsonData, null, 2));

  if (jsonData.candidates?.[0]?.content?.parts?.[0]?.text) {
    return jsonData.candidates[0].content.parts[0].text;
  } else if (
    typeof jsonData === 'object' &&
    (jsonData.recipeName || jsonData.message)
  ) {
    console.warn(
      'Gemini might have returned a parsed object directly at response.candidates[0].content.parts[0] or top level.'
    );
    if (
      typeof jsonData.candidates?.[0]?.content?.parts?.[0] === 'object' &&
      (jsonData.candidates[0].content.parts[0].recipeName ||
        jsonData.candidates[0].content.parts[0].message)
    ) {
      return jsonData.candidates[0].content.parts[0];
    }
    return jsonData;
  }

  console.error('Unexpected Gemini API response structure:', jsonData);
  throw new Error(
    'Failed to extract recipe content from AI response. Structure was not as expected.'
  );
};

const validateRecipeData = (data) => {
  if (data?.message) {
    if (
      data.reason === 'DIET_MISMATCH' ||
      data.reason === 'DIET_MISMATCH_MODIFICATION'
    ) {
      throw new Error('DIET_MISMATCH');
    }
    if (data.reason === 'NONSENSICAL_INPUT') {
      throw new Error('NONSENSICAL_INPUT');
    }
    if (data.reason === 'INVALID_REQUEST_STRUCTURE') {
      throw new Error(
        'AI reported: Invalid request structure. Please check inputs.'
      );
    }
    throw new Error(data.reason || data.message || 'AI flagged an issue.');
  }
  if (
    !data.recipeName?.en ||
    !data.ingredients ||
    !Array.isArray(data.ingredients) ||
    !data.steps ||
    !Array.isArray(data.steps) ||
    !data.totalTime
  ) {
    console.error(
      'Client-side validation failed: Core recipe structure incomplete.',
      data
    );
    throw new Error('Recipe data from AI is incomplete or has an invalid structure.');
  }
  for (const ing of data.ingredients) {
    if (!ing.name?.en || ing.quantity === undefined || ing.image === undefined) {
      throw new Error('Invalid ingredient structure.');
    }
  }
  for (const step of data.steps) {
    if (
      !step.instruction?.en ||
      typeof step.stepNumber !== 'number' ||
      step.timeRequired === undefined ||
      step.ingredientsUsed === undefined
    ) {
      throw new Error('Invalid step structure.');
    }
  }
  return true;
};

const MAIN_SYSTEM_INSTRUCTION = `You are a recipe assistant chatbot. Your task is to respond in JSON format only, using simple and clear English, Hindi (Devanagari script), and Punjabi (Gurmukhi script). Do not include any words, characters, or explanations outside the JSON. Strictly adhere to the JSON structure and rules provided below.

**ABSOLUTE FIRST TASK: INPUT VALIDATION (NON-NEGOTIABLE)**
1. Examine the "User's Initial Recipe Idea/Name" AND "User's Description/Special Notes" provided in the user prompt.
2. If the combined input appears to be **gibberish, random characters, a test string (like "asdfgh"), nonsensical, or absolutely unrelated to food or cooking**, you MUST immediately stop and respond ONLY with the following JSON:
    {"message": "Bad request", "reason": "NONSENSICAL_INPUT"}
3. **DO NOT PROCEED TO GENERATE ANY OTHER RECIPE FIELDS IF INPUT IS NONSENSICAL. YOUR ONLY RESPONSE IN THIS CASE IS THE ERROR JSON ABOVE.**

If input is a valid food query, proceed:

**AI-GENERATED RECIPE TITLE ('recipeName' object):**
- Generate the 'recipeName' object (en, hi, pa). Base this title on the user's input name AND their description/notes. Refine it to be a clear, appealing, and accurate title for ALL components of the dish (e.g., if user asks for "Shahi Paneer with Rotis", the title should reflect both).

**DIET VALIDATION (Based on AI-generated English recipeName and user's diet preference from the prompt):**
- If AI-generated vegetarian name + "nonveg" diet from user -> error: {"message": "Bad request", "reason": "DIET_MISMATCH"}
- If AI-generated non-vegetarian name + "veg" or "vegan" diet from user -> error: {"message": "Bad request", "reason": "DIET_MISMATCH"}
- If AI-generated dairy-containing name + "vegan" diet from user -> error: {"message": "Bad request", "reason": "DIET_MISMATCH"}

**CORE REQUIREMENT: EXTREME STEP-BY-STEP DETAIL (NON-NEGOTIABLE)**
- **EVERY SINGLE ACTION, no matter how small, MUST be a separate point or clearly delineated sub-action within an instruction.** Think "Explain Like I'm 5" but for cooking.
- **ASSUME ZERO PRIOR KNOWLEDGE.** Explain things like "medium heat means the knob is halfway," "sauté means to cook while stirring," "translucent means the onion looks a bit see-through."
- **BREAK IT DOWN RELENTLESSLY.** Use AS MANY STEPS AS ARE LOGICALLY REQUIRED. If a recipe like "Shahi Paneer with Rotis" is requested, provide detailed steps for making the Shahi Paneer AND detailed steps for making the Rotis as part of the same recipe steps list. Do not just say "serve with rotis" at the end; include the roti-making process. Number steps sequentially for the entire combined recipe.

LANGUAGE: VERY simple, common, everyday words (en, hi, pa). Short, clear sentences.

JSON STRUCTURE TO FOLLOW:
{
  "recipeName": {
    "en": "Simple English Recipe Name (short, clear explanation of the final dish)",
    "hi": "सरल हिन्दी रेसिपी नाम (संक्षिप्त, स्पष्ट विवरण)",
    "pa": "ਸਧਾਰਨ ਪੰਜਾਬੀ ਰੈਸਿਪੀ ਨਾਮ (ਸੰਖੇਪ, ਸਪਸ਼ਟ ਵੇਰਵਾ)"
  },
  "ingredients": [
    {
      "name": { "en": "Simple English Ingredient", "hi": "सरल हिन्दी सामग्री", "pa": "ਸਧਾਰਨ ਪੰਜਾਬੀ ਸਮੱਗਰੀ" },
      "quantity": "Quantity with units (e.g., 1 cup, 2 tbsp, 250g)",
      "image": "DESCRIPTIVE English text prompt for image generation (e.g., 'a ripe red tomato on a white plate', 'a clear glass of water with ice cubes', 'a small bowl of golden turmeric powder with a spoon'). Be vivid."
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "instruction": {
        "en": "DETAILED, simple English step, explaining every micro-action.",
        "hi": "विस्तृत, सरल हिन्दी चरण, हर छोटी क्रिया को समझाते हुए।",
        "pa": "ਵਿਸਤ੍ਰਿਤ, ਸਧਾਰਨ ਪੰਜਾਬੀ ਕਦਮ, ਹਰ ਛੋਟੀ ਕਿਰਿਆ ਨੂੰ ਸਮਝਾਉਂਦੇ ਹੋਏ।"
      },
      "timeRequired": "ACTIVE cooking/preparation time in SECONDS for this step, or null/\"0\" for very long passive waits. Examples: \"300\", \"1800\", null, \"0\".",
      "ingredientsUsed": "Comma-separated list of ENGLISH ingredient names used in this step (must exactly match 'ingredients.name.en'), or an empty string \"\" or null if no specific listed ingredient is actively used."
    }
  ],
  "totalTime": "Total ACTIVE cooking/preparation time in SECONDS (numeric string). This is the sum of 'timeRequired' for all steps that have active time. EXCLUDE very long passive waits (2+ hours) IF their 'timeRequired' was '0' or null. If a shorter passive wait (e.g., 30 min rest) was included in a step's 'timeRequired', it contributes to this totalTime."
}

TIMING RULES FOR STEPS ('timeRequired'):
- Only ACTIVE, hands-on time in SECONDS.
- PASSIVE waits < 2 HOURS (e.g., 30 min rest, 1 hr simmer, 25 min bake) SHOULD have their duration in 'timeRequired' if users typically time them.
- PASSIVE waits >= 2 HOURS (e.g., "freeze for 4 hours", "soak overnight") MUST have 'timeRequired' as "0" or null. The full duration MUST be stated in the 'instruction' text.

Unrelated Requests: For non-recipe queries, respond ONLY with: {"message": "Bad request", "reason": "Query is unrelated to recipes."}
Strict Adherence: Never respond with additional words, comments, or explanations outside the primary JSON object.
`;

export const generateRecipe = async (userData) => {
  console.log('generateRecipe called with userData:', userData);
  try {
    const userRequestedRecipeName = userData.recipeName;
    const userDescription =
      userData.description || 'No specific description provided.';

    const userPrompt = `User's Initial Recipe Idea/Name: "${userRequestedRecipeName}"
User's Description/Special Notes: "${userDescription}"

User Requirements:
Servings: ${userData.servingsCount}
Diet: ${userData.diet}
Cuisine: ${
      userData.cuisine === 'Any' || !userData.cuisine
        ? 'AI to choose or make general'
        : userData.cuisine
    }
Health Goals: ${
      userData.healthGoals === 'None' || !userData.healthGoals
        ? 'None'
        : userData.healthGoals
    }
Restrictions: ${
      userData.restrictions === 'None' || !userData.restrictions
        ? 'None'
        : userData.restrictions
    }

Based on ALL the rules and detailed instructions in the system prompt, please generate the recipe JSON.
Remember to first validate if the input is nonsensical. If it is, return the specified error JSON.
If valid, create an appealing multilingual 'recipeName' considering both user's idea and description.
Then, perform diet validation based on the AI-generated English recipe name.
Finally, generate the highly detailed, multilingual recipe steps for all components requested (e.g., main dish and any side like rotis).
Ensure the image prompts for ingredients are descriptive.
`;

    const responseContent = await callGeminiAPI(
      userPrompt,
      MAIN_SYSTEM_INSTRUCTION
    );
    let parsedData;
    if (typeof responseContent === 'string') {
      console.log(
        'Parsing string response from callGeminiAPI for generateRecipe'
      );
      parsedData = JSON.parse(responseContent);
    } else if (typeof responseContent === 'object') {
      console.log(
        'Received object directly from callGeminiAPI for generateRecipe'
      );
      parsedData = responseContent;
    } else {
      throw new Error('Invalid response type from callGeminiAPI');
    }

    console.log('Parsed data for generateRecipe:', parsedData);
    validateRecipeData(parsedData);
    return await replaceImagesWithURLs(parsedData);
  } catch (error) {
    console.error('Error in generateRecipe:', error.message, error.stack);
    if (
      error.message === 'DIET_MISMATCH' ||
      error.message === 'NONSENSICAL_INPUT' ||
      error.message.includes('AI flagged') ||
      error.message.includes('incomplete') ||
      error.message.includes('AI returned invalid')
    ) {
      throw error;
    }
    throw new Error(
      'Failed to generate recipe. Please try rephrasing.'
    );
  }
};

export const requestRecipeModification = async (
  originalRecipeData,
  modificationRequestText
) => {
  console.log('Requesting recipe modification (apiService):', {
    originalRecipeData,
    modificationRequestText,
  });
  try {
    // Convert all ingredient.image fields to text prompts for consistency
    const coreRecipeForPrompt = {
      recipeName: originalRecipeData.recipeName,
      ingredients: originalRecipeData.ingredients.map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        image: ing.originalImagePrompt || // Use stored original prompt if available
          (typeof ing.image === 'string' && ing.image.startsWith('https://')
            ? `photo of ${
                typeof ing.name === 'object' && ing.name.en
                  ? ing.name.en
                  : typeof ing.name === 'string'
                  ? ing.name
                  : 'ingredient'
              }`
            : ing.image),
      })),
      steps: originalRecipeData.steps,
      totalTime: originalRecipeData.totalTime,
    };
    const baseRecipeNameForPrompt =
      originalRecipeData?.recipeName?.en || 'the recipe';

    const userPrompt = `Modify the existing recipe below based on the user's request.
Adhere strictly to ALL rules and detailed instructions in the system prompt.
You MUST return a modified recipe in the specified JSON format unless a diet mismatch or unfulfillable request is detected.

EXISTING RECIPE (for context):
${JSON.stringify(coreRecipeForPrompt, null, 2)}

USER'S MODIFICATION REQUEST:
"${modificationRequestText}"

MODIFICATION INSTRUCTIONS (to be followed by AI):
1. Apply the user's request logically to the existing recipe.
2. If ingredients are changed/added, ensure their 'image' field is a new, DESCRIPTIVE English TEXT PROMPT.
3. If ingredients are unchanged, retain their existing 'image' field as the original text prompt.
4. All modified/new step instructions MUST be extremely detailed and in simple language (en, hi, pa).
5. Re-evaluate and update 'timeRequired' for steps and 'totalTime' according to the TIMING RULES in system prompt.
6. If modification creates a diet inconsistency with "${baseRecipeNameForPrompt}", return error: {"message": "Modification failed", "reason": "DIET_MISMATCH_MODIFICATION"}
7. If the modification request cannot be fulfilled for any other reason, return error: {"message": "Modification failed", "reason": "SPECIFIC_REASON"}`;

    const modificationSystemInstruction = `You are a recipe modification assistant. Your primary goal is to modify recipes ensuring they remain EXTREMELY DETAILED, using VERY SIMPLE language for BEGINNERS.
Return the COMPLETE modified recipe in the exact JSON structure per responseSchema.

**CRITICAL: STEP DETAIL: Modified steps MUST be broken into SMALLEST LOGICAL SUB-ACTIONS. Be EXHAUSTIVELY DETAILED/EXPLICIT. USE MANY STEPS if needed.**
LANGUAGE: Simple, common, everyday words (en, hi-Devanagari, pa-Gurmukhi). Short, clear sentences.
TIMING ('timeRequired' & 'totalTime'): Adhere to rules: ACTIVE seconds for timeRequired. Passive <2hrs (30min rest) SHOULD be timed. Passive >=2hrs (overnight soak) MUST be "0"/null, duration in 'instruction'. 'totalTime' = sum of ACTIVE 'timeRequired's.
IMAGE PROMPTS ('ingredients[].image'): For new/changed ingredients: MUST be DESCRIPTIVE English TEXT PROMPT. Unchanged: Retain existing prompt or improve.
ERROR FORMAT for unfulfillable modifications or diet issues: {"message": "Modification failed", "reason": "SPECIFIC_REASON"}`;

    const responseContent = await callGeminiAPI(
      userPrompt,
      modificationSystemInstruction
    );
    let parsedData;
    if (typeof responseContent === 'string') {
      console.log(
        'Parsing string response from callGeminiAPI for requestRecipeModification'
      );
      parsedData = JSON.parse(responseContent);
    } else if (typeof responseContent === 'object') {
      console.log(
        'Received object directly from callGeminiAPI for requestRecipeModification'
      );
      parsedData = responseContent;
    } else {
      throw new Error(
        'Invalid response type from callGeminiAPI for modification'
      );
    }

    if (!parsedData.recipeName || !parsedData.recipeName.en) {
      parsedData.recipeName = originalRecipeData.recipeName;
    }

    console.log('Parsed data for requestRecipeModification:', parsedData);
    if (parsedData?.message?.toLowerCase().includes('modification failed')) {
      console.error('Modification failed with reason:', parsedData.reason);
      if (parsedData.reason === 'DIET_MISMATCH_MODIFICATION') {
        throw new Error('DIET_MISMATCH_MODIFICATION');
      }
      throw new Error(
        `AI could not apply requested changes: ${parsedData.reason || 'Unknown reason'}`
      );
    }

    validateRecipeData(parsedData);

    // Pass the original ingredients to replaceImagesWithURLs to preserve unchanged image URLs
    return await replaceImagesWithURLs(parsedData, originalRecipeData.ingredients);
  } catch (error) {
    console.error(
      'Error in requestRecipeModification:',
      error.message,
      error.stack
    );
    if (
      error.message === 'DIET_MISMATCH_MODIFICATION' ||
      error.message.includes('AI could not apply') ||
      error.message.includes('incomplete') ||
      error.message.includes('AI returned invalid')
    ) {
      throw error;
    }
    throw new Error(
      'Failed to modify recipe. Please try rephrasing your modification request.'
    );
  }
};
