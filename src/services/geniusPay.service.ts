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
  id: string;
  event: 'payment.initiated' | 'payment.success' | 'payment.failed' | 'payment.cancelled' | 'payment.expired';
  timestamp: number;
  created_at: string;
  data: {
    object: string;
    id: number;
    reference: string;
    amount: number;
    currency: string;
    fees?: number;
    net_amount?: number;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired';
    payment_method?: string;
    provider?: string;
    customer_name?: string;
    customer_phone?: string;
    merchant_id?: number;
    metadata?: {
      order_id?: string;
      user_id?: string;
      plan_id?: string;
      payment_id?: string;
      plan_slug?: string;
      [key: string]: unknown;
    };
  };
  environment: 'sandbox' | 'live';
  api_version?: string;
}

class GeniusPayService {
  private readonly baseUrl = 'https://geniuspay.ci/api/v1/merchant';
  private readonly apiKey = env.GENIUS_PAY_API_KEY;
  private readonly apiSecret = env.GENIUS_PAY_SECRET_KEY;
  private readonly webhookSecret = env.GENIUS_PAY_WEBHOOK_SECRET;

  async createPaymentSession(params: CreatePaymentSessionParams): Promise<PaymentSessionResult> {
    const successUrl = `${env.FRONTEND_URL}/dashboard/abonnement/success?ref=${params.reference}`;
    const errorUrl = `${env.FRONTEND_URL}/dashboard/abonnement/cancel?ref=${params.reference}`;

    // Si les clés Genius Pay ne sont pas encore renseignées en local
    if (!this.apiKey || !this.apiSecret) {
      logger.warn(
        'GENIUS_PAY',
        `Clés API Genius Pay non configurées. Mode simulation pour ${params.reference}.`
      );
      return {
        checkoutUrl: `${env.FRONTEND_URL}/payment/simulation?reference=${params.reference}&amount=${params.amountFCFA}`,
        transactionReference: params.reference,
        providerReference: `SIMU-${Date.now()}`,
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'X-API-Secret': this.apiSecret,
        },
        body: JSON.stringify({
          amount: params.amountFCFA,
          currency: 'XOF',
          description: params.description,
          customer: {
            name: params.customerName,
            email: params.customerEmail,
            phone: params.customerPhone || '',
          },
          success_url: successUrl,
          error_url: errorUrl,
          metadata: {
            order_id: params.reference,
            ...(params.customData || {}),
          },
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        data?: {
          id: number;
          reference: string;
          checkout_url: string;
          payment_url: string;
        };
        error?: { code: string; message: string };
      };

      if (!response.ok || !data.success || !data.data?.checkout_url) {
        const errorMsg = data.error?.message || `Status HTTP ${response.status}`;
        logger.error('GENIUS_PAY', `Échec d'initialisation Genius Pay: ${errorMsg}`);
        throw AppError.badRequest(`Échec de la passerelle de paiement : ${errorMsg}`);
      }

      return {
        checkoutUrl: data.data.checkout_url,
        transactionReference: params.reference,
        providerReference: data.data.reference,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('GENIUS_PAY', 'Erreur réseau passerelle Genius Pay', error);
      throw AppError.internal('Erreur de communication avec la passerelle Genius Pay.');
    }
  }

  verifyWebhookSignature(rawBody: string, signature: string, timestampHeader?: string): boolean {
    if (!this.webhookSecret) {
      if (env.NODE_ENV !== 'production') return true;
      return false;
    }

    try {
      if (!signature) return false;

      // Construction de la donnée à vérifier : timestamp + '.' + json_payload
      const dataToSign = timestampHeader ? `${timestampHeader}.${rawBody}` : rawBody;

      const computedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(dataToSign)
        .digest('hex');

      // Vérification sécurisée en temps constant contre les attaques de timing
      const isValid = crypto.timingSafeEqual(
        Buffer.from(computedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );

      // Protection contre les Replay Attacks (délai max 5 minutes = 300s)
      if (isValid && timestampHeader) {
        const timestampNumber = parseInt(timestampHeader, 10);
        if (!isNaN(timestampNumber)) {
          const currentTimestamp = Math.floor(Date.now() / 1000);
          if (Math.abs(currentTimestamp - timestampNumber) > 300) {
            logger.warn('GENIUS_PAY', 'Rejet Webhook : Timestamp expiré (> 300 secondes).');
            return false;
          }
        }
      }

      return isValid;
    } catch (error) {
      logger.error('GENIUS_PAY', 'Erreur lors de la validation HMAC de la signature webhook', error);
      return false;
    }
  }
}

export const geniusPayService = new GeniusPayService();
