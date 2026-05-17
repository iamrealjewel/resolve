import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Verify the HMAC SHA-256 JWT SSO Token signed by AppHub
function verifySSOToken(token: string, secret: string) {
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Error("Invalid SSO token structure");
  }

  // Re-generate signature and compare
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64url");

  if (signatureB64 !== expectedSignature) {
    throw new Error("SSO token signature verification failed");
  }

  // Decode payload
  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));

  // Check expiration
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    throw new Error("SSO token has expired");
  }

  // Verify Issuer & Audience
  if (payload.iss !== "apphub") {
    throw new Error("Invalid SSO token issuer");
  }
  if (payload.aud !== "resolve") {
    throw new Error("Invalid SSO token audience");
  }

  return payload;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        ssoToken: { label: "SSO Token", type: "text" },
      },
      async authorize(credentials) {
        // 1. SSO Token Login Flow
        if (credentials?.ssoToken) {
          try {
            const ssoSecret = process.env.SSO_SECRET_KEY;
            if (!ssoSecret) {
              throw new Error("SSO_SECRET_KEY is not configured in Resolve environment");
            }

            const payload = verifySSOToken(credentials.ssoToken, ssoSecret);
            if (!payload.email) {
              throw new Error("SSO token does not contain a valid email address");
            }

            // Look up user in local Resolve database by email
            const user = await prisma.user.findUnique({
              where: { email: payload.email },
            });

            if (!user) {
              throw new Error(`User "${payload.email}" is not authorized in Resolve. Please contact your system administrator.`);
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              companyId: user.companyId,
              departmentId: user.departmentId,
              locationId: user.locationId,
              image: user.image,
            };
          } catch (error: any) {
            console.error("SSO authorization error:", error.message);
            throw new Error(error.message || "SSO authentication failed");
          }
        }

        // 2. Standard Email/Password Login Flow
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("User not found");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        ).catch(() => false);

        // Fallback for plain text passwords (e.g. legacy or seed data)
        const isPlainTextMatch = credentials.password === user.password;

        if (!isPasswordValid && !isPlainTextMatch) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          departmentId: user.departmentId,
          locationId: user.locationId,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
        token.companyId = (user as any).companyId;
        token.departmentId = (user as any).departmentId;
        token.locationId = (user as any).locationId;
        token.image = (user as any).image;
      }
      if (trigger === "update" && session?.image) {
        token.image = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).companyId = token.companyId;
        (session.user as any).departmentId = token.departmentId;
        (session.user as any).locationId = token.locationId;
        (session.user as any).image = token.image;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
