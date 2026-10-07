import { DefaultSession, DefaultUser } from 'next-auth'

declare module 'next-auth' {
    interface Session {
        user: {
            id: string,
            email: string,
            name?: string | null
        } & DefaultSession
    }

    interface User extends DefaultUser {
        id: string,
        email: string
    }
}

declare module '@auth/core/jwt' {
    interface JWT {
        id: string,
        email: string
    }
}
