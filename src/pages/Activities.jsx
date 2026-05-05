import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { activities } from '../data/activities'

const Activities = () => {
  return (
    <div className="min-h-screen bg-beige-100">
      <Navbar />

      <section className="pt-20 sm:pt-24 pb-10 sm:pb-14 bg-gradient-to-br from-olive-700 via-olive-600 to-gold-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4"
          >
            أنشطتنا
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-beige-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            مبادرة أثر تعمل على مشاريع خيرية متنوعة. تصفح أنشطتنا وتعرّف على التفاصيل.
          </motion.p>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {activities.map((a, i) => (
              <motion.article
                key={a.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-3xl border border-beige-300 bg-white shadow-lg overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="aspect-[16/10] bg-beige-200 overflow-hidden">
                  <img
                    src={a.image}
                    alt={a.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 sm:p-8">
                  {a.featured && (
                    <span className="inline-block mb-2 text-xs font-bold uppercase tracking-wide text-gold-700 bg-gold-100 px-3 py-1 rounded-full">
                      نشاط مميز
                    </span>
                  )}
                  <h2 className="text-xl sm:text-2xl font-bold text-olive-800 mb-3">{a.title}</h2>
                  <p className="text-olive-600 text-sm sm:text-base leading-relaxed mb-6">{a.description}</p>

                  <Link
                    to={a.href}
                    className="inline-flex items-center justify-center rounded-xl bg-olive-700 hover:bg-olive-800 text-white font-bold py-3 px-6 transition-colors"
                  >
                    {a.cta}
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              to="/donate"
              className="inline-block bg-gold-500 hover:bg-gold-600 text-white font-bold py-4 px-10 rounded-2xl shadow-lg transition-colors"
            >
              تبرّع الآن
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Activities
