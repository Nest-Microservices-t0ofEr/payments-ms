import { Injectable } from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';
import { PaymentsSessionDto } from './dto/payments-session.dto';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
    private readonly stripe = new Stripe(envs.stripeSectretKey);
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
            success_url: 'http://localhost:3001/payments/success',
            cancel_url: 'http://localhost:3001/payments/cancel',
        });
        return session;
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
        const endpointSecret = 'whsec_QoqlpgjCHUgHs0nECNK5dtdjRua2gIwA';
        try {
            event = this.stripe.webhooks.constructEvent(req['rawBody'], sig, endpointSecret);
        } catch (err) {
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
        switch(event.type) {
            case 'charge.succeeded':
                console.log({
                    metadata: event.data.object.metadata,
                    orderId: event.data.object.metadata.orderId,
                })
                break;
            default:
                console.log(`Event type ${event.type} not handled`);
                break;
        }
        return res.status(200).json({ sig });
    }
}
