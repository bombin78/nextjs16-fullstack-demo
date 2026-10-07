# nextjs16-fullstack-demo

Учебное fullstack-приложение на Next.js 16: конфигуратор сборки ПК.
Пользователь регистрируется, входит в систему и в личном кабинете собирает
компьютер из комплектующих.


## Технологии

- **Next.js 16** (App Router) и **React 19**
- **TypeScript**
- **PostgreSQL** в Docker, **Prisma 7** для работы с базой
- **Auth.js** (`next-auth` v5): вход по email и паролю, пароли хешируются
  через `bcryptjs`
- **Tailwind CSS 4** и компоненты **shadcn/ui**

## Страницы

| Адрес | Файл | Что там |
|---|---|---|
| `/` | [app/page.tsx](app/page.tsx) | главная |
| `/signup` | [app/signup/page.tsx](app/signup/page.tsx) | регистрация |
| `/login` | [app/login/page.tsx](app/login/page.tsx) | вход |
| `/dashboard` | [app/dashboard/page.tsx](app/dashboard/page.tsx) | конфигуратор, только после входа |

Без входа [proxy.ts](proxy.ts) перенаправляет с закрытых страниц на `/login`.

## Запуск

1. Создать в корне файл `.env` с переменными:

   ```bash
   POSTGRES_USER=...
   POSTGRES_PASSWORD=...
   POSTGRES_DB=...
   DATABASE_URL=...
   NEXTAUTH_SECRET=...
   ```

   `POSTGRES_*` читает [docker-compose.yml](docker-compose.yml) при создании
   базы. `DATABASE_URL` читает Prisma. `NEXTAUTH_SECRET` передаётся в Auth.js
   в [auth.ts](auth.ts): из него Auth.js получает ключ, которым шифрует куку
   сессии.

2. Установить зависимости:

   ```bash
   npm install
   ```

3. Запустить контейнер с PostgreSQL:

   ```bash
   docker compose up -d
   ```

   Проверить, что он работает: `docker compose ps` — в `STATUS` должно
   стоять `Up`.

4. Применить миграции, сгенерировать клиент Prisma и заполнить базу
   комплектующими:

   ```bash
   npx prisma migrate dev
   npx prisma generate
   npx prisma db seed
   ```

   Клиент генерируется в `lib/generated/prisma` (папка не хранится в git).
   Данные для заполнения — в [prisma/seed.ts](prisma/seed.ts).

5. Запустить сервер разработки:

   ```bash
   npm run dev
   ```

   Адрес: [http://localhost:3000](http://localhost:3000).

## Просмотр базы в браузере (Prisma Studio)

Контейнер с PostgreSQL должен быть запущен (шаг 3).

```bash
npx prisma studio
```

Адрес: `http://localhost:5555`.

Полезные флаги:

- `--port 5556` — другой порт, если занят 5555;
- `--browser firefox` — открыть в конкретном браузере.
