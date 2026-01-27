// Vercel Serverless Function - Notify Telegram about new donation
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { donationId, amount, boxes, paymentMethod, screenshotURL } = req.body

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Telegram credentials not configured')
      return res.status(500).json({ error: 'Telegram not configured' })
    }

    // Create message with inline keyboard
    const message = `
🆕 *تبرع جديد*

💰 *المبلغ:* ${amount.toLocaleString()} جنيه
📦 *عدد الشنط:* ${boxes || 'غير محدد'}
💳 *طريقة الدفع:* ${paymentMethod}
🆔 *رقم التبرع:* \`${donationId}\`

⏳ *الحالة:* في انتظار المراجعة
`

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ قبول', callback_data: `approve_${donationId}` },
          { text: '❌ رفض', callback_data: `reject_${donationId}` }
        ]
      ]
    }

    // Send photo with caption if screenshot exists
    if (screenshotURL) {
      const photoResponse = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            photo: screenshotURL,
            caption: message,
            parse_mode: 'Markdown',
            reply_markup: keyboard
          })
        }
      )

      const photoResult = await photoResponse.json()
      
      if (!photoResult.ok) {
        // If photo fails, send as text message
        console.log('Photo send failed, sending as text:', photoResult)
        await sendTextMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, message, keyboard, screenshotURL)
      }
    } else {
      await sendTextMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, message, keyboard)
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error sending Telegram notification:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function sendTextMessage(token, chatId, message, keyboard, imageUrl = null) {
  const fullMessage = imageUrl ? `${message}\n\n📷 *صورة الإيصال:* ${imageUrl}` : message
  
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: fullMessage,
      parse_mode: 'Markdown',
      reply_markup: keyboard
    })
  })
}
