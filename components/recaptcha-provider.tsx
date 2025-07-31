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
    
    console.log('🔍 [RECAPTCHA DEBUG] Iniciando useEffect');
    console.log('🔍 [RECAPTCHA DEBUG] siteKey:', siteKey);
    console.log('🔍 [RECAPTCHA DEBUG] process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY:', process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
    console.log('🔍 [RECAPTCHA DEBUG] key final:', key);
    console.log('🔍 [RECAPTCHA DEBUG] typeof window:', typeof window);
    
    if (!key) {
      console.error('❌ [RECAPTCHA DEBUG] No hay clave de sitio configurada');
      return;
    }
    
    if (typeof window === 'undefined') {
      console.log('ℹ️ [RECAPTCHA DEBUG] Ejecutando en servidor, saltando carga');
      return;
    }

    // Verificar si ya está cargado
    console.log('🔍 [RECAPTCHA DEBUG] Verificando si grecaptcha ya existe');
    console.log('🔍 [RECAPTCHA DEBUG] window.grecaptcha:', !!window.grecaptcha);
    
    if (window.grecaptcha) {
      console.log('✅ [RECAPTCHA DEBUG] grecaptcha ya está disponible');
      setGrecaptcha(window.grecaptcha);
      setIsLoaded(true);
      return;
    }

    // Verificar si el script ya existe
    console.log('🔍 [RECAPTCHA DEBUG] Verificando si el script ya existe');
    const existingScript = document.querySelector('script[src*="recaptcha/api.js"]');
    console.log('🔍 [RECAPTCHA DEBUG] existingScript:', !!existingScript);
    
    if (existingScript) {
      console.log('📜 [RECAPTCHA DEBUG] Script ya existe, esperando carga...');
      // Si el script ya existe, esperar a que se cargue
      const checkGrecaptcha = () => {
        console.log('🔍 [RECAPTCHA DEBUG] Verificando grecaptcha desde script existente...');
        if (window.grecaptcha) {
          console.log('✅ [RECAPTCHA DEBUG] grecaptcha cargado desde script existente');
          setGrecaptcha(window.grecaptcha);
          setIsLoaded(true);
        } else {
          console.log('⏳ [RECAPTCHA DEBUG] grecaptcha aún no disponible, reintentando...');
          setTimeout(checkGrecaptcha, 100);
        }
      };
      checkGrecaptcha();
      return;
    }

    // Cargar el script
    console.log('📜 [RECAPTCHA DEBUG] Creando nuevo script de reCAPTCHA');
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${key}`;
    script.async = true;
    script.defer = true;
    
    console.log('📜 [RECAPTCHA DEBUG] URL del script:', script.src);

    script.onload = () => {
      console.log('📜 [RECAPTCHA DEBUG] Script cargado exitosamente');
      console.log('🔍 [RECAPTCHA DEBUG] window.grecaptcha después de onload:', !!window.grecaptcha);
      
      if (window.grecaptcha) {
        console.log('✅ [RECAPTCHA DEBUG] grecaptcha disponible después de cargar script');
        setGrecaptcha(window.grecaptcha);
        setIsLoaded(true);
      } else {
        console.error('❌ [RECAPTCHA DEBUG] window.grecaptcha no disponible después de cargar script');
      }
    };

    script.onerror = (error) => {
      console.error('❌ [RECAPTCHA DEBUG] Error al cargar script de reCAPTCHA:', error);
      console.error('❌ [RECAPTCHA DEBUG] Posibles causas: CSP, red, dominio no autorizado');
    };

    console.log('📜 [RECAPTCHA DEBUG] Agregando script al DOM...');
    document.head.appendChild(script);
    console.log('📜 [RECAPTCHA DEBUG] Script agregado al DOM');

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [siteKey]);

  const execute = async (action: string): Promise<string> => {
    console.log('🚀 [RECAPTCHA DEBUG] Ejecutando reCAPTCHA para acción:', action);
    
    // Verificar si el bypass está habilitado
    const bypassEnabled = process.env.NEXT_PUBLIC_RECAPTCHA_BYPASS === 'true';
    console.log('🔍 [RECAPTCHA DEBUG] Bypass habilitado:', bypassEnabled);
    
    if (bypassEnabled) {
      console.warn('⚠️ [RECAPTCHA DEBUG] RECAPTCHA_BYPASS habilitado. Retornando token simulado.');
      return 'bypass-token-' + Date.now();
    }

    console.log('🔍 [RECAPTCHA DEBUG] grecaptcha disponible:', !!grecaptcha);
    console.log('🔍 [RECAPTCHA DEBUG] isLoaded:', isLoaded);
    
    if (!grecaptcha || !isLoaded) {
      console.error('❌ [RECAPTCHA DEBUG] reCAPTCHA no está cargado para ejecutar');
      throw new Error('reCAPTCHA no está cargado');
    }

    return new Promise((resolve, reject) => {
      console.log('🔄 [RECAPTCHA DEBUG] Llamando grecaptcha.ready()...');
      grecaptcha.ready(async () => {
        console.log('✅ [RECAPTCHA DEBUG] grecaptcha.ready() completado');
        try {
          const finalSiteKey = siteKey || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;
          console.log('🔑 [RECAPTCHA DEBUG] Usando site key:', finalSiteKey?.substring(0, 10) + '...');
          console.log('🎯 [RECAPTCHA DEBUG] Ejecutando grecaptcha.execute()...');
          
          const token = await grecaptcha.execute(finalSiteKey, { action });
          console.log('✅ [RECAPTCHA DEBUG] Token obtenido exitosamente:', token?.substring(0, 20) + '...');
          resolve(token);
        } catch (error) {
          console.error('❌ [RECAPTCHA DEBUG] Error al ejecutar grecaptcha:', error);
          reject(error);
        }
      });
    });
  };

  console.log('🔍 [RECAPTCHA DEBUG] Renderizando provider - isLoaded:', isLoaded);
  
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

  const makeRequest = function<T>(
    url: string,
    options: {
      method?: string;
      body?: any;
      action: string;
    }
  ): Promise<T> {
    if (!isLoaded) {
      return Promise.reject(new Error('reCAPTCHA no está cargado'));
    }

    return execute(options.action).then(token => {
      return fetch(url, {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Recaptcha-Token': token
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      }).then(response => {
        if (!response.ok) {
          return response.json().then(errorData => {
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          });
        }
        return response.json();
      });
    });
  };

  return { makeRequest, isLoaded };
} 