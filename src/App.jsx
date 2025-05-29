import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import HomePage from './pages/HomePage'
import IngredientsPage from './pages/IngredientsPage'
import StepsPage from './pages/StepsPage'
import RecentPage from './pages/RecentPage'
import { restoreCurrentRecipe } from './store/recipeSlice'

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(restoreCurrentRecipe())
  }, [dispatch])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ingredients" element={<IngredientsPage />} />
        <Route path="/steps" element={<StepsPage />} />
        <Route path="/recent" element={<RecentPage />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        className="z-50"
      />
    </div>
  )
}

export default App
