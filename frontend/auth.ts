import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabaseClient";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials) return null;

        const email = String(credentials.email || "").trim().toLowerCase();
        const password = String(credentials.password || "").trim();

        if (!email || !password) {
          return null;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (error || !data.user) {
          console.error("supabase signInWithPassword error:", error?.message || error);
          return null;
        }

        return {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || "",
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },

    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});
