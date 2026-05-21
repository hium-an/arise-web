/**
 * Tests for lib/queries/useHabits.ts
 *
 * Tests the TanStack Query hooks:
 *   useHabits, useCreateHabit, useToggleHabit, useDeleteHabit
 *
 * Strategy:
 *   - Mock @/lib/firebase/firestore entirely — no Firestore calls hit real Firebase.
 *   - Wrap each renderHook call in a QueryClientProvider using a fresh QueryClient.
 *   - Use waitFor to assert async states after query resolution.
 *   - Verify invalidateQueries by spying on the QueryClient instance.
 */

// ─── Mock: @/lib/firebase/config ─────────────────────────────────────────────
// Prevents env-var validation errors when firestore.ts is loaded transitively.

jest.mock('@/lib/firebase/config', () => ({
  __esModule: true,
  default: { name: 'mock-firebase-app' },
}))

// ─── Mock: @/lib/firebase/firestore ──────────────────────────────────────────

jest.mock('@/lib/firebase/firestore', () => ({
  getHabits: jest.fn(),
  createHabit: jest.fn(),
  deleteHabit: jest.fn(),
  toggleHabitCompletion: jest.fn(),
}))

// ─── Imports ──────────────────────────────────────────────────────────────────

import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { useHabits, useCreateHabit, useToggleHabit, useDeleteHabit, habitKeys } from '@/lib/queries/useHabits'
import type { Habit, CreateHabitInput } from '@/types'

// ─── Grab mocked functions ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const firestoreMock = jest.requireMock('@/lib/firebase/firestore') as {
  getHabits: jest.Mock
  createHabit: jest.Mock
  deleteHabit: jest.Mock
  toggleHabitCompletion: jest.Mock
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_UID = 'uid-hunter-001'

// ─── Habit factory ────────────────────────────────────────────────────────────

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    userId: MOCK_UID,
    title: 'Morning Run',
    domain: 'physical',
    frequency: 'daily',
    statGains: { STR: 1 },
    streak: 3,
    longestStreak: 5,
    completionLog: [],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }
}

// ─── QueryClient wrapper ──────────────────────────────────────────────────────

function makeWrapper(client: QueryClient) {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children)
  Wrapper.displayName = 'TestQueryClientProvider'
  return Wrapper
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,          // fail fast in tests
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('lib/queries/useHabits', () => {
  let queryClient: QueryClient
  let wrapper: ReturnType<typeof makeWrapper>

  beforeEach(() => {
    jest.clearAllMocks()
    queryClient = makeQueryClient()
    wrapper = makeWrapper(queryClient)
  })

  afterEach(() => {
    queryClient.clear()
  })

  // ── useHabits ──────────────────────────────────────────────────────────────

  describe('useHabits', () => {
    it('returns an empty data state initially while fetching', () => {
      // Arrange
      firestoreMock.getHabits.mockResolvedValue([])

      // Act
      const { result } = renderHook(() => useHabits(MOCK_UID), { wrapper })

      // Assert — data is undefined on the very first render (loading)
      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('returns an empty array when Firestore resolves with no habits', async () => {
      // Arrange
      firestoreMock.getHabits.mockResolvedValue([])

      // Act
      const { result } = renderHook(() => useHabits(MOCK_UID), { wrapper })

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([])
    })

    it('returns the habits list when Firestore resolves with data', async () => {
      // Arrange
      const habits = [
        makeHabit({ id: 'h1', title: 'Run' }),
        makeHabit({ id: 'h2', title: 'Read' }),
      ]
      firestoreMock.getHabits.mockResolvedValue(habits)

      // Act
      const { result } = renderHook(() => useHabits(MOCK_UID), { wrapper })

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toHaveLength(2)
      expect(result.current.data?.[0].id).toBe('h1')
      expect(result.current.data?.[1].id).toBe('h2')
    })

    it('calls getHabits with the correct uid', async () => {
      // Arrange
      firestoreMock.getHabits.mockResolvedValue([])

      // Act
      const { result } = renderHook(() => useHabits(MOCK_UID), { wrapper })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Assert
      expect(firestoreMock.getHabits).toHaveBeenCalledWith(MOCK_UID)
    })

    it('is disabled (not fetching) when uid is null', () => {
      // Arrange & Act
      const { result } = renderHook(() => useHabits(null), { wrapper })

      // Assert — query is disabled, fetchStatus is 'idle'
      expect(result.current.fetchStatus).toBe('idle')
      expect(firestoreMock.getHabits).not.toHaveBeenCalled()
    })

    it('transitions to error state when getHabits rejects', async () => {
      // Arrange
      firestoreMock.getHabits.mockRejectedValue(new Error('Firestore unavailable'))

      // Act
      const { result } = renderHook(() => useHabits(MOCK_UID), { wrapper })

      // Assert
      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.data).toBeUndefined()
    })

    it('uses the correct query key structure for the uid', async () => {
      // Arrange
      firestoreMock.getHabits.mockResolvedValue([])

      // Act
      const { result } = renderHook(() => useHabits(MOCK_UID), { wrapper })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Assert — cache entry exists under habitKeys.all(uid)
      const cached = queryClient.getQueryData(habitKeys.all(MOCK_UID))
      expect(cached).toBeDefined()
    })
  })

  // ── useCreateHabit ─────────────────────────────────────────────────────────

  describe('useCreateHabit', () => {
    const validInput: CreateHabitInput = {
      title: 'Meditate',
      domain: 'mental',
      frequency: 'daily',
      statGains: { WIS: 1 },
    }

    it('calls createHabit with the correct uid, data, and count', async () => {
      // Arrange
      const newHabit = makeHabit({ id: 'new-h', title: 'Meditate' })
      firestoreMock.createHabit.mockResolvedValue(newHabit)

      const { result } = renderHook(() => useCreateHabit(), { wrapper })

      // Act
      await act(async () => {
        await result.current.mutateAsync({
          uid: MOCK_UID,
          data: validInput,
          currentCount: 2,
        })
      })

      // Assert
      expect(firestoreMock.createHabit).toHaveBeenCalledWith(MOCK_UID, validInput, 2)
    })

    it('resolves with the newly created habit', async () => {
      // Arrange
      const newHabit = makeHabit({ id: 'new-h', title: 'Meditate' })
      firestoreMock.createHabit.mockResolvedValue(newHabit)

      const { result } = renderHook(() => useCreateHabit(), { wrapper })

      // Act
      let created: Habit | undefined
      await act(async () => {
        created = await result.current.mutateAsync({
          uid: MOCK_UID,
          data: validInput,
          currentCount: 0,
        })
      })

      // Assert
      expect(created?.id).toBe('new-h')
      expect(created?.title).toBe('Meditate')
    })

    it('invalidates the habits query on success', async () => {
      // Arrange
      const newHabit = makeHabit({ id: 'new-h' })
      firestoreMock.createHabit.mockResolvedValue(newHabit)

      // Pre-seed cache so we can check it gets invalidated
      queryClient.setQueryData(habitKeys.all(MOCK_UID), [makeHabit()])

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
      const { result } = renderHook(() => useCreateHabit(), { wrapper })

      // Act
      await act(async () => {
        await result.current.mutateAsync({
          uid: MOCK_UID,
          data: validInput,
          currentCount: 1,
        })
      })

      // Assert
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: habitKeys.all(MOCK_UID) })
      )
    })

    it('propagates errors from createHabit', async () => {
      // Arrange
      firestoreMock.createHabit.mockRejectedValue(new Error('HABIT_LIMIT_REACHED'))
      const { result } = renderHook(() => useCreateHabit(), { wrapper })

      // Act & Assert
      await act(async () => {
        await expect(
          result.current.mutateAsync({
            uid: MOCK_UID,
            data: validInput,
            currentCount: 5,
          })
        ).rejects.toThrow('HABIT_LIMIT_REACHED')
      })
    })
  })

  // ── useToggleHabit ─────────────────────────────────────────────────────────

  describe('useToggleHabit', () => {
    it('calls toggleHabitCompletion with the correct arguments', async () => {
      // Arrange
      firestoreMock.toggleHabitCompletion.mockResolvedValue({ newStreak: 4, wasFreezed: false })

      const { result } = renderHook(() => useToggleHabit(), { wrapper })

      // Act
      await act(async () => {
        await result.current.mutateAsync({
          uid: MOCK_UID,
          habitId: 'habit-abc',
          statGains: { STR: 1 },
        })
      })

      // Assert
      expect(firestoreMock.toggleHabitCompletion).toHaveBeenCalledWith(
        MOCK_UID,
        'habit-abc',
        { STR: 1 }
      )
    })

    it('invalidates the habits query on success', async () => {
      // Arrange
      firestoreMock.toggleHabitCompletion.mockResolvedValue({ newStreak: 4, wasFreezed: false })
      queryClient.setQueryData(habitKeys.all(MOCK_UID), [makeHabit()])

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
      const { result } = renderHook(() => useToggleHabit(), { wrapper })

      // Act
      await act(async () => {
        await result.current.mutateAsync({
          uid: MOCK_UID,
          habitId: 'habit-abc',
          statGains: {},
        })
      })

      // Assert
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: habitKeys.all(MOCK_UID) })
      )
    })

    it('invalidates the user profile query on success', async () => {
      // Arrange
      firestoreMock.toggleHabitCompletion.mockResolvedValue({ newStreak: 2, wasFreezed: true })

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
      const { result } = renderHook(() => useToggleHabit(), { wrapper })

      // Act
      await act(async () => {
        await result.current.mutateAsync({
          uid: MOCK_UID,
          habitId: 'habit-abc',
          statGains: { STR: 1 },
        })
      })

      // Assert — profile query is also invalidated
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: habitKeys.profile(MOCK_UID) })
      )
    })

    it('resolves with the ToggleHabitResult from Firestore', async () => {
      // Arrange
      const expectedResult = { newStreak: 7, wasFreezed: false }
      firestoreMock.toggleHabitCompletion.mockResolvedValue(expectedResult)

      const { result } = renderHook(() => useToggleHabit(), { wrapper })

      // Act
      let toggleResult: { newStreak: number; wasFreezed: boolean } | undefined
      await act(async () => {
        toggleResult = await result.current.mutateAsync({
          uid: MOCK_UID,
          habitId: 'habit-abc',
          statGains: {},
        })
      })

      // Assert
      expect(toggleResult).toEqual(expectedResult)
    })

    it('propagates errors from toggleHabitCompletion', async () => {
      // Arrange
      firestoreMock.toggleHabitCompletion.mockRejectedValue(
        new Error('ALREADY_COMPLETED_TODAY')
      )
      const { result } = renderHook(() => useToggleHabit(), { wrapper })

      // Act & Assert
      await act(async () => {
        await expect(
          result.current.mutateAsync({
            uid: MOCK_UID,
            habitId: 'habit-abc',
            statGains: {},
          })
        ).rejects.toThrow('ALREADY_COMPLETED_TODAY')
      })
    })
  })

  // ── useDeleteHabit ─────────────────────────────────────────────────────────

  describe('useDeleteHabit', () => {
    it('calls deleteHabit with the correct uid and habitId', async () => {
      // Arrange
      firestoreMock.deleteHabit.mockResolvedValue(undefined)

      const { result } = renderHook(() => useDeleteHabit(), { wrapper })

      // Act
      await act(async () => {
        await result.current.mutateAsync({
          uid: MOCK_UID,
          habitId: 'habit-to-delete',
        })
      })

      // Assert
      expect(firestoreMock.deleteHabit).toHaveBeenCalledWith(MOCK_UID, 'habit-to-delete')
    })

    it('invalidates the habits query on success', async () => {
      // Arrange
      firestoreMock.deleteHabit.mockResolvedValue(undefined)
      queryClient.setQueryData(habitKeys.all(MOCK_UID), [makeHabit()])

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
      const { result } = renderHook(() => useDeleteHabit(), { wrapper })

      // Act
      await act(async () => {
        await result.current.mutateAsync({
          uid: MOCK_UID,
          habitId: 'habit-to-delete',
        })
      })

      // Assert
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: habitKeys.all(MOCK_UID) })
      )
    })

    it('resolves void (undefined) on successful deletion', async () => {
      // Arrange
      firestoreMock.deleteHabit.mockResolvedValue(undefined)
      const { result } = renderHook(() => useDeleteHabit(), { wrapper })

      // Act
      let deleteResult: unknown = 'sentinel'
      await act(async () => {
        deleteResult = await result.current.mutateAsync({
          uid: MOCK_UID,
          habitId: 'habit-x',
        })
      })

      // Assert
      expect(deleteResult).toBeUndefined()
    })

    it('propagates errors from deleteHabit', async () => {
      // Arrange
      firestoreMock.deleteHabit.mockRejectedValue(new Error('Permission denied'))
      const { result } = renderHook(() => useDeleteHabit(), { wrapper })

      // Act & Assert
      await act(async () => {
        await expect(
          result.current.mutateAsync({
            uid: MOCK_UID,
            habitId: 'habit-x',
          })
        ).rejects.toThrow('Permission denied')
      })
    })

    it('does not invalidate the profile query (only habits query is invalidated)', async () => {
      // Arrange
      firestoreMock.deleteHabit.mockResolvedValue(undefined)
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries')
      const { result } = renderHook(() => useDeleteHabit(), { wrapper })

      // Act
      await act(async () => {
        await result.current.mutateAsync({ uid: MOCK_UID, habitId: 'habit-x' })
      })

      // Assert — profile key should NOT appear in any invalidate call
      const profileKey = habitKeys.profile(MOCK_UID)
      const calledWithProfile = invalidateSpy.mock.calls.some(
        ([arg]) =>
          arg !== null &&
          typeof arg === 'object' &&
          'queryKey' in (arg as object) &&
          JSON.stringify((arg as { queryKey: unknown }).queryKey) ===
            JSON.stringify(profileKey)
      )
      expect(calledWithProfile).toBe(false)
    })
  })

  // ── habitKeys factory ──────────────────────────────────────────────────────

  describe('habitKeys', () => {
    it('habitKeys.all returns ["habits", uid]', () => {
      expect(habitKeys.all(MOCK_UID)).toEqual(['habits', MOCK_UID])
    })

    it('habitKeys.profile returns ["userProfile", uid]', () => {
      expect(habitKeys.profile(MOCK_UID)).toEqual(['userProfile', MOCK_UID])
    })
  })
})
