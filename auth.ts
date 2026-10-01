// 1:49:06
// next-auth (Auth.js v5, здесь 5.0.0-beta.31) — библиотека аутентификации для Next.js.
// Импорт по умолчанию — функция NextAuth(config): на вход конфигурация
// (провайдеры входа, стратегия сессии, свои страницы, коллбэки),
// на выходе объект с готовыми инструментами:
//   handlers        — обработчики GET/POST для app/api/auth/[...nextauth]/route.ts,
//                     они обслуживают служебные адреса /api/auth/* (вход, выход, сессия, CSRF);
//   auth()          — чтение текущей сессии на сервере: серверные компоненты,
//                     серверные действия, route handlers, proxy (бывший middleware);
//   signIn/signOut  — вход и выход; в этом проекте signIn вызывается из app/login/actions.ts,
//                     а signOut отсюда не используется: кнопка выхода берёт signOut
//                     из next-auth/react (components/header-nav.tsx).
// Сама библиотека выпускает и проверяет куку сессии (здесь — JWT, см. session.strategy ниже),
// хешированием паролей Auth.js не занимается: хеш создаёт bcrypt.hash при регистрации
// (app/signup/actions.ts), а authorize() сверяет пароль с ним через bcrypt.compare.
// CSRF — Cross-Site Request Forgery, «подделка межсайтового запроса».
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
    // JWT (jwt) — JSON Web Token, «веб-токен в формате JSON»
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
            // REVIEW: [Tutorial]
            if (session.user) {
                session.user.id = token.id;
                session.user.email = token.email;
                session.user.name = token.name;
            }
            // if (session.user) {
            //     session.user.id = token.id as string
            //     session.user.email = token.email as string
            //     session.user.name = token.name
            // }

            return session;
        }
    }
});
