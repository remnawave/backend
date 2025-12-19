const LANGUAGES_LIST = {
    en: { name: 'English', nativeName: 'English', emoji: '🇬🇧' },
    ru: { name: 'Russian', nativeName: 'Русский', emoji: '🇷🇺' },
    zh: { name: 'Chinese', nativeName: '中文', emoji: '🇨🇳' },
    fr: { name: 'French', nativeName: 'Français', emoji: '🇫🇷' },
    fa: { name: 'Persian', nativeName: 'فارسی', emoji: '🇮🇷' },
    uz: { name: 'Uzbek', nativeName: 'Ўзбек', emoji: '🇺🇿' },
    de: { name: 'German', nativeName: 'Deutsch', emoji: '🇩🇪' },
    hi: { name: 'Hindi', nativeName: 'हिन्दी', emoji: '🇮🇳' },
    tr: { name: 'Turkish', nativeName: 'Türkçe', emoji: '🇹🇷' },
    az: { name: 'Azerbaijani', nativeName: 'azərbaycan dili', emoji: '🇦🇿' },
    es: { name: 'Spanish', nativeName: 'Español', emoji: '🇪🇸' },
    vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt', emoji: '🇻🇳' },
    ja: { name: 'Japanese', nativeName: '日本語', emoji: '🇯🇵' },
    be: { name: 'Belarusian', nativeName: 'беларуская мова', emoji: '🇧🇾' },
    uk: { name: 'Ukrainian', nativeName: 'Українська', emoji: '🇺🇦' },
    pt: { name: 'Portuguese', nativeName: 'Português', emoji: '🇵🇹' },
    pl: { name: 'Polish', nativeName: 'Polski', emoji: '🇵🇱' },
    id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia', emoji: '🇮🇩' },
    tk: { name: 'Turkmen', nativeName: 'Türkmençe', emoji: '🇹🇲' },
    th: { name: 'Thai', nativeName: 'ไทย', emoji: '🇹🇭' },
} as const;

export type TSubscriptionPageLanguageCode = keyof typeof LANGUAGES_LIST;

export const LANGUAGE_CODES = Object.keys(LANGUAGES_LIST) as [
    TSubscriptionPageLanguageCode,
    ...TSubscriptionPageLanguageCode[],
];

export interface ILanguageInfo {
    name: string;
    nativeName: string;
    emoji: string;
}

/**
 * Get language info by code
 * @param code - ISO 639-1 language code
 * @returns Language info object with name and nativeName
 */
export const getLanguageInfo = (code: string): ILanguageInfo | null => {
    if (isLanguageCode(code)) {
        return LANGUAGES_LIST[code];
    }
    return null;
};

/**
 * Get language name (English) by code
 * @param code - ISO 639-1 language code
 * @returns English language name or the code itself if not found
 */

export const getLanguageName = (code: string): string => {
    if (isLanguageCode(code)) {
        return LANGUAGES_LIST[code].name;
    }
    return code;
};

/**
 * Get native language name by code
 * @param code - ISO 639-1 language code
 * @returns Native language name or the code itself if not found
 */
export const getLanguageNativeName = (code: string): string => {
    if (isLanguageCode(code)) {
        return LANGUAGES_LIST[code].nativeName;
    }
    return code;
};

/**
 * Check if a string is a valid language code
 */
export const isLanguageCode = (code: string): code is TSubscriptionPageLanguageCode => {
    return code in LANGUAGES_LIST;
};

/**
 * Get all languages as array for UI selects
 */
export const getLanguagesArray = (): Array<
    { code: TSubscriptionPageLanguageCode } & ILanguageInfo
> => {
    return (Object.entries(LANGUAGES_LIST) as [TSubscriptionPageLanguageCode, ILanguageInfo][]).map(
        ([code, info]) => ({
            code,
            ...info,
        }),
    );
};
