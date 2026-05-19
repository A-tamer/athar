// Vercel Serverless Function - Notify Telegram about new donation

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

async function telegramApi(token, method, body) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const result = await response.json()
  if (!result.ok) {
    throw new Error(result.description || `Telegram ${method} failed`)
  }
  return result
}

async function sendTelegramAdminAlert(token, chatId, { message, keyboard, screenshotURL }) {
  if (screenshotURL) {
    try {
      await telegramApi(token, 'sendPhoto', {
        chat_id: chatId,
        photo: screenshotURL,
        caption: message,
        parse_mode: 'HTML',
        reply_markup: keyboard,
      })
      return
    } catch (photoError) {
      console.error('Telegram sendPhoto failed, falling back to text:', photoError.message)
    }
  }

  const text = screenshotURL
    ? `${message}\n\n📷 <a href="${escapeHtml(screenshotURL)}">صورة الإيصال</a>`
    : message

  await telegramApi(token, 'sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: keyboard,
  })
}

export default async function handler(req, res) {
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
      status = 'pending',
    } = req.body

    const amountNum = Number(amount) || 0
    const unitsNum = Number(units) || 0
    const boxesNum = Number(boxes)

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
    const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM
    const TWILIO_WHATSAPP_CONTENT_SID = process.env.TWILIO_WHATSAPP_CONTENT_SID

    const notificationResults = {
      telegram: { attempted: false, sent: false, error: null },
      whatsapp: { attempted: false, sent: false, error: null },
    }

    const causeLine = cause
      ? `🎯 <b>المبادرة:</b> ${escapeHtml(causeLabel || cause)}\n`
      : ''
    const unitsLine = unitsNum > 0 ? `📊 <b>العدد:</b> ${unitsNum}\n` : ''
    const boxesLine =
      !Number.isNaN(boxesNum) && boxesNum > 0 ? `📦 <b>عدد الشنط:</b> ${boxesNum}\n` : ''
    const phoneLine = phoneNumber ? `📱 <b>رقم المتبرع:</b> ${escapeHtml(phoneNumber)}\n` : ''

    const statusLine =
      status === 'approved'
        ? '✅ <b>الحالة:</b> معتمد (إضافة يدوية)'
        : '⏳ <b>الحالة:</b> في انتظار المراجعة'

    const message = `🆕 <b>تبرع جديد</b>

${causeLine}${unitsLine}${boxesLine}${phoneLine}💰 <b>المبلغ:</b> ${amountNum.toLocaleString()} جنيه
💳 <b>طريقة الدفع:</b> ${escapeHtml(paymentMethod || 'غير محدد')}
🆔 <b>رقم التبرع:</b> <code>${escapeHtml(donationId)}</code>

${statusLine}`

    const keyboard =
      status === 'pending'
        ? {
            inline_keyboard: [
              [
                { text: '✅ قبول', callback_data: `approve_${donationId}` },
                { text: '❌ رفض', callback_data: `reject_${donationId}` },
              ],
            ],
          }
        : undefined

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      notificationResults.telegram.attempted = true
      try {
        await sendTelegramAdminAlert(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, {
          message,
          keyboard,
          screenshotURL,
        })
        notificationResults.telegram.sent = true
      } catch (telegramError) {
        notificationResults.telegram.error = telegramError.message
        console.error('Telegram notification failed:', telegramError)
      }
    } else {
      console.log('Telegram credentials not configured, skipping Telegram notification')
    }

    if (phoneNumber && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM) {
      notificationResults.whatsapp.attempted = true
      try {
        await sendTwilioWhatsApp({
          accountSid: TWILIO_ACCOUNT_SID,
          authToken: TWILIO_AUTH_TOKEN,
          from: TWILIO_WHATSAPP_FROM,
          contentSid: TWILIO_WHATSAPP_CONTENT_SID,
          toPhone: phoneNumber,
          amount: amountNum,
          causeLabel: causeLabel || cause,
        })
        notificationResults.whatsapp.sent = true
      } catch (twilioError) {
        notificationResults.whatsapp.error = twilioError.message
        console.error('WhatsApp thank-you failed:', twilioError)
      }
    } else {
      console.log('Twilio credentials or donor phone not configured, skipping WhatsApp message')
    }

    const telegramRequired = Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID)
    const telegramOk = !telegramRequired || notificationResults.telegram.sent

    return res.status(telegramOk ? 200 : 502).json({
      success: telegramOk,
      notifications: notificationResults,
    })
  } catch (error) {
    console.error('Error processing notifications:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function sendTwilioWhatsApp({ accountSid, authToken, from, contentSid, toPhone, amount, causeLabel }) {
  const to = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`
  const payload = new URLSearchParams({ From: from, To: to })

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
    payload.set(
      'Body',
      `شكراً لتبرعك مع أثر ❤️
تم استلام تبرعك بقيمة ${amount.toLocaleString()} جنيه (${causeLabel || 'تبرّع لإفطار صائم يوم عرفات'})
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
