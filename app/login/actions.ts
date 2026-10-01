// 2:05:07
'use server'

// REVIEW: [Tutorial]
// import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export type LoginState = { error?: string }

export async function loginAction(
    _prevState: LoginState | null,
    formData: FormData
): Promise<LoginState> {
    const email = String(formData.get('email')).trim();
    const password = String(formData.get('password')).trim();

    if(!email || !password) {
        return { error: 'Введите email или пароль'};
    }

    try {

        console.log('email, ', email, password);
        // S:2:09:00
        // REVIEW: [Tutorial]
        // В курсе здесь было: await signIn(...) без return, а под ним redirect('/dashboard').
        // При запуске redirect('/dashboard') не выполнялся: после успешного входа signIn
        // сама вызывает redirect() и прерывает функцию.
        // Эта строка была нужна только TypeScript. signIn возвращает Promise<never>,
        // но после await TypeScript не считает, что выполнение остановилось. Без строки
        // tsc выдаёт ошибку TS2366: "Function lacks ending return statement and return
        // type does not include 'undefined'". redirect() возвращает never, и после
        // обычного вызова такой функции TypeScript считает, что выполнение остановилось.
        // return await signIn(...) убирает ошибку без лишней строки: значение типа never
        // подходит для любого возвращаемого типа, в том числе для LoginState.
        return await signIn('credentials', {
            email,
            password,
            redirectTo: "/dashboard"
        })
        // redirect('/dashboard');
        // E:2:09:55
    } catch (error) {
        // В блок catch попадают ошибки двух видов:
        // 1) AuthError — signIn не смог войти (например, неверный пароль);
        // 2) Ошибки, которые не AuthError. Главная из них — NEXT_REDIRECT:
        // signIn успешно вошёл и вызвал redirect() из next/navigation
        // (здесь речь о вызове внутри next-auth), а redirect() прерывает
        // функцию, выбрасывая NEXT_REDIRECT.
        if (error instanceof AuthError) {
            if (error.type === 'CredentialsSignin') {
                return { error: 'Неверный email или пароль'};
            }

            return { error: 'Ошибка авторизации'};
        }

        // Всё, что не AuthError, выбрасываем дальше. Среди этих ошибок есть NEXT_REDIRECT:
        // Next.js ловит её сам и отправляет браузер на /dashboard.
        // Если поймать её здесь и не выбросить дальше, перехода после входа не будет.
        throw error;
    }
}
