import { Inject, Injectable, Logger } from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';
import { PaymentsSessionDto } from './dto/payments-session.dto';
import { Request, Response } from 'express';
import { NATS_SERVICE } from 'src/config/services';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {
    private readonly stripe = new Stripe(envs.stripeSectretKey);
    private readonly logger = new Logger('PaymentsService');
    constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

    async createPaymentSession(paymentsSessionDto: PaymentsSessionDto) {
        const {currency, items, orderId} = paymentsSessionDto;
        const lineItems = items.map(item => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name,
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));
        const session = await this.stripe.checkout.sessions.create({
            payment_intent_data: {
                metadata: {
                    orderId: orderId,
                }
            },
            line_items: lineItems,
            mode: 'payment',
            success_url: envs.stripeSuccessUrl,
            cancel_url: envs.stripeCancelUrl,
        });
        return {
            cancelUrl: session.cancel_url,
            successUrl: session.success_url,
            url: session.url,
        };
    }
    success() {
        return 'This action returns success';
    }
    cancel() {
        return 'This action returns cancel';
    }
    stripeWebhook(req: Request, res: Response) {
        const sig = req.headers['stripe-signature'] ?? '';
        let event: Stripe.Event;
        const endpointSecret = envs.stripeEndpointSecret;
        try {
            event = this.stripe.webhooks.constructEvent(req['rawBody'], sig, endpointSecret);
        } catch (err) {
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
        switch(event.type) {
            case 'charge.succeeded':
                const chargeSucceded = event.data.object;
                const payload = {
                    stripePaymentId: chargeSucceded.id,
                    orderId: chargeSucceded.metadata.orderId,
                    receiptUrl: chargeSucceded.receipt_url,
                }
                this.client.emit('payment.succeeded', payload);
                break;
            default:
                console.log(`Event type ${event.type} not handled`);
                break;
        }
        return res.status(200).json({ sig });
    }
}
