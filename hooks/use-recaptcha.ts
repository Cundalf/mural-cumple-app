import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface UseRecaptchaOptions {
  siteKey?: string;
  action: string;
  threshold?: number;
}

interface UseRecaptchaReturn {
  executeRecaptcha: () => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

export function useRecaptcha({ 
  siteKey, 
  action, 
  threshold = 0.5 
}: UseRecaptchaOptions): UseRecaptchaReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scriptLoaded = useRef(false);

  // Cargar el script de reCAPTCHA
  useEffect(() => {
    if (typeof window === 'undefined' || scriptLoaded.current) return;

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      scriptLoaded.current = true;
    };

    script.onerror = () => {
      setError('Error al cargar reCAPTCHA');
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [siteKey]);

  const executeRecaptcha = useCallback(async (): Promise<string | null> => {
    if (!siteKey && !process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      setError('Clave de sitio de reCAPTCHA no configurada');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      return new Promise((resolve, reject) => {
        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(
              siteKey || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
              { action }
            );
            resolve(token);
          } catch (err) {
            setError('Error al ejecutar reCAPTCHA');
            reject(err);
          } finally {
            setIsLoading(false);
          }
        });
      });
    } catch (err) {
      setIsLoading(false);
      setError('Error al ejecutar reCAPTCHA');
      return null;
    }
  }, [siteKey, action]);

  return {
    executeRecaptcha,
    isLoading,
    error
  };
}

// Hook helper para hacer requests con reCAPTCHA
export function useRecaptchaRequest() {
  const makeRequest = useCallback(async <T>(
    url: string,
    options: {
      method?: string;
      body?: any;
      action: string;
      siteKey?: string;
      threshold?: number;
    }
  ): Promise<T> => {
    const { executeRecaptcha } = useRecaptcha({
      siteKey: options.siteKey,
      action: options.action,
      threshold: options.threshold
    });

    const token = await executeRecaptcha();
    
    if (!token) {
      throw new Error('No se pudo obtener token de reCAPTCHA');
    }

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
  }, []);

  return { makeRequest };
} 