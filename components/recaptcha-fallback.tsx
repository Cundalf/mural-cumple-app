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
    console.log('🔍 [RECAPTCHA FALLBACK DEBUG] Iniciando fallback timer');
    console.log('🔍 [RECAPTCHA FALLBACK DEBUG] timeout:', timeout);
    console.log('🔍 [RECAPTCHA FALLBACK DEBUG] isLoaded inicial:', isLoaded);
    
    const timer = setTimeout(() => {
      console.log('⏰ [RECAPTCHA FALLBACK DEBUG] Timer expirado, isLoaded:', isLoaded);
      if (!isLoaded) {
        console.log('⚠️ [RECAPTCHA FALLBACK DEBUG] Mostrando fallback - reCAPTCHA no cargado');
        setShowFallback(true);
      }
    }, timeout);

    const checkGrecaptcha = () => {
      console.log('🔍 [RECAPTCHA FALLBACK DEBUG] Verificando grecaptcha...');
      if (window.grecaptcha) {
        console.log('✅ [RECAPTCHA FALLBACK DEBUG] grecaptcha encontrado, cancelando timer');
        setIsLoaded(true);
        clearTimeout(timer);
      } else {
        console.log('⏳ [RECAPTCHA FALLBACK DEBUG] grecaptcha no disponible, reintentando...');
        setTimeout(checkGrecaptcha, 100);
      }
    };

    checkGrecaptcha();

    return () => {
      console.log('🧹 [RECAPTCHA FALLBACK DEBUG] Limpiando timer');
      clearTimeout(timer);
    };
  }, [timeout, isLoaded]);

  console.log('🔍 [RECAPTCHA FALLBACK DEBUG] Renderizando - showFallback:', showFallback, 'isLoaded:', isLoaded);
  
  if (showFallback && !isLoaded) {
    console.log('⚠️ [RECAPTCHA FALLBACK DEBUG] Mostrando mensaje de fallback');
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