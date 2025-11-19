// PayMongo API client for Philippines
// Documentation: https://developers.paymongo.com/

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || '';
const PAYMONGO_BASE_URL = 'https://api.paymongo.com/v1';

export const paymongo = {
  async createCheckoutSession(options: {
    amount: number; // in centavos (₱9.99 = 999)
    description: string;
    email: string;
    userId: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    const response = await fetch(`${PAYMONGO_BASE_URL}/checkout_sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            description: options.description,
            line_items: [
              {
                currency: 'PHP',
                amount: options.amount,
                description: options.description,
                name: 'QuizGod Premium',
                quantity: 1,
              }
            ],
            payment_method_types: ['gcash', 'paymaya', 'card', 'grab_pay'],
            success_url: options.successUrl,
            cancel_url: options.cancelUrl,
            billing: {
              email: options.email,
            },
            metadata: {
              userId: options.userId,
              email: options.email,
            },
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create PayMongo checkout session');
    }

    return await response.json();
  },

  async retrieveCheckoutSession(sessionId: string) {
    const response = await fetch(`${PAYMONGO_BASE_URL}/checkout_sessions/${sessionId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to retrieve checkout session');
    }

    return await response.json();
  }
};

export const PREMIUM_PRICE_PHP = 499; // ₱4.99 in centavos
