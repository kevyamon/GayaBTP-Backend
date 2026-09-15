import crypto from 'crypto';
import { env } from '../config/env.config';
import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';

export interface CreatePaymentSessionParams {
  reference: string;
  amountFCFA: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description: string;
  customData?: Record<string, unknown>;
}

export interface PaymentSessionResult {
  checkoutUrl: string;
  transactionReference: string;
  providerReference?: string;
}

export interface GeniusPayWebhookPayload {
  event: 'payment.success' | 'payment.failed';
  data: {
    reference: string;
    transaction_id: string;
    amount: number;
    currency: string;
    status: 'successful' | 'failed';
    customer: {
      email?: string;
      phone?: string;
      name?: string;
    };
    paid_at?: string;
    custom_data?: Record<string, unknown>;
  };
}

class GeniusPayService {
  private readonly baseUrl = env.GENIUS_PAY_BASE_URL;
  private readonly apiKey = env.GENIUS_PAY_API_KEY;
  private readonly webhookSecret = env.GENIUS_PAY_WEBHOOK_SECRET;

  async createPaymentSession(params: CreatePaymentSessionParams): Promise<PaymentSessionResult> {
    const callbackUrl = `${env.FRONTEND_URL}/dashboard/abonnement/success?ref=${params.reference}`;
    const cancelUrl = `${env.FRONTEND_URL}/dashboard/abonnement/cancel?ref=${params.reference}`;
    const webhookUrl = `${env.NODE_ENV === 'production' ? 'https://api.gayabtp.ci' : 'http://localhost:5000'}/api/v1/payments/webhook/geniuspay`;

    // Si les clés Genius Pay ne sont pas encore configurées en environnement de dev/test
    if (!this.apiKey) {
      logger.warn(
        'GENIUS_PAY',
        `Clé API Genius Pay non configurée. Génération d'une URL de paiement de simulation pour ${params.reference}.`
      );
      return {
        checkoutUrl: `${env.FRONTEND_URL}/payment/simulation?reference=${params.reference}&amount=${params.amountFCFA}`,
        transactionReference: params.reference,
        providerReference: `SIMU-${Date.now()}`,
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          reference: params.reference,
          amount: params.amountFCFA,
          currency: 'XOF',
          description: params.description,
          customer_name: params.customerName,
          customer_email: params.customerEmail,
          customer_phone: params.customerPhone || '',
          callback_url: callbackUrl,
          cancel_url: cancelUrl,
          webhook_url: webhookUrl,
          metadata: params.customData || {},
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error('GENIUS_PAY', `Échec d'initialisation Genius Pay: ${response.status} - ${errorBody}`);
        throw AppError.badRequest('Impossible d initialiser la passerelle de paiement. Veuillez reessayer.');
      }

      const data = (await response.json()) as {
        success: boolean;
        data?: { checkout_url: string; id?: string };
      };

      if (!data.data?.checkout_url) {
        throw AppError.internal('Réponse invalide de la passerelle de paiement.');
      }

      return {
        checkoutUrl: data.data.checkout_url,
        transactionReference: params.reference,
        providerReference: data.data.id,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('GENIUS_PAY', 'Erreur réseau passerelle Genius Pay', error);
      throw AppError.internal('Erreur de communication avec la passerelle de paiement.');
    }
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.webhookSecret) {
      // En mode développement si le secret n'est pas encore défini
      if (env.NODE_ENV !== 'production') return true;
      return false;
    }

    try {
      const computedHash = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(rawBody)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(computedHash, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch (error) {
      logger.error('GENIUS_PAY', 'Erreur lors de la validation HMAC de la signature webhook', error);
      return false;
    }
  }
}

export const geniusPayService = new GeniusPayService();
