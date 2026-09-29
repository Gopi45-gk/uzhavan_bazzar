import { Translations } from '../translations/types';

export function getLocalizedErrorMessage(
  error: any,
  t: (key: keyof Translations, defaultText?: string) => string
): string {
  if (!error) return '';

  const msg = typeof error === 'string' ? error : (error.code || error.message || '');
  const lower = msg.toLowerCase();

  if (
    lower.includes('auth/invalid-credential') ||
    lower.includes('invalid-credential') ||
    lower.includes('invalid credentials') ||
    lower.includes('invalid mobile number or password')
  ) {
    return t('errorInvalidCredentials');
  }

  if (lower.includes('auth/user-not-found') || lower.includes('user not found')) {
    return t('errorUserNotFound');
  }

  if (
    lower.includes('auth/wrong-password') ||
    lower.includes('wrong-password') ||
    lower.includes('incorrect password')
  ) {
    return t('errorInvalidCredentials');
  }

  if (
    lower.includes('auth/email-already-in-use') ||
    lower.includes('already exists') ||
    lower.includes('account with this mobile')
  ) {
    return t('errorEmailInUse');
  }

  if (
    lower.includes('auth/weak-password') ||
    lower.includes('weak-password') ||
    lower.includes('at least 4 characters') ||
    lower.includes('at least 6 characters')
  ) {
    return t('errorWeakPassword');
  }

  if (
    lower.includes('network') ||
    lower.includes('network-request-failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('offline')
  ) {
    return t('errorNetwork');
  }

  if (lower.includes('photo') && lower.includes('required')) {
    return t('errorPhotoRequired');
  }

  if (lower.includes('required')) {
    return t('errorRequiredField');
  }

  // If specific message already looks human-readable without raw codes:
  if (typeof error === 'string' && !error.includes('auth/') && !error.includes('Firebase:')) {
    return error;
  }

  return t('errorGenericSave');
}
