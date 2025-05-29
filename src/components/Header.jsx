import { Link, useLocation } from 'react-router-dom'
import { GiChefToque } from 'react-icons/gi'
import { IoHome, IoTime, IoMenu, IoClose } from 'react-icons/io5'
import { useState } from 'react'

const Header = () => {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="glass-dark border-b border-white/10 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center space-x-2 md:space-x-3 hover:scale-105 transition-transform"
            onClick={closeMobileMenu}
          >
            <GiChefToque className="text-orange-500 text-2xl md:text-3xl" />
            <h1 className="text-orange-500 text-xl md:text-2xl font-bold">WhipUp</h1>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                location.pathname === '/' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <IoHome className="text-lg" />
              <span className="font-medium">Home</span>
            </Link>
            <Link 
              to="/recent" 
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                location.pathname === '/recent' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <IoTime className="text-lg" />
              <span className="font-medium">Recent</span>
            </Link>
          </nav>
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-white/70 hover:text-white transition-colors p-2"
          >
            {isMobileMenuOpen ? (
              <IoClose className="text-2xl" />
            ) : (
              <IoMenu className="text-2xl" />
            )}
          </button>
        </div>
        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4">
            <div className="flex flex-col space-y-2">
              <Link 
                to="/" 
                onClick={closeMobileMenu}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  location.pathname === '/' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <IoHome className="text-xl" />
                <span className="font-medium text-lg">Home</span>
              </Link>
              <Link 
                to="/recent" 
                onClick={closeMobileMenu}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  location.pathname === '/recent' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <IoTime className="text-xl" />
                <span className="font-medium text-lg">Recent</span>
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header
