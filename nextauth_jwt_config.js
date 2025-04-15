// Modified NextAuth configuration that works without a database
// Place this in your /src/app/api/auth/[...nextauth]/route.ts file

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // This is where you would normally validate against a database
        // Since we don't have a database, we'll use a simple check for demo purposes
        // In a real application, you should implement proper authentication
        
        // Example hardcoded admin user - REPLACE THIS IN PRODUCTION
        if (
          credentials?.email === "admin@esh7rni.me" &&
          credentials?.password === "admin123"
        ) {
          return {
            id: "1",
            name: "Admin User",
            email: "admin@esh7rni.me",
            role: "admin",
          };
        }
        
        // For demo purposes, allow any email/password with minimum length
        // IMPORTANT: Replace this with proper authentication in production
        if (
          credentials?.email &&
          credentials?.password &&
          credentials.password.length >= 6
        ) {
          return {
            id: Date.now().toString(),
            name: credentials.email.split("@")[0],
            email: credentials.email,
            role: "user",
          };
        }
        
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt", // Use JWT instead of database sessions
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add role to JWT token when user signs in
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Add role to session from JWT token
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.sub;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
