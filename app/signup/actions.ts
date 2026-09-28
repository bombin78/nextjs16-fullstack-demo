// 1:29:08
"use server"

import { redirect } from "next/navigation";
import {prisma} from "@/lib/db";
// bcryptjs — хеширование паролей по алгоритму bcrypt, написано на чистом JavaScript.
// Пароль нельзя хранить в базе как есть: при утечке базы все пароли сразу станут известны.
// Поэтому ниже вместо пароля сохраняем его хеш: bcrypt.hash(password, 10).
//   - Хеш необратим: получить из него исходный пароль нельзя, можно только перебирать варианты.
//   - bcrypt сам генерирует случайную соль (salt) и добавляет её к паролю перед хешированием,
//     поэтому один и тот же пароль каждый раз даёт разный хеш.
//     Соль не секрет. Она нужна, чтобы у пользователей с одинаковым паролем были разные хеши:
//     тогда нельзя заранее посчитать хеши популярных паролей и сверить их со всей базой сразу —
//     подбирать пароль приходится для каждого пользователя отдельно.
//   - 10 — число раундов (cost). Чем оно больше, тем медленнее считается хеш,
//     и тем дороже злоумышленнику перебор паролей.
//   - Результат — строка вида "$2b$10$<соль><хеш>": соль и число раундов лежат в ней же,
//     отдельно их хранить не нужно.
// При входе пароль сверяется через bcrypt.compare(введённый, хеш из базы) — см. auth.ts.
import bcrypt from "bcryptjs";

// Константы валидации
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignupState = {error?: string};

/**
 * REVIEW: [Tutorial]
 * Возвращает значение поля, если это строка; иначе (поля нет или это файл) — null.
 * Раньше было formData.get(...) as string | undefined — это неточно:
 * - get() возвращает File | string | null: если поля нет, будет null, а не undefined;
 * - as ничего не проверяет во время выполнения, только заставляет компилятор поверить.
 * getString проверяет typeof и гарантирует string | null, поэтому as больше не нужен.	
*/
function getString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
};

export async function signupAction(
	// Подчёркивание в имени — соглашение: параметр намеренно не используется.
	// Удалить его нельзя: useActionState передаёт аргументы по позиции (prevState, formData).
	_prevState: SignupState | null,
	formData: FormData
): Promise<SignupState> {
    // REVIEW: [Tutorial]
	const name = getString(formData, 'name');
	const email = getString(formData, 'email');
	const password = getString(formData, 'password');
	// const name = formData.get('name') as string | undefined;
	// const email = formData.get('email') as string | undefined;
	// const password = formData.get('password') as string | undefined;

	if (!email) {
        return { error: "Введите email"}
    }

    if(!EMAIL_REGEX.test(email)) {
        return { error: 'Некорректный формат email' }
    }

    if(!password || password.length < MIN_PASSWORD_LENGTH) {
        return { error: 'Пароль должен быть не менее 8 символов'}
    }

	const existing = await prisma.user.findUnique({
		where: {email}
	});

	if (existing) {
        return { error: 'Email уже занят'}
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassword
        }
    })

    redirect('/login');
}