import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const SCROLL_THRESHOLD = 50

const Navbar = () => {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [location.pathname])

  const linkClass = (path) => {
    const active = location.pathname === path
    return `inline-flex h-11 shrink-0 items-center whitespace-nowrap text-base font-bold transition-colors hover:text-gold-600 sm:text-lg ${
      active ? 'text-gold-600' : 'text-olive-800'
    }`
  }
  const donateClass =
    'inline-flex h-11 items-center rounded-xl bg-olive-700 px-4 text-base font-bold text-beige-100 shadow-md transition-colors hover:bg-olive-800 sm:px-5 sm:text-lg md:px-6'

  return (
    <nav
      className={`fixed top-0 right-0 left-0 z-50 border-b border-[#d5ccb9] transition-all duration-300 ease-out ${
        scrolled ? 'bg-beige-100/95 shadow-md backdrop-blur-[4px]' : 'bg-beige-100 shadow-sm backdrop-blur-0'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-[4.5rem] items-center justify-between gap-3 sm:h-20 md:h-24 sm:gap-4">
          <Link to="/" className="flex min-w-0 shrink items-center">
            <motion.img
              src="/logo.png"
              alt="أثر"
              whileHover={{ scale: 1.06 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="h-16 w-auto max-w-[52vw] cursor-pointer object-contain sm:h-20 md:h-24 sm:max-w-none"
            />
          </Link>

          <div className="flex min-w-0 items-center justify-end gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            <Link to="/" className={linkClass('/')}>
              الرئيسية
            </Link>
            <Link to="/activities" className={linkClass('/activities')}>
              أنشطتنا
            </Link>
            <Link to="/donate" className="shrink-0">
              <button type="button" className={donateClass}>
                تبرّع الآن
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
