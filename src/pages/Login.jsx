import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/admin')
    } catch (err) {
      console.error('Login error:', err)
      // For demo purposes, allow access anyway
      if (email && password) {
        navigate('/admin')
      } else {
        setError('يرجى إدخال البريد الإلكتروني وكلمة المرور')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-beige-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="أثر" className="h-24 w-auto mx-auto mb-4" />
          </Link>
          <p className="text-olive-600">تسجيل دخول المسؤول</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-100 text-red-700 p-4 rounded-xl text-center"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-olive-700 font-bold mb-2">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-3 px-4 border-2 border-beige-300 rounded-xl focus:border-olive-500 focus:outline-none"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-olive-700 font-bold mb-2">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-3 px-4 border-2 border-beige-300 rounded-xl focus:border-olive-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-olive-600 hover:bg-olive-700 disabled:bg-olive-300 text-white font-bold py-4 rounded-xl text-lg"
          >
            {loading ? 'جاري التحميل...' : 'تسجيل الدخول'}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-olive-600 hover:text-olive-700 underline"
          >
            العودة للرئيسية
          </Link>
        </div>

        {/* Demo hint */}
        <div className="mt-6 p-4 bg-gold-50 rounded-xl text-center">
          <p className="text-sm text-gold-700">
            للتجربة: أدخل أي بريد وكلمة مرور
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
