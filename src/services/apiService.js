const GEMINI_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_FALLBACK';

const generateImageURL = (prompt) => {
  const width = 300;
  const height = 300;
  const seed = Math.floor(Math.random() * 1000);
  const model = 'flux';
  return `https://pollinations.ai/p/${encodeURIComponent(
    prompt
  )}?width=${width}&height=${height}&seed=${seed}&model=${model}`;
};

const preloadImage = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) return url;
    console.warn(
      `Image preloading failed for ${url}, status: ${response.status}`
    );
    return null;
  } catch (error) {
    console.error(`Error preloading image at ${url}:`, error.message);
    return null;
  }
};

const replaceImagesWithURLs = async (data) => {
  if (!data.ingredients || !Array.isArray(data.ingredients)) {
    console.warn('replaceImagesWithURLs: No ingredients array.');
    return data;
  }
  const imageTasks = data.ingredients.map(async (ingredient) => {
    const englishName =
      typeof ingredient.name === 'object' && ingredient.name.en
        ? ingredient.name.en
        : typeof ingredient.name === 'string'
        ? ingredient.name
        : 'food item';
    const descriptiveImagePrompt = ingredient.image;
    if (
      descriptiveImagePrompt &&
      descriptiveImagePrompt !== 'null' &&
      descriptiveImagePrompt.trim() !== ''
    ) {
      const generatedUrl = generateImageURL(descriptiveImagePrompt);
      const preloadedUrl = await preloadImage(generatedUrl);
      ingredient.image = preloadedUrl || generatedUrl;
      if (!preloadedUrl)
        console.warn(
          `Image for "${englishName}" might take time to load (preload failed): ${generatedUrl}`
        );
    } else {
      ingredient.image = generateImageURL(
        `simple clear photo of ${englishName || 'ingredient'}`
      );
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
      // ignore if not json
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
1.  Examine the "User's Initial Recipe Idea/Name" AND "User's Description/Special Notes" provided in the user prompt.
2.  If the combined input appears to be **gibberish, random characters, a test string (like "asdfgh"), nonsensical, or absolutely unrelated to food or cooking**, you MUST immediately stop and respond ONLY with the following JSON:
    {"message": "Bad request", "reason": "NONSENSICAL_INPUT"}
3.  **DO NOT PROCEED TO GENERATE ANY OTHER RECIPE FIELDS IF INPUT IS NONSENSICAL. YOUR ONLY RESPONSE IN THIS CASE IS THE ERROR JSON ABOVE.**

If input is a valid food query, proceed:

**AI-GENERATED RECIPE TITLE ('recipeName' object):**
- Generate the 'recipeName' object (en, hi, pa). Base this title on the user's input name AND their description/notes. Refine it to be a clear, appealing, and accurate title for ALL components of the dish (e.g., if user asks for "Shahi Paneer with Rotis", the title should reflect both).

**DIET VALIDATION (Based on AI-generated English recipeName and user's diet preference from the prompt):**
- If AI-generated vegetarian name + "nonveg" diet from user -> error: {"message": "Bad request", "reason": "DIET_MISMATCH"}
- If AI-generated non-vegetarian name + "veg" or "vegan" diet from user -> error: {"message": "Bad request", "reason": "DIET_MISMATCH"}
- If AI-generated dairy-containing name + "vegan" diet from user -> error: {"message": "Bad request", "reason": "DIET_MISMATCH"}

**CORE REQUIREMENT: EXTREME STEP-BY-STEP DETAIL (NON-NEGOTIABLE)**
-   **EVERY SINGLE ACTION, no matter how small, MUST be a separate point or clearly delineated sub-action within an instruction.** Think "Explain Like I'm 5" but for cooking.
-   **ASSUME ZERO PRIOR KNOWLEDGE.** Explain things like "medium heat means the knob is halfway," "sauté means to cook while stirring," "translucent means the onion looks a bit see-through."
-   **BREAK IT DOWN RELENTLESSLY.** Use AS MANY STEPS AS ARE LOGICALLY REQUIRED. If a recipe like "Shahi Paneer with Rotis" is requested, provide detailed steps for making the Shahi Paneer AND detailed steps for making the Rotis as part of the same recipe steps list. Do not just say "serve with rotis" at the end; include the roti-making process. Number steps sequentially for the entire combined recipe.

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
      "image": "DESCRIPTIVE English text prompt for image generation for Pollinations AI (e.g., 'a ripe red tomato on a white plate', 'a clear glass of water with ice cubes', 'a small bowl of golden turmeric powder with a spoon'). Be vivid."
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
      "timeRequired": "ACTIVE cooking/preparation time in SECONDS for this step, or null/\\"0\\" for very long passive waits. Examples: \\"300\\", \\"1800\\", null, \\"0\\".",
      "ingredientsUsed": "Comma-separated list of ENGLISH ingredient names used in this step (must exactly match 'ingredients.name.en'), or an empty string \\"\\" or null if no specific listed ingredient is actively used."
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
    const coreRecipeForPrompt = {
      recipeName: originalRecipeData.recipeName,
      ingredients: originalRecipeData.ingredients.map((ing) => ({
        name: ing.name,
        quantity: ing.quantity,
        image:
          typeof ing.image === 'string' &&
          (ing.image.startsWith('data:') || ing.image.startsWith('http'))
            ? `photo of ${
                typeof ing.name === 'object' && ing.name.en
                  ? ing.name.en
                  : typeof ing.name === 'string'
                  ? ing.name
                  : 'ingredient'
              }`
            : ing.image ||
              `photo of ${
                typeof ing.name === 'object' && ing.name.en
                  ? ing.name.en
                  : 'ingredient'
              }`,
      })),
      steps: originalRecipeData.steps,
      totalTime: originalRecipeData.totalTime,
    };
    const baseRecipeNameForPrompt =
      originalRecipeData?.recipeName?.en || 'the recipe';

    const userPrompt = `Modify the existing recipe below based on the user's request.
Adhere strictly to ALL rules and detailed instructions in the system prompt.

EXISTING RECIPE (for context):
${JSON.stringify(coreRecipeForPrompt, null, 2)}

USER'S MODIFICATION REQUEST:
"${modificationRequestText}"

MODIFICATION INSTRUCTIONS (to be followed by AI):
1. Apply user's request logically to the existing recipe.
2. If ingredients are changed/added, ensure their 'image' field is a new, DESCRIPTIVE English TEXT PROMPT.
3. All modified/new step instructions MUST be extremely detailed and in simple language (en, hi, pa).
4. Re-evaluate and update 'timeRequired' for steps and 'totalTime' according to the TIMING RULES in system prompt.
5. If modification creates a diet inconsistency with "${baseRecipeNameForPrompt}", return error: {"message": "Modification failed", "reason": "DIET_MISMATCH_MODIFICATION"}`;

    const modificationSystemInstruction = `You are a recipe modification assistant. Your primary goal is to modify recipes ensuring they remain EXTREMELY DETAILED, using VERY SIMPLE language for BEGINNERS.
Return COMPLETE modified recipe in exact JSON structure per responseSchema.

**CRITICAL: STEP DETAIL: Modified steps MUST be broken into SMALLEST LOGICAL SUB-ACTIONS. Be EXHAUSTIVELY DETAILED/EXPLICIT. USE MANY STEPS if needed.**
LANGUAGE: Simple, common, everyday words (en, hi-Devanagari, pa-Gurmukhi). Short, clear sentences.
TIMING ('timeRequired' & 'totalTime'): Adhere to rules: ACTIVE seconds for timeRequired. Passive <2hrs (30min rest) SHOULD be timed. Passive >=2hrs (overnight soak) MUST be "0"/null, duration in 'instruction'. 'totalTime' = sum of ACTIVE 'timeRequired's.
IMAGE PROMPTS ('ingredients[].image'): For new/changed ingredients: MUST be DESCRIPTIVE English TEXT PROMPT. Unchanged: Retain/improve.
ERROR FORMAT for unfulfillable modifications or diet issues: {"message": "Modification failed", "reason": "SPECIFIC_REASON"}`;

    const responseContent = await callGeminiAPI(
      userPrompt,
      modificationSystemInstruction,
      'gemini-2.0-flash-lite'
    );
    let parsedData;
    if (typeof responseContent === 'string') {
      parsedData = JSON.parse(responseContent);
    } else if (typeof responseContent === 'object') {
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
      if (parsedData.reason === 'DIET_MISMATCH_MODIFICATION')
        throw new Error('DIET_MISMATCH_MODIFICATION');
      throw new Error(
        parsedData.reason || 'AI could not apply requested changes.'
      );
    }
    validateRecipeData(parsedData);
    return await replaceImagesWithURLs(parsedData);
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
      'Failed to modify recipe. Please try rephrasing.'
    );
  }
};
