"use server"

import { redirect } from "next/navigation";
import {prisma} from "@/lib/db";
import bcrypt from "bcryptjs";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignupState = {error?: string};

function getString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
};

export async function signupAction(
	_prevState: SignupState | null,
	formData: FormData
): Promise<SignupState> {
	const name = getString(formData, 'name');
	const email = getString(formData, 'email');
	const password = getString(formData, 'password');

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
