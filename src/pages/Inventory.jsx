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
  deleteDoc,
  serverTimestamp,
  orderBy,
  where
} from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { db, auth } from '../lib/firebase'

// Default box items configuration
const DEFAULT_ITEMS = [
  { id: 'rice', name: 'أرز مصري', nameEn: 'Rice', quantityPerBox: 2, unit: 'كجم', costPerUnit: 0 },
  { id: 'sugar', name: 'سكر أبيض', nameEn: 'Sugar', quantityPerBox: 1, unit: 'كجم', costPerUnit: 0 },
  { id: 'oil', name: 'زيت خليط', nameEn: 'Oil', quantityPerBox: 1, unit: 'لتر', costPerUnit: 0 },
  { id: 'pasta', name: 'مكرونة 350 جم', nameEn: 'Pasta', quantityPerBox: 3, unit: 'كيس', costPerUnit: 0 },
  { id: 'fava', name: 'فول', nameEn: 'Fava Beans', quantityPerBox: 1, unit: 'كجم', costPerUnit: 0 },
  { id: 'lentils', name: 'عدس', nameEn: 'Lentils', quantityPerBox: 0.5, unit: 'كجم', costPerUnit: 0 },
  { id: 'dates', name: 'تمر', nameEn: 'Dates', quantityPerBox: 0.7, unit: 'كجم', costPerUnit: 0 },
  { id: 'tomato', name: 'صلصة', nameEn: 'Tomato Paste', quantityPerBox: 0.3, unit: 'كجم', costPerUnit: 0 },
  { id: 'tea', name: 'شاي', nameEn: 'Tea', quantityPerBox: 40, unit: 'جم', costPerUnit: 0 },
  { id: 'salt', name: 'ملح', nameEn: 'Salt', quantityPerBox: 1, unit: 'كيس', costPerUnit: 0 },
]

const TARGET_BOXES = 500

const Inventory = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [transactions, setTransactions] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  
  // Modal states
  const [showAddStock, setShowAddStock] = useState(false)
  const [showUseStock, setShowUseStock] = useState(false)
  const [showEditItem, setShowEditItem] = useState(null)
  
  // Form states
  const [selectedItem, setSelectedItem] = useState('')
  const [quantity, setQuantity] = useState('')
  const [costPerUnit, setCostPerUnit] = useState('')
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        setLoading(false)
      } else {
        navigate('/login')
      }
    })
    return () => unsubAuth()
  }, [navigate])

  useEffect(() => {
    if (!user) return

    // Subscribe to inventory items
    const itemsQuery = query(collection(db, 'inventoryItems'))
    const unsubItems = onSnapshot(itemsQuery, (snapshot) => {
      console.log('Inventory items snapshot:', snapshot.size)
      if (snapshot.empty) {
        // Initialize with default items
        console.log('Initializing default items...')
        initializeItems()
      } else {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        console.log('Loaded items:', data)
        setItems(data)
      }
    }, (error) => {
      console.error('Error fetching inventory items:', error)
    })

    // Subscribe to transactions
    const transQuery = query(collection(db, 'stockTransactions'), orderBy('createdAt', 'desc'))
    const unsubTrans = onSnapshot(transQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }))
      setTransactions(data)
    }, (error) => {
      console.error('Error fetching transactions:', error)
    })

    return () => {
      unsubItems()
      unsubTrans()
    }
  }, [user])

  const initializeItems = async () => {
    try {
      for (const item of DEFAULT_ITEMS) {
        const docRef = await addDoc(collection(db, 'inventoryItems'), {
          name: item.name,
          nameEn: item.nameEn,
          quantityPerBox: item.quantityPerBox,
          unit: item.unit,
          costPerUnit: item.costPerUnit,
          currentStock: 0,
          minStockAlert: item.quantityPerBox * 50,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        console.log('Created item:', item.name, docRef.id)
      }
    } catch (error) {
      console.error('Error initializing items:', error)
    }
  }

  // Calculate stats
  const calculateStats = () => {
    if (items.length === 0) return { possibleBoxes: 0, limitingItem: null, totalValue: 0, costPerBox: 0 }

    let minBoxes = Infinity
    let limitingItem = null
    let totalValue = 0
    let costPerBox = 0

    items.forEach(item => {
      const possibleFromItem = Math.floor((item.currentStock || 0) / item.quantityPerBox)
      if (possibleFromItem < minBoxes) {
        minBoxes = possibleFromItem
        limitingItem = item
      }
      totalValue += (item.currentStock || 0) * (item.costPerUnit || 0)
      costPerBox += item.quantityPerBox * (item.costPerUnit || 0)
    })

    return {
      possibleBoxes: minBoxes === Infinity ? 0 : minBoxes,
      limitingItem,
      totalValue,
      costPerBox,
      neededForTarget: Math.max(0, TARGET_BOXES - (minBoxes === Infinity ? 0 : minBoxes))
    }
  }

  const stats = calculateStats()

  // Add stock (purchase)
  const handleAddStock = async () => {
    if (!selectedItem || !quantity) return
    setSubmitting(true)

    try {
      const item = items.find(i => i.id === selectedItem)
      const qty = parseFloat(quantity)
      const cost = parseFloat(costPerUnit) || 0

      // Add transaction
      await addDoc(collection(db, 'stockTransactions'), {
        itemId: selectedItem,
        itemName: item.name,
        type: 'purchase',
        quantity: qty,
        costPerUnit: cost,
        totalCost: qty * cost,
        supplier: supplier || '',
        notes: notes || '',
        addedBy: user.email,
        createdAt: serverTimestamp()
      })

      // Update item stock and cost
      const itemDoc = doc(db, 'inventoryItems', selectedItem)
      await updateDoc(itemDoc, {
        currentStock: (item.currentStock || 0) + qty,
        costPerUnit: cost > 0 ? cost : item.costPerUnit,
        updatedAt: serverTimestamp()
      })

      resetForm()
      setShowAddStock(false)
    } catch (error) {
      console.error('Error adding stock:', error)
      alert('حدث خطأ أثناء إضافة المخزون')
    }
    setSubmitting(false)
  }

  // Use stock (for making boxes)
  const handleUseStock = async () => {
    if (!quantity) return
    setSubmitting(true)

    try {
      const boxesToMake = parseInt(quantity)
      
      // Check if we have enough stock
      for (const item of items) {
        const needed = item.quantityPerBox * boxesToMake
        if ((item.currentStock || 0) < needed) {
          alert(`لا يوجد مخزون كافي من ${item.name}. المتاح: ${item.currentStock}, المطلوب: ${needed}`)
          setSubmitting(false)
          return
        }
      }

      // Deduct from all items
      for (const item of items) {
        const needed = item.quantityPerBox * boxesToMake
        
        await addDoc(collection(db, 'stockTransactions'), {
          itemId: item.id,
          itemName: item.name,
          type: 'usage',
          quantity: -needed,
          boxesMade: boxesToMake,
          notes: `تجهيز ${boxesToMake} شنطة`,
          addedBy: user.email,
          createdAt: serverTimestamp()
        })

        const itemDoc = doc(db, 'inventoryItems', item.id)
        await updateDoc(itemDoc, {
          currentStock: (item.currentStock || 0) - needed,
          updatedAt: serverTimestamp()
        })
      }

      resetForm()
      setShowUseStock(false)
      alert(`تم تجهيز ${boxesToMake} شنطة بنجاح`)
    } catch (error) {
      console.error('Error using stock:', error)
      alert('حدث خطأ')
    }
    setSubmitting(false)
  }

  // Update item cost
  const handleUpdateItem = async () => {
    if (!showEditItem) return
    setSubmitting(true)

    try {
      const itemDoc = doc(db, 'inventoryItems', showEditItem.id)
      await updateDoc(itemDoc, {
        costPerUnit: parseFloat(costPerUnit) || 0,
        updatedAt: serverTimestamp()
      })
      setShowEditItem(null)
      resetForm()
    } catch (error) {
      console.error('Error updating item:', error)
    }
    setSubmitting(false)
  }

  const resetForm = () => {
    setSelectedItem('')
    setQuantity('')
    setCostPerUnit('')
    setSupplier('')
    setNotes('')
  }

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

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
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">إدارة المخزون</h1>
            <button
              onClick={() => navigate('/admin')}
              className="bg-olive-600 hover:bg-olive-500 px-3 py-1 rounded-lg text-sm"
            >
              ← لوحة التحكم
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-beige-200">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-olive-600 hover:bg-olive-500 px-4 py-2 rounded-lg"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 shadow-lg"
          >
            <h3 className="text-olive-600 text-sm mb-1">شنط ممكن تجهيزها</h3>
            <p className="text-3xl font-bold text-gold-500">{stats.possibleBoxes}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-lg"
          >
            <h3 className="text-olive-600 text-sm mb-1">الهدف</h3>
            <p className="text-3xl font-bold text-olive-700">{TARGET_BOXES}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 shadow-lg"
          >
            <h3 className="text-olive-600 text-sm mb-1">المتبقي للهدف</h3>
            <p className="text-3xl font-bold text-orange-500">{stats.neededForTarget}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-4 shadow-lg"
          >
            <h3 className="text-olive-600 text-sm mb-1">تكلفة الشنطة</h3>
            <p className="text-3xl font-bold text-olive-700">{stats.costPerBox.toFixed(0)}</p>
            <p className="text-olive-500 text-xs">جنيه</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-4 shadow-lg"
          >
            <h3 className="text-olive-600 text-sm mb-1">قيمة المخزون</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalValue.toLocaleString()}</p>
            <p className="text-olive-500 text-xs">جنيه</p>
          </motion.div>
        </div>

        {/* Limiting Item Alert */}
        {stats.limitingItem && stats.possibleBoxes < TARGET_BOXES && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6"
          >
            <p className="text-orange-700">
              ⚠️ <strong>{stats.limitingItem.name}</strong> هو العنصر المحدد للإنتاج. 
              المخزون الحالي: {stats.limitingItem.currentStock} {stats.limitingItem.unit}
            </p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddStock(true)}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl"
          >
            + إضافة مخزون (شراء)
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowUseStock(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl"
          >
            📦 تجهيز شنط
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['overview', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                activeTab === tab
                  ? 'bg-olive-600 text-white'
                  : 'bg-white text-olive-600 hover:bg-olive-100'
              }`}
            >
              {tab === 'overview' ? 'المخزون الحالي' : 'سجل الحركات'}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-olive-100">
                  <tr>
                    <th className="px-4 py-3 text-right text-olive-700">المنتج</th>
                    <th className="px-4 py-3 text-right text-olive-700">الكمية للشنطة</th>
                    <th className="px-4 py-3 text-right text-olive-700">المخزون الحالي</th>
                    <th className="px-4 py-3 text-right text-olive-700">سعر الوحدة</th>
                    <th className="px-4 py-3 text-right text-olive-700">القيمة</th>
                    <th className="px-4 py-3 text-right text-olive-700">يكفي لـ</th>
                    <th className="px-4 py-3 text-right text-olive-700">الحالة</th>
                    <th className="px-4 py-3 text-right text-olive-700">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const boxesPossible = Math.floor((item.currentStock || 0) / item.quantityPerBox)
                    const isLow = boxesPossible < 50
                    const isCritical = boxesPossible < 20
                    return (
                      <tr key={item.id} className="border-b border-beige-100 hover:bg-beige-50">
                        <td className="px-4 py-3 font-bold text-olive-700">{item.name}</td>
                        <td className="px-4 py-3 text-olive-600">
                          {item.quantityPerBox} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-olive-700 font-bold">
                          {item.currentStock || 0} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-olive-600">
                          {item.costPerUnit || 0} جنيه
                        </td>
                        <td className="px-4 py-3 text-olive-600">
                          {((item.currentStock || 0) * (item.costPerUnit || 0)).toLocaleString()} جنيه
                        </td>
                        <td className="px-4 py-3 font-bold text-olive-700">
                          {boxesPossible} شنطة
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            isCritical ? 'bg-red-100 text-red-700' :
                            isLow ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {isCritical ? 'حرج' : isLow ? 'منخفض' : 'جيد'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setShowEditItem(item)
                              setCostPerUnit(item.costPerUnit?.toString() || '')
                            }}
                            className="text-gold-500 hover:text-gold-600 text-sm"
                          >
                            تعديل السعر
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-olive-100">
                  <tr>
                    <th className="px-4 py-3 text-right text-olive-700">التاريخ</th>
                    <th className="px-4 py-3 text-right text-olive-700">النوع</th>
                    <th className="px-4 py-3 text-right text-olive-700">المنتج</th>
                    <th className="px-4 py-3 text-right text-olive-700">الكمية</th>
                    <th className="px-4 py-3 text-right text-olive-700">التكلفة</th>
                    <th className="px-4 py-3 text-right text-olive-700">المورد</th>
                    <th className="px-4 py-3 text-right text-olive-700">بواسطة</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trans) => (
                    <tr key={trans.id} className="border-b border-beige-100 hover:bg-beige-50">
                      <td className="px-4 py-3 text-olive-600 text-sm">
                        {trans.createdAt?.toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          trans.type === 'purchase' ? 'bg-green-100 text-green-700' :
                          trans.type === 'usage' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {trans.type === 'purchase' ? 'شراء' : trans.type === 'usage' ? 'استخدام' : 'تعديل'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-olive-700">{trans.itemName}</td>
                      <td className="px-4 py-3 font-bold text-olive-700">
                        {trans.quantity > 0 ? '+' : ''}{trans.quantity}
                      </td>
                      <td className="px-4 py-3 text-olive-600">
                        {trans.totalCost ? `${trans.totalCost.toLocaleString()} جنيه` : '-'}
                      </td>
                      <td className="px-4 py-3 text-olive-600">{trans.supplier || '-'}</td>
                      <td className="px-4 py-3 text-olive-500 text-sm">{trans.addedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* Add Stock Modal */}
      <AnimatePresence>
        {showAddStock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddStock(false)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-olive-700 mb-4">إضافة مخزون (شراء)</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-olive-600 text-sm mb-1">المنتج *</label>
                  <select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    className="w-full py-3 px-4 border-2 border-beige-300 rounded-xl focus:border-olive-500 focus:outline-none bg-white"
                  >
                    <option value="">اختر المنتج</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-olive-600 text-sm mb-1">الكمية *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="مثال: 50"
                    className="w-full py-3 px-4 border-2 border-beige-300 rounded-xl focus:border-olive-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-olive-600 text-sm mb-1">سعر الوحدة (جنيه)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    placeholder="مثال: 25"
                    className="w-full py-3 px-4 border-2 border-beige-300 rounded-xl focus:border-olive-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-olive-600 text-sm mb-1">المورد (اختياري)</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="اسم المورد"
                    className="w-full py-3 px-4 border-2 border-beige-300 rounded-xl focus:border-olive-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-olive-600 text-sm mb-1">ملاحظات (اختياري)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full py-3 px-4 border-2 border-beige-300 rounded-xl focus:border-olive-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowAddStock(false); resetForm(); }}
                  className="flex-1 bg-beige-200 hover:bg-beige-300 text-olive-700 font-bold py-3 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAddStock}
                  disabled={submitting || !selectedItem || !quantity}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold py-3 rounded-xl"
                >
                  {submitting ? 'جاري...' : 'إضافة'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Use Stock Modal */}
      <AnimatePresence>
        {showUseStock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUseStock(false)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-olive-700 mb-4">تجهيز شنط</h2>
              <p className="text-olive-600 text-sm mb-4">
                سيتم خصم المكونات تلقائياً من المخزون
              </p>
              
              <div className="bg-olive-50 rounded-xl p-4 mb-4">
                <p className="text-olive-700 font-bold">
                  الحد الأقصى المتاح: {stats.possibleBoxes} شنطة
                </p>
              </div>
              
              <div>
                <label className="block text-olive-600 text-sm mb-1">عدد الشنط *</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  max={stats.possibleBoxes}
                  placeholder={`حتى ${stats.possibleBoxes}`}
                  className="w-full py-3 px-4 border-2 border-beige-300 rounded-xl focus:border-olive-500 focus:outline-none"
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowUseStock(false); resetForm(); }}
                  className="flex-1 bg-beige-200 hover:bg-beige-300 text-olive-700 font-bold py-3 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleUseStock}
                  disabled={submitting || !quantity || parseInt(quantity) > stats.possibleBoxes}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl"
                >
                  {submitting ? 'جاري...' : 'تجهيز'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Item Modal */}
      <AnimatePresence>
        {showEditItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditItem(null)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-olive-700 mb-4">
                تعديل سعر {showEditItem.name}
              </h2>
              
              <div>
                <label className="block text-olive-600 text-sm mb-1">سعر الوحدة (جنيه)</label>
                <input
                  type="number"
                  step="0.01"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  className="w-full py-3 px-4 border-2 border-beige-300 rounded-xl focus:border-olive-500 focus:outline-none"
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowEditItem(null); resetForm(); }}
                  className="flex-1 bg-beige-200 hover:bg-beige-300 text-olive-700 font-bold py-3 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleUpdateItem}
                  disabled={submitting}
                  className="flex-1 bg-gold-500 hover:bg-gold-600 text-white font-bold py-3 rounded-xl"
                >
                  {submitting ? 'جاري...' : 'حفظ'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Inventory
