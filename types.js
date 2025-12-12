export const SUBSCRIPTION_PLANS = {
    monthly: {
        id: 'monthly',
        price: 59.99,
        period: 'Aylık',
        label: 'Esnek Plan'
    },
    yearly: {
        id: 'yearly',
        price: 499.99,
        period: 'Yıllık',
        label: 'En Popüler',
        discount: '%30 İndirim'
    }
};
export const FREE_LIMITS = {
    MAX_WARDROBE_ITEMS: 20, // Deprecated in favor of trialUsage logic, but kept for type safety
    DAILY_AI_SCANS: 3
};
