import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = () => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  // Track scroll for background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 bg-beige-100 ${
      scrolled ? 'shadow-md' : ''
    }`}>
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <motion.img 
              src="/logo.png"
              alt="أثر"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="h-10 sm:h-12 md:h-16 w-auto cursor-pointer object-contain"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link 
              to="/"
              className={`font-bold hover:text-gold-600 transition-colors ${
                location.pathname === '/' ? 'text-gold-600' : 'text-olive-800'
              }`}
            >
              الرئيسية
            </Link>
            <Link to="/donate">
              <button className="bg-olive-700 hover:bg-olive-800 text-beige-100 font-bold py-2 px-6 rounded-xl transition-colors shadow-md">
                تبرّع الآن
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-3 rounded-xl transition-colors text-olive-800 bg-beige-200/80 hover:bg-beige-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-beige-100 border-t border-beige-300 shadow-lg"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              <Link 
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-colors ${
                  location.pathname === '/' 
                    ? 'bg-beige-200 text-olive-800' 
                    : 'text-olive-700 hover:bg-beige-200'
                }`}
              >
                <span className="text-xl">🏠</span>
                الرئيسية
              </Link>
              <div className="pt-2">
                <Link 
                  to="/donate"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <button className="w-full bg-olive-700 hover:bg-olive-800 text-beige-100 font-bold py-4 rounded-xl text-lg shadow-md">
                    تبرّع الآن
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Navbar
