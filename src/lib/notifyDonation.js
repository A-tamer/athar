/**
 * Notify admin (Telegram) about a donation with retries.
 * Returns true if Telegram was sent or not configured; false on failure.
 */
export async function notifyDonation(payload, { retries = 2 } = {}) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch('/api/notify-donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      const telegram = data.notifications?.telegram

      if (res.ok && data.success) {
        return true
      }

      if (res.ok && telegram && !telegram.attempted) {
        return true
      }

      console.warn(`Donation notify attempt ${attempt + 1} failed:`, data)
    } catch (error) {
      console.warn(`Donation notify attempt ${attempt + 1} error:`, error)
    }

    if (attempt < retries - 1) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  return false
}
