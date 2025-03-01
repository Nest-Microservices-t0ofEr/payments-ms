import 'dotenv/config'
import * as joi from 'joi';

interface EnvVars {
    PORT: number;
    STRIPE_SECRET_KEY: string;
    STRIPE_ENDPOINT_SECRET: string;
    STRIPE_PAYMENT_SUCCESS_URL: string;
    STRIPE_PAYMENT_CANCEL_URL: string;
}

const envsSchema = joi.object({
    PORT: joi.number().required(),
    STRIPE_SECRET_KEY: joi.string().required(),
    STRIPE_ENDPOINT_SECRET: joi.string().required(),
    STRIPE_PAYMENT_SUCCESS_URL: joi.string().required(),
    STRIPE_PAYMENT_CANCEL_URL: joi.string().required(),
})
.unknown(true);

const { error, value } = envsSchema.validate( process.env );

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
    port: envVars.PORT,
    stripeSectretKey: envVars.STRIPE_SECRET_KEY,
    stripeEndpointSecret: envVars.STRIPE_ENDPOINT_SECRET,
    stripeSuccessUrl: envVars.STRIPE_PAYMENT_SUCCESS_URL,  
    stripeCancelUrl: envVars.STRIPE_PAYMENT_CANCEL_URL,
}

