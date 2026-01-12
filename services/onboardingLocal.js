const KEY = 'lova_onboarding_checklist';
const STEP_SET = ['add-item', 'analyze', 'generate'];
const defaultState = { seen: false, completedSteps: [] };
function safeParse() {
    if (typeof window === 'undefined' || !('localStorage' in window))
        return defaultState;
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw)
            return defaultState;
        const parsed = JSON.parse(raw);
        const completed = Array.isArray(parsed?.completedSteps)
            ? parsed.completedSteps.filter((s) => STEP_SET.includes(s))
            : [];
        return {
            seen: Boolean(parsed?.seen),
            completedSteps: completed,
        };
    }
    catch {
        return defaultState;
    }
}
function save(state) {
    if (typeof window === 'undefined' || !('localStorage' in window))
        return;
    try {
        localStorage.setItem(KEY, JSON.stringify(state));
    }
    catch {
        // ignore storage quota/availability issues
    }
}
export function getState() {
    return safeParse();
}
export function markSeen() {
    const current = safeParse();
    const next = { ...current, seen: true };
    save(next);
    return next;
}
export function markStepCompleted(step) {
    const current = safeParse();
    if (current.completedSteps.includes(step)) {
        return current;
    }
    const next = { ...current, completedSteps: [...current.completedSteps, step] };
    save(next);
    return next;
}
export function reset() {
    save(defaultState);
}
