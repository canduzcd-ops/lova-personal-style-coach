/**
 * Soft Wall Management for Free Tier
 * Tracks weekly bonus combo usage to provide users with additional breathing room
 */

const BONUS_STORAGE_KEY = 'lova_weekly_bonus_v1';
const BONUS_RESET_DAYS = 7;

export interface WeeklyBonus {
  used: boolean;
  lastResetDate: string; // ISO date string
}

/**
 * Get current weekly bonus state
 * Auto-resets if 7+ days have passed
 */
export const getWeeklyBonus = (): WeeklyBonus => {
  try {
    const stored = localStorage.getItem(BONUS_STORAGE_KEY);
    if (!stored) {
      return { used: false, lastResetDate: new Date().toISOString().split('T')[0] };
    }

    const bonus = JSON.parse(stored) as WeeklyBonus;
    const today = new Date();
    const lastReset = new Date(bonus.lastResetDate);
    const daysSinceReset = Math.floor((today.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

    // Auto-reset if 7+ days passed
    if (daysSinceReset >= BONUS_RESET_DAYS) {
      return { used: false, lastResetDate: today.toISOString().split('T')[0] };
    }

    return bonus;
  } catch (e) {
    console.warn('Error reading weekly bonus:', e);
    return { used: false, lastResetDate: new Date().toISOString().split('T')[0] };
  }
};

/**
 * Mark weekly bonus as used
 */
export const markBonusUsed = (): void => {
  try {
    const bonus: WeeklyBonus = {
      used: true,
      lastResetDate: new Date().toISOString().split('T')[0],
    };
    localStorage.setItem(BONUS_STORAGE_KEY, JSON.stringify(bonus));
  } catch (e) {
    console.warn('Error marking bonus used:', e);
  }
};

/**
 * Get days until bonus resets
 */
export const getDaysUntilBonusReset = (): number => {
  const bonus = getWeeklyBonus();
  const today = new Date();
  const lastReset = new Date(bonus.lastResetDate);
  const daysSinceReset = Math.floor((today.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, BONUS_RESET_DAYS - daysSinceReset);
};

/**
 * Check if user can generate (soft wall logic)
 * Returns: { canGenerate, reason }
 */
export const checkGenerateLimit = (
  isPremium: boolean,
  combinationsCount: number
): { canGenerate: boolean; showOverlay: boolean; reason?: string } => {
  if (isPremium) {
    return { canGenerate: true, showOverlay: false };
  }

  const bonus = getWeeklyBonus();

  // 0-1 combos: No limit
  if (combinationsCount < 2) {
    return { canGenerate: true, showOverlay: false };
  }

  // 2 combos: Show overlay, offer bonus
  if (combinationsCount === 2) {
    if (!bonus.used) {
      return { canGenerate: true, showOverlay: true, reason: 'bonus_available' };
    } else {
      return { canGenerate: true, showOverlay: true, reason: 'bonus_used' };
    }
  }

  // 3+ combos: Hard block
  return { canGenerate: false, showOverlay: true, reason: 'limit_reached' };
};
