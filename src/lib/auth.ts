import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, twoFactor } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { PrismaClient } from "@prisma/client";

// Using same instantiation pattern as existing test-db route  
const prisma = new PrismaClient();

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false // Internal tool - admin creates users
  },
  socialProviders: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  } : {},
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24      // 24 hours  
  },
  appName: "Traffboard Analytics", // Required for 2FA issuer
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"]
    }),
    twoFactor({
      issuer: "Traffboard Analytics"
      // TOTP only - no OTP for internal tool
    }),
    nextCookies() // Must be last in plugins array
  ]
});

export type Session = typeof auth.$Infer.Session;