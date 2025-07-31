import { NextRequest, NextResponse } from 'next/server';
import { verifyRecaptcha, validateRecaptchaScore, extractRecaptchaToken, RecaptchaError } from './recaptcha';

export interface RecaptchaOptions {
  action: string;
  threshold?: number;
  required?: boolean;
}

export async function withRecaptcha(
  request: NextRequest,
  options: RecaptchaOptions,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const { action, threshold = 0.5, required = true } = options;
  
  console.log('🔍 [RECAPTCHA MIDDLEWARE] Iniciando validación');
  console.log('🔍 [RECAPTCHA MIDDLEWARE] Action:', action);
  console.log('🔍 [RECAPTCHA MIDDLEWARE] Threshold:', threshold);

  // Verificar si el bypass está habilitado
  const bypassEnabled = process.env.RECAPTCHA_BYPASS === 'true';
  console.log('🔍 [RECAPTCHA MIDDLEWARE] Bypass habilitado:', bypassEnabled);
  
  if (bypassEnabled) {
    console.warn('⚠️ [RECAPTCHA MIDDLEWARE] RECAPTCHA_BYPASS habilitado. reCAPTCHA deshabilitado para esta petición.');
    return await handler(request);
  }

  // Verificar si reCAPTCHA está configurado
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const isRecaptchaConfigured = !!secretKey;
  
  console.log('🔍 [RECAPTCHA MIDDLEWARE] Secret key configurada:', !!secretKey);
  console.log('🔍 [RECAPTCHA MIDDLEWARE] Secret key primeros 6 chars:', secretKey?.substring(0, 6));

  if (!isRecaptchaConfigured) {
    console.warn('⚠️ [RECAPTCHA MIDDLEWARE] reCAPTCHA no está configurado. Continuando sin validación.');
    return await handler(request);
  }

  try {
    // Extraer token de reCAPTCHA
    console.log('🔍 [RECAPTCHA MIDDLEWARE] Extrayendo token...');
    const token = extractRecaptchaToken(request);
    console.log('🔍 [RECAPTCHA MIDDLEWARE] Token extraído:', !!token);
    console.log('🔍 [RECAPTCHA MIDDLEWARE] Token primeros 20 chars:', token?.substring(0, 20));
    
    if (!token && required) {
      console.error('❌ [RECAPTCHA MIDDLEWARE] Token requerido pero no encontrado');
      return NextResponse.json(
        { error: 'Token de reCAPTCHA requerido' },
        { status: 400 }
      );
    }

    if (token) {
      console.log('🔄 [RECAPTCHA MIDDLEWARE] Verificando reCAPTCHA...');
      
      // Verificar reCAPTCHA
      const score = await verifyRecaptcha(token, action);
      console.log('✅ [RECAPTCHA MIDDLEWARE] Score obtenido:', score);
      
      if (!validateRecaptchaScore(score, threshold)) {
        console.error('❌ [RECAPTCHA MIDDLEWARE] Score insuficiente:', score, 'vs threshold:', threshold);
        return NextResponse.json(
          { 
            error: 'Actividad sospechosa detectada',
            recaptcha_score: score,
            threshold
          },
          { status: 429 }
        );
      }

      console.log('✅ [RECAPTCHA MIDDLEWARE] Validación exitosa, ejecutando handler...');
      
      // Agregar el score a los headers para debugging (opcional)
      const response = await handler(request);
      response.headers.set('X-Recaptcha-Score', score.toString());
      console.log('✅ [RECAPTCHA MIDDLEWARE] Handler ejecutado exitosamente');
      return response;
    }

    // Si no es requerido y no hay token, continuar sin validación
    console.log('ℹ️ [RECAPTCHA MIDDLEWARE] No hay token pero no es requerido, continuando...');
    return await handler(request);

  } catch (error) {
    console.error('❌ [RECAPTCHA MIDDLEWARE] Error capturado:', error);
    
    if (error instanceof RecaptchaError) {
      console.error('❌ [RECAPTCHA MIDDLEWARE] Error de reCAPTCHA:', error.message);
      return NextResponse.json(
        { 
          error: error.message,
          recaptcha_score: error.score || 0
        },
        { status: 400 }
      );
    }

    console.error('❌ [RECAPTCHA MIDDLEWARE] Error inesperado:', error);
    
    // En caso de error de configuración, permitir continuar sin reCAPTCHA
    if (error instanceof Error && error.message.includes('no está configurada')) {
      console.warn('⚠️ [RECAPTCHA MIDDLEWARE] reCAPTCHA no configurado, continuando sin validación');
      return await handler(request);
    }
    
    console.error('❌ [RECAPTCHA MIDDLEWARE] Error fatal, retornando 500');
    return NextResponse.json(
      { error: 'Error interno del servidor en middleware reCAPTCHA' },
      { status: 500 }
    );
  }
}