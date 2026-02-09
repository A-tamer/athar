import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Home from './pages/Home'
import Donate from './pages/Donate'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Inventory from './pages/Inventory'

function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </AnimatePresence>
  )
}

export default App
