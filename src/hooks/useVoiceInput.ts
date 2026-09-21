import { useState, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

export type VoiceFieldType = 'name' | 'phone' | 'location' | 'cropType' | 'landArea' | 'soilType' | 'password' | 'confirmPassword' | 'general';

interface UseVoiceInputOptions {
  onTranscript?: (field: VoiceFieldType, text: string) => void;
}

// Multi-lingual digit conversion dictionary
const WORD_TO_DIGIT: Record<string, string> = {
  // English
  zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9',
  plus: '+', point: '.', dot: '.',
  // Tamil
  பூஜ்ஜியம்: '0', ஒன்று: '1', இரண்டு: '2', மூன்று: '3', நான்கு: '4', ஐந்து: '5', ஆறு: '6', ஏழு: '7', எட்டு: '8', ஒன்பது: '9',
  புள்ளி: '.',
  // Telugu
  సున్నా: '0', ఒకటి: '1', రెండు: '2', మూడు: '3', నాలుగు: '4', ఐదు: '5', ఆరు: '6', ఏడు: '7', ఎనిమిది: '8', తొమ్మిది: '9',
  బిందువు: '.',
  // Kannada
  ಸೊನ್ನೆ: '0', ಒಂದು: '1', ಎರಡು: '2', ಮೂರು: '3', ನಾಲ್ಕು: '4', ಐದು: '5', ಆರು: '6', ಏಳು: '7', ಎಂಟು: '8', ಒಂಬತ್ತು: '9',
  ಬಿಂದು: '.',
  // Malayalam
  പൂജ്യം: '0', ഒന്ന്: '1', രണ്ട്: '2', മൂന്ന്: '3', നാല്: '4', അഞ്ച്: '5', ആറ്: '6', ഏഴ്: '7', എട്ട്: '8', ഒമ്പത്: '9',
  പോയിന്റ്: '.',
  // Hindi
  शून्य: '0', एक: '1', दो: '2', तीन: '3', चार: '4', पांच: '5', छह: '6', सात: '7', आठ: '8', नौ: '9',
  दशमलव: '.', पॉइंट: '.',
};

export const normalizePhoneNumber = (raw: string): string => {
  let text = raw.toLowerCase().trim();
  for (const [w, d] of Object.entries(WORD_TO_DIGIT)) {
    text = text.replaceAll(w, d);
  }
  // Extract pure digits
  const cleanDigits = text.replace(/\D/g, '');
  if (cleanDigits.startsWith('91') && cleanDigits.length >= 12) {
    return '91+ ' + cleanDigits.slice(2, 12);
  } else if (cleanDigits.length >= 10) {
    return cleanDigits.slice(-10);
  }
  return cleanDigits;
};

export const normalizeLandArea = (raw: string): string => {
  let text = raw.toLowerCase().trim();
  for (const [w, d] of Object.entries(WORD_TO_DIGIT)) {
    text = text.replaceAll(w, d);
  }
  // Remove whitespace around decimal dots, e.g. "5 . 5" -> "5.5"
  text = text.replace(/\s*\.\s*/g, '.');
  // Match decimal or integer numbers e.g. "2.5" from "2.5 acres"
  const match = text.match(/\d+(\.\d+)?/);
  return match ? match[0] : raw.trim();
};

export const useVoiceInput = ({ onTranscript }: UseVoiceInputOptions = {}) => {
  const { speechLocale, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [activeField, setActiveField] = useState<VoiceFieldType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setActiveField(null);
  }, []);

  const startListening = useCallback(
    (field: VoiceFieldType) => {
      setError(null);

      // Check browser SpeechRecognition support
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError(t('voiceNotSupported', 'Voice recognition is not supported in this browser.'));
        return;
      }

      if (isListening) {
        stopListening();
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.lang = speechLocale;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setActiveField(field);
          setError(null);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0]?.[0]?.transcript || '';
          if (transcript) {
            let processed = transcript.trim();
            if (field === 'phone') {
              processed = normalizePhoneNumber(processed);
            } else if (field === 'landArea') {
              processed = normalizeLandArea(processed);
            }
            if (onTranscript) {
              onTranscript(field, processed);
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition event error:', event.error);
          setIsListening(false);
          setActiveField(null);
          if (event.error === 'not-allowed') {
            setError(t('permissionDenied', 'Microphone permission denied.'));
          } else if (event.error === 'no-speech') {
            setError(t('voiceError', 'Could not understand. Please try again.'));
          } else {
            setError(t('voiceError', 'Could not understand. Please try again.'));
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          setActiveField(null);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.error('Failed to initialize voice recognition:', err);
        setIsListening(false);
        setActiveField(null);
        setError(t('voiceError', 'Could not understand. Please try again.'));
      }
    },
    [speechLocale, isListening, onTranscript, stopListening, t]
  );

  return {
    isListening,
    activeField,
    error,
    startListening,
    stopListening,
    clearError: () => setError(null),
  };
};
