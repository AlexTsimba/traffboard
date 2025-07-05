import { PrismaAdapter } from "@auth/prisma-adapter";
import bcryptjs from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authenticator } from "otplib";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

import { authConfig } from "./auth.config";
import "@/types/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  code: z.string().optional(), // TOTP code for 2FA
});

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password, code } = parsedCredentials.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            passwordHash: true,
            totpSecret: true,
          },
        });

        if (!user?.passwordHash) {
          return null;
        }

        // Verify password
        const passwordsMatch = await bcryptjs.compare(password, user.passwordHash);
        if (!passwordsMatch) {
          return null;
        }

        // Check if 2FA is required
        if (user.totpSecret) {
          // 2FA is enabled, verify TOTP code
          if (!code) {
            // No 2FA code provided, but 2FA is required
            return null;
          }

          // Verify TOTP code with robust time tolerance
          let isValidTOTP = authenticator.verify({
            token: code,
            secret: user.totpSecret,
            window: 2, // Allow ±60 seconds tolerance
          });

          // If standard verification fails, try with different time offsets
          if (!isValidTOTP) {
            const now = Math.floor(Date.now() / 1000);
            
            for (let offset = -6; offset <= 6; offset++) {
              const testTime = now + (offset * 30);
              const expectedCode = authenticator.generate(user.totpSecret, testTime);
              if (expectedCode === code) {
                isValidTOTP = true;
                break;
              }
            }
          }

          if (!isValidTOTP) {
            // Invalid 2FA code
            return null;
          }
        }

        // Authentication successful (either no 2FA or valid 2FA)
        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id;
      }
      if (token.role) {
        session.user.role = token.role;
      }
      return session;
    },
  },
});
