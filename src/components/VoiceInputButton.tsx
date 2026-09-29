import React, { useState, useRef, useEffect } from 'react';
import { Mic } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { normalizePhoneNumber } from '../hooks/useVoiceInput';

interface VoiceInputButtonProps {
  id?: string;
  onTranscript: (text: string) => void;
  isNumeric?: boolean;
  className?: string;
  title?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  id,
  onTranscript,
  isNumeric = false,
  className = '',
  title = 'Voice input',
}) => {
  const { speechLocale, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(t('voiceNotSupported', 'Voice recognition is not supported in this browser.'));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLocale || 'ta-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript || '';
        if (transcript) {
          let processed = transcript.trim();
          if (isNumeric) {
            processed = normalizePhoneNumber(processed);
          }
          onTranscript(processed);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition note:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage(t('permissionDenied', 'Microphone permission denied.'));
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Could not start speech recognition:', err);
      setIsListening(false);
    }
  };

  return (
    <button
      id={id}
      type="button"
      onClick={handleClick}
      title={isListening ? t('listening', 'Listening... Speak now') : title}
      className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
        isListening
          ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-500 animate-pulse'
          : 'text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100'
      } ${className}`}
    >
      <Mic className={`w-4 h-4 ${isListening ? 'text-rose-600 stroke-[2.5]' : ''}`} />
    </button>
  );
};
