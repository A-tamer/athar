import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import CountUp from 'react-countup'
import Navbar from '../components/Navbar'

const Home = () => {
  const [totalDonations, setTotalDonations] = useState(0)
  const [boxCount, setBoxCount] = useState(0)
  const BOX_COST = 250 // Cost per شنطة in EGP

  useEffect(() => {
    // Listen to approved donations
    const q = query(
      collection(db, 'donations'),
      where('status', '==', 'approved')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Approved donations count:', snapshot.size)
      let total = 0
      let totalBoxes = 0
      snapshot.forEach((doc) => {
        const data = doc.data()
        console.log('Donation:', doc.id, data)
        const amount = data.amount || 0
        const boxes = data.boxes || 0
        total += amount
        // Use actual boxes count if available, otherwise calculate from amount
        totalBoxes += boxes > 0 ? boxes : Math.floor(amount / BOX_COST)
      })
      console.log('Total:', total, 'Boxes:', totalBoxes)
      setTotalDonations(total)
      setBoxCount(totalBoxes)
    }, (error) => {
      console.error('Firebase error:', error)
      // Demo data for development
      setTotalDonations(0)
      setBoxCount(0)
    })

    return () => unsubscribe()
  }, [])

  // Calculate estimated families (1 box per family)
  const familiesSupported = boxCount

  return (
    <div className="min-h-screen bg-beige-100">
      <Navbar />
      
      {/* Live Impact Section - First Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="pt-16 sm:pt-20 md:pt-24 pb-10 sm:pb-12 md:pb-16 bg-olive-700 relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          {/* Live Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-6 sm:mb-8"
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 flex items-center gap-2 sm:gap-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"
              />
              <span className="text-white font-bold text-sm sm:text-base">مباشر - يتم التحديث لحظياً</span>
            </div>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-8 sm:mb-10 md:mb-12"
          >
            أثرنا معاً
          </motion.h2>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-6xl mx-auto mb-6 sm:mb-8">
            {/* Total Donations */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-center border border-white/20"
            >
              <div className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black text-gold-400 mb-1 sm:mb-2">
                <CountUp
                  end={totalDonations}
                  duration={2.5}
                  separator=","
                />
              </div>
              <p className="text-xs sm:text-sm md:text-lg text-beige-200">جنيه تبرعات</p>
            </motion.div>

            {/* Boxes Count */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-center border border-white/20"
            >
              <div className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black text-gold-400 mb-1 sm:mb-2">
                <CountUp
                  end={boxCount}
                  duration={2.5}
                  separator=","
                />
              </div>
              <p className="text-xs sm:text-sm md:text-lg text-beige-200">شنطة رمضان</p>
            </motion.div>

            {/* Families Supported */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-center border border-white/20"
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <span className="text-xl sm:text-2xl md:text-3xl">👨‍👩‍👧‍👦</span>
                <span className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black text-gold-400">
                  <CountUp
                    end={familiesSupported}
                    duration={2.5}
                    separator=","
                  />
                </span>
              </div>
              <p className="text-xs sm:text-sm md:text-lg text-beige-200">أسرة مستفيدة</p>
            </motion.div>

            {/* Goal Progress */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-center border border-white/20"
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                <span className="text-xl sm:text-2xl md:text-3xl">🎯</span>
                <span className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black text-gold-400">
                  {Math.min(Math.round((boxCount / 500) * 100), 100)}%
                </span>
              </div>
              <p className="text-xs sm:text-sm md:text-lg text-beige-200">من هدف 500 شنطة</p>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="max-w-xl sm:max-w-2xl mx-auto px-2"
          >
            <div className="bg-white/20 rounded-full h-3 sm:h-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((boxCount / 500) * 100, 100)}%` }}
                transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
                className="bg-gradient-to-r from-gold-400 to-gold-500 h-full rounded-full"
              />
            </div>
            <div className="flex justify-between mt-2 text-beige-200 text-xs sm:text-sm">
              <span>{boxCount} شنطة</span>
              <span>الهدف: 500 شنطة</span>
            </div>
          </motion.div>

          {/* CTA in Impact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-8 sm:mt-10"
          >
            <Link to="/donate">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gold-500 hover:bg-gold-600 text-white text-lg sm:text-xl md:text-2xl font-bold py-4 sm:py-5 px-8 sm:px-12 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                ساهم الآن
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* About Section - Combined */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative py-12 sm:py-16 md:py-20 overflow-hidden bg-beige-100"
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-10 right-10 w-32 sm:w-64 h-32 sm:h-64 bg-olive-200/30 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-10 left-10 w-48 sm:w-96 h-48 sm:h-96 bg-gold-200/20 rounded-full blur-3xl"
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          {/* Logo and About */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 mb-10 sm:mb-12">
            {/* Logo */}
            <motion.div
              initial={{ x: -30, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="flex-shrink-0"
            >
              <motion.img 
                src="/logo.png"
                alt="أثر"
                className="h-32 sm:h-40 md:h-48 w-auto"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
            </motion.div>

            {/* About Text */}
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-center lg:text-right"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-olive-700 mb-4">
                عن المبادرة
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-olive-600 leading-relaxed max-w-2xl">
                مبادرة أثر هي مبادرة خيرية تهدف إلى جمع التبرعات وتوزيعها على المحتاجين 
                في شهر رمضان المبارك. نسعى لترك أثر طيب يدوم في حياة الآخرين.
              </p>
            </motion.div>
          </div>

          {/* Feature Cards */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-3xl mx-auto"
          >
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg text-center">
              <div className="text-2xl sm:text-3xl mb-2">✅</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-gold-500 mb-1">100%</div>
              <p className="text-olive-600 text-xs sm:text-sm">شفافية كاملة</p>
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg text-center">
              <div className="text-2xl sm:text-3xl mb-2">🔒</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-gold-500 mb-1">24/7</div>
              <p className="text-olive-600 text-xs sm:text-sm">متابعة مستمرة</p>
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg text-center">
              <div className="text-2xl sm:text-3xl mb-2">🤝</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-gold-500 mb-1">ثقة</div>
              <p className="text-olive-600 text-xs sm:text-sm">أمان تام</p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Previous Year Gallery / Testimonials */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-12 sm:py-16 md:py-20 bg-olive-50"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-olive-700 text-center mb-8 sm:mb-10"
          >
            من العام الماضي
          </motion.h2>

          {/* Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="relative aspect-square bg-olive-200 rounded-xl sm:rounded-2xl overflow-hidden shadow-md cursor-pointer group"
              >
                {/* Placeholder - replace with actual images */}
                <div className="absolute inset-0 bg-gradient-to-br from-olive-300 to-olive-400 flex items-center justify-center">
                  <span className="text-4xl sm:text-5xl opacity-50">📦</span>
                </div>
                <div className="absolute inset-0 bg-olive-800/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm sm:text-base font-bold">عرض الصورة</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-olive-700 text-center mb-6">
              آراء المتبرعين
            </h3>
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <motion.div
                initial={{ x: -30, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold-100 rounded-full flex items-center justify-center">
                    <span className="text-xl sm:text-2xl">👤</span>
                  </div>
                  <div>
                    <p className="font-bold text-olive-700 text-sm sm:text-base">أحمد محمد</p>
                    <p className="text-olive-500 text-xs sm:text-sm">متبرع</p>
                  </div>
                </div>
                <p className="text-olive-600 text-sm sm:text-base leading-relaxed">
                  "تجربة رائعة مع مبادرة أثر، شفافية كاملة ومتابعة مستمرة. سعيد إني كنت جزء من هذا العمل الخيري."
                </p>
                <div className="flex gap-1 mt-3">
                  {[1,2,3,4,5].map(star => (
                    <span key={star} className="text-gold-500">⭐</span>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ x: 30, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold-100 rounded-full flex items-center justify-center">
                    <span className="text-xl sm:text-2xl">👤</span>
                  </div>
                  <div>
                    <p className="font-bold text-olive-700 text-sm sm:text-base">سارة أحمد</p>
                    <p className="text-olive-500 text-xs sm:text-sm">متبرعة</p>
                  </div>
                </div>
                <p className="text-olive-600 text-sm sm:text-base leading-relaxed">
                  "الحمد لله، المبادرة وصلت لناس محتاجة فعلاً. شكراً لفريق أثر على المجهود الرائع."
                </p>
                <div className="flex gap-1 mt-3">
                  {[1,2,3,4,5].map(star => (
                    <span key={star} className="text-gold-500">⭐</span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer CTA */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="py-12 sm:py-16 md:py-20 bg-olive-800"
      >
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-6 sm:mb-8">
            كن جزءاً من الأثر
          </h2>
          <Link to="/donate">
            <button className="bg-gold-500 hover:bg-gold-600 text-white text-lg sm:text-xl font-bold py-3 sm:py-4 px-8 sm:px-10 rounded-xl shadow-lg transition-colors">
              تبرّع الآن
            </button>
          </Link>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-olive-900 text-beige-200 py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className="text-base sm:text-lg mb-1 sm:mb-2">أثر © 2026</p>
          <p className="text-xs sm:text-sm opacity-70">جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  )
}

export default Home
