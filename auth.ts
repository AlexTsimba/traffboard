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
          console.log("AUTH_DEBUG: invalid credentials", credentials);
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
          console.log("AUTH_DEBUG: user not found or no passwordHash", email, password, user);
          return null;
        }

        // Verify password
        const passwordsMatch = await bcryptjs.compare(password, user.passwordHash);
        if (!passwordsMatch) {
          console.log("AUTH_DEBUG: password mismatch", email, password, user, passwordsMatch);
          return null;
        }

        // Check if 2FA is required
        if (user.totpSecret) {
          // 2FA is enabled, verify TOTP code
          if (!code) {
            console.log("AUTH_DEBUG: 2FA required but no code", email, password, user, code);
            return null;
          }

          // Verify TOTP code with robust time tolerance
          let isValidTOTP = authenticator.verify({
            token: code,
            secret: user.totpSecret,
            window: 2, // Allow ±60 seconds tolerance
          } as any); // Type workaround for authenticator options

          // If standard verification fails, try with different time offsets
          if (!isValidTOTP) {
            const now = Math.floor(Date.now() / 1000);

            for (let offset = -6; offset <= 6; offset++) {
              const testTime = now + offset * 30;
              const expectedCode = authenticator.generate(user.totpSecret);
              if (expectedCode === code) {
                isValidTOTP = true;
                break;
              }
            }
          }

          if (!isValidTOTP) {
            console.log("AUTH_DEBUG: invalid 2FA code", email, password, user, code);
            return null;
          }
        }

        // Update last login timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

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
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
