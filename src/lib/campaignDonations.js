import { CAUSES } from './causes'

/** Donations on/after this date = Arafat campaign; earlier = Ramadan boxes. */
export const CAMPAIGN_CUTOFF = new Date(2026, 4, 9)
CAMPAIGN_CUTOFF.setHours(0, 0, 0, 0)

export const MEAL_PRICE_EGP = CAUSES.arafat.unitCost

export function getDonationDate(donation) {
  const ts = donation.createdAt
  if (!ts) return null
  return ts instanceof Date ? ts : ts.toDate?.() ?? null
}

export function isArafatCampaignDonation(donation) {
  const date = getDonationDate(donation)
  if (!date) return donation.cause === 'arafat'
  return date >= CAMPAIGN_CUTOFF
}

export function isRamadanCampaignDonation(donation) {
  return !isArafatCampaignDonation(donation)
}

/** Meals = total money ÷ 100 (never uses stored units). */
export function mealsFromAmount(totalAmount, mealPrice = MEAL_PRICE_EGP) {
  if (!mealPrice || totalAmount <= 0) return 0
  return Math.floor(totalAmount / mealPrice)
}

export function mealsForDonation(donation, mealPrice = MEAL_PRICE_EGP) {
  return mealsFromAmount(Number(donation.amount) || 0, mealPrice)
}

/**
 * Arafat campaign totals: money is the sum of each transaction amount;
 * meal count is derived only from that sum.
 */
export function computeArafatTotals(donations) {
  const approved = donations.filter(
    (d) => d.status === 'approved' && isArafatCampaignDonation(d)
  )
  const total = approved.reduce((acc, d) => acc + (Number(d.amount) || 0), 0)
  const meals = mealsFromAmount(total)
  return { total, meals, count: approved.length }
}
