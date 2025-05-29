import { configureStore } from '@reduxjs/toolkit'
import loaderReducer from './loaderSlice'
import recipeReducer from './recipeSlice'

export const store = configureStore({
  reducer: {
    loader: loaderReducer,
    recipe: recipeReducer,
  },
})
