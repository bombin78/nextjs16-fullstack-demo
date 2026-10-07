import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from '@/lib/db';
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    secret: process.env.NEXTAUTH_SECRET,
    // здесь идет перечисление вариантов аутентификации
    providers: [
        // у нас будет только один вариант через форму по email и паролю
        Credentials({
            credentials: {
                email: {
                    label: 'Email',
                    type: 'email'
                },
                password: {
                    label: 'Пароль',
                    type: 'password'
                }
            },
            async authorize(credentials) {
                if (!credentials?.email || typeof credentials.email !== 'string') {
                    return null;
                }

                if (!credentials?.password || typeof credentials.password !== 'string') {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })
    
                if (!user?.password) {
                    return null;
                }

                const valid = await bcrypt.compare(credentials.password, user.password);

                if (!valid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name
                };
            },
        })
    ],
    // Какая будет сессия создаваться
    session: { strategy: 'jwt'},
    // Указываем свои страницы
    pages: {
        signIn: "/login"
    },
    callbacks: {
        // jwt решает, что сохранить в куке
        jwt({ token, user}) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
            }

            return token;
        },
        // session решает, что из токена отдать коду приложения
        session({ session, token}) {
            if (session.user) {
                session.user.id = token.id;
                session.user.email = token.email;
                session.user.name = token.name;
            }

            return session;
        }
    }
});
