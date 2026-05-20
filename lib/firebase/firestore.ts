import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import app from './config'
import { STAT_CODES } from '@/lib/rpg/stats'
import { xpRequiredForLevel } from '@/lib/rpg/xp'

export const db = getFirestore(app)

export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string
): Promise<void> {
  const initialStats = Object.fromEntries(STAT_CODES.map((code) => [code, 0]))

  await setDoc(doc(db, 'users', uid), {
    id: uid,
    email,
    displayName,
    photoUrl: null,
    level: 1,
    xp: 0,
    xpToNextLevel: xpRequiredForLevel(2),
    playerClass: 'Novice Hunter',
    activeTitle: 'Novice Hunter',
    unlockedTitles: ['Novice Hunter'],
    stats: initialStats,
    credits: 0,
    totalQuestsCompleted: 0,
    currentStreak: 0,
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  })
}
