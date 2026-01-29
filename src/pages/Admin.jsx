import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp,
  orderBy 
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { db, auth, storage } from '../lib/firebase'

const BOX_COST = 250

const Admin = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [donations, setDonations] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState({ 
    total: 0, 
    pending: 0, 
    approved: 0, 
    rejected: 0,
    boxes: 0,
    todayDonations: 0,
    todayAmount: 0,
    avgDonation: 0
  })
  
  // Manual add form
  const [manualAmount, setManualAmount] = useState('')
  const [manualBoxes, setManualBoxes] = useState('')
  const [manualPaymentMethod, setManualPaymentMethod] = useState('')
  const [manualScreenshot, setManualScreenshot] = useState(null)
  const [manualScreenshotPreview, setManualScreenshotPreview] = useState(null)
  const [addingManual, setAddingManual] = useState(false)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // User is authenticated
        setUser(currentUser)
        setLoading(false)
      } else {
        // Not logged in, redirect to login
        navigate('/login')
      }
    })

    return () => unsubAuth()
  }, [navigate])

  useEffect(() => {
    if (!user) return

    // Subscribe to donations
    const q = query(collection(db, 'donations'), orderBy('createdAt', 'desc'))
    const unsubDonations = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }))
      setDonations(data)
      calculateStats(data)
    }, (error) => {
      console.error('Error fetching donations:', error)
    })

    return () => unsubDonations()
  }, [user])

  const calculateStats = (data) => {
    const approvedDonations = data.filter(d => d.status === 'approved')
    const total = approvedDonations.reduce((acc, d) => acc + (d.amount || 0), 0)
    const boxes = approvedDonations.reduce((acc, d) => {
      const b = d.boxes || 0
      return acc + (b > 0 ? b : Math.floor((d.amount || 0) / BOX_COST))
    }, 0)
    const pending = data.filter(d => d.status === 'pending').length
    const approved = approvedDonations.length
    const rejected = data.filter(d => d.status === 'rejected').length
    const avgDonation = approved > 0 ? Math.round(total / approved) : 0
    
    // Today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayApproved = approvedDonations.filter(d => d.createdAt && d.createdAt >= today)
    const todayDonations = todayApproved.length
    const todayAmount = todayApproved.reduce((acc, d) => acc + (d.amount || 0), 0)
    
    setStats({ total, pending, approved, rejected, boxes, todayDonations, todayAmount, avgDonation })
  }

  const handleStatusChange = async (donationId, newStatus) => {
    try {
      await updateDoc(doc(db, 'donations', donationId), { 
        status: newStatus,
        reviewedAt: new Date(),
        reviewedBy: user?.email
      })
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setManualScreenshot(file)
      const reader = new FileReader()
      reader.onload = (e) => setManualScreenshotPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleManualAdd = async () => {
    if (!manualAmount || parseInt(manualAmount) <= 0) return

    setAddingManual(true)
    try {
      let screenshotURL = null
      
      // Upload screenshot if provided
      if (manualScreenshot) {
        const screenshotRef = ref(storage, `screenshots/manual_${Date.now()}_${manualScreenshot.name}`)
        await uploadBytes(screenshotRef, manualScreenshot)
        screenshotURL = await getDownloadURL(screenshotRef)
      }

      const amount = parseInt(manualAmount)
      const boxes = manualBoxes ? parseInt(manualBoxes) : Math.floor(amount / BOX_COST)

      await addDoc(collection(db, 'donations'), {
        amount,
        boxes,
        type: 'manual',
        paymentMethod: manualPaymentMethod || 'إضافة يدوية',
        screenshotURL,
        status: 'approved',
        createdAt: serverTimestamp(),
        addedBy: user?.email
      })

      // Reset form
      setManualAmount('')
      setManualBoxes('')
      setManualPaymentMethod('')
      setManualScreenshot(null)
      setManualScreenshotPreview(null)
    } catch (error) {
      console.error('Error adding manual donation:', error)
      alert('حدث خطأ أثناء إضافة التبرع')
    }
    setAddingManual(false)
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
    }
    navigate('/login')
  }

  const filteredDonations = donations.filter(d => {
    if (filter === 'all') return true
    return d.status === filter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-beige-100 flex items-center justify-center">
        <div className="text-2xl text-olive-600">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-beige-100">
      {/* Header */}
      <header className="bg-olive-700 text-white py-4 px-6">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">لوحة التحكم - أثر</h1>
          <div className="flex items-center gap-4">
            <span className="text-beige-200">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-olive-600 hover:bg-olive-500 px-4 py-2 rounded-lg"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards - Row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 shadow-lg"
          >
            <h3 className="text-olive-600 text-sm mb-1">إجمالي التبرعات</h3>
            <p className="text-2xl font-bold text-gold-500">{stats.total.toLocaleString()}</p>
            <p className="text-olive-500 text-xs">جنيه</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-lg"
          >
            <h3 className="text-olive-600 text-sm mb-1">عدد الشنط</h3>
            <p className="text-2xl font-bold text-olive-700">{stats.boxes}</p>
            <p className="text-olive-500 text-xs">شنطة</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 shadow-lg"
          >
            <h3 className="text-olive-600 text-sm mb-1">في الانتظار</h3>
            <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
            <p className="text-olive-500 text-xs">تبرع</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-4 shadow-lg"
          >
            <h3 className="text-olive-600 text-sm mb-1">معتمدة</h3>
            <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
            <p className="text-olive-500 text-xs">تبرع</p>
          </motion.div>
        </div>

        {/* Stats Cards - Row 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-olive-50 rounded-2xl p-4 shadow-lg"
          >
            <h3 className="text-olive-600 text-sm mb-1">تبرعات اليوم</h3>
            <p className="text-2xl font-bold text-olive-700">{stats.todayDonations}</p>
            <p className="text-olive-500 text-xs">تبرع</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-olive-50 rounded-2xl p-4 shadow-lg"
          >
            <h3 className="text-olive-600 text-sm mb-1">مبلغ اليوم</h3>
            <p className="text-2xl font-bold text-olive-700">{stats.todayAmount.toLocaleString()}</p>
            <p className="text-olive-500 text-xs">جنيه</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-olive-50 rounded-2xl p-4 shadow-lg"
          >
            <h3 className="text-olive-600 text-sm mb-1">متوسط التبرع</h3>
            <p className="text-2xl font-bold text-olive-700">{stats.avgDonation.toLocaleString()}</p>
            <p className="text-olive-500 text-xs">جنيه</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-red-50 rounded-2xl p-4 shadow-lg"
          >
            <h3 className="text-olive-600 text-sm mb-1">مرفوضة</h3>
            <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
            <p className="text-olive-500 text-xs">تبرع</p>
          </motion.div>
        </div>

        {/* Manual Add Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-8"
        >
          <h2 className="text-xl font-bold text-olive-700 mb-2">إضافة تبرع يدوي</h2>
          <p className="text-olive-600 mb-4 text-sm">للتبرعات النقدية أو التصحيحات (يتم اعتماده تلقائياً)</p>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-olive-600 text-sm mb-1">المبلغ بالجنيه *</label>
              <input
                type="number"
                placeholder="مثال: 500"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                className="w-full py-3 px-4 border-2 border-beige-300 rounded-xl focus:border-olive-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-olive-600 text-sm mb-1">عدد الشنط (اختياري)</label>
              <input
                type="number"
                placeholder="يحسب تلقائياً إذا تركته فارغاً"
                value={manualBoxes}
                onChange={(e) => setManualBoxes(e.target.value)}
                className="w-full py-3 px-4 border-2 border-beige-300 rounded-xl focus:border-olive-500 focus:outline-none"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-olive-600 text-sm mb-1">طريقة الدفع (اختياري)</label>
              <select
                value={manualPaymentMethod}
                onChange={(e) => setManualPaymentMethod(e.target.value)}
                className="w-full py-3 px-4 border-2 border-beige-300 rounded-xl focus:border-olive-500 focus:outline-none bg-white"
              >
                <option value="">إضافة يدوية</option>
                <option value="نقدي">نقدي</option>
                <option value="InstaPay">InstaPay</option>
                <option value="Telda">Telda</option>
                <option value="تحويل بنكي">تحويل بنكي</option>
                <option value="فودافون كاش">فودافون كاش</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
            <div>
              <label className="block text-olive-600 text-sm mb-1">صورة الإيصال (اختياري)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                className="w-full py-2 px-4 border-2 border-beige-300 rounded-xl focus:border-olive-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          {manualScreenshotPreview && (
            <div className="mb-4">
              <img src={manualScreenshotPreview} alt="Preview" className="h-20 rounded-lg" />
              <button 
                onClick={() => { setManualScreenshot(null); setManualScreenshotPreview(null); }}
                className="text-red-500 text-sm mt-1"
              >
                حذف الصورة
              </button>
            </div>
          )}
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleManualAdd}
            disabled={addingManual || !manualAmount}
            className="bg-gold-500 hover:bg-gold-600 disabled:bg-gold-300 text-white font-bold py-3 px-8 rounded-xl"
          >
            {addingManual ? 'جاري الإضافة...' : 'إضافة التبرع'}
          </motion.button>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                filter === f
                  ? 'bg-olive-600 text-white'
                  : 'bg-white text-olive-600 hover:bg-olive-100'
              }`}
            >
              {f === 'all' ? 'الكل' : f === 'pending' ? 'قيد المراجعة' : f === 'approved' ? 'معتمد' : 'مرفوض'}
            </button>
          ))}
        </div>

        {/* Donations Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-olive-100">
                <tr>
                  <th className="px-4 py-3 text-right text-olive-700 text-sm">المبلغ</th>
                  <th className="px-4 py-3 text-right text-olive-700 text-sm">الشنط</th>
                  <th className="px-4 py-3 text-right text-olive-700 text-sm">طريقة الدفع</th>
                  <th className="px-4 py-3 text-right text-olive-700 text-sm">الإيصال</th>
                  <th className="px-4 py-3 text-right text-olive-700 text-sm">الحالة</th>
                  <th className="px-4 py-3 text-right text-olive-700 text-sm">التاريخ</th>
                  <th className="px-4 py-3 text-right text-olive-700 text-sm">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonations.map((donation) => (
                  <tr key={donation.id} className="border-b border-beige-100 hover:bg-beige-50">
                    <td className="px-4 py-3 font-bold text-olive-700">
                      {donation.amount?.toLocaleString()} جنيه
                    </td>
                    <td className="px-4 py-3 text-olive-600">
                      {donation.boxes || Math.floor((donation.amount || 0) / BOX_COST)}
                    </td>
                    <td className="px-4 py-3 text-olive-600 text-sm">
                      {donation.paymentMethod || 'غير محدد'}
                    </td>
                    <td className="px-4 py-3">
                      {donation.screenshotURL ? (
                        <button
                          onClick={() => setSelectedImage(donation.screenshotURL)}
                          className="text-gold-500 hover:text-gold-600 underline text-sm"
                        >
                          عرض
                        </button>
                      ) : (
                        <span className="text-olive-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        donation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        donation.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {donation.status === 'pending' ? 'انتظار' :
                         donation.status === 'approved' ? 'معتمد' : 'مرفوض'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-olive-600 text-sm">
                      {donation.createdAt?.toLocaleDateString('ar-EG') || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {donation.status === 'pending' && (
                        <div className="flex gap-1">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleStatusChange(donation.id, 'approved')}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                          >
                            ✓
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleStatusChange(donation.id, 'rejected')}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                          >
                            ✗
                          </motion.button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6"
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={selectedImage}
              alt="Receipt"
              className="max-w-full max-h-[80vh] rounded-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Admin
