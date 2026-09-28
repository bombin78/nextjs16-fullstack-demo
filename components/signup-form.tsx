// 1:20:42
"use client"

import { signupAction, SignupState } from "@/app/signup/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useActionState } from "react";
import { ErrorMessage } from "./error-message";

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  // useActionState связывает серверное действие signupAction с состоянием компонента.
  //
  // Дженерики: <тип состояния, тип данных, которые приходят при отправке формы>.
  //   SignupState | null — то, что хранится в state (null — пока форму не отправляли);
  //   FormData           — то, что браузер соберёт из полей <form> при submit.
  //
  // Аргументы:
  //   signupAction — функция, которую React вызовет при отправке формы.
  //                  Она получает (предыдущее состояние, FormData) и возвращает новое состояние.
  //   null         — начальное значение state до первой отправки.
  //
  // Возвращает кортеж:
  //   state      — последний результат signupAction (например, { error: "Email уже занят" });
  //   formAction — обёртка над signupAction, её передаём в <form action={...}>.
  //                При submit React вызывает signupAction на сервере, дожидается ответа,
  //                кладёт результат в state и перерисовывает компонент.
  //
  // Почему state бывает только null или { error }:
  //   - до первой отправки state = null (начальное значение);
  //   - при ошибке проверки signupAction делает return { error: "..." }, это попадает в state;
  //   - при успехе signupAction ничего не возвращает: она вызывает redirect("/login").
  //     redirect() не возвращает управление, а бросает исключение NEXT_REDIRECT.
  //     Next.js перехватывает его и отвечает клиенту перенаправлением.
  //     Браузер уходит на /login, эта форма пропадает со страницы,
  //     так что обновлять state уже незачем — он просто не меняется.
  //   Поэтому тип Promise<SignupState> в actions.ts не нарушается: у redirect()
  //   тип возврата never, и TypeScript знает, что до конца функции выполнение не дойдёт.
  //
  // Есть и третий элемент — isPending (true, пока действие выполняется),
  // его можно взять так: const [state, formAction, isPending] = useActionState(...)
  const [state, formAction] = useActionState<SignupState | null, FormData>(signupAction, null);

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Создать аккаунт</CardTitle>
        <CardDescription>
          Введите свои данные ниже, чтобы создать учетную запись.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Имя</FieldLabel>
              <Input 
                id="name" 
                type="text" 
                name="name" 
                placeholder="John Doe" 
                required 
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="m@example.com"
                required
              />
              <FieldDescription>
                Мы будем использовать этот адрес электронной почты для связи с вами. 
                Мы не будем передавать ваш адрес никому другому.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Пароль</FieldLabel>
              <Input 
                id="password" 
                type="password"
                name="password" 
                required 
              />
              <FieldDescription>
                Пароль должен быть не менее 8 символов
              </FieldDescription>
            </Field>
            {
              state?.error && <ErrorMessage message={state.error}/>
            }
            <FieldGroup>
              <Field>
                <Button type="submit">Создать аккаунт</Button>
                <FieldDescription className="px-6 text-center">
                  У вас уже есть аккаунт? <a href="/login">Войти</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
