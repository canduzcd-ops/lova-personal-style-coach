import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OutfitHistoryScreen } from '../screens/OutfitHistoryScreen';
// Mock the outfitHistoryService - preserving named exports
vi.mock('../services/outfitHistoryService', async () => {
    return {
        outfitHistoryService: {
            listOutfits: vi.fn(() => Promise.resolve([])),
            setFeedback: vi.fn(() => Promise.resolve(undefined)),
        },
    };
});
const mockUser = {
    id: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    styles: ['minimal'],
    joinedAt: '2024-01-01',
    isPremium: false,
    isGuest: false,
    theme: 'light',
    usage: { wardrobeCount: 0, dailyScanCount: 0, lastScanDate: '' },
    trialUsage: { wardrobeAccessUsed: false, combinationsCount: 0 },
};
describe('OutfitHistoryScreen', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('renders empty state with 2 CTAs when no outfits', async () => {
        render(_jsx(OutfitHistoryScreen, { user: mockUser, onClose: () => { }, onGenerateOutfit: () => { }, onOpenWardrobe: () => { } }));
        // Check for empty state heading
        expect(await screen.findByText('Henüz kayıt yok')).toBeInTheDocument();
        // Check for footer CTA buttons (✨ and 👕)
        expect(await screen.findByRole('button', { name: /✨ Kombin Üret/i })).toBeInTheDocument();
        expect(await screen.findByRole('button', { name: /👕 Dolabına Parça Ekle/i })).toBeInTheDocument();
    });
    it('calls onGenerateOutfit when "Kombin Üret" button is clicked', async () => {
        const mockGenerateOutfit = vi.fn();
        render(_jsx(OutfitHistoryScreen, { user: mockUser, onClose: () => { }, onGenerateOutfit: mockGenerateOutfit, onOpenWardrobe: () => { } }));
        const generateButton = await screen.findByRole('button', { name: /✨ Kombin Üret/i });
        await generateButton.click();
        expect(mockGenerateOutfit).toHaveBeenCalled();
    });
    it('calls onOpenWardrobe when "Dolabına Parça Ekle" button is clicked', async () => {
        const mockOpenWardrobe = vi.fn();
        render(_jsx(OutfitHistoryScreen, { user: mockUser, onClose: () => { }, onGenerateOutfit: () => { }, onOpenWardrobe: mockOpenWardrobe }));
        const wardrobeButton = await screen.findByRole('button', { name: /👕 Dolabına Parça Ekle/i });
        await wardrobeButton.click();
        expect(mockOpenWardrobe).toHaveBeenCalled();
    });
});
