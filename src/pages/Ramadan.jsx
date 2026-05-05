import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PhotoPlaceholder from '../components/PhotoPlaceholder'
import RamadanStatsCharts from '../components/RamadanStatsCharts'
import { useRamadanCampaignStats } from '../hooks/useRamadanCampaignStats'

const Ramadan = () => {
  const {
    totalDonations,
    boxCount,
    familiesSupported,
    percentToGoal,
    boxGoal,
    effectiveCostPerBox,
  } = useRamadanCampaignStats()

  return (
    <div className="min-h-screen bg-beige-100">
      <Navbar />

      <section className="relative pt-20 sm:pt-24 overflow-hidden border-b border-beige-300">
        <div className="absolute inset-0">
          <img
            src="/ramadan-box-card.png"
            alt="شنطة رمضان — رمضان كريم"
            className="h-full w-full object-cover object-center min-h-[220px] sm:min-h-[280px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-olive-950/90 via-olive-900/55 to-olive-800/35" />
        </div>
        <div className="container relative z-10 mx-auto px-4 sm:px-6 max-w-3xl text-center py-12 sm:py-16">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-md"
          >
            حملة شنطة رمضان
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-beige-100 text-base sm:text-lg leading-relaxed drop-shadow"
          >
            أثرنا معاً في رمضان — تبرعاتكم تُحوَّل إلى شنط غذائية تصل للأسر المحتاجة. الإحصائيات أدناه تُحدَّث
            من التبرعات المعتمدة.
          </motion.p>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-olive-800 mb-2 text-center">لوحة الأثر — رمضان</h2>
          <p className="text-sm text-olive-600 text-center mb-8 max-w-xl mx-auto">
            تبرعات معتمدة: <span className="font-bold tabular-nums">{totalDonations.toLocaleString()}</span> ج.م · شنط
            تقديرية: <span className="font-bold tabular-nums">{boxCount.toLocaleString()}</span> · هدف الشنط:{' '}
            <span className="font-bold tabular-nums">{boxGoal.toLocaleString()}</span>
          </p>
          <RamadanStatsCharts
            totalDonations={totalDonations}
            boxCount={boxCount}
            percentToGoal={percentToGoal}
            boxGoal={boxGoal}
            effectiveCostPerBox={effectiveCostPerBox}
          />
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-beige-100">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl font-bold text-olive-800 text-center mb-6">من الحملة</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="col-span-2 md:col-span-1 rounded-2xl overflow-hidden border border-beige-300 shadow-md aspect-[4/3]">
              <img
                src="/ramadan-box-card.png"
                alt="عرض شنطة رمضان"
                className="h-full w-full object-cover"
              />
            </div>
            <PhotoPlaceholder label="صورة 2" />
            <PhotoPlaceholder label="صورة 3" />
          </div>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-8 sm:py-12 md:py-16 bg-white"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <motion.h2
            initial={{ y: -12, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-olive-700 text-center mb-6 sm:mb-8"
          >
            محتويات الشنطة
          </motion.h2>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto"
          >
            <img src="/box-contents.png" alt="محتويات شنطة رمضان" className="w-full h-auto rounded-2xl shadow-xl" />
          </motion.div>
        </div>
      </motion.section>

      <Footer />
    </div>
  )
}

export default Ramadan
