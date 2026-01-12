import React from 'react';
import { render, screen } from '@testing-library/react';
import { PremiumScreen } from '../screens/PremiumScreen';
import { PremiumProvider } from '../contexts/PremiumContext';
import { Capacitor } from '@capacitor/core';
import { vi } from 'vitest';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

vi.mock('../services/iapService', () => ({
  iapService: {
    init: vi.fn(async () => {}),
    getPlans: vi.fn(async () => [{ id: 'monthly', price: { price: '₺1' } }, { id: 'yearly', price: { price: '₺10' } }]),
    purchase: vi.fn(),
    openManageSubscriptions: vi.fn(),
  },
}));

vi.mock('../contexts/PremiumContext', () => ({
  usePremium: () => ({
    isPremium: false,
    plan: null,
    refresh: vi.fn(async () => ({ isPremium: false })),
    setPlan: vi.fn(),
    clear: vi.fn(),
  }),
  PremiumProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockUser = {
  id: 'u1',
  email: 'a@b.com',
  name: 'Test',
  styles: [],
  joinedAt: '',
  isPremium: false,
  usage: { wardrobeCount: 0, dailyScanCount: 0, lastScanDate: '' },
  trialUsage: { wardrobeAccessUsed: false, combinationsCount: 0 },
  theme: 'light',
};

describe('PremiumScreen (web)', () => {
  it('renders without crashing on web', async () => {
    render(
      <PremiumProvider>
        <PremiumScreen user={mockUser as any} onClose={() => {}} onSuccess={() => {}} />
      </PremiumProvider>
    );

    expect(await screen.findByRole('heading', { name: /Stilini Keşfet/i })).toBeInTheDocument();
    expect(Capacitor.isNativePlatform).toHaveBeenCalled();
  });
});
