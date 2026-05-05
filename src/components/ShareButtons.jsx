import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const ShareButtons = ({ title = 'أثر — خير لا ينقطع', className = '' }) => {
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(typeof window !== 'undefined' ? window.location.href : '')
  }, [])

  const text = encodeURIComponent(title)
  const encodedUrl = encodeURIComponent(url || (typeof window !== 'undefined' ? window.location.href : ''))

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${text}%20${encodedUrl}`, '_blank', 'noopener,noreferrer')
  }

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`, '_blank', 'noopener,noreferrer')
  }

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank', 'noopener,noreferrer')
  }

  const copyLink = async () => {
    const href = url || (typeof window !== 'undefined' ? window.location.href : '')
    try {
      await navigator.clipboard.writeText(href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const btn =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-sm transition-all border-2'

  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
      <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={shareWhatsApp} className={`${btn} bg-[#25D366]/15 border-[#25D366] text-olive-800 hover:bg-[#25D366]/25`}>
        واتساب
      </motion.button>
      <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={shareTwitter} className={`${btn} bg-sky-500/10 border-sky-500 text-olive-800 hover:bg-sky-500/20`}>
        X
      </motion.button>
      <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={shareFacebook} className={`${btn} bg-blue-600/10 border-blue-600 text-olive-800 hover:bg-blue-600/20`}>
        فيسبوك
      </motion.button>
      <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={copyLink} className={`${btn} bg-gold-500/15 border-gold-500 text-olive-800 hover:bg-gold-500/25`}>
        {copied ? 'تم النسخ!' : 'نسخ الرابط'}
      </motion.button>
    </div>
  )
}

export default ShareButtons
