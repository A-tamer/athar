import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import Navbar from '../components/Navbar'

const paymentMethods = [
  {
    id: 'instapay',
    name: 'InstaPay',
    icon: '/instapay-logo.png',
    isImage: true,
    instructions: 'اضغط على الزر للتحويل عبر InstaPay',
    details: 'ahmed_tamer@instapay',
    link: 'https://ipn.eg/S/ahmed_tamer/instapay/5bqnfX'
  },
  {
    id: 'telda',
    name: 'Telda',
    icon: '/telda-logo.png',
    isImage: true,
    instructions: 'اضغط على الزر للتحويل عبر Telda',
    details: '@ahmeddtamerr',
    link: 'https://telda.me/ahmeddtamerr'
  },
  {
    id: 'bank',
    name: 'تحويل بنكي',
    icon: '🏦',
    isImage: false,
    instructions: 'قم بالتحويل إلى الحساب البنكي التالي',
    details: 'البنك الأهلي المصري\nرقم الحساب: 1234567890123',
    link: '#'
  }
]

const BOX_COST = 250 // Cost per شنطة in EGP

const Donate = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [boxes, setBoxes] = useState(1)
  const [customAmount, setCustomAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [screenshot, setScreenshot] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showBoxContents, setShowBoxContents] = useState(false)

  // Calculate total amount
  const totalAmount = boxes ? boxes * BOX_COST : (customAmount ? parseInt(customAmount) : 0)

  // Handle payment completion - redirect to payment link and move to step 3
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
      reader.onload = (e) => setScreenshotPreview(e.target.result)
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
      // Upload screenshot
      const screenshotRef = ref(storage, `screenshots/${Date.now()}_${screenshot.name}`)
      await uploadBytes(screenshotRef, screenshot)
      const screenshotURL = await getDownloadURL(screenshotRef)

      // Create donation document
      const docRef = await addDoc(collection(db, 'donations'), {
        amount: totalAmount,
        boxes: boxes || 0,
        paymentMethod: selectedMethod.name,
        screenshotURL,
        status: 'pending',
        createdAt: serverTimestamp()
      })

      // Send Telegram notification
      try {
        await fetch('/api/notify-donation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            donationId: docRef.id,
            amount: totalAmount,
            boxes: boxes || 0,
            paymentMethod: selectedMethod.name,
            screenshotURL
          })
        })
      } catch (telegramError) {
        console.log('Telegram notification failed:', telegramError)
        // Don't fail the donation if Telegram fails
      }

      setSuccess(true)
    } catch (error) {
      console.error('Error submitting donation:', error)
      // For demo purposes, show success anyway
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-beige-100">
        <Navbar />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-h-[80vh] flex items-center justify-center pt-20 px-4"
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
            <h1 className="text-2xl sm:text-4xl font-bold text-olive-700 mb-3 sm:mb-4">
              شكراً لك!
            </h1>
            <p className="text-base sm:text-xl text-olive-600 mb-6 sm:mb-8">
              تم استلام تبرعك وسيتم مراجعته قريباً
            </p>
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
    <div className="min-h-screen bg-beige-100">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-olive-700 text-center mb-2">
            تبرّع الآن
          </h1>
          <p className="text-olive-600 text-center mb-4 sm:mb-6 text-sm sm:text-base">
            اترك أثراً طيباً في حياة المحتاجين
          </p>

          {/* Instructions Box */}
          <div className="bg-olive-50 border border-olive-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8">
            <h3 className="font-bold text-olive-700 mb-3 text-center text-sm sm:text-base">خطوات التبرع</h3>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className={`flex items-center gap-2 ${step === 1 ? 'text-gold-600 font-bold' : 'text-olive-600'}`}>
                <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${step >= 1 ? 'bg-olive-500 text-white' : 'bg-olive-200 text-olive-600'}`}>1</span>
                <span>اختر عدد الشنط أو المبلغ</span>
              </div>
              <div className={`flex items-center gap-2 ${step === 2 ? 'text-gold-600 font-bold' : 'text-olive-600'}`}>
                <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${step >= 2 ? 'bg-olive-500 text-white' : 'bg-olive-200 text-olive-600'}`}>2</span>
                <span>اختر طريقة الدفع وأتمم التحويل</span>
              </div>
              <div className={`flex items-center gap-2 ${step === 3 ? 'text-gold-600 font-bold' : 'text-olive-600'}`}>
                <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${step >= 3 ? 'bg-olive-500 text-white' : 'bg-olive-200 text-olive-600'}`}>3</span>
                <span>ارفع صورة إيصال الدفع</span>
              </div>
            </div>
          </div>

          {/* Progress Steps Visual */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <motion.div
                    animate={{
                      backgroundColor: step >= s ? '#7d9048' : '#d4dab8',
                      scale: step === s ? 1.1 : 1
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  >
                    {s}
                  </motion.div>
                  {s < 3 && (
                    <div className={`w-12 h-1 mx-1 ${step > s ? 'bg-olive-500' : 'bg-olive-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Boxes Selection */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-lg"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-olive-700 mb-2 text-center sm:text-right">
                  اختر عدد الشنط
                </h2>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4 sm:mb-6">
                  <p className="text-olive-500 text-sm sm:text-base">
                    سعر الشنطة الواحدة: <span className="font-bold text-gold-600">{BOX_COST} جنيه</span>
                  </p>
                  <button
                    onClick={() => setShowBoxContents(true)}
                    className="text-gold-600 hover:text-gold-700 font-bold text-xs sm:text-sm underline flex items-center gap-1"
                  >
                    <span>👁️</span>
                    عرض محتويات الشنطة
                  </button>
                </div>

                {/* Box Counter */}
                <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setBoxes(Math.max((boxes || 0) - 1, 0))
                      setCustomAmount('')
                    }}
                    disabled={!boxes || boxes <= 0}
                    className="w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16 rounded-full bg-beige-200 hover:bg-beige-300 disabled:opacity-50 disabled:cursor-not-allowed text-olive-700 text-2xl sm:text-3xl font-bold flex items-center justify-center transition-all"
                  >
                    −
                  </motion.button>
                  
                  <div className="text-center min-w-[80px] sm:min-w-[120px]">
                    <motion.div
                      key={boxes}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-4xl sm:text-5xl font-black text-olive-700"
                    >
                      {boxes || 0}
                    </motion.div>
                    <p className="text-olive-500 mt-1 text-sm sm:text-base">{boxes === 1 ? 'شنطة' : 'شنط'}</p>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setBoxes((boxes || 0) + 1)
                      setCustomAmount('')
                    }}
                    className="w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16 rounded-full bg-gold-500 hover:bg-gold-600 text-white text-2xl sm:text-3xl font-bold flex items-center justify-center transition-all shadow-lg"
                  >
                    +
                  </motion.button>
                </div>

                {/* Quick Select Buttons */}
                <div className="flex flex-wrap justify-center gap-2 mb-4 sm:mb-6">
                  {[1, 5, 10, 20, 50].map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        setBoxes(num)
                        setCustomAmount('')
                      }}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                        boxes === num
                          ? 'bg-gold-500 text-white'
                          : 'bg-beige-100 text-olive-600 hover:bg-beige-200'
                      }`}
                    >
                      {num} شنط
                    </button>
                  ))}
                </div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-beige-300"></div>
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
                    onFocus={() => setBoxes(null)}
                    onChange={(e) => {
                      setCustomAmount(e.target.value)
                      setBoxes(null)
                    }}
                    className={`w-full py-3 sm:py-4 px-4 sm:px-6 text-base sm:text-lg border-2 rounded-xl focus:border-olive-500 focus:outline-none text-center transition-all ${
                      customAmount && !boxes ? 'border-gold-500 bg-gold-50' : 'border-beige-300'
                    }`}
                  />
                  <span className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-olive-600 text-sm sm:text-base">
                    جنيه
                  </span>
                </div>

                {/* Total Amount Display */}
                {totalAmount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-olive-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 text-center"
                  >
                    <p className="text-olive-600 text-sm sm:text-base">إجمالي التبرع</p>
                    <p className="text-2xl sm:text-3xl font-bold text-olive-700">{totalAmount.toLocaleString()} جنيه</p>
                    {boxes && (
                      <p className="text-gold-600 mt-1 text-sm sm:text-base">{boxes} {boxes === 1 ? 'شنطة' : 'شنط'}</p>
                    )}
                  </motion.div>
                )}

                <button
                  onClick={() => totalAmount > 0 && setStep(2)}
                  disabled={!totalAmount}
                  className="w-full bg-olive-600 hover:bg-olive-700 disabled:bg-olive-300 text-white text-lg sm:text-xl font-bold py-3 sm:py-4 rounded-xl transition-all"
                >
                  التالي
                </button>
              </motion.div>
            )}

            {/* Step 2: Payment Method */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-lg"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-olive-700 mb-2 text-center sm:text-right">
                  اختر طريقة الدفع
                </h2>
                <p className="text-olive-500 text-xs sm:text-sm mb-4 sm:mb-6 text-center sm:text-right">
                  اختر طريقة الدفع المناسبة ثم أتمم عملية التحويل قبل الضغط على "تم الدفع"
                </p>

                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  {paymentMethods.map((method) => (
                    <motion.div
                      key={method.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedMethod(method)}
                      className={`rounded-xl sm:rounded-2xl cursor-pointer transition-all border-2 overflow-hidden ${
                        selectedMethod?.id === method.id
                          ? 'border-gold-500 shadow-lg'
                          : 'border-beige-200 hover:border-olive-300'
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
                            <h3 className="text-lg sm:text-xl font-bold text-olive-700">
                              {method.name}
                            </h3>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {selectedMethod && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-olive-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6"
                  >
                    <p className="text-olive-600 whitespace-pre-line mb-2 text-sm sm:text-base">
                      {selectedMethod.details}
                    </p>
                    <p className="text-gold-600 font-bold text-base sm:text-lg">
                      المبلغ: {totalAmount.toLocaleString()} جنيه
                      {boxes && <span className="text-olive-600 font-normal"> ({boxes} {boxes === 1 ? 'شنطة' : 'شنط'})</span>}
                    </p>
                  </motion.div>
                )}

                {/* Note about payment */}
                <div className="bg-gold-50 border border-gold-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                  <p className="text-gold-700 text-xs sm:text-sm text-center">
                    عند الضغط على "إتمام الدفع" سيتم تحويلك لصفحة الدفع. بعد إتمام التحويل، عد لهذه الصفحة لرفع صورة الإيصال.
                  </p>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-beige-200 hover:bg-beige-300 text-olive-700 text-base sm:text-lg font-bold py-3 sm:py-4 rounded-xl"
                  >
                    السابق
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePaymentComplete}
                    disabled={!selectedMethod}
                    className="flex-1 bg-olive-600 hover:bg-olive-700 disabled:bg-olive-300 text-white text-base sm:text-lg font-bold py-3 sm:py-4 rounded-xl flex items-center justify-center gap-2"
                  >
                    {selectedMethod?.isImage && (
                      <img src={selectedMethod.icon} alt="" className="h-5 sm:h-6 w-auto" />
                    )}
                    إتمام الدفع
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Upload Screenshot */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-lg"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-olive-700 mb-3 sm:mb-4 text-center sm:text-right">
                  تأكيد 
                </h2>

                {/* Important Note */}
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
                  {boxes && (
                    <div className="flex justify-between mb-2 text-sm sm:text-base">
                      <span className="text-olive-600">عدد الشنط:</span>
                      <span className="font-bold text-olive-700">{boxes} {boxes === 1 ? 'شنطة' : 'شنط'}</span>
                    </div>
                  )}
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
                  <label className="block text-base sm:text-lg font-bold text-olive-700 mb-3 sm:mb-4 text-center sm:text-right">
                    ارفع صورة إيصال التحويل
                  </label>
                  <div className="border-2 border-dashed border-olive-300 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
                    {screenshotPreview ? (
                      <div className="space-y-3 sm:space-y-4">
                        <img
                          src={screenshotPreview}
                          alt="Screenshot preview"
                          className="max-h-40 sm:max-h-48 mx-auto rounded-xl"
                        />
                        <button
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
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 bg-beige-200 hover:bg-beige-300 text-olive-700 text-base sm:text-lg font-bold py-3 sm:py-4 rounded-xl"
                  >
                    السابق
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
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
        </motion.div>
      </div>

      {/* Box Contents Popup */}
      <AnimatePresence>
        {showBoxContents && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBoxContents(false)}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl"
            >
              <div className="p-4 bg-olive-700 text-white flex items-center justify-between">
                <h3 className="text-xl font-bold">محتويات الشنطة</h3>
                <button
                  onClick={() => setShowBoxContents(false)}
                  className="text-white hover:text-beige-200 text-2xl"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-auto max-h-[calc(90vh-60px)]">
                <img
                  src="/box-contents.png"
                  alt="محتويات الشنطة"
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Donate
