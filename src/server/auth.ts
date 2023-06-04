import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";

import { env } from "~/env.mjs";
import { prisma } from "~/server/db";
import { randomUUID, randomBytes } from "crypto";

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
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
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
    jwt: async ({ token, user, profile }) => {
      if (user) {
        token.email = user.email
        token.name = user.name
        token.id = user.id
      }
      console.log("jwt", token, profile)
      return token
    },
    session: ({ session, token, user }) => {
      const newSession = {
        ...session,
        user: {
          ...session.user,
          id: token.id,
        }
      }
      console.log("session", session, newSession, user)
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
      name: "Sign in",
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
          if (!user || !user.emailVerified) return null

          const credential = await prisma.credential.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (credential && credential.pwd === credentials.password) {
            console.log("success", user)
            return user
          }
        }

        return null
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
