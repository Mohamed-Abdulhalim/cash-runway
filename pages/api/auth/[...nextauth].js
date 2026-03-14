import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { supabase } from '../../../lib/supabase'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],

  callbacks: {
    async signIn({ user }) {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.name,
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' })

      if (error) {
        console.error('signIn upsert failed:', error.message)
        return false
      }
      return true
    },

    async session({ session, token }) {
      session.user.id = token.sub
      return session
    },

    async jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    }
  },

  session: {
    strategy: 'jwt'
  },

  secret: process.env.NEXTAUTH_SECRET
}

export default NextAuth(authOptions)