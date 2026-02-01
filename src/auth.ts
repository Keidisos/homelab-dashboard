import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"

const authConfig: NextAuthConfig = {
  trustHost: true, // Trust all hosts (needed for Docker/homelab setups)
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = process.env.AUTH_USERNAME || "admin"
        const password = process.env.AUTH_PASSWORD || "admin"

        if (
          credentials?.username === username &&
          credentials?.password === password
        ) {
          return {
            id: "1",
            name: username,
            email: `${username}@homelab.local`,
          }
        }
        return null
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLogin = nextUrl.pathname.startsWith("/login")
      const isApiRoute = nextUrl.pathname.startsWith("/api")

      // Allow API routes to pass through (they have their own auth if needed)
      if (isApiRoute) {
        return true
      }

      if (isOnLogin) {
        if (isLoggedIn) {
          // Redirect to dashboard if already logged in
          return Response.redirect(new URL("/", nextUrl))
        }
        return true
      }

      // Protect all other routes
      return isLoggedIn
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
