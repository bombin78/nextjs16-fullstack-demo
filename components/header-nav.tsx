// 2:40:30
"use client"

import { getTabValue } from "@/lib/utils";
import { Session } from "next-auth";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { LayoutList, Plus, Users } from "lucide-react";
import { signOut } from "next-auth/react";

type Props = {
    session: Session | null
}

export function HeaderNav({ session }: Props) {
    const pathname = usePathname();
    const tabValue = getTabValue(pathname);

    if (!session?.user) {
        return (
            <div className="flex justify-end">
                <Button variant="secondary">
                    <Link href="/login">Войти</Link>
                </Button>
            </div>
        )
    }


    return (
        <div className="grid grid-cols-3 items-center gap-4">
            <div/>
            <div className="flex justify-center">
                {/*
                  Tabs, TabsList и TabsTrigger — компоненты shadcn/ui из components/ui/tabs.tsx.
                  Каждый из них оборачивает одноимённую часть Radix Tabs и добавляет классы.

                  Tabs выводит <div> и получает в value, какая вкладка выбрана.
                  Через контекст React (значение, которое компонент передаёт всем вложенным
                  компонентам, не передавая его через props) Tabs сообщает это значение
                  каждому TabsTrigger.
                  Здесь выбранную вкладку задаёт value={tabValue}, а tabValue вычисляет
                  getTabValue из адреса страницы. Обработчика onValueChange нет, поэтому
                  клик по вкладке сам value не меняет: вкладка меняется, только когда
                  меняется адрес страницы.
                */}
                <Tabs value={tabValue} className="w-fit">
                    {/*
                      TabsList выводит <div role="tablist">.
                      Внутри него стрелки влево и вправо на клавиатуре переводят фокус
                      между вкладками; после последней вкладки фокус переходит на первую.
                      Когда вкладка получает фокус, Radix пытается её выбрать. Но value меняется
                      только при смене адреса, поэтому выбранная вкладка остаётся прежней.
                      Перейти на страницу с клавиатуры можно клавишей Enter: браузер отправляет
                      событие click ссылке <a>, на которой стоит фокус, и Link переходит на страницу.
                    */}
                    <TabsList>
                        {/*
                          TabsTrigger — одна вкладка. Он сравнивает свой value с value из Tabs.
                          Если они равны, вкладка выбрана, и TabsTrigger ставит ей aria-selected="true"
                          и data-state="active". Иначе ставит data-state="inactive".
                          aria-selected — атрибут для программ чтения с экрана: сообщает, что вкладка выбрана.
                          Без asChild TabsTrigger выводит свой <button>.
                          С asChild он не создаёт <button>, а передаёт эти атрибуты
                          и обработчики событий дочернему элементу — здесь это Link.
                          Две вкладки ниже устроены так же.
                        */}
                        <TabsTrigger value="dashboard" asChild>
                            {/*
                              Link из next/link выводит <a href="/dashboard">.
                              При клике Next.js переходит на страницу без полной перезагрузки.
                              Адрес меняется, и React заново вызывает HeaderNav.
                              В этом вызове usePathname() возвращает новый адрес, getTabValue вычисляет
                              по нему новый tabValue, и Tabs получает его в value.
                            */}
                            <Link href="/dashboard">
                                <Plus className="h-4 w-4"/>
                                Создать сборку
                            </Link>
                        </TabsTrigger>
                        <TabsTrigger value="builds" asChild>
                            <Link href="/builds">
                                <LayoutList className="h-4 w-4"/>
                                Мои сборки
                            </Link>
                        </TabsTrigger>
                        <TabsTrigger value="explore" asChild>
                            <Link href="/builds/explore">
                                <Users className="h-4 w-4"/>
                                Публичные сборки
                            </Link>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            <div className="flex justify-end">
                <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    // signOut здесь из next-auth/react, а не из auth.ts. Причина: onClick
                    // выполняется в браузере, а signOut из auth.ts без своего Server Action
                    // из браузера не вызвать.
                    // signOut из auth.ts выполняется только на сервере:
                    // - auth.ts нельзя импортировать в файл с "use client": он обращается
                    //   к базе данных через lib/db.ts;
                    // - signOut из auth.ts удаляет куку сессии через cookies() из next/headers
                    //   (функция Next.js, которая на сервере читает и меняет куки запроса),
                    //   а Next.js разрешает менять куки только в Server Action или обработчике
                    //   маршрута.
                    // signOut из next-auth/react выполняется в браузере:
                    // 1) запросом GET /api/auth/csrf получает CSRF-токен;
                    // 2) запросом POST /api/auth/signout с этим CSRF-токеном просит выйти.
                    //    Запрос принимает app/api/auth/[...nextauth]/route.ts, и в ответе
                    //    сервер велит браузеру удалить куку сессии;
                    // 3) переходит на redirectTo ('/') через window.location.href, и браузер
                    //    загружает страницу заново. Серверный компонент Header
                    //    (components/header.tsx, его выводит app/layout.tsx) вызывает auth()
                    //    из auth.ts. auth() читает куку сессии, не находит её и возвращает null.
                    //    Header передаёт session = null в HeaderNav, и HeaderNav показывает
                    //    кнопку «Войти».
                    onClick={() => signOut({ redirectTo: '/' })}
                >
                    Выйти
                </Button>
            </div>
        </div>
    )
}