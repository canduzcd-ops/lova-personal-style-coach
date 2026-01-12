import { describe, it, expect, vi, beforeEach } from 'vitest';
import { upsertToken, disableToken, getDocId } from '../services/pushTokenService';
import { auth, db } from '../services/firebaseClient';
import { track, captureError } from '../services/telemetry';
// Create mock serverTimestamp before mocking firebase
const mockServerTimestamp = {};
// Mock firebase separately
vi.mock('firebase/compat/app', () => ({
    default: {
        firestore: {
            FieldValue: {
                serverTimestamp: () => mockServerTimestamp,
            },
        },
    },
}));
// Mock dependencies
vi.mock('../services/firebaseClient', () => ({
    auth: {
        currentUser: null,
    },
    db: {
        collection: vi.fn(),
    },
}));
vi.mock('../services/telemetry', () => ({
    track: vi.fn(),
    captureError: vi.fn(),
}));
describe('pushTokenService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('getDocId', () => {
        it('should generate deterministic doc ID from uid and platform', () => {
            const uid = 'user123';
            const docId = getDocId(uid, 'ios');
            expect(docId).toBe('user123_ios');
        });
        it('should generate different IDs for different platforms', () => {
            const uid = 'user123';
            const iosId = getDocId(uid, 'ios');
            const androidId = getDocId(uid, 'android');
            expect(iosId).not.toBe(androidId);
            expect(androidId).toBe('user123_android');
        });
    });
    describe('upsertToken', () => {
        it('should throw error for invalid platform', async () => {
            await expect(upsertToken({ token: 'test_token', platform: 'web' })).rejects.toThrow('Invalid platform: web');
        });
        it('should silently return if currentUser is null', async () => {
            auth.currentUser = null;
            const mockCollection = vi.fn();
            db.collection = mockCollection;
            await upsertToken({ token: 'test_token', platform: 'ios' });
            expect(mockCollection).not.toHaveBeenCalled();
        });
        it('should upsert token with merge on new write', async () => {
            const userId = 'user123';
            auth.currentUser = { uid: userId };
            const mockSet = vi.fn().mockResolvedValue(undefined);
            const mockDoc = vi.fn().mockReturnValue({
                set: mockSet,
                get: vi.fn().mockResolvedValue({ exists: false }),
            });
            const mockCollection = vi.fn().mockReturnValue({
                doc: mockDoc,
            });
            db.collection = mockCollection;
            await upsertToken({ token: 'abc123token', platform: 'ios', deviceId: 'device456' });
            expect(mockCollection).toHaveBeenCalledWith('pushTokens');
            expect(mockDoc).toHaveBeenCalledWith('user123_ios');
            expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
                userId,
                token: 'abc123token',
                platform: 'ios',
                deviceId: 'device456',
                isEnabled: true,
                createdAt: expect.any(Object), // serverTimestamp
            }), { merge: true });
            expect(track).toHaveBeenCalledWith('push_token_upsert_success', {
                platform: 'ios',
                isNewToken: true,
            });
        });
        it('should upsert token without createdAt on existing write', async () => {
            const userId = 'user123';
            auth.currentUser = { uid: userId };
            const mockSet = vi.fn().mockResolvedValue(undefined);
            const mockDoc = vi.fn().mockReturnValue({
                set: mockSet,
                get: vi.fn().mockResolvedValue({ exists: true }),
            });
            const mockCollection = vi.fn().mockReturnValue({
                doc: mockDoc,
            });
            db.collection = mockCollection;
            await upsertToken({ token: 'new_token123', platform: 'android' });
            const callArgs = mockSet.mock.calls[0][0];
            expect(callArgs).toHaveProperty('userId', userId);
            expect(callArgs).toHaveProperty('token', 'new_token123');
            expect(callArgs).toHaveProperty('platform', 'android');
            expect(callArgs).not.toHaveProperty('createdAt');
            expect(track).toHaveBeenCalledWith('push_token_upsert_success', {
                platform: 'android',
                isNewToken: false,
            });
        });
        it('should handle upsert errors gracefully', async () => {
            const userId = 'user123';
            auth.currentUser = { uid: userId };
            const mockError = new Error('Firestore write failed');
            const mockSet = vi.fn().mockRejectedValue(mockError);
            const mockDoc = vi.fn().mockReturnValue({
                set: mockSet,
                get: vi.fn().mockResolvedValue({ exists: false }),
            });
            const mockCollection = vi.fn().mockReturnValue({
                doc: mockDoc,
            });
            db.collection = mockCollection;
            await expect(upsertToken({ token: 'bad_token', platform: 'ios' })).rejects.toThrow('Firestore write failed');
            expect(captureError).toHaveBeenCalledWith('push_token_upsert_failed', {
                error: mockError,
            });
            expect(track).toHaveBeenCalledWith('push_token_upsert_failed', {
                platform: 'ios',
                reason: 'Error: Firestore write failed',
            });
        });
        it('should set deviceId as null if not provided', async () => {
            const userId = 'user123';
            auth.currentUser = { uid: userId };
            const mockSet = vi.fn().mockResolvedValue(undefined);
            const mockDoc = vi.fn().mockReturnValue({
                set: mockSet,
                get: vi.fn().mockResolvedValue({ exists: false }),
            });
            const mockCollection = vi.fn().mockReturnValue({
                doc: mockDoc,
            });
            db.collection = mockCollection;
            await upsertToken({ token: 'token123', platform: 'ios' });
            const callArgs = mockSet.mock.calls[0][0];
            expect(callArgs.deviceId).toBeNull();
        });
    });
    describe('disableToken', () => {
        it('should throw error for invalid platform', async () => {
            await expect(disableToken({ platform: 'web' })).rejects.toThrow('Invalid platform: web');
        });
        it('should silently return if currentUser is null', async () => {
            auth.currentUser = null;
            const mockCollection = vi.fn();
            db.collection = mockCollection;
            await disableToken({ platform: 'ios' });
            expect(mockCollection).not.toHaveBeenCalled();
        });
        it('should silently return if token doc does not exist', async () => {
            const userId = 'user123';
            auth.currentUser = { uid: userId };
            const mockUpdate = vi.fn();
            const mockDoc = vi.fn().mockReturnValue({
                update: mockUpdate,
                get: vi.fn().mockResolvedValue({ exists: false }),
            });
            const mockCollection = vi.fn().mockReturnValue({
                doc: mockDoc,
            });
            db.collection = mockCollection;
            await disableToken({ platform: 'ios' });
            expect(mockUpdate).not.toHaveBeenCalled();
            expect(track).not.toHaveBeenCalledWith('push_token_disable_success', expect.anything());
        });
        it('should update token to disabled when doc exists', async () => {
            const userId = 'user123';
            auth.currentUser = { uid: userId };
            const mockUpdate = vi.fn().mockResolvedValue(undefined);
            const mockDoc = vi.fn().mockReturnValue({
                update: mockUpdate,
                get: vi.fn().mockResolvedValue({ exists: true }),
            });
            const mockCollection = vi.fn().mockReturnValue({
                doc: mockDoc,
            });
            db.collection = mockCollection;
            await disableToken({ platform: 'android' });
            expect(mockCollection).toHaveBeenCalledWith('pushTokens');
            expect(mockDoc).toHaveBeenCalledWith('user123_android');
            expect(mockUpdate).toHaveBeenCalledWith({
                isEnabled: false,
                updatedAt: expect.any(Object), // serverTimestamp
            });
            expect(track).toHaveBeenCalledWith('push_token_disable_success', {
                platform: 'android',
            });
        });
        it('should swallow errors on disable (for logout)', async () => {
            const userId = 'user123';
            auth.currentUser = { uid: userId };
            const mockError = new Error('Update failed');
            const mockUpdate = vi.fn().mockRejectedValue(mockError);
            const mockDoc = vi.fn().mockReturnValue({
                update: mockUpdate,
                get: vi.fn().mockResolvedValue({ exists: true }),
            });
            const mockCollection = vi.fn().mockReturnValue({
                doc: mockDoc,
            });
            db.collection = mockCollection;
            // Should not throw
            await expect(disableToken({ platform: 'ios' })).resolves.not.toThrow();
            expect(track).toHaveBeenCalledWith('push_token_disable_failed', {
                platform: 'ios',
                reason: 'Error: Update failed',
            });
        });
    });
});
