export type ScreenType = 'splash' | 'language' | 'role' | 'farmer-login' | 'buyer-login' | 'farmer-dashboard' | 'buyer-dashboard';

export type LanguageCode = 'ta' | 'en' | 'te' | 'ml' | 'kn' | 'hi';

export interface LanguageOption {
  code: LanguageCode;
  nativeName: string;
  englishName: string;
  bgGradient: string;
  shadowColor: string;
}
