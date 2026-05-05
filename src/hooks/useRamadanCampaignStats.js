import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { CAUSES } from '../lib/causes'

const BOX_GOAL = CAUSES.ramadan.boxGoal

/**
 * Live Ramadan campaign totals (approved donations: cause ramadan or legacy missing cause).
 */
export function useRamadanCampaignStats() {
  const [totalDonations, setTotalDonations] = useState(0)
  const [costPerBox, setCostPerBox] = useState(0)

  useEffect(() => {
    const unsubInventory = onSnapshot(
      collection(db, 'inventoryItems'),
      (snapshot) => {
        let cost = 0
        snapshot.forEach((docSnap) => {
          const data = docSnap.data()
          cost += (data.quantityPerBox || 0) * (data.costPerUnit || 0)
        })
        setCostPerBox(cost)
      },
      (err) => console.error('Error fetching inventory:', err)
    )
    return () => unsubInventory()
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'donations'), where('status', '==', 'approved'))
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        let total = 0
        snapshot.forEach((docSnap) => {
          const data = docSnap.data()
          const c = data.cause
          if (c === 'ramadan' || c === undefined || c === null) {
            total += data.amount || 0
          }
        })
        setTotalDonations(total)
      },
      (err) => {
        console.error('Firebase error:', err)
        setTotalDonations(0)
      }
    )
    return () => unsub()
  }, [])

  const effectiveCost = costPerBox > 0 ? costPerBox : CAUSES.ramadan.unitCost
  const boxCount =
    effectiveCost > 0 && totalDonations > 0 ? Math.floor(totalDonations / effectiveCost) : 0
  const familiesSupported = boxCount
  const percentToGoal = Math.min(Math.round((boxCount / BOX_GOAL) * 100), 100)

  return {
    totalDonations,
    boxCount,
    familiesSupported,
    percentToGoal,
    boxGoal: BOX_GOAL,
    effectiveCostPerBox: effectiveCost,
  }
}
