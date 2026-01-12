import { describe, it, expect, vi, beforeEach } from 'vitest';

const addMock = vi.fn();
const whereMock = vi.fn();
const orderByMock = vi.fn();
const limitMock = vi.fn();
const getMock = vi.fn();
const docMock = vi.fn();
const updateMock = vi.fn();
const docGetMock = vi.fn();

vi.mock('../services/firebaseClient', () => ({
  db: {
    collection: vi.fn(() => ({
      add: addMock,
      where: whereMock,
      doc: docMock,
    })),
  },
}));

vi.mock('firebase/compat/app', () => ({
  __esModule: true,
  default: {
    firestore: {
      FieldValue: {
        serverTimestamp: () => 'ts',
      },
    },
  },
}));

// Bring in the service after mocks
import { outfitHistoryService } from '../services/outfitHistoryService';

const makeSnapshot = (docs: Array<{ id: string; data: any }>) => ({
  forEach: (cb: (doc: any) => void) => docs.forEach((d) => cb({ id: d.id, data: () => d.data })),
});

beforeEach(() => {
  vi.clearAllMocks();

  orderByMock.mockReturnThis();
  limitMock.mockReturnThis();
  whereMock.mockReturnValue({ orderBy: orderByMock, limit: limitMock, get: getMock });

  docMock.mockImplementation((id: string) => ({ get: docGetMock, update: updateMock }));
});

describe('outfitHistoryService', () => {
  it('addOutfit sends correct payload', async () => {
    addMock.mockResolvedValue({ id: 'new-id' });

    const payload = { outfit: { title: 'Look' }, weather: { temp: 20 }, source: 'ai', liked: true };
    await outfitHistoryService.addOutfit('user-1', payload);

    expect(addMock).toHaveBeenCalledTimes(1);
    const arg = addMock.mock.calls[0][0];
    expect(arg.userId).toBe('user-1');
    expect(arg.outfit).toEqual(payload.outfit);
    expect(arg.weather).toEqual(payload.weather);
    expect(arg.source).toBe('ai');
    expect(arg.liked).toBe(true);
    expect(arg.createdAt).toBe('ts');
  });

  it('listOutfits maps snapshot to domain shape', async () => {
    getMock.mockResolvedValue(
      makeSnapshot([
        {
          id: 'doc-1',
          data: {
            userId: 'user-1',
            outfit: { title: 'Look' },
            weather: null,
            source: 'ai',
            liked: null,
            isFavorite: false,
            collectionTag: null,
            createdAt: { toDate: () => new Date('2024-01-01T00:00:00Z') },
            feedbackAt: null,
          },
        },
      ])
    );

    const res = await outfitHistoryService.listOutfits('user-1', 50);
    expect(whereMock).toHaveBeenCalledWith('userId', '==', 'user-1');
    expect(orderByMock).toHaveBeenCalledWith('createdAt', 'desc');
    expect(limitMock).toHaveBeenCalledWith(50);

    expect(res).toEqual([
      {
        id: 'doc-1',
        userId: 'user-1',
        outfit: { title: 'Look' },
        weather: undefined,
        source: 'ai',
        liked: null,
        isFavorite: false,
        collectionTag: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        feedbackAt: null,
      },
    ]);
  });

  it('setFeedback updates liked flag with ownership checks mocked', async () => {
    docGetMock.mockResolvedValue({ exists: true, data: () => ({ userId: 'user-1' }) });

    await outfitHistoryService.setFeedback('doc-1', 'user-1', false);

    expect(docMock).toHaveBeenCalledWith('doc-1');
    expect(updateMock).toHaveBeenCalledWith({ liked: false, feedbackAt: 'ts' });
  });
});
