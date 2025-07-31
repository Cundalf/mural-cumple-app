'use client';

import { useState, useEffect } from 'react';

interface RecaptchaFallbackProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  timeout?: number;
}

export function RecaptchaFallback({ 
  children, 
  fallback, 
  timeout = 10000 
}: RecaptchaFallbackProps) {
  const [showFallback, setShowFallback] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoaded) {
        setShowFallback(true);
      }
    }, timeout);

    const checkGrecaptcha = () => {
      if (window.grecaptcha) {
        setIsLoaded(true);
        clearTimeout(timer);
      } else {
        setTimeout(checkGrecaptcha, 100);
      }
    };

    checkGrecaptcha();

    return () => clearTimeout(timer);
  }, [timeout, isLoaded]);

  if (showFallback && !isLoaded) {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
          <p className="text-yellow-800 text-sm">
            {fallback || 'reCAPTCHA no se pudo cargar. Algunas funciones pueden estar limitadas.'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 