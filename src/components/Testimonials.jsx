import { motion } from 'framer-motion'
import { testimonials as defaultTestimonials } from '../data/testimonials'

const Testimonials = ({ items = defaultTestimonials, title = 'ماذا يقول المتبرعون' }) => {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-olive-800 text-center mb-8 sm:mb-12"
        >
          {title}
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {items.map((t, i) => (
            <motion.article
              key={t.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-beige-200 bg-gradient-to-br from-beige-50 to-white p-6 shadow-md hover:shadow-lg transition-shadow"
            >
              <p className="text-olive-700 leading-relaxed mb-4 text-sm sm:text-base">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-olive-200 flex items-center justify-center text-olive-800 font-bold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-olive-800">{t.name}</p>
                  <p className="text-xs text-olive-500">{t.role}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonials
