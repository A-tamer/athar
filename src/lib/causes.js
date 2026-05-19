/** Donation causes — used by Donate, Home (Arafat stats), Ramadan page */
export const CAUSES = {
  arafat: {
    id: 'arafat',
    unitCost: 100,
    unitLabelSingular: 'وجبة',
    unitLabelPlural: 'وجبات',
    headline: 'تبرّع لإفطار صائم يوم عرفات',
    countLabel: 'اختر عدد وجبات الإفطار',
    /** Target number of meals for progress display */
    mealGoal: 1000,
  },
  ramadan: {
    id: 'ramadan',
    /** Fallback when inventory cost is 0 */
    unitCost: 300,
    unitLabelSingular: 'شنطة',
    unitLabelPlural: 'شنط',
    headline: 'تبرّع لشنطة رمضان',
    countLabel: 'اختر عدد الشنط',
    boxGoal: 500,
  },
}

export const DEFAULT_CAUSE_ID = 'arafat'

export function isValidCauseId(id) {
  return id === 'arafat' || id === 'ramadan'
}
