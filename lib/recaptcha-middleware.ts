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

  // Verificar si reCAPTCHA está configurado
  const isRecaptchaConfigured = !!process.env.RECAPTCHA_SECRET_KEY;

  if (!isRecaptchaConfigured) {
    console.warn('reCAPTCHA no está configurado. Continuando sin validación.');
    return await handler(request);
  }

  try {
    // Extraer token de reCAPTCHA
    const token = extractRecaptchaToken(request);
    
    if (!token && required) {
      return NextResponse.json(
        { error: 'Token de reCAPTCHA requerido' },
        { status: 400 }
      );
    }

    if (token) {
      // Verificar reCAPTCHA
      const score = await verifyRecaptcha(token, action);
      
      if (!validateRecaptchaScore(score, threshold)) {
        return NextResponse.json(
          { 
            error: 'Actividad sospechosa detectada',
            recaptcha_score: score,
            threshold
          },
          { status: 429 }
        );
      }

      // Agregar el score a los headers para debugging (opcional)
      const response = await handler(request);
      response.headers.set('X-Recaptcha-Score', score.toString());
      return response;
    }

    // Si no es requerido y no hay token, continuar sin validación
    return await handler(request);

  } catch (error) {
    if (error instanceof RecaptchaError) {
      return NextResponse.json(
        { 
          error: error.message,
          recaptcha_score: error.score || 0
        },
        { status: 400 }
      );
    }

    console.error('Error en middleware de reCAPTCHA:', error);
    
    // En caso de error de configuración, permitir continuar sin reCAPTCHA
    if (error.message.includes('no está configurada')) {
      console.warn('reCAPTCHA no configurado, continuando sin validación');
      return await handler(request);
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 