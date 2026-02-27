import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3001'),

  // Stripe (for credit top-ups via card)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // x402 (for per-request crypto payments)
  X402_WALLET_ADDRESS: z.string().optional(), // USDC receiving wallet
  X402_NETWORK: z.string().default('eip155:8453'), // Base mainnet
});

export const env = envSchema.parse(process.env);
