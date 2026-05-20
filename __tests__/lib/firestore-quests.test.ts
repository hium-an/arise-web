/**
 * Tests for lib/firebase/firestore.ts — quest-related functions:
 *   getQuests, createQuest, deleteQuest, completeQuestWithReward
 *
 * Strategy:
 *   - Mock 'firebase/firestore' module entirely (all exports used by the file)
 *   - Mock '@/lib/firebase/config' to avoid env-var validation
 *   - Mock RPG utilities to keep tests deterministic
 *   - Reference mocked functions via jest.requireMock() to avoid hoisting issues
 */

// ─── Mock: firebase/firestore ─────────────────────────────────────────────────
// Note: jest.mock factories are hoisted, so we cannot reference `const` variables
// declared in the test file. All jest.fn() instances are defined inside the
// factory and accessed later via jest.requireMock().

jest.mock('firebase/firestore', () => {
  class FactoryTimestamp {
    constructor(public seconds: number, public nanoseconds: number) {}
    toDate(): Date {
      return new Date(this.seconds * 1000)
    }
    static fromDate(d: Date) {
      return new FactoryTimestamp(Math.floor(d.getTime() / 1000), 0)
    }
    static now() {
      return new FactoryTimestamp(Math.floor(Date.now() / 1000), 0)
    }
  }

  return {
    getFirestore: jest.fn(() => ({ name: 'mock-db' })),
    doc: jest.fn(),
    setDoc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    collection: jest.fn(),
    query: jest.fn((...args: unknown[]) => args[0]),
    where: jest.fn((...args: unknown[]) => args),
    orderBy: jest.fn((...args: unknown[]) => args),
    serverTimestamp: jest.fn(() => ({ _methodName: 'serverTimestamp' })),
    runTransaction: jest.fn(),
    Timestamp: FactoryTimestamp,
  }
})

// ─── Mock: @/lib/firebase/config ──────────────────────────────────────────────

jest.mock('@/lib/firebase/config', () => ({
  __esModule: true,
  default: { name: 'mock-firebase-app' },
}))

// ─── Mock: RPG utilities ───────────────────────────────────────────────────────

jest.mock('@/lib/rpg/xp', () => ({
  xpRequiredForLevel: jest.fn((level: number) => level * 100),
  calculateLevel: jest.fn((totalXp: number) => Math.floor(totalXp / 100) + 1),
}))

jest.mock('@/lib/rpg/stats', () => ({
  STAT_CODES: ['STR', 'VIT', 'AGI', 'INT', 'WIS', 'FOC', 'WLT', 'SAV', 'INV', 'CHA', 'EMP', 'NET', 'WIL', 'PER', 'CON'],
  applyStatGains: jest.fn((stats: Record<string, number>, gains: Record<string, number>) => ({
    ...stats,
    ...Object.fromEntries(
      Object.entries(gains).map(([k, v]) => [k, (stats[k] ?? 0) + v])
    ),
  })),
  computePlayerClass: jest.fn(() => 'Iron Will'),
}))

// ─── Import module under test (after mocks) ───────────────────────────────────

import {
  getQuests,
  createQuest,
  deleteQuest,
  completeQuestWithReward,
} from '@/lib/firebase/firestore'
import type { CreateQuestInput } from '@/types'

// ─── Grab mocked functions from the mocked module ────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-require-imports
const firestoreMock = jest.requireMock('firebase/firestore') as {
  doc: jest.Mock
  setDoc: jest.Mock
  getDoc: jest.Mock
  getDocs: jest.Mock
  addDoc: jest.Mock
  updateDoc: jest.Mock
  deleteDoc: jest.Mock
  collection: jest.Mock
  serverTimestamp: jest.Mock
  runTransaction: jest.Mock
  Timestamp: {
    new (seconds: number, nanoseconds: number): { seconds: number; nanoseconds: number; toDate(): Date }
    fromDate(d: Date): { seconds: number; nanoseconds: number; toDate(): Date }
    now(): { seconds: number; nanoseconds: number; toDate(): Date }
  }
}

// Convenience aliases
const { doc: mockDoc, getDocs: mockGetDocs, addDoc: mockAddDoc, deleteDoc: mockDeleteDoc, collection: mockCollection, runTransaction: mockRunTransaction } = firestoreMock
const MockTimestamp = firestoreMock.Timestamp

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MOCK_UID = 'uid-hunter-001'
const MOCK_QUEST_ID = 'quest-abc-123'

function makeRawQuest(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    userId: MOCK_UID,
    title: 'Defeat the Shadow Dragon',
    description: 'Slay it before dawn',
    type: 'boss',
    domain: 'physical',
    xpReward: 200,
    statGains: { STR: 5 },
    status: 'pending',
    deadline: null,
    completedAt: null,
    aiGenerated: false,
    parentGoalId: null,
    parentMilestoneId: null,
    createdAt: new MockTimestamp(1700000000, 0),
    ...overrides,
  }
}

function makeFakeDocSnap(id: string, data: Record<string, unknown>, exists = true) {
  return {
    id,
    exists: () => exists,
    data: () => (exists ? data : null),
  }
}

function makeFakeCollectionSnap(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  return {
    docs: docs.map((d) => ({
      id: d.id,
      data: () => d.data,
    })),
    size: docs.length,
    empty: docs.length === 0,
  }
}

function makeUserSnap(overrides: Record<string, unknown> = {}) {
  return makeFakeDocSnap('user-ref', {
    level: 3,
    totalXp: 250,
    xp: 50,
    xpToNextLevel: 100,
    stats: { STR: 10 },
    totalQuestsCompleted: 5,
    ...overrides,
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('lib/firebase/firestore — quest functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: doc() and collection() return stable ref strings
    mockDoc.mockImplementation((_db: unknown, ...segments: string[]) => segments.join('/'))
    mockCollection.mockImplementation((_db: unknown, ...segments: string[]) => segments.join('/'))
  })

  // ── getQuests ──────────────────────────────────────────────────────────────

  describe('getQuests', () => {
    it('returns a mapped Quest array from a non-empty collection', async () => {
      // Arrange
      const rawDocs = [
        { id: 'q1', data: makeRawQuest({ title: 'Quest One' }) },
        { id: 'q2', data: makeRawQuest({ title: 'Quest Two', type: 'daily', domain: 'mental' }) },
      ]
      mockGetDocs.mockResolvedValueOnce(makeFakeCollectionSnap(rawDocs))

      // Act
      const result = await getQuests(MOCK_UID)

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('q1')
      expect(result[0].title).toBe('Quest One')
      expect(result[1].id).toBe('q2')
      expect(result[1].type).toBe('daily')
    })

    it('returns an empty array when the collection has no documents', async () => {
      // Arrange
      mockGetDocs.mockResolvedValueOnce(makeFakeCollectionSnap([]))

      // Act
      const result = await getQuests(MOCK_UID)

      // Assert
      expect(result).toEqual([])
    })

    it('maps raw Firestore Timestamp fields to Date objects', async () => {
      // Arrange
      const ts = new MockTimestamp(1700000000, 0)
      const rawDocs = [{ id: 'q1', data: makeRawQuest({ createdAt: ts }) }]
      mockGetDocs.mockResolvedValueOnce(makeFakeCollectionSnap(rawDocs))

      // Act
      const [quest] = await getQuests(MOCK_UID)

      // Assert
      expect(quest.createdAt).toBeInstanceOf(Date)
      expect(quest.createdAt.getTime()).toBe(ts.toDate().getTime())
    })

    it('maps raw Date fields directly to Date objects', async () => {
      // Arrange
      const d = new Date('2024-06-01')
      const rawDocs = [{ id: 'q1', data: makeRawQuest({ createdAt: d }) }]
      mockGetDocs.mockResolvedValueOnce(makeFakeCollectionSnap(rawDocs))

      // Act
      const [quest] = await getQuests(MOCK_UID)

      // Assert
      expect(quest.createdAt).toBeInstanceOf(Date)
    })

    it('applies default fallbacks when raw fields are missing', async () => {
      // Arrange — minimal doc with no optional fields
      const rawDocs = [
        {
          id: 'q1',
          data: {
            createdAt: new MockTimestamp(1700000000, 0),
          },
        },
      ]
      mockGetDocs.mockResolvedValueOnce(makeFakeCollectionSnap(rawDocs))

      // Act
      const [quest] = await getQuests(MOCK_UID)

      // Assert defaults
      expect(quest.userId).toBe('')
      expect(quest.title).toBe('')
      expect(quest.type).toBe('side')
      expect(quest.domain).toBe('discipline')
      expect(quest.xpReward).toBe(0)
      expect(quest.status).toBe('pending')
      expect(quest.aiGenerated).toBe(false)
    })

    it('calls getDocs with the correct collection reference', async () => {
      // Arrange
      mockGetDocs.mockResolvedValueOnce(makeFakeCollectionSnap([]))

      // Act
      await getQuests(MOCK_UID)

      // Assert
      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        'users',
        MOCK_UID,
        'quests'
      )
      expect(mockGetDocs).toHaveBeenCalledTimes(1)
    })
  })

  // ── createQuest ────────────────────────────────────────────────────────────

  describe('createQuest', () => {
    const validInput: CreateQuestInput = {
      title: 'Run 5km',
      description: 'Morning run',
      type: 'daily',
      domain: 'physical',
      xpReward: 50,
      statGains: { STR: 1, VIT: 1 },
      deadline: new Date('2030-12-31'),
    }

    it('calls addDoc with correct payload fields', async () => {
      // Arrange
      mockAddDoc.mockResolvedValueOnce({ id: 'new-quest-id' })

      // Act
      await createQuest(MOCK_UID, validInput)

      // Assert
      expect(mockAddDoc).toHaveBeenCalledTimes(1)
      const [, payload] = mockAddDoc.mock.calls[0] as [unknown, Record<string, unknown>]
      expect(payload.userId).toBe(MOCK_UID)
      expect(payload.title).toBe('Run 5km')
      expect(payload.description).toBe('Morning run')
      expect(payload.type).toBe('daily')
      expect(payload.domain).toBe('physical')
      expect(payload.xpReward).toBe(50)
      expect(payload.statGains).toEqual({ STR: 1, VIT: 1 })
      expect(payload.status).toBe('pending')
      expect(payload.aiGenerated).toBe(false)
    })

    it('sets deadline as Timestamp.fromDate when provided', async () => {
      // Arrange
      mockAddDoc.mockResolvedValueOnce({ id: 'new-quest-id' })

      // Act
      await createQuest(MOCK_UID, validInput)

      // Assert — payload.deadline should be a MockTimestamp instance
      const [, payload] = mockAddDoc.mock.calls[0] as [unknown, Record<string, unknown>]
      const deadline = payload.deadline as { seconds: number; nanoseconds: number }
      expect(deadline).toHaveProperty('seconds')
      expect(deadline).toHaveProperty('nanoseconds')
    })

    it('sets deadline as null when not provided', async () => {
      // Arrange
      mockAddDoc.mockResolvedValueOnce({ id: 'new-quest-id' })
      const inputWithoutDeadline: CreateQuestInput = { ...validInput, deadline: undefined }

      // Act
      await createQuest(MOCK_UID, inputWithoutDeadline)

      // Assert
      const [, payload] = mockAddDoc.mock.calls[0] as [unknown, Record<string, unknown>]
      expect(payload.deadline).toBeNull()
    })

    it('returns a Quest object with the new document id', async () => {
      // Arrange
      mockAddDoc.mockResolvedValueOnce({ id: 'new-quest-id' })

      // Act
      const result = await createQuest(MOCK_UID, validInput)

      // Assert
      expect(result.id).toBe('new-quest-id')
      expect(result.title).toBe('Run 5km')
      expect(result.status).toBe('pending')
      expect(result.aiGenerated).toBe(false)
    })

    it('description defaults to undefined in returned quest when not provided', async () => {
      // Arrange
      mockAddDoc.mockResolvedValueOnce({ id: 'q-no-desc' })
      const inputNoDesc: CreateQuestInput = { ...validInput, description: undefined }

      // Act
      const result = await createQuest(MOCK_UID, inputNoDesc)

      // Assert
      expect(result.description).toBeUndefined()
    })

    it('description in payload defaults to null when not provided', async () => {
      // Arrange
      mockAddDoc.mockResolvedValueOnce({ id: 'q-no-desc' })
      const inputNoDesc: CreateQuestInput = { ...validInput, description: undefined }

      // Act
      await createQuest(MOCK_UID, inputNoDesc)

      // Assert
      const [, payload] = mockAddDoc.mock.calls[0] as [unknown, Record<string, unknown>]
      expect(payload.description).toBeNull()
    })
  })

  // ── deleteQuest ────────────────────────────────────────────────────────────

  describe('deleteQuest', () => {
    it('calls deleteDoc with the correct document ref', async () => {
      // Arrange
      firestoreMock.deleteDoc.mockResolvedValueOnce(undefined)
      const expectedRef = `users/${MOCK_UID}/quests/${MOCK_QUEST_ID}`
      mockDoc.mockReturnValueOnce(expectedRef)

      // Act
      await deleteQuest(MOCK_UID, MOCK_QUEST_ID)

      // Assert
      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        'users',
        MOCK_UID,
        'quests',
        MOCK_QUEST_ID
      )
      expect(mockDeleteDoc).toHaveBeenCalledWith(expectedRef)
    })

    it('resolves void on success', async () => {
      // Arrange
      firestoreMock.deleteDoc.mockResolvedValueOnce(undefined)

      // Act
      const result = await deleteQuest(MOCK_UID, MOCK_QUEST_ID)

      // Assert
      expect(result).toBeUndefined()
    })

    it('propagates errors from deleteDoc', async () => {
      // Arrange
      firestoreMock.deleteDoc.mockRejectedValueOnce(new Error('Permission denied'))

      // Act & Assert
      await expect(deleteQuest(MOCK_UID, MOCK_QUEST_ID)).rejects.toThrow('Permission denied')
    })
  })

  // ── completeQuestWithReward ───────────────────────────────────────────────

  describe('completeQuestWithReward', () => {
    /**
     * Helper: configure runTransaction to execute the callback with a fake
     * transaction object. get() is called with user ref first, quest ref second.
     */
    function setupTransaction(
      userSnap: ReturnType<typeof makeUserSnap>,
      questSnap: ReturnType<typeof makeFakeDocSnap>
    ) {
      mockRunTransaction.mockImplementation(
        async (_db: unknown, updateFn: (tx: unknown) => Promise<unknown>) => {
          const fakeTx = {
            get: jest.fn()
              .mockResolvedValueOnce(userSnap)
              .mockResolvedValueOnce(questSnap),
            update: jest.fn(),
          }
          return updateFn(fakeTx)
        }
      )
    }

    it('throws "Quest already completed" when quest status is "completed"', async () => {
      // Arrange
      const userSnap = makeUserSnap()
      const completedQuestSnap = makeFakeDocSnap(
        MOCK_QUEST_ID,
        makeRawQuest({ status: 'completed' })
      )
      setupTransaction(userSnap, completedQuestSnap)

      // Act & Assert
      await expect(
        completeQuestWithReward(MOCK_UID, MOCK_QUEST_ID, 50, { STR: 1 })
      ).rejects.toThrow('Quest already completed')
    })

    it('throws "User profile not found" when user snapshot does not exist', async () => {
      // Arrange
      const missingUserSnap = makeFakeDocSnap('user-ref', {}, false)
      const questSnap = makeFakeDocSnap(MOCK_QUEST_ID, makeRawQuest())
      setupTransaction(missingUserSnap, questSnap)

      // Act & Assert
      await expect(
        completeQuestWithReward(MOCK_UID, MOCK_QUEST_ID, 50, { STR: 1 })
      ).rejects.toThrow('User profile not found')
    })

    it('returns correct prevLevel from user snapshot', async () => {
      // Arrange
      const userSnap = makeUserSnap({ level: 4, totalXp: 400 })
      const questSnap = makeFakeDocSnap(MOCK_QUEST_ID, makeRawQuest({ status: 'pending' }))
      setupTransaction(userSnap, questSnap)

      // Act
      const result = await completeQuestWithReward(MOCK_UID, MOCK_QUEST_ID, 50, {})

      // Assert
      expect(result.prevLevel).toBe(4)
    })

    it('returns newLevel calculated from total XP after gain', async () => {
      // Arrange — user at totalXp=250, gains 50 → totalXp=300
      // calculateLevel mock: Math.floor(300/100)+1 = 4
      const userSnap = makeUserSnap({ level: 3, totalXp: 250 })
      const questSnap = makeFakeDocSnap(MOCK_QUEST_ID, makeRawQuest({ status: 'pending' }))
      setupTransaction(userSnap, questSnap)

      // Act
      const result = await completeQuestWithReward(MOCK_UID, MOCK_QUEST_ID, 50, {})

      // Assert
      expect(result.newLevel).toBe(4)
    })

    it('returns newStats after applying stat gains', async () => {
      // Arrange
      const userSnap = makeUserSnap({ stats: { STR: 10 } })
      const questSnap = makeFakeDocSnap(MOCK_QUEST_ID, makeRawQuest({ status: 'pending' }))
      setupTransaction(userSnap, questSnap)

      // Act
      const result = await completeQuestWithReward(MOCK_UID, MOCK_QUEST_ID, 50, { STR: 5 })

      // Assert — applyStatGains mock: STR 10 + 5 = 15
      expect(result.newStats.STR).toBe(15)
    })

    it('calls transaction.update on the quest ref to mark completed', async () => {
      // Arrange
      const userSnap = makeUserSnap()
      const questSnap = makeFakeDocSnap(MOCK_QUEST_ID, makeRawQuest({ status: 'pending' }))
      let capturedTx: { update: jest.Mock } | null = null

      mockRunTransaction.mockImplementation(
        async (_db: unknown, updateFn: (tx: unknown) => Promise<unknown>) => {
          const fakeTx = {
            get: jest.fn()
              .mockResolvedValueOnce(userSnap)
              .mockResolvedValueOnce(questSnap),
            update: jest.fn(),
          }
          capturedTx = fakeTx
          return updateFn(fakeTx)
        }
      )

      // Act
      await completeQuestWithReward(MOCK_UID, MOCK_QUEST_ID, 50, {})

      // Assert — one of the update calls marks status=completed
      expect(capturedTx).not.toBeNull()
      const questUpdateCall = capturedTx!.update.mock.calls.find(
        (call: unknown[]) => {
          const payload = call[1] as Record<string, unknown>
          return payload.status === 'completed'
        }
      )
      expect(questUpdateCall).toBeDefined()
    })

    it('calls transaction.update on the user ref with updated XP', async () => {
      // Arrange
      const userSnap = makeUserSnap({ level: 2, totalXp: 150 })
      const questSnap = makeFakeDocSnap(MOCK_QUEST_ID, makeRawQuest({ status: 'pending' }))
      let capturedTx: { update: jest.Mock } | null = null

      mockRunTransaction.mockImplementation(
        async (_db: unknown, updateFn: (tx: unknown) => Promise<unknown>) => {
          const fakeTx = {
            get: jest.fn()
              .mockResolvedValueOnce(userSnap)
              .mockResolvedValueOnce(questSnap),
            update: jest.fn(),
          }
          capturedTx = fakeTx
          return updateFn(fakeTx)
        }
      )

      // Act
      await completeQuestWithReward(MOCK_UID, MOCK_QUEST_ID, 50, {})

      // Assert — user update call contains totalXp = 150 + 50 = 200
      const userUpdateCall = capturedTx!.update.mock.calls.find(
        (call: unknown[]) => {
          const payload = call[1] as Record<string, unknown>
          return typeof payload.totalXp === 'number'
        }
      )
      expect(userUpdateCall).toBeDefined()
      const [, userPayload] = userUpdateCall as [unknown, Record<string, unknown>]
      expect(userPayload.totalXp).toBe(200)
    })

    it('does not throw when quest snapshot does not exist (new quest scenario)', async () => {
      // Arrange — quest snap exists: false → status check is skipped
      const userSnap = makeUserSnap()
      const nonExistentQuestSnap = makeFakeDocSnap(MOCK_QUEST_ID, {}, false)
      setupTransaction(userSnap, nonExistentQuestSnap)

      // Act & Assert — should resolve normally
      await expect(
        completeQuestWithReward(MOCK_UID, MOCK_QUEST_ID, 50, {})
      ).resolves.not.toThrow()
    })
  })
})
