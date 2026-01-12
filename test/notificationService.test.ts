import { describe, it, expect, vi, beforeEach } from 'vitest';

const isNativePlatformMock = vi.fn();
const checkPermissionsMock = vi.fn();
const requestPermissionsMock = vi.fn();
const scheduleMock = vi.fn();
const getPendingMock = vi.fn();
const cancelMock = vi.fn();
const removeAllDeliveredNotificationsMock = vi.fn();

declare const Notification: any;

globalThis.Notification = {
  permission: 'default',
  requestPermission: vi.fn(),
} as any;

globalThis.localStorage = globalThis.localStorage || {
  getItem: () => null,
  setItem: () => undefined,
};

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: (...args: any[]) => isNativePlatformMock(...args),
  },
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: (...args: any[]) => checkPermissionsMock(...args),
    requestPermissions: (...args: any[]) => requestPermissionsMock(...args),
    schedule: (...args: any[]) => scheduleMock(...args),
    getPending: (...args: any[]) => getPendingMock(...args),
    cancel: (...args: any[]) => cancelMock(...args),
    removeAllDeliveredNotifications: (...args: any[]) => removeAllDeliveredNotificationsMock(...args),
  },
}));

import { isSupported, enable } from '../services/notificationService';

beforeEach(() => {
  vi.clearAllMocks();
  isNativePlatformMock.mockReturnValue(false);
});

describe('notificationService', () => {
  it('isSupported returns false on web', () => {
    expect(isSupported()).toBe(false);
  });

  it('enable does nothing when not native', async () => {
    await enable();

    expect(checkPermissionsMock).not.toHaveBeenCalled();
    expect(requestPermissionsMock).not.toHaveBeenCalled();
    expect(scheduleMock).not.toHaveBeenCalled();
  });
});
