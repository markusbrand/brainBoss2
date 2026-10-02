import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Language, translations } from '../i18n/translations';

export type UnitSystem = 'metric' | 'imperial';
export type LocalizationMode = 'auto' | 'manual';

export interface StoredLocalization {
  mode: LocalizationMode;
  language?: Language;
  unitSystem?: UnitSystem;
}

export interface LanguageContextType {
  language: Language;
  unitSystem: UnitSystem;
  localizationMode: LocalizationMode;
  detectedBrowserLanguage: Language;
  detectedBrowserUnitSystem: UnitSystem;
  browserLocale: string;
  setLanguage: (lang: Language) => void;
  setUnitSystem: (units: UnitSystem) => void;
  setAutodetect: () => void;
  setManualConfig: (config: { language?: Language; unitSystem?: UnitSystem }) => void;
  t: typeof translations.de;
  isGerman: boolean;
  isEnglish: boolean;
  // Unit formatting helpers
  formatDistance: (meters: number) => string;
  formatWeight: (grams: number) => string;
  formatTemperature: (celsius: number) => string;
  formatVolume: (milliliters: number) => string;
  unitLabels: {
    distance: string;
    weight: string;
    temperature: string;
    volume: string;
  };
}

const LOCALIZATION_STORAGE_KEY = 'brainboss_localization_v2';
const LEGACY_LANGUAGE_STORAGE_KEY = 'brainboss_language_v1';

/**
 * Detects browser language and measurement system automatically.
 * - Language: German for de, de-DE, de-AT, de-CH, etc.; English for all others.
 * - Units: Imperial for en-US / US timezone regions; Metric for Europe and the rest of the world.
 */
export const detectBrowserSettings = (): {
  language: Language;
  unitSystem: UnitSystem;
  rawLocale: string;
} => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { language: 'de', unitSystem: 'metric', rawLocale: 'de-DE' };
  }

  const rawLocale =
    (navigator.languages && navigator.languages[0]) ||
    navigator.language ||
    'de-DE';

  const lower = rawLocale.toLowerCase();

  // Detect language: Starts with 'de' -> German, otherwise English
  const language: Language = lower.startsWith('de') ? 'de' : 'en';

  // Detect unit system: US is primarily Imperial; Europe / world is Metric
  const isEnUS =
    lower === 'en-us' ||
    (navigator.languages && navigator.languages.some((l) => l.toLowerCase() === 'en-us'));

  let isUSZone = false;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    isUSZone =
      tz.startsWith('America/New_York') ||
      tz.startsWith('America/Chicago') ||
      tz.startsWith('America/Denver') ||
      tz.startsWith('America/Los_Angeles') ||
      tz.startsWith('America/Phoenix') ||
      tz.startsWith('America/Anchorage') ||
      tz.startsWith('America/Honolulu') ||
      tz.startsWith('America/Detroit') ||
      tz.startsWith('America/Indiana');
  } catch {}

  const unitSystem: UnitSystem = isEnUS || isUSZone ? 'imperial' : 'metric';

  return { language, unitSystem, rawLocale };
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial browser detection
  const [browserInfo, setBrowserInfo] = useState(() => detectBrowserSettings());

  // 2. Load stored preference (auto vs manual)
  const [localizationState, setLocalizationState] = useState<{
    mode: LocalizationMode;
    manualLanguage?: Language;
    manualUnitSystem?: UnitSystem;
  }>(() => {
    try {
      const saved = localStorage.getItem(LOCALIZATION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as StoredLocalization;
        if (parsed.mode === 'manual') {
          return {
            mode: 'manual',
            manualLanguage: parsed.language || 'de',
            manualUnitSystem: parsed.unitSystem || 'metric',
          };
        }
      }

      // Check legacy single-key migration
      const legacyLang = localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
      if (legacyLang === 'en' || legacyLang === 'de') {
        return {
          mode: 'manual',
          manualLanguage: legacyLang,
          manualUnitSystem: 'metric',
        };
      }
    } catch (err) {
      console.warn('Localization load notice:', err);
    }

    // Default to AUTO-DETECT from browser
    return {
      mode: 'auto',
    };
  });

  // Effective language and unit system based on mode
  const effectiveLanguage: Language =
    localizationState.mode === 'manual' && localizationState.manualLanguage
      ? localizationState.manualLanguage
      : browserInfo.language;

  const effectiveUnitSystem: UnitSystem =
    localizationState.mode === 'manual' && localizationState.manualUnitSystem
      ? localizationState.manualUnitSystem
      : browserInfo.unitSystem;

  // Listen to browser language changes dynamically
  useEffect(() => {
    const handleLanguageChange = () => {
      const fresh = detectBrowserSettings();
      setBrowserInfo(fresh);
    };

    window.addEventListener('languagechange', handleLanguageChange);
    return () => {
      window.removeEventListener('languagechange', handleLanguageChange);
    };
  }, []);

  // Save manual language
  const setLanguage = useCallback((lang: Language) => {
    setLocalizationState((prev) => {
      const nextUnits = prev.manualUnitSystem || effectiveUnitSystem;
      const next = {
        mode: 'manual' as const,
        manualLanguage: lang,
        manualUnitSystem: nextUnits,
      };
      try {
        localStorage.setItem(
          LOCALIZATION_STORAGE_KEY,
          JSON.stringify({ mode: 'manual', language: lang, unitSystem: nextUnits })
        );
      } catch (e) {
        console.error('Failed to save localization:', e);
      }
      return next;
    });
  }, [effectiveUnitSystem]);

  // Save manual unit system
  const setUnitSystem = useCallback((units: UnitSystem) => {
    setLocalizationState((prev) => {
      const nextLang = prev.manualLanguage || effectiveLanguage;
      const next = {
        mode: 'manual' as const,
        manualLanguage: nextLang,
        manualUnitSystem: units,
      };
      try {
        localStorage.setItem(
          LOCALIZATION_STORAGE_KEY,
          JSON.stringify({ mode: 'manual', language: nextLang, unitSystem: units })
        );
      } catch (e) {
        console.error('Failed to save localization:', e);
      }
      return next;
    });
  }, [effectiveLanguage]);

  // Switch back to browser autodetect
  const setAutodetect = useCallback(() => {
    const fresh = detectBrowserSettings();
    setBrowserInfo(fresh);
    setLocalizationState({
      mode: 'auto',
    });
    try {
      localStorage.setItem(
        LOCALIZATION_STORAGE_KEY,
        JSON.stringify({ mode: 'auto' })
      );
    } catch (e) {
      console.error('Failed to reset localization to auto:', e);
    }
  }, []);

  const setManualConfig = useCallback(
    (cfg: { language?: Language; unitSystem?: UnitSystem }) => {
      const nextLang = cfg.language || effectiveLanguage;
      const nextUnits = cfg.unitSystem || effectiveUnitSystem;
      setLocalizationState({
        mode: 'manual',
        manualLanguage: nextLang,
        manualUnitSystem: nextUnits,
      });
      try {
        localStorage.setItem(
          LOCALIZATION_STORAGE_KEY,
          JSON.stringify({ mode: 'manual', language: nextLang, unitSystem: nextUnits })
        );
      } catch (e) {
        console.error('Failed to save manual localization:', e);
      }
    },
    [effectiveLanguage, effectiveUnitSystem]
  );

  // Unit formatting helpers
  const formatDistance = useCallback(
    (meters: number): string => {
      const locale = effectiveLanguage === 'de' ? 'de-DE' : 'en-US';
      if (effectiveUnitSystem === 'imperial') {
        const feet = meters * 3.28084;
        if (feet >= 1000) {
          const miles = meters * 0.000621371;
          return `${miles.toLocaleString(locale, { maximumFractionDigits: 1 })} mi`;
        }
        return `${Math.round(feet).toLocaleString(locale)} ft`;
      } else {
        if (meters >= 1000) {
          const km = meters / 1000;
          return `${km.toLocaleString(locale, { maximumFractionDigits: 1 })} km`;
        }
        return `${Math.round(meters).toLocaleString(locale)} m`;
      }
    },
    [effectiveLanguage, effectiveUnitSystem]
  );

  const formatWeight = useCallback(
    (grams: number): string => {
      const locale = effectiveLanguage === 'de' ? 'de-DE' : 'en-US';
      if (effectiveUnitSystem === 'imperial') {
        const lbs = grams * 0.00220462;
        if (lbs >= 1) {
          return `${lbs.toLocaleString(locale, { maximumFractionDigits: 1 })} lb`;
        }
        const oz = grams * 0.035274;
        return `${Math.round(oz).toLocaleString(locale)} oz`;
      } else {
        if (grams >= 1000) {
          const kg = grams / 1000;
          return `${kg.toLocaleString(locale, { maximumFractionDigits: 1 })} kg`;
        }
        return `${Math.round(grams).toLocaleString(locale)} g`;
      }
    },
    [effectiveLanguage, effectiveUnitSystem]
  );

  const formatTemperature = useCallback(
    (celsius: number): string => {
      if (effectiveUnitSystem === 'imperial') {
        const fahrenheit = Math.round((celsius * 9) / 5 + 32);
        return `${fahrenheit} °F`;
      }
      return `${Math.round(celsius)} °C`;
    },
    [effectiveUnitSystem]
  );

  const formatVolume = useCallback(
    (milliliters: number): string => {
      const locale = effectiveLanguage === 'de' ? 'de-DE' : 'en-US';
      if (effectiveUnitSystem === 'imperial') {
        const gallons = milliliters * 0.000264172;
        if (gallons >= 1) {
          return `${gallons.toLocaleString(locale, { maximumFractionDigits: 1 })} gal`;
        }
        const flOz = milliliters * 0.033814;
        return `${Math.round(flOz).toLocaleString(locale)} fl oz`;
      } else {
        if (milliliters >= 1000) {
          const l = milliliters / 1000;
          return `${l.toLocaleString(locale, { maximumFractionDigits: 1 })} l`;
        }
        return `${Math.round(milliliters).toLocaleString(locale)} ml`;
      }
    },
    [effectiveLanguage, effectiveUnitSystem]
  );

  const unitLabels = useMemo(() => {
    return {
      distance: effectiveUnitSystem === 'imperial' ? 'ft / mi' : 'm / km',
      weight: effectiveUnitSystem === 'imperial' ? 'oz / lb' : 'g / kg',
      temperature: effectiveUnitSystem === 'imperial' ? '°F' : '°C',
      volume: effectiveUnitSystem === 'imperial' ? 'fl oz / gal' : 'ml / l',
    };
  }, [effectiveUnitSystem]);

  const t = translations[effectiveLanguage] || translations.de;

  const value: LanguageContextType = {
    language: effectiveLanguage,
    unitSystem: effectiveUnitSystem,
    localizationMode: localizationState.mode,
    detectedBrowserLanguage: browserInfo.language,
    detectedBrowserUnitSystem: browserInfo.unitSystem,
    browserLocale: browserInfo.rawLocale,
    setLanguage,
    setUnitSystem,
    setAutodetect,
    setManualConfig,
    t,
    isGerman: effectiveLanguage === 'de',
    isEnglish: effectiveLanguage === 'en',
    formatDistance,
    formatWeight,
    formatTemperature,
    formatVolume,
    unitLabels,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
