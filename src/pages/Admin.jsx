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
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { db, auth } from '../lib/firebase'

const Admin = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [donations, setDonations] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [manualAmount, setManualAmount] = useState('')
  const [manualBoxes, setManualBoxes] = useState('')
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, boxes: 0 })

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
    const boxes = approvedDonations.reduce((acc, d) => acc + (d.boxes || 0), 0)
    const pending = data.filter(d => d.status === 'pending').length
    const approved = approvedDonations.length
    setStats({ total, pending, approved, boxes })
  }

  const handleStatusChange = async (donationId, newStatus) => {
    try {
      await updateDoc(doc(db, 'donations', donationId), { status: newStatus })
    } catch (error) {
      // Demo mode: update locally
      setDonations(prev => prev.map(d => 
        d.id === donationId ? { ...d, status: newStatus } : d
      ))
      calculateStats(donations.map(d => 
        d.id === donationId ? { ...d, status: newStatus } : d
      ))
    }
  }

  const handleManualAdd = async () => {
    if (!manualAmount || parseInt(manualAmount) <= 0) return

    try {
      await addDoc(collection(db, 'donations'), {
        amount: parseInt(manualAmount),
        type: 'manual',
        status: 'approved',
        createdAt: serverTimestamp()
      })
    } catch (error) {
      // Demo mode: add locally
      const newDonation = {
        id: Date.now().toString(),
        amount: parseInt(manualAmount),
        type: 'manual',
        status: 'approved',
        createdAt: new Date()
      }
      setDonations(prev => [newDonation, ...prev])
      calculateStats([newDonation, ...donations])
    }
    setManualAmount('')
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
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-olive-600 mb-2">إجمالي التبرعات المعتمدة</h3>
            <p className="text-3xl font-bold text-gold-500">{stats.total.toLocaleString()} جنيه</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-olive-600 mb-2">في انتظار المراجعة</h3>
            <p className="text-3xl font-bold text-orange-500">{stats.pending}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-olive-600 mb-2">تبرعات معتمدة</h3>
            <p className="text-3xl font-bold text-green-500">{stats.approved}</p>
          </motion.div>
        </div>

        {/* Manual Add Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-8"
        >
          <h2 className="text-xl font-bold text-olive-700 mb-4">إضافة تبرع يدوي</h2>
          <p className="text-olive-600 mb-4 text-sm">للتبرعات النقدية أو التصحيحات</p>
          <div className="flex gap-4">
            <input
              type="number"
              placeholder="المبلغ بالجنيه"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
              className="flex-1 py-3 px-4 border-2 border-beige-300 rounded-xl focus:border-olive-500 focus:outline-none"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleManualAdd}
              className="bg-gold-500 hover:bg-gold-600 text-white font-bold py-3 px-8 rounded-xl"
            >
              إضافة
            </motion.button>
          </div>
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
                  <th className="px-6 py-4 text-right text-olive-700">المبلغ</th>
                  <th className="px-6 py-4 text-right text-olive-700">طريقة الدفع</th>
                  <th className="px-6 py-4 text-right text-olive-700">الإيصال</th>
                  <th className="px-6 py-4 text-right text-olive-700">الحالة</th>
                  <th className="px-6 py-4 text-right text-olive-700">التاريخ</th>
                  <th className="px-6 py-4 text-right text-olive-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonations.map((donation) => (
                  <tr key={donation.id} className="border-b border-beige-100 hover:bg-beige-50">
                    <td className="px-6 py-4 font-bold text-olive-700">
                      {donation.amount} جنيه
                    </td>
                    <td className="px-6 py-4 text-olive-600">
                      {donation.type === 'manual' ? 'إضافة يدوية' : donation.paymentMethod}
                    </td>
                    <td className="px-6 py-4">
                      {donation.screenshotURL ? (
                        <button
                          onClick={() => setSelectedImage(donation.screenshotURL)}
                          className="text-gold-500 hover:text-gold-600 underline"
                        >
                          عرض الصورة
                        </button>
                      ) : (
                        <span className="text-olive-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        donation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        donation.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {donation.status === 'pending' ? 'قيد المراجعة' :
                         donation.status === 'approved' ? 'معتمد' : 'مرفوض'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-olive-600">
                      {donation.createdAt?.toLocaleDateString('ar-EG') || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {donation.status === 'pending' && (
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleStatusChange(donation.id, 'approved')}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
                          >
                            اعتماد
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleStatusChange(donation.id, 'rejected')}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                          >
                            رفض
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
