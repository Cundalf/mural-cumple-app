interface RecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
}

export class RecaptchaError extends Error {
  constructor(message: string, public score?: number) {
    super(message);
    this.name = 'RecaptchaError';
  }
}

export async function verifyRecaptcha(token: string, action: string): Promise<number> {
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    throw new Error('RECAPTCHA_SECRET_KEY no está configurada');
  }

  if (!token) {
    throw new RecaptchaError('Token de reCAPTCHA requerido');
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en la verificación de reCAPTCHA: ${response.status}`);
    }

    const data: RecaptchaResponse = await response.json();

    if (!data.success) {
      const errorCodes = data['error-codes'] || [];
      console.error('reCAPTCHA verification failed:', errorCodes);
      throw new RecaptchaError('Verificación de reCAPTCHA fallida', 0);
    }

    // Verificar que la acción coincida (opcional pero recomendado)
    if (data.action !== action) {
      console.warn(`reCAPTCHA action mismatch: expected ${action}, got ${data.action}`);
    }

    return data.score;
  } catch (error) {
    if (error instanceof RecaptchaError) {
      throw error;
    }
    console.error('Error al verificar reCAPTCHA:', error);
    throw new RecaptchaError('Error interno al verificar reCAPTCHA');
  }
}

export function validateRecaptchaScore(score: number, threshold: number = 0.5): boolean {
  return score >= threshold;
}

// Función helper para extraer el token del header o body
export function extractRecaptchaToken(request: Request): string | null {
  // Intentar obtener del header Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Intentar obtener del header X-Recaptcha-Token
  const recaptchaHeader = request.headers.get('x-recaptcha-token');
  if (recaptchaHeader) {
    return recaptchaHeader;
  }

  return null;
} 