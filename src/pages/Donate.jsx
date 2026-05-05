import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import Navbar from '../components/Navbar'
import { CAUSES } from '../lib/causes'

const paymentMethods = [
  {
    id: 'instapay',
    name: 'InstaPay',
    icon: '/instapay-logo.png',
    isImage: true,
    instructions: 'اضغط على الزر للتحويل عبر InstaPay',
    details: 'ahmedgharib11112@instapay',
    link: 'https://ipn.eg/S/ahmedgharib11112/instapay/0ghllN',
  },
  {
    id: 'telda',
    name: 'Telda',
    icon: '/telda-logo.png',
    isImage: true,
    instructions: 'اضغط على الزر للتحويل عبر Telda',
    details: '@ahmeddtamerr',
    link: 'https://telda.me/ahmeddtamerr',
  },
]

const CAUSE_ARAFAT = 'arafat'

const Donate = () => {
  const navigate = useNavigate()
  /** User must pick a type; only Arafat meals can actually be selected. */
  const [donationType, setDonationType] = useState(CAUSE_ARAFAT)

  const cause = CAUSES[CAUSE_ARAFAT]

  const [step, setStep] = useState(1)
  const [units, setUnits] = useState(1)
  const [customAmount, setCustomAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [screenshot, setScreenshot] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setStep(1)
    setUnits(1)
    setCustomAmount('')
    setSelectedMethod(null)
    setScreenshot(null)
    setScreenshotPreview(null)
  }, [donationType])

  const unitCost = cause.unitCost
  const totalAmount = units ? units * unitCost : customAmount ? parseInt(String(customAmount), 10) || 0 : 0

  const handlePaymentComplete = () => {
    if (selectedMethod && selectedMethod.link !== '#') {
      window.open(selectedMethod.link, '_blank')
    }
    setStep(3)
  }

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setScreenshot(file)
      const reader = new FileReader()
      reader.onload = (ev) => setScreenshotPreview(ev.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!totalAmount || !selectedMethod || !screenshot) {
      alert('يرجى إكمال جميع البيانات')
      return
    }

    setLoading(true)
    try {
      const screenshotRef = ref(storage, `screenshots/${Date.now()}_${screenshot.name}`)
      await uploadBytes(screenshotRef, screenshot)
      const screenshotURL = await getDownloadURL(screenshotRef)

      const unitsCount = units || 0
      const docRef = await addDoc(collection(db, 'donations'), {
        amount: totalAmount,
        cause: CAUSE_ARAFAT,
        units: unitsCount,
        paymentMethod: selectedMethod.name,
        screenshotURL,
        status: 'pending',
        createdAt: serverTimestamp(),
      })

      try {
        await fetch('/api/notify-donation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            donationId: docRef.id,
            amount: totalAmount,
            cause: CAUSE_ARAFAT,
            causeLabel: cause.headline,
            units: unitsCount,
            boxes: 0,
            paymentMethod: selectedMethod.name,
            screenshotURL,
          })
        })
      } catch (telegramError) {
        console.log('Telegram notification failed:', telegramError)
      }

      setSuccess(true)
    } catch (error) {
      console.error('Error submitting donation:', error)
      setSuccess(true)
    }
    setLoading(false)
  }

  const step1Hint = 'اختر عدد وجبات الإفطار أو المبلغ'

  if (success) {
    return (
      <div className="min-h-screen bg-beige-100">
        <Navbar />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-h-[80vh] flex items-center justify-center pt-28 px-4"
        >
          <div className="text-center p-6 sm:p-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="text-6xl sm:text-8xl mb-4 sm:mb-6"
            >
              ✅
            </motion.div>
            <h1 className="text-2xl sm:text-4xl font-bold text-olive-700 mb-3 sm:mb-4">شكراً لك!</h1>
            <p className="text-base sm:text-xl text-olive-600 mb-6 sm:mb-8">تم استلام تبرعك وسيتم مراجعته قريباً</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="bg-olive-600 hover:bg-olive-700 text-white text-base sm:text-lg font-bold py-3 px-6 sm:px-8 rounded-xl"
            >
              العودة للرئيسية
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-beige-100 to-beige-200">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-olive-800 text-center tracking-tight mb-2">تبرّع</h1>
          <p className="text-olive-600 text-center mb-6 sm:mb-8 text-sm sm:text-base">اترك أثراً طيباً في حياة المحتاجين</p>

          <div className="mb-6 sm:mb-8 rounded-2xl border border-olive-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-center font-bold text-olive-800 mb-3 sm:mb-4">اختر نوع التبرع</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDonationType(CAUSE_ARAFAT)}
                className={`rounded-2xl border-2 p-4 text-center transition-all ${
                  donationType === CAUSE_ARAFAT
                    ? 'border-gold-500 bg-gold-50 shadow-md ring-2 ring-gold-200'
                    : 'border-beige-300 bg-beige-50 hover:border-olive-400'
                }`}
              >
                <span className="block font-bold text-olive-800">وجبات إفطار عرفات</span>
                <span className="mt-1 block text-xs text-olive-600">متاح — اضغط للمتابعة</span>
              </button>
              <div
                className="rounded-2xl border-2 border-dashed border-beige-400 bg-beige-100/90 p-4 text-center opacity-80 cursor-not-allowed select-none"
                aria-disabled="true"
                title="غير متاح حالياً"
              >
                <span className="block font-bold text-olive-700">شنطة رمضان</span>
                <span className="mt-2 block text-xs font-bold text-olive-500">غير متاح حالياً للتبرع عبر الموقع</span>
              </div>
            </div>
          </div>

          {donationType === CAUSE_ARAFAT && (
            <>
              <div className="bg-olive-50 border border-olive-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8">
                <h3 className="font-bold text-olive-700 mb-3 text-center text-sm sm:text-base">خطوات التبرع</h3>
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className={`flex items-center gap-2 ${step === 1 ? 'text-gold-600 font-bold' : 'text-olive-600'}`}>
                    <span
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                        step >= 1 ? 'bg-olive-500 text-white' : 'bg-olive-200 text-olive-600'
                      }`}
                    >
                      1
                    </span>
                    <span>{step1Hint}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${step === 2 ? 'text-gold-600 font-bold' : 'text-olive-600'}`}>
                    <span
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                        step >= 2 ? 'bg-olive-500 text-white' : 'bg-olive-200 text-olive-600'
                      }`}
                    >
                      2
                    </span>
                    <span>اختر طريقة الدفع وأتمم التحويل</span>
                  </div>
                  <div className={`flex items-center gap-2 ${step === 3 ? 'text-gold-600 font-bold' : 'text-olive-600'}`}>
                    <span
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                        step >= 3 ? 'bg-olive-500 text-white' : 'bg-olive-200 text-olive-600'
                      }`}
                    >
                      3
                    </span>
                    <span>ارفع صورة إيصال الدفع</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mb-8">
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                      <motion.div
                        animate={{
                          backgroundColor: step >= s ? '#7d9048' : '#d4dab8',
                          scale: step === s ? 1.1 : 1,
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      >
                        {s}
                      </motion.div>
                      {s < 3 && <div className={`w-12 h-1 mx-1 ${step > s ? 'bg-olive-500' : 'bg-olive-200'}`} />}
                    </div>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1-arafat"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-lg border border-beige-200"
                  >
                    <h2 className="text-xl sm:text-2xl font-bold text-olive-700 mb-2 text-center sm:text-right">{cause.countLabel}</h2>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4 sm:mb-6">
                      <p className="text-olive-500 text-sm sm:text-base">
                        سعر {cause.unitLabelSingular} واحدة: <span className="font-bold text-gold-600">{unitCost} جنيه</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4 sm:mb-6">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={() => {
                          setUnits(Math.max((units || 0) - 1, 0))
                          setCustomAmount('')
                        }}
                        disabled={!units || units <= 0}
                        className="w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16 rounded-full bg-beige-200 hover:bg-beige-300 disabled:opacity-50 disabled:cursor-not-allowed text-olive-700 text-2xl sm:text-3xl font-bold flex items-center justify-center transition-all"
                      >
                        −
                      </motion.button>

                      <div className="text-center min-w-[80px] sm:min-w-[120px]">
                        <motion.div key={units} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-4xl sm:text-5xl font-black text-olive-700">
                          {units || 0}
                        </motion.div>
                        <p className="text-olive-500 mt-1 text-sm sm:text-base">
                          {units === 1 ? cause.unitLabelSingular : cause.unitLabelPlural}
                        </p>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={() => {
                          setUnits((units || 0) + 1)
                          setCustomAmount('')
                        }}
                        className="w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16 rounded-full bg-gold-500 hover:bg-gold-600 text-white text-2xl sm:text-3xl font-bold flex items-center justify-center transition-all shadow-lg"
                      >
                        +
                      </motion.button>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 mb-4 sm:mb-6">
                      {[1, 5, 10, 20, 50].map((num) => (
                        <button
                          type="button"
                          key={num}
                          onClick={() => {
                            setUnits(num)
                            setCustomAmount('')
                          }}
                          className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                            units === num ? 'bg-gold-500 text-white' : 'bg-beige-100 text-olive-600 hover:bg-beige-200'
                          }`}
                        >
                          {num} {cause.unitLabelPlural}
                        </button>
                      ))}
                    </div>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-beige-300" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white px-4 text-olive-500">أو</span>
                      </div>
                    </div>

                    <div className="relative mb-4 sm:mb-6">
                      <input
                        type="number"
                        placeholder="أدخل مبلغ آخر"
                        value={customAmount}
                        onFocus={() => setUnits(null)}
                        onChange={(e) => {
                          setCustomAmount(e.target.value)
                          setUnits(null)
                        }}
                        className={`w-full py-3 sm:py-4 px-4 sm:px-6 text-base sm:text-lg border-2 rounded-xl focus:border-olive-500 focus:outline-none text-center transition-all ${
                          customAmount && !units ? 'border-gold-500 bg-gold-50' : 'border-beige-300'
                        }`}
                      />
                      <span className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-olive-600 text-sm sm:text-base">جنيه</span>
                    </div>

                    {totalAmount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-olive-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 text-center"
                      >
                        <p className="text-olive-600 text-sm sm:text-base">إجمالي التبرع</p>
                        <p className="text-2xl sm:text-3xl font-bold text-olive-700">{totalAmount.toLocaleString()} جنيه</p>
                        {units ? (
                          <p className="text-gold-600 mt-1 text-sm sm:text-base">
                            {units} {units === 1 ? cause.unitLabelSingular : cause.unitLabelPlural}
                          </p>
                        ) : null}
                      </motion.div>
                    )}

                    <button
                      type="button"
                      onClick={() => totalAmount > 0 && setStep(2)}
                      disabled={!totalAmount}
                      className="w-full bg-olive-600 hover:bg-olive-700 disabled:bg-olive-300 text-white text-lg sm:text-xl font-bold py-3 sm:py-4 rounded-xl transition-all"
                    >
                      التالي
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-lg border border-beige-200"
                  >
                    <h2 className="text-xl sm:text-2xl font-bold text-olive-700 mb-2 text-center sm:text-right">اختر طريقة الدفع</h2>
                    <p className="text-olive-500 text-xs sm:text-sm mb-4 sm:mb-6 text-center sm:text-right">
                      اختر طريقة الدفع المناسبة ثم أتمم عملية التحويل قبل الضغط على &quot;تم الدفع&quot;
                    </p>

                    <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                      {paymentMethods.map((method) => (
                        <motion.div
                          key={method.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedMethod(method)}
                          className={`rounded-xl sm:rounded-2xl cursor-pointer transition-all border-2 overflow-hidden ${
                            selectedMethod?.id === method.id ? 'border-gold-500 shadow-lg' : 'border-beige-200 hover:border-olive-300'
                          } ${method.isImage ? 'bg-white py-4 sm:py-6 px-4 sm:px-8' : 'bg-beige-50 p-4 sm:p-6'}`}
                        >
                          {method.isImage ? (
                            <div className="flex justify-center items-center">
                              <img src={method.icon} alt={method.name} className="h-10 sm:h-14 w-auto max-w-[150px] sm:max-w-[200px] object-contain" />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 sm:gap-4">
                              <span className="text-3xl sm:text-4xl">{method.icon}</span>
                              <div>
                                <h3 className="text-lg sm:text-xl font-bold text-olive-700">{method.name}</h3>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {selectedMethod && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-olive-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
                        <p className="text-olive-600 whitespace-pre-line mb-2 text-sm sm:text-base">{selectedMethod.details}</p>
                        <p className="text-gold-600 font-bold text-base sm:text-lg">
                          المبلغ: {totalAmount.toLocaleString()} جنيه
                          {units ? (
                            <span className="text-olive-600 font-normal">
                              {' '}
                              ({units} {units === 1 ? cause.unitLabelSingular : cause.unitLabelPlural})
                            </span>
                          ) : null}
                        </p>
                      </motion.div>
                    )}

                    <div className="bg-gold-50 border border-gold-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                      <p className="text-gold-700 text-xs sm:text-sm text-center">
                        عند الضغط على &quot;إتمام الدفع&quot; سيتم تحويلك لصفحة الدفع. بعد إتمام التحويل، عد لهذه الصفحة لرفع صورة الإيصال.
                      </p>
                    </div>

                    <div className="flex gap-3 sm:gap-4">
                      <button type="button" onClick={() => setStep(1)} className="flex-1 bg-beige-200 hover:bg-beige-300 text-olive-700 text-base sm:text-lg font-bold py-3 sm:py-4 rounded-xl">
                        السابق
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={handlePaymentComplete}
                        disabled={!selectedMethod}
                        className="flex-1 bg-olive-600 hover:bg-olive-700 disabled:bg-olive-300 text-white text-base sm:text-lg font-bold py-3 sm:py-4 rounded-xl flex items-center justify-center gap-2"
                      >
                        {selectedMethod?.isImage && <img src={selectedMethod.icon} alt="" className="h-5 sm:h-6 w-auto" />}
                        إتمام الدفع
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-lg border border-beige-200"
                  >
                    <h2 className="text-xl sm:text-2xl font-bold text-olive-700 mb-3 sm:mb-4 text-center sm:text-right">تأكيد</h2>

                    <div className="bg-gold-50 border border-gold-300 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <span className="text-xl sm:text-2xl">⚠️</span>
                        <div>
                          <p className="font-bold text-gold-700 text-sm sm:text-base">تنبيه مهم</p>
                          <p className="text-gold-600 text-xs sm:text-sm">يرجى عدم نسيان رفع صورة إيصال التحويل .</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-beige-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
                      <div className="flex justify-between mb-2 text-sm sm:text-base">
                        <span className="text-olive-600">المبادرة:</span>
                        <span className="font-bold text-olive-700">{cause.headline}</span>
                      </div>
                      {units ? (
                        <div className="flex justify-between mb-2 text-sm sm:text-base">
                          <span className="text-olive-600">العدد:</span>
                          <span className="font-bold text-olive-700">
                            {units} {units === 1 ? cause.unitLabelSingular : cause.unitLabelPlural}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex justify-between mb-2 text-sm sm:text-base">
                        <span className="text-olive-600">المبلغ:</span>
                        <span className="font-bold text-olive-700">{totalAmount.toLocaleString()} جنيه</span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-olive-600">طريقة الدفع:</span>
                        <span className="font-bold text-olive-700">{selectedMethod?.name}</span>
                      </div>
                    </div>

                    <div className="mb-4 sm:mb-6">
                      <label className="block text-base sm:text-lg font-bold text-olive-700 mb-3 sm:mb-4 text-center sm:text-right">ارفع صورة إيصال التحويل</label>
                      <div className="border-2 border-dashed border-olive-300 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
                        {screenshotPreview ? (
                          <div className="space-y-3 sm:space-y-4">
                            <img src={screenshotPreview} alt="Screenshot preview" className="max-h-40 sm:max-h-48 mx-auto rounded-xl" />
                            <button
                              type="button"
                              onClick={() => {
                                setScreenshot(null)
                                setScreenshotPreview(null)
                              }}
                              className="text-red-500 hover:text-red-600 text-sm sm:text-base"
                            >
                              حذف الصورة
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">📸</div>
                            <p className="text-olive-600 mb-2 text-sm sm:text-base">اضغط لاختيار صورة</p>
                            <p className="text-xs sm:text-sm text-olive-400">PNG, JPG حتى 5MB</p>
                            <input type="file" accept="image/*" onChange={handleScreenshotChange} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 sm:gap-4">
                      <button type="button" onClick={() => setStep(2)} className="flex-1 bg-beige-200 hover:bg-beige-300 text-olive-700 text-base sm:text-lg font-bold py-3 sm:py-4 rounded-xl">
                        السابق
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={handleSubmit}
                        disabled={!screenshot || loading}
                        className="flex-1 bg-gold-500 hover:bg-gold-600 disabled:bg-gold-300 text-white text-base sm:text-lg font-bold py-3 sm:py-4 rounded-xl"
                      >
                        {loading ? 'جاري الإرسال...' : 'إرسال التبرع'}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Donate
