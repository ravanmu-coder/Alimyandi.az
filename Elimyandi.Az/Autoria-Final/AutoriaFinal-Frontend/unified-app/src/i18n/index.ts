import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// i18next konfiqurasiyası
i18n
  // HttpBackend plaginini əlavə et - tərcümə fayllarını dinamik yükləmək üçün
  .use(Backend)
  // LanguageDetector plaginini əlavə et - dili avtomatik təyin etmək üçün
  .use(LanguageDetector)
  // React inteqrasiyası üçün plagin
  .use(initReactI18next)
  .init({
    // Dəstəklənən dillər
    supportedLngs: ['az', 'en'],
    
    // Standart dil (tərcümə tapılmadıqda istifadə olunacaq)
    fallbackLng: 'az',
    
    // Debug rejimi (development zamanı)
    debug: process.env.NODE_ENV === 'development',
    
    // Tərcümə fayllarının yolu
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    
    // Dil təyin etmə konfiqurasiyası
    detection: {
      // Dil təyin etmə üsulları (sıra ilə)
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // localStorage-də saxlanılan dil açarı
      lookupLocalStorage: 'language',
      
      // localStorage-də dil saxlanılsın
      caches: ['localStorage'],
      
      // Brauzer dilini avtomatik təyin et
      checkWhitelist: true,
    },
    
    // React spesifik konfiqurasiya
    react: {
      // Suspense istifadə et
      useSuspense: true,
    },
    
    // Interpolation konfiqurasiyası
    interpolation: {
      // React-də HTML escape etmə
      escapeValue: false,
    },
    
    // Namespace konfiqurasiyası
    ns: ['translation'],
    defaultNS: 'translation',
  });

export default i18n;
