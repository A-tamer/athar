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
    const {
      donationId,
      amount,
      boxes,
      units,
      cause,
      causeLabel,
      paymentMethod,
      phoneNumber,
      screenshotURL,
    } = req.body

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
    const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM
    const TWILIO_WHATSAPP_CONTENT_SID = process.env.TWILIO_WHATSAPP_CONTENT_SID

    const notificationResults = {
      telegram: { attempted: false, sent: false },
      whatsapp: { attempted: false, sent: false },
    }

    const causeLine = cause ? `🎯 *المبادرة:* ${causeLabel || cause}\n` : ''
    const unitsLine =
      typeof units === 'number' && units > 0
        ? `📊 *العدد:* ${units}\n`
        : ''
    const boxesLine =
      boxes !== undefined && boxes !== null && boxes !== ''
        ? `📦 *عدد الشنط:* ${boxes}\n`
        : ''
    const phoneLine = phoneNumber ? `📱 *رقم المتبرع:* ${phoneNumber}\n` : ''

    const message = `
🆕 *تبرع جديد*

${causeLine}${unitsLine}${boxesLine}${phoneLine}💰 *المبلغ:* ${amount.toLocaleString()} جنيه
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

    // Send Telegram admin notification when configured.
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      notificationResults.telegram.attempted = true
      try {
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
            console.log('Photo send failed, sending as text:', photoResult)
            await sendTextMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, message, keyboard, screenshotURL)
          }
        } else {
          await sendTextMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, message, keyboard)
        }
        notificationResults.telegram.sent = true
      } catch (telegramError) {
        console.error('Telegram notification failed:', telegramError)
      }
    } else {
      console.log('Telegram credentials not configured, skipping Telegram notification')
    }

    // Send donor WhatsApp thank-you message through Twilio when configured.
    if (phoneNumber && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM) {
      notificationResults.whatsapp.attempted = true
      try {
        await sendTwilioWhatsApp({
          accountSid: TWILIO_ACCOUNT_SID,
          authToken: TWILIO_AUTH_TOKEN,
          from: TWILIO_WHATSAPP_FROM,
          contentSid: TWILIO_WHATSAPP_CONTENT_SID,
          toPhone: phoneNumber,
          amount,
          causeLabel: causeLabel || cause,
        })
        notificationResults.whatsapp.sent = true
      } catch (twilioError) {
        console.error('WhatsApp thank-you failed:', twilioError)
      }
    } else {
      console.log('Twilio credentials or donor phone not configured, skipping WhatsApp message')
    }

    return res.status(200).json({ success: true, notifications: notificationResults })
  } catch (error) {
    console.error('Error processing notifications:', error)
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

async function sendTwilioWhatsApp({ accountSid, authToken, from, contentSid, toPhone, amount, causeLabel }) {
  const to = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`
  const payload = new URLSearchParams({ From: from, To: to })

  // Outside WhatsApp's 24-hour customer service window, Twilio requires an approved template.
  if (contentSid) {
    payload.set('ContentSid', contentSid)
    payload.set(
      'ContentVariables',
      JSON.stringify({
        '1': amount.toLocaleString(),
        '2': causeLabel || 'تبرّع لإفطار صائم يوم عرفات',
      })
    )
  } else {
    // Fallback works only if recipient is inside the 24-hour messaging window.
    payload.set(
      'Body',
      `شكراً لتبرعك مع أثر ❤️
تم استلام تبرعك بقيمة 250 جنيه (تبرّع لإفطار صائم يوم عرفات)
جزاك الله خيراً وتقبّل منكم صالح الأعمال`
    )
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload.toString(),
  })

  const result = await response.json()
  if (!response.ok) {
    const details = result?.message ? `${result.message} (${result.code || 'unknown'})` : 'Unknown Twilio error'
    throw new Error(details)
  }
}
