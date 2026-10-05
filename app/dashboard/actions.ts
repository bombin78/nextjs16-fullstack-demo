// 4:07:51
// 'use server' в начале файла делает каждую экспортированную функцию файла
// Server Function — асинхронной функцией, которая выполняется на сервере.
// Клиентский компонент может импортировать Server Function и вызвать её.
// Тогда браузер отправляет на сервер POST-запрос, а сервер выполняет функцию
// и возвращает результат.
// Server Action — частный случай Server Function: та, которую передали
// в action формы или в useActionState.
// Server Function можно вызвать и прямым POST-запросом, в обход интерфейса.
// Поэтому каждая Server Function сама проверяет, вошёл ли пользователь.
// Источник: node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md
'use server'

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { categoryIdToDbType, Component } from '@/lib/types' 
import { revalidatePath } from 'next/cache';

// 4:27:10
export type SaveBuildFromState = {
    status: 'idle' | 'success' | 'error',
    message?: string
}

// 4:42:44
// Server Action: save-build-dialog.tsx передаёт её в useActionState.
// Суффикс Action в имени — договорённость этого проекта для функций, которые
// вызывает форма (как loginAction и signupAction). Next.js на имя не смотрит.
// Параметры (_prevState, formData) заданы под useActionState: он вызывает
// функцию с прошлым результатом и данными формы, а результат кладёт в state.
// Напрямую в <form action> эту функцию передать нельзя: форма вызывает
// функцию с одним аргументом FormData и не принимает возвращаемый результат.
// Сама функция только достаёт поля из formData и передаёт их в saveBuild.
export async function saveBuildAction(
    _prevState: SaveBuildFromState,
    formData: FormData
): Promise<SaveBuildFromState> {
    const name = String(formData.get('name') ?? '').trim();
    const componentIds = String(formData.get('componentIds'))
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

    const result = await saveBuild(name, componentIds);

    if (!result.success) {
        return {
            status: 'error',
            message: result.error
        };
    }

    return {
        status: 'success',
        message: 'Сборка успешно сохранена'
    };
}

// 4:46:17
// Server Function, но не Server Action: её вызывает только saveBuildAction.
// Этот вызов идёт на сервере, поэтому это обычный вызов функции, без запроса.
// Server Function она потому, что экспортирована из файла с 'use server'.
// Поэтому, как каждая Server Function, она сама проверяет вход через auth().
// Если убрать export, saveBuild станет обычной функцией внутри файла.
export async function saveBuild(
    name: string,
    componentIds: string[]
): Promise<{success: true; buildId: string} | { success: false; error: string }> {
    const session = await auth();

    if (!session?.user.id) {
        return { success: false, error: 'Необходимо войти'};
    }

    // trim() возвращает новую строку без пробельных символов в начале и в конце:
    // пробелов, неразрывных пробелов, табуляций и переводов строки.
    const trimmedName = name.trim();

    if (!trimmedName) {
        return { success: false, error: 'Введите название сборки'};
    }

    if(componentIds.length === 0) {
        return { success: false, error: 'Добавьте хотя бы один компонент'};
    }

    const components = await prisma.component.findMany({
        where: { id: { in: componentIds }}
    });

    if (components.length !== componentIds.length) {
         return { success: false, error: 'Некоторые компоненты не найдены'};
    }

    const totalPrice = components.reduce((sum,component) => sum + component.price, 0);

    try {
        // $transaction выполняет запросы к базе как одну транзакцию: группу
        // запросов, которую база сохраняет целиком или не сохраняет совсем.
        // Здесь в транзакции два запроса: создать сборку и создать её связи
        // с компонентами. Без транзакции при ошибке во втором запросе в базе
        // осталась бы сборка без компонентов.
        // Prisma вызывает функцию-аргумент и передаёт в неё tx — клиент Prisma,
        // запросы которого идут внутри этой транзакции. Поэтому внутри функции
        // запросы пишут через tx, а не через prisma: запросы через prisma
        // выполнились бы вне транзакции.
        // Если функция завершилась без ошибки, Prisma сохраняет изменения
        // в базе, и $transaction возвращает то, что вернула функция, — newBuild.
        // Если функция выбросила ошибку, Prisma отменяет все запросы транзакции,
        // а $transaction выбрасывает ошибку дальше, в catch ниже.
        // Источник: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
        const build = await prisma.$transaction(
            async (tx) => {
                // create добавляет одну строку в таблицу Build и возвращает её
                // объектом. id, isPublic и createdAt не переданы: их значения
                // берутся из @default в модели Build (prisma/schema.prisma).
                // Поэтому newBuild.id появляется только после этого запроса.
                const newBuild = await tx.build.create({
                    data: {
                        name: trimmedName,
                        totalPrice,
                        userId: session.user.id
                    }
                });

                // createMany добавляет несколько строк в таблицу BuildComponent
                // одним запросом. Каждая строка связывает сборку newBuild
                // с одним компонентом: buildId из прошлого запроса, componentId
                // из массива componentIds. Сами компоненты в таблице Component
                // не меняются.
                await tx.buildComponent.createMany({
                    data: componentIds.map((componentId) => ({
                        buildId: newBuild.id,
                        componentId
                    }))
                });

                // newBuild станет результатом $transaction, то есть build выше.
                return newBuild;
            }
        );

        // revalidatePath помечает кэш страницы по указанному адресу устаревшим.
        // Кэш — сохранённый результат отрисовки страницы и её данные, которые
        // Next.js отдаёт повторно, не выполняя компоненты заново.
        // После этого Next.js заново выполняет серверные компоненты страницы
        // и берёт из базы свежие данные, например только что созданную сборку.
        // Вызов из Server Function обновляет страницу сразу, если пользователь
        // сейчас на ней: ответ на POST-запрос приносит новый вид страницы.
        // Источник: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md
        // На /dashboard серверный компонент PopularBuildCard читает сборки
        // из базы. Новая сборка в нём пока не появится: getPopularBuild
        // (lib/builds.ts) берёт только сборки с isPublic: true и лайками.
        revalidatePath('/dashboard');
        // Страницы /builds в app/ пока нет, на неё только ведёт ссылка
        // в components/header-nav.tsx. Пока страницы нет, вызов ничего не обновляет.
        revalidatePath('/builds');

        return { success: true, buildId: build.id};
    } catch (error) {
         return { success: false, error: 'Не удалось сохранить сборки'};
    }
}

// 4:07:51
// Server Function, но не Server Action: формы здесь нет.
// Клиентский компонент add-component-dialog.tsx вызывает её как обычную
// асинхронную функцию. Браузер отправляет POST-запрос, сервер читает
// компоненты из базы и возвращает массив.
export async function getComponentsByCategory(categoryId: string): Promise<Component[]> {
    const dbType = categoryIdToDbType[categoryId];
    
    if (!dbType) {
        return [];
    }

    // prisma — клиент из lib/db.ts. prisma.component — его объект для таблицы
    // Component. Prisma сгенерировала этот объект по модели Component
    // из prisma/schema.prisma.
    // findMany читает из таблицы все строки, которые подходят под условие.
    // Он возвращает промис. await ждёт, пока промис вернёт массив объектов.
    // Prisma переводит вызов в SQL-запрос (SQL — язык запросов к базе).
    // Запрос, снятый запуском с log: ['query'] для dbType = "cpu":
    //   SELECT "id", "type"::text, "name", "price", "socket"
    //   FROM "public"."Component"
    //   WHERE "type" = CAST($1::text AS "public"."ComponentType")
    //   ORDER BY "price" ASC OFFSET $2
    //   значения: ["cpu", "0"]
    // OFFSET 0 — «пропустить 0 строк». Prisma добавила его сама, на результат
    // он не влияет.
    // Postgres отбирает и сортирует строки сам и отдаёт их уже по порядку.
    // Каждую строку Prisma превращает в объект с полями модели Component:
    //   { id: "cmrjec72800043re57y1pp4k8", type: "cpu",
    //     name: "Intel Core i3-12100F", price: 8990, socket: "LGA1700" }
    const components = await prisma.component.findMany({
        // where — условие отбора: колонка type равна dbType.
        // dbType получен в начале функции: это значение из объекта
        // categoryIdToDbType (lib/types.ts) по ключу categoryId.
        // Например, для категории "storage" это "ssd".
        // В SQL это WHERE "type" = CAST($1::text AS "public"."ComponentType").
        // Колонка type в Postgres имеет тип ComponentType. Этот тип создала
        // в базе миграция (SQL-файл, который меняет базу) по enum ComponentType
        // из schema.prisma. Значение $1 приходит строкой, например 'cpu'.
        // Поэтому Prisma пишет CAST: переводит строку в Postgres-тип ComponentType.
        where: { type: dbType },
        // orderBy — порядок строк: по колонке price, 'asc' — по возрастанию,
        // от дешёвых к дорогим. В SQL это ORDER BY "price" ASC.
        orderBy: { price: 'asc'}
    });

    return components.map((component) => ({
        id: component.id,
        type: component.type,
        name: component.name,
        price: component.price,
        socket: component.socket
    }));
};
