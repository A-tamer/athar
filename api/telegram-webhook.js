// Vercel Serverless Function - Handle Telegram webhook (button clicks)
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin
function getFirebaseAdmin() {
  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
    
    if (!serviceAccount.project_id) {
      // Fallback to simple config if no service account
      initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'athar-446da'
      })
    } else {
      initializeApp({
        credential: cert(serviceAccount)
      })
    }
  }
  return getFirestore()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { callback_query } = req.body

    if (!callback_query) {
      return res.status(200).json({ ok: true })
    }

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const callbackData = callback_query.data
    const messageId = callback_query.message.message_id
    const chatId = callback_query.message.chat.id

    // Parse callback data
    const [action, donationId] = callbackData.split('_')
    
    if (!donationId) {
      return res.status(200).json({ ok: true })
    }

    const db = getFirebaseAdmin()
    const donationRef = db.collection('donations').doc(donationId)
    const donationDoc = await donationRef.get()

    if (!donationDoc.exists) {
      await answerCallback(TELEGRAM_BOT_TOKEN, callback_query.id, '❌ التبرع غير موجود')
      return res.status(200).json({ ok: true })
    }

    const donation = donationDoc.data()
    
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
      return res.status(200).json({ ok: true })
    }

    // Update donation status in Firebase
    await donationRef.update({
      status: newStatus,
      reviewedAt: new Date(),
      reviewedBy: 'telegram'
    })

    // Update the Telegram message
    const updatedMessage = `
${statusEmoji} *${statusText}*

💰 *المبلغ:* ${donation.amount.toLocaleString()} جنيه
📦 *عدد الشنط:* ${donation.boxes || 'غير محدد'}
💳 *طريقة الدفع:* ${donation.paymentMethod}
🆔 *رقم التبرع:* \`${donationId}\`

${newStatus === 'approved' ? '✅ تمت الموافقة وإضافة المبلغ للعداد' : '❌ تم رفض التبرع'}
`

    // Edit the message to remove buttons and update text
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageCaption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        caption: updatedMessage,
        parse_mode: 'Markdown'
      })
    })

    // Answer the callback query
    await answerCallback(
      TELEGRAM_BOT_TOKEN, 
      callback_query.id, 
      newStatus === 'approved' ? '✅ تم قبول التبرع' : '❌ تم رفض التبرع'
    )

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return res.status(200).json({ ok: true }) // Always return 200 to Telegram
  }
}

async function answerCallback(token, callbackId, text) {
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackId,
      text: text,
      show_alert: true
    })
  })
}
