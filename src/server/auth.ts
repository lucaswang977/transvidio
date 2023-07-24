import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { GetServerSidePropsContext } from "next";
import type { NextAuthOptions, DefaultSession } from "next-auth"
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import type { UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

import { env } from "~/env.mjs";
import { prisma } from "~/server/db";
import { randomUUID, randomBytes } from "crypto";

import { cLog, LogLevels } from "~/utils/helper"
const LOG_RANGE = "AUTH"

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
      // ...other properties
    } & DefaultSession["user"];
  }

  interface User {
    // ...other properties
    role: UserRole;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    generateSessionToken: () => {
      return randomUUID?.() ?? randomBytes(32).toString("hex")
    }
  },
  callbacks: {
    async signIn({ user }) {
      const u = await prisma.user.findUnique({
        where: {
          id: user.id
        }
      })
      if (u && u.blocked) {
        await cLog(LogLevels.WARN, LOG_RANGE, u.id, "user is blocked.")
        return false
      }
      return true
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.email = user.email
        token.name = user.name
        token.role = user.role
        token.id = user.id
      }
      if ("id" in token) {
        await prisma.user.update({
          data: {
            lastLogin: new Date()
          },
          where: {
            id: token.id as string
          }
        })
        await cLog(LogLevels.DEBUG, LOG_RANGE, token.id as string, "session updated.")
      }
      return token
    },
    session: ({ session, token }) => {
      const newSession = {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role
        }
      }

      return newSession
    },
  },
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/signin"
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    EmailProvider({
      server: env.EMAIL_SERVER,
      from: env.EMAIL_FROM,
    }),
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials,) {
        if (credentials) {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })
          if (user && user.pwd && user.emailVerified) {
            const pwdVerified = await bcrypt.compare(credentials.password, user.pwd)

            if (pwdVerified)
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role
              }
            else
              throw new Error("Email or password is invalid.")
          } else {
            throw new Error("User data is invalid.")
          }
        }
        throw new Error("Input is invalid.")
      }
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
