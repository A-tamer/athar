import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const defaultItems = [
  {
    q: 'كيف أتأكد أن تبرعي وصل؟',
    a: 'بعد رفع إيصال التحويل، يتم مراجعة التبرع من الفريق. عند الموافقة يظهر المبلغ ضمن الإحصائيات المباشرة على الموقع.',
  },
  {
    q: 'ما الفرق بين إفطار عرفات وشنطة رمضان؟',
    a: 'إفطار يوم عرفات مخصص لوجبات إفطار الصائمين في يوم عرفات ويمكن التبرع له عبر صفحة التبرع. شنطة رمضان حملة موسمية لتوزيع سلال غذائية؛ التبرع لها عبر الموقع غير متاح حالياً ويمكنك متابعة صفحة النشاط للأرقام والتفاصيل.',
  },
  {
    q: 'هل يمكن التبرع بمبلغ مخصص؟',
    a: 'نعم، في صفحة التبرع يمكنك إدخال أي مبلغ بالجنيه بدلاً من اختيار عدد الوحدات فقط.',
  },
  {
    q: 'ما طرق الدفع المتاحة؟',
    a: 'InstaPay و Telda متاحان حالياً. اختر الطريقة المناسبة، أكمل التحويل، ثم ارفع صورة الإيصال.',
  },
  {
    q: 'كيف أتواصل معكم؟',
    a: 'يمكنك مراسلتنا عبر البريد الإلكتروني أو واتساب من أسفل الصفحة أو الزر العائم.',
  },
]

const FAQ = ({ items = defaultItems, title = 'أسئلة شائعة' }) => {
  const [openId, setOpenId] = useState(null)

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-beige-50">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-olive-800 text-center mb-8 sm:mb-10"
        >
          {title}
        </motion.h2>
        <div className="space-y-3">
          {items.map((item, index) => {
            const id = index
            const isOpen = openId === id
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border border-beige-300 bg-white shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : id)}
                  className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-right font-bold text-olive-800 hover:bg-beige-50 transition-colors"
                >
                  <span className="text-base sm:text-lg flex-1">{item.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    className="text-gold-600 text-xl shrink-0"
                  >
                    ▼
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-olive-600 text-sm sm:text-base leading-relaxed border-t border-beige-100 pt-3">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FAQ
