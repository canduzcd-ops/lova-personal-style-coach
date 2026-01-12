export type OnboardingStep = 'add-item' | 'analyze' | 'generate';

export type OnboardingState = {
  seen: boolean;
  completedSteps: OnboardingStep[];
};

const KEY = 'lova_onboarding_checklist';
const STEP_SET: OnboardingStep[] = ['add-item', 'analyze', 'generate'];
const defaultState: OnboardingState = { seen: false, completedSteps: [] };

function safeParse(): OnboardingState {
  if (typeof window === 'undefined' || !('localStorage' in window)) return defaultState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    const completed = Array.isArray(parsed?.completedSteps)
      ? parsed.completedSteps.filter((s: any): s is OnboardingStep => STEP_SET.includes(s))
      : [];
    return {
      seen: Boolean(parsed?.seen),
      completedSteps: completed,
    };
  } catch {
    return defaultState;
  }
}

function save(state: OnboardingState): void {
  if (typeof window === 'undefined' || !('localStorage' in window)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota/availability issues
  }
}

export function getState(): OnboardingState {
  return safeParse();
}

export function markSeen(): OnboardingState {
  const current = safeParse();
  const next = { ...current, seen: true };
  save(next);
  return next;
}

export function markStepCompleted(step: OnboardingStep): OnboardingState {
  const current = safeParse();
  if (current.completedSteps.includes(step)) {
    return current;
  }
  const next: OnboardingState = { ...current, completedSteps: [...current.completedSteps, step] };
  save(next);
  return next;
}

export function reset(): void {
  save(defaultState);
}
