// Vercel Serverless Function - Handle Telegram webhook (button clicks)

let admin = null
let db = null

async function getFirebaseAdmin() {
  if (db) return db
  
  // Dynamic import for firebase-admin
  const { initializeApp, getApps, cert } = await import('firebase-admin/app')
  const { getFirestore } = await import('firebase-admin/firestore')
  
  if (getApps().length === 0) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
      
      if (serviceAccount.project_id) {
        initializeApp({
          credential: cert(serviceAccount)
        })
      } else {
        initializeApp({
          projectId: 'athar-446da'
        })
      }
    } catch (e) {
      console.error('Firebase init error:', e)
      initializeApp({
        projectId: 'athar-446da'
      })
    }
  }
  
  db = getFirestore()
  return db
}

export default async function handler(req, res) {
  console.log('Webhook received:', JSON.stringify(req.body))
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { callback_query } = req.body

    if (!callback_query) {
      console.log('No callback_query in request')
      return res.status(200).json({ ok: true })
    }

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const callbackData = callback_query.data
    const messageId = callback_query.message.message_id
    const chatId = callback_query.message.chat.id

    console.log('Callback data:', callbackData)

    // Parse callback data - handle potential multiple underscores in ID
    const firstUnderscore = callbackData.indexOf('_')
    if (firstUnderscore === -1) {
      console.log('Invalid callback data format')
      return res.status(200).json({ ok: true })
    }
    
    const action = callbackData.substring(0, firstUnderscore)
    const donationId = callbackData.substring(firstUnderscore + 1)
    
    console.log('Action:', action, 'DonationId:', donationId)
    
    if (!donationId) {
      await answerCallback(TELEGRAM_BOT_TOKEN, callback_query.id, '❌ خطأ في البيانات')
      return res.status(200).json({ ok: true })
    }

    // Get Firebase
    const firestore = await getFirebaseAdmin()
    const donationRef = firestore.collection('donations').doc(donationId)
    const donationDoc = await donationRef.get()

    if (!donationDoc.exists) {
      console.log('Donation not found:', donationId)
      await answerCallback(TELEGRAM_BOT_TOKEN, callback_query.id, '❌ التبرع غير موجود')
      return res.status(200).json({ ok: true })
    }

    const donation = donationDoc.data()
    console.log('Donation data:', donation)
    
    if (donation.status !== 'pending') {
      await answerCallback(TELEGRAM_BOT_TOKEN, callback_query.id, '⚠️ تم معالجة هذا التبرع مسبقاً')
      return res.status(200).json({ ok: true })
    }

    let newStatus, statusEmoji, statusText

    if (action === 'approve') {
      newStatus = 'approved'
      statusEmoji = '✅'
      statusText = 'تم القبول'
    } else if (action === 'reject') {
      newStatus = 'rejected'
      statusEmoji = '❌'
      statusText = 'تم الرفض'
    } else {
      console.log('Unknown action:', action)
      return res.status(200).json({ ok: true })
    }

    // Update donation status in Firebase
    await donationRef.update({
      status: newStatus,
      reviewedAt: new Date(),
      reviewedBy: 'telegram'
    })
    
    console.log('Donation updated to:', newStatus)

    // Update the Telegram message
    const updatedMessage = `${statusEmoji} *${statusText}*

💰 *المبلغ:* ${donation.amount.toLocaleString()} جنيه
📦 *عدد الشنط:* ${donation.boxes || 'غير محدد'}
💳 *طريقة الدفع:* ${donation.paymentMethod}
🆔 *رقم التبرع:* \`${donationId}\`

${newStatus === 'approved' ? '✅ تمت الموافقة وإضافة المبلغ للعداد' : '❌ تم رفض التبرع'}`

    // Edit the message to remove buttons and update text
    const editResult = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageCaption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        caption: updatedMessage,
        parse_mode: 'Markdown'
      })
    })
    
    console.log('Edit message result:', await editResult.text())

    // Answer the callback query
    await answerCallback(
      TELEGRAM_BOT_TOKEN, 
      callback_query.id, 
      newStatus === 'approved' ? '✅ تم قبول التبرع' : '❌ تم رفض التبرع'
    )

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error.message, error.stack)
    // Still try to answer the callback
    try {
      if (req.body?.callback_query?.id) {
        await answerCallback(
          process.env.TELEGRAM_BOT_TOKEN,
          req.body.callback_query.id,
          '❌ حدث خطأ، حاول مرة أخرى'
        )
      }
    } catch (e) {}
    return res.status(200).json({ ok: true })
  }
}

async function answerCallback(token, callbackId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackId,
        text: text,
        show_alert: true
      })
    })
  } catch (e) {
    console.error('Answer callback error:', e)
  }
}
