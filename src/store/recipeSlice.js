import { createSlice } from '@reduxjs/toolkit';

const generateRecipeId = (recipeNameObj, diet, cuisine) => {
  const baseName =
    typeof recipeNameObj === 'object' && recipeNameObj.en
      ? recipeNameObj.en
      : typeof recipeNameObj === 'string'
      ? recipeNameObj
      : 'unknown-recipe';
  const baseString = `${baseName}-${diet || 'any'}-${
    cuisine || 'any'
  }`
    .toLowerCase()
    .replace(/\s+/g, '-');
  return baseString.replace(/[^a-z0-9-]/g, '');
};

const loadCurrentRecipe = () => {
  try {
    const savedRecipe = localStorage.getItem('currentRecipe');
    return savedRecipe ? JSON.parse(savedRecipe) : null;
  } catch (error) {
    console.error('Error loading current recipe from localStorage:', error);
    return null;
  }
};

const saveCurrentRecipe = (recipe) => {
  try {
    if (recipe) {
      localStorage.setItem('currentRecipe', JSON.stringify(recipe));
      console.log('Recipe saved/updated in localStorage (currentRecipe):', recipe);
    } else {
      localStorage.removeItem('currentRecipe');
      console.log('Recipe removed from localStorage (currentRecipe).');
    }
  } catch (error) {
    console.error('Error saving current recipe to localStorage:', error);
  }
};

const loadCurrentLanguage = () => {
  const savedLanguage = localStorage.getItem('currentLanguage');
  return savedLanguage || 'en';
};

const saveCurrentLanguage = (lang) => {
  try {
    localStorage.setItem('currentLanguage', lang);
  } catch (error) {
    console.error('Error saving current language to localStorage:', error);
  }
};

const initialState = {
  currentRecipe: loadCurrentRecipe(),
  recentRecipes: JSON.parse(localStorage.getItem('recentRecipes') || '[]'),
  currentLanguage: loadCurrentLanguage(),
};

export const recipeSlice = createSlice({
  name: 'recipe',
  initialState,
  reducers: {
    setRecipe: (state, action) => {
      const newRecipePayload = action.payload;
      state.currentRecipe = newRecipePayload;
      saveCurrentRecipe(newRecipePayload);

      if (newRecipePayload && newRecipePayload.recipeName) {
        const uniqueId = generateRecipeId(
          newRecipePayload.recipeName,
          newRecipePayload.diet,
          newRecipePayload.cuisine
        );

        const recipeToStoreOrUpdateInRecents = {
          ...newRecipePayload,
          id: Date.now(),
          uniqueId: uniqueId,
          createdAt: newRecipePayload.createdAt || new Date().toISOString(),
          lastAccessedAt: new Date().toISOString(),
        };

        const existingIndex = state.recentRecipes.findIndex(
          (recipe) => recipe.uniqueId === uniqueId
        );

        if (existingIndex !== -1) {
          console.log(
            `Updating existing recent recipe (uniqueId: ${uniqueId}) with new data.`
          );
          const originalEntry = state.recentRecipes[existingIndex];
          state.recentRecipes[existingIndex] = {
            ...recipeToStoreOrUpdateInRecents,
            id: originalEntry.id,
            createdAt: originalEntry.createdAt,
          };
          const updatedRecipe = state.recentRecipes.splice(existingIndex, 1)[0];
          state.recentRecipes.unshift(updatedRecipe);
        } else {
          console.log(`Adding new recent recipe (uniqueId: ${uniqueId}).`);
          state.recentRecipes.unshift(recipeToStoreOrUpdateInRecents);
          if (state.recentRecipes.length > 20) {
            state.recentRecipes = state.recentRecipes.slice(0, 20);
          }
        }
        localStorage.setItem(
          'recentRecipes',
          JSON.stringify(state.recentRecipes)
        );
        console.log('Recent recipes updated in localStorage.');
      }
    },
    clearRecipe: (state) => {
      state.currentRecipe = null;
      saveCurrentRecipe(null);
    },
    removeRecentRecipe: (state, action) => {
      state.recentRecipes = state.recentRecipes.filter(
        (recipe) => recipe.id !== action.payload
      );
      localStorage.setItem(
        'recentRecipes',
        JSON.stringify(state.recentRecipes)
      );
    },
    clearAllRecentRecipes: (state) => {
      state.recentRecipes = [];
      localStorage.removeItem('recentRecipes');
    },
    restoreCurrentRecipe: (state) => {
      const savedRecipe = loadCurrentRecipe();
      if (savedRecipe) {
        state.currentRecipe = savedRecipe;
      }
    },
    setCurrentLanguage: (state, action) => {
      state.currentLanguage = action.payload;
      saveCurrentLanguage(action.payload);
    },
  },
});

export const {
  setRecipe,
  clearRecipe,
  removeRecentRecipe,
  clearAllRecentRecipes,
  restoreCurrentRecipe,
  setCurrentLanguage,
} = recipeSlice.actions;

export const selectLocalizedText = (textObject, language) => {
  if (typeof textObject === 'string') return textObject;
  if (textObject && typeof textObject === 'object') {
    return textObject[language] || textObject['en'] || '';
  }
  return '';
};

export default recipeSlice.reducer;
