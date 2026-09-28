// proxy.ts — специальный файл Next.js (до версии 16 назывался middleware.ts).
// Next.js вызывает функцию proxy на сервере до рендера страницы.
// Здесь она закрывает непубличные страницы: нет куки сессии Auth.js —
// перенаправляет на /login. Проверка оптимистичная: функция смотрит только,
// есть ли кука, но не проверяет её подпись.

// NextResponse — класс ответа Next.js, расширяет стандартный Response.
import { NextResponse } from "next/server"
// NextRequest — класс входящего запроса, расширяет стандартный Request.
// В нашем случае используется в качестве типа.
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = new Set(["/", "/login", "/signup"])

// Публичный путь (public path) — адрес, который можно открыть без входа.
// Для такого пути proxy не ищет куку сессии и сразу пропускает запрос.
// isPublicPath получает путь из адреса запроса (pathname, например "/login")
// и возвращает true, если путь публичный:
// - путь точно совпадает с одним из PUBLIC_PATHS: "/", "/login", "/signup".
//   Set.has сравнивает строки целиком, поэтому "/login/abc" не публичный;
// - путь начинается с "/api/". Эта проверка дублирует matcher в config ниже:
//   для путей на /api Next.js функцию proxy не вызывает, и сюда они не доходят.
//   Адреса /api — не страницы, а обработчики маршрутов (app/api/**/route.ts).
//   Сейчас там только Auth.js (/api/auth/*), он проверяет запросы сам.
//   Новый обработчик в app/api proxy не защитит: сессию в нём нужно
//   проверять самому, вызовом auth().
// Любой другой путь, например "/dashboard", закрыт: нужна кука сессии.
function isPublicPath(pathname: string) {
    if (PUBLIC_PATHS.has(pathname)) return true;

    if(pathname.startsWith('/api/')) return true;

    return false;
}

// Функция proxy создаёт объект ответа статическим методом (next() или redirect())
// класса NextResponse и возвращает его в Next.js. По этому объекту Next.js решает,
// что делать: next() — не вмешиваться, Next.js обрабатывает запрос как обычно
// (рендерит страницу или отдаёт файл), redirect(url) — перенаправить.
// Статический метод (static) — это метод самого класса, для его вызова не нужно
// предварительно создавать объект через new NextResponse(). При этом каждый вызов
// next() или redirect() создаёт новый объект NextResponse.
// Объект request (NextRequest) создаёт Next.js на каждый запрос и передаёт в proxy.
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    const sessionCookie = 
        request.cookies.get('authjs.session-token') ??
        request.cookies.get('__Secure-authjs.session-token')

    if(!sessionCookie?.value) {
        return NextResponse.redirect(new URL("/login", request.url))
    }

    return NextResponse.next()
}

// config — необязательная настройка proxy. Next.js ищет её по имени рядом
// с функцией proxy. Значения должны быть константами: Next.js читает их из
// текста файла при сборке, не выполняя код. Переменные здесь не сработают.
export const config = {
  // REVIEW: [Tutorial]
  // matcher — список шаблонов пути. Next.js вызывает функцию proxy только для
  // запросов, путь которых совпадает хотя бы с одним шаблоном. Без matcher
  // proxy вызывался бы на каждый запрос, включая CSS, JS и картинки.
  // Next.js компилирует шаблон в регулярное выражение с помощью библиотеки
  // path-to-regexp.
  matcher: [
    // Шаблон составлен через отрицание: (?!...) значит «дальше не идёт ни один
    // из вариантов». Путь совпадает, когда после первого "/" он НЕ начинается
    // с api, _next/static, _next/image и НЕ заканчивается расширением картинки.
    // Проверяется начало строки, поэтому, например, /apiary тоже исключён.
    // .* в конце — остаток пути любой длины.
    // Картинки исключены по расширению, а не по имени: сейчас это
    // /favicon.ico и .svg из public/, в будущем — любой новый файл
    // с этими расширениями. Без исключения proxy перенаправлял бы запрос
    // за картинкой на /login, и у гостя она бы не загрузилась.
    // (?:png|svg|...) — группа вариантов расширения, ?: значит «только
    // сгруппировать». Новый тип файла в public/ (например, .pdf) нужно
    // добавить в этот список.
    '/((?!api|_next/static|_next/image|.*\\.(?:png|svg|ico|jpg|jpeg|gif|webp)$).*)',
  ],
  //   matcher: [
  //     '/((?!api|_next/static|_next/image|.*\\.png$).*)',
  //   ],
}