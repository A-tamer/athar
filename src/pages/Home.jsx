import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import CountUp from 'react-countup'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { CAUSES } from '../lib/causes'
import { computeArafatTotals, MEAL_PRICE_EGP } from '../lib/campaignDonations'

const MEAL_COST = MEAL_PRICE_EGP
const MEAL_GOAL = CAUSES.arafat.mealGoal

const HERO_GOLD = '#D4A757'

const HERO_TOP_OVERLAY_STYLE = {
  background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.4), transparent)',
}

const HeroTopBand = () => (
  <div
    className="pointer-events-none absolute top-0 left-0 z-[2] h-[120px] w-full"
    style={HERO_TOP_OVERLAY_STYLE}
    aria-hidden
  />
)

const HeroCrescentDivider = () => (
  <div className="mx-auto mb-6 flex w-full max-w-sm items-center gap-3 px-1" aria-hidden>
    <div className="h-px flex-1" style={{ backgroundColor: HERO_GOLD }} />
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill={HERO_GOLD} aria-hidden>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
    <div className="h-px flex-1" style={{ backgroundColor: HERO_GOLD }} />
  </div>
)

const Home = () => {
  const [totalDonations, setTotalDonations] = useState(0)
  const [mealCount, setMealCount] = useState(0)

  useEffect(() => {
    const q = query(collection(db, 'donations'), where('status', '==', 'approved'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const donations = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return {
            ...data,
            createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
          }
        })
        const { total, meals } = computeArafatTotals(donations)
        setTotalDonations(total)
        setMealCount(meals)
      },
      (error) => {
        console.error('Firebase error (arafat):', error)
        setTotalDonations(0)
      }
    )

    return () => unsubscribe()
  }, [])

  const percentGoal = Math.min(Math.round((mealCount / MEAL_GOAL) * 100), 100)

  return (
    <div className="min-h-screen bg-beige-100">
      <Navbar />

      {/* Hero — portrait photo + overlay on mobile; split panel + landscape on laptop */}
      <section className="relative overflow-hidden bg-olive-900">
        {/* Mobile: z-[1] image stack, z-[2] top band (below navbar z-50), z-10 content */}
        <div className="relative isolate flex min-h-[100svh] flex-col md:hidden">
          <div className="absolute inset-0 z-[1]">
            <img
              src="/hero-meals-mobile.png"
              alt="توزيع وجبات إفطار على المحتاجين"
              className="absolute inset-0 h-full w-full object-cover object-[center_22%]"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
              }}
            />
          </div>
          <HeroTopBand />

          <div
            className="relative z-10 mt-auto flex w-full flex-col items-center justify-end px-4 pb-[max(1.75rem,env(safe-area-inset-bottom))]"
            style={{ paddingTop: 'max(5.5rem, env(safe-area-inset-top))' }}
          >
            <div className="flex w-[85%] max-w-md flex-col items-center">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2 text-center text-[1.75rem] font-black leading-[1.25] tracking-tight text-white sm:text-[2rem] [text-shadow:0_2px_20px_rgba(0,0,0,0.5)]"
              >
                إفطار صائم يوم عرفة
              </motion.h1>
              <HeroCrescentDivider />
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
                className="mb-8 w-full text-center text-[0.95rem] font-medium leading-[1.85] text-white sm:text-base [text-shadow:0_1px_12px_rgba(0,0,0,0.45)]"
              >
                يوم عرفة من أفضل أيام الدنيا؛ صيامه يكفّر سنتين، وإفطار الصائم فيه أجر عظيم. كن سبباً في فرح صائم بإذن الله.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="flex w-full flex-col items-stretch gap-3.5"
              >
                <Link to="/donate" className="w-full">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    className="w-full rounded-3xl px-5 py-4 text-base font-black text-white shadow-[0_6px_24px_rgba(0,0,0,0.35)] transition-[filter] hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:py-[1.05rem] sm:text-lg"
                    style={{ backgroundColor: HERO_GOLD }}
                  >
                    ساهم بإفطار صائم
                  </motion.button>
                </Link>
                <Link to="/activities" className="w-full">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    className="w-full rounded-3xl border-2 border-white bg-transparent px-5 py-3.5 text-sm font-bold text-white shadow-none transition-colors hover:bg-white/10 sm:py-4 sm:text-base"
                  >
                    تعرف على أنشطتنا
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Laptop / tablet: split — top band + z-layering on image column */}
        <div className="relative isolate hidden min-h-[min(92vh,760px)] grid-cols-1 md:grid md:grid-cols-2">
          <div className="relative z-10 flex flex-col justify-center px-6 py-16 lg:px-12 xl:px-16">
            <HeroTopBand />
            <div className="relative z-10 mx-auto max-w-xl text-center md:mx-0 md:text-right">
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 text-4xl font-black leading-tight text-white lg:text-5xl xl:text-6xl"
              >
                إفطار صائم يوم عرفة
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
                className="mb-10 text-lg leading-relaxed text-beige-100 lg:text-xl"
              >
                يوم عرفة من أفضل أيام الدنيا؛ صيامه يكفّر سنتين، وإفطار الصائم فيه أجر عظيم. كن سبباً في فرح صائم بإذن الله.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="flex flex-col items-stretch justify-center gap-4 sm:flex-row md:justify-start"
              >
                <Link to="/donate" className="sm:flex-1 md:flex-initial">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-3xl px-8 py-4 text-lg font-black text-white shadow-lg transition-[filter] hover:brightness-105 sm:w-auto"
                    style={{ backgroundColor: HERO_GOLD }}
                  >
                    ساهم بإفطار صائم
                  </motion.button>
                </Link>
                <Link to="/activities" className="sm:flex-1 md:flex-initial">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-3xl border-2 border-beige-300/60 bg-white/5 px-8 py-4 font-bold text-white hover:bg-white/10 sm:w-auto"
                  >
                    تعرف على أنشطتنا
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </div>
          <div className="relative z-[1] min-h-[320px] lg:min-h-0">
            <img
              src="/hero-meals.png"
              alt="توزيع وجبات إفطار على المحتاجين"
              className="absolute inset-0 z-[1] h-full w-full object-cover object-[center_30%] lg:object-center"
            />
            <div
              className="absolute inset-0 z-[1] bg-olive-900/10 md:bg-gradient-to-l md:from-olive-900/40 md:to-transparent"
              aria-hidden
            />
            <HeroTopBand />
          </div>
        </div>
      </section>

      {/* Virtue */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-12 sm:py-16 bg-white border-y border-beige-200"
      >
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center">
          <motion.h2
            initial={{ y: 16, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold text-olive-800 mb-6"
          >
            لماذا إفطار يوم عرفات؟
          </motion.h2>
          <p className="text-olive-700 leading-relaxed text-base sm:text-lg mb-4">
            قال النبي ﷺ: <span className="font-bold text-olive-900">&ldquo;من فطّر صائماً كان له مثل أجره من غير أن ينقص من أجر الصائم شيء&rdquo;</span> — رواه الترمذي.
          </p>
          <p className="text-olive-600 leading-relaxed text-sm sm:text-base">
            يوم عرفة يُجتمع فيه الخير: صيام يومٍ عظيم، وإطعامٌ للصائمين، ودعواتٌ مستجابة. مع أثر، تساهم في إفطار صائم بوجبة نظيفة ومُحضَّرة بعناية.
          </p>
        </div>
      </motion.section>

      {/* Live impact Arafat */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-olive-800 to-olive-900 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.35'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center mb-6"
          >
            <div className="bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2.5 h-2.5 bg-red-500 rounded-full"
              />
              <span className="text-white font-bold text-sm">مباشر — إفطار عرفات</span>
            </div>
          </motion.div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-10">أثرنا في إفطار عرفات</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 max-w-5xl mx-auto mb-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-4 sm:p-6 text-center"
            >
              <div className="text-2xl sm:text-4xl font-black text-gold-300 mb-1">
                <CountUp end={totalDonations} duration={2.2} separator="," />
              </div>
              <p className="text-beige-200 text-xs sm:text-sm">جنيه تبرعات</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-4 sm:p-6 text-center"
            >
              <div className="text-2xl sm:text-4xl font-black text-gold-300 mb-1">
                <CountUp end={mealCount} duration={2.2} separator="," />
              </div>
              <p className="text-beige-200 text-xs sm:text-sm">وجبة إفطار</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-4 sm:p-6 text-center"
            >
              <div className="text-2xl sm:text-4xl font-black text-gold-300 mb-1">{percentGoal}%</div>
              <p className="text-beige-200 text-xs sm:text-sm">من الهدف</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-4 sm:p-6 text-center"
            >
              <div className="text-lg sm:text-2xl font-bold text-white mb-1">{MEAL_GOAL.toLocaleString()}</div>
              <p className="text-beige-200 text-xs sm:text-sm">وجبة هدف</p>
            </motion.div>
          </div>

          <div className="max-w-xl mx-auto mb-10">
            <div className="bg-white/15 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${percentGoal}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="bg-gradient-to-r from-gold-400 to-gold-500 h-full rounded-full"
              />
            </div>
            <p className="text-beige-300 text-xs text-center mt-2">تُحسب الوجبات على أساس {MEAL_COST} جنيه للوجبة (قابل للتعديل)</p>
          </div>

          <div className="text-center">
            <Link to="/donate">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gold-500 hover:bg-gold-600 text-white text-lg font-bold py-4 px-10 rounded-2xl shadow-lg"
              >
                ساهم الآن
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.section>

      <Footer />
    </div>
  )
}

export default Home
