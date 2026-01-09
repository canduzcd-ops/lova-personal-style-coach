import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import tr from './tr.json';
const STORAGE_KEY = 'lova_lang';
const getInitialLanguage = () => {
    if (typeof window === 'undefined')
        return 'tr';
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'en' || saved === 'tr')
            return saved;
    }
    catch {
        /* ignore */
    }
    return 'tr';
};
i18n.use(initReactI18next).init({
    resources: {
        tr: { translation: tr },
        en: { translation: en },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'tr',
    // Dil kodlarını temiz tut
    supportedLngs: ['tr', 'en'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: {
        escapeValue: false,
    },
    react: {
        useSuspense: false,
    },
    // Key ekrana düşmesin
    returnNull: false,
    returnEmptyString: false,
    parseMissingKeyHandler: () => '',
});
export const setAppLanguage = async (lng) => {
    if (i18n.language?.startsWith(lng))
        return;
    await i18n.changeLanguage(lng);
    try {
        localStorage.setItem(STORAGE_KEY, lng);
        document.documentElement.lang = lng;
    }
    catch {
        /* ignore */
    }
};
export default i18n;
