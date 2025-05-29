import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  loading: false,
}

export const loaderSlice = createSlice({
  name: 'loader',
  initialState,
  reducers: {
    showLoader: (state) => {
      state.loading = true
    },
    hideLoader: (state) => {
      state.loading = false
    },
  },
})

export const { showLoader, hideLoader } = loaderSlice.actions

export default loaderSlice.reducer
