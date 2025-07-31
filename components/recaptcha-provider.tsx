'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface RecaptchaContextType {
  siteKey: string | null;
  isLoaded: boolean;
  execute: (action: string) => Promise<string>;
}

const RecaptchaContext = createContext<RecaptchaContextType | null>(null);

interface RecaptchaProviderProps {
  children: React.ReactNode;
  siteKey?: string;
}

export function RecaptchaProvider({ children, siteKey }: RecaptchaProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [grecaptcha, setGrecaptcha] = useState<any>(null);

  useEffect(() => {
    const key = siteKey || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    
    if (!key || typeof window === 'undefined') return;

    // Verificar si ya está cargado
    if (window.grecaptcha) {
      setGrecaptcha(window.grecaptcha);
      setIsLoaded(true);
      return;
    }

    // Verificar si el script ya existe
    const existingScript = document.querySelector('script[src*="recaptcha/api.js"]');
    if (existingScript) {
      // Si el script ya existe, esperar a que se cargue
      const checkGrecaptcha = () => {
        if (window.grecaptcha) {
          setGrecaptcha(window.grecaptcha);
          setIsLoaded(true);
        } else {
          setTimeout(checkGrecaptcha, 100);
        }
      };
      checkGrecaptcha();
      return;
    }

    // Cargar el script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${key}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.grecaptcha) {
        setGrecaptcha(window.grecaptcha);
        setIsLoaded(true);
      }
    };

    script.onerror = () => {
      console.error('Error al cargar reCAPTCHA. Verifica tu CSP y conexión a internet.');
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [siteKey]);

  const execute = async (action: string): Promise<string> => {
    // Verificar si el bypass está habilitado
    const bypassEnabled = process.env.NEXT_PUBLIC_RECAPTCHA_BYPASS === 'true';
    if (bypassEnabled) {
      console.warn('⚠️  RECAPTCHA_BYPASS habilitado. Retornando token simulado.');
      return 'bypass-token-' + Date.now();
    }

    if (!grecaptcha || !isLoaded) {
      throw new Error('reCAPTCHA no está cargado');
    }

    return new Promise((resolve, reject) => {
      grecaptcha.ready(async () => {
        try {
          const token = await grecaptcha.execute(
            siteKey || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
            { action }
          );
          resolve(token);
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  return (
    <RecaptchaContext.Provider value={{
      siteKey: siteKey || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || null,
      isLoaded,
      execute
    }}>
      {children}
    </RecaptchaContext.Provider>
  );
}

export function useRecaptcha() {
  const context = useContext(RecaptchaContext);
  if (!context) {
    throw new Error('useRecaptcha debe usarse dentro de RecaptchaProvider');
  }
  return context;
}

// Hook helper para hacer requests con reCAPTCHA
export function useRecaptchaRequest() {
  const { execute, isLoaded } = useRecaptcha();

  const makeRequest = async <T>(
    url: string,
    options: {
      method?: string;
      body?: any;
      action: string;
    }
  ): Promise<T> => {
    if (!isLoaded) {
      throw new Error('reCAPTCHA no está cargado');
    }

    const token = await execute(options.action);

    const response = await fetch(url, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Recaptcha-Token': token
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  return { makeRequest, isLoaded };
} 