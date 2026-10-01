import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// cn собирает строку CSS-классов для атрибута className.
// Пример вызова: cn("flex flex-col gap-6", className) в components/login-form.tsx.
// Работает в два шага:
// 1) clsx получает массив inputs (в нём лежат аргументы cn), склеивает его
//    элементы в одну строку через пробел и выбрасывает «пустые» значения:
//    false, null, undefined, "", 0. Поэтому можно писать условия:
//    cn("base", isActive && "active") — при isActive === false останется только "base".
//    clsx(["flex gap-6", undefined, "gap-2"]) вернёт "flex gap-6 gap-2".
// 2) twMerge убирает конфликтующие классы Tailwind (Tailwind — библиотека, где каждый
//    класс задаёт одно CSS-свойство). Если два класса задают одно свойство,
//    остаётся последний: twMerge("flex gap-6 gap-2") вернёт "flex gap-2".
//    Так класс, переданный в компонент снаружи, заменяет класс по умолчанию.
//    Для этого внешний класс ставят последним аргументом: cn("flex gap-6", className).
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// S:2:40:30
// Значения вкладок в шапке. Они совпадают с value у TabsTrigger
// в components/header-nav.tsx. "" значит «ни одна вкладка не выбрана».
type TabValue = "dashboard" | "explore" | "builds" | "";

// getTabValue по адресу текущей страницы решает, какую вкладку в шапке подсветить.
// HeaderNav (components/header-nav.tsx) получает pathname из usePathname()
// и передаёт результат в <Tabs value={tabValue}>.
// Проверки идут сверху вниз, и функция возвращает первое совпадение.
// Поэтому /builds/explore проверяется раньше /builds: иначе адрес /builds/explore
// тоже начинался бы с "/builds" и функция вернула бы 'builds'.
export function getTabValue(pathname: string): TabValue {
  if(pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return 'dashboard';
  // ВНИМАНИЕ: строки ниже, начинающиеся с pathname === '/builds, нельзя менять местами.
  // Если проверка "pathname === '/builds' || pathname.startsWith('/builds/')" будет первой из этих строк,
  // то она сработает для любого /builds/...
  // Поэтому, например, для /builds/explore эта функция никогда не вернёт 'explore'.
  if(pathname === '/builds/explore' || pathname.startsWith('/builds/explore/')) return 'explore';
  if(pathname === '/builds' || pathname.startsWith('/builds/')) return 'builds';

  // Адрес не относится ни к одной вкладке (например, /login): вкладка не выбрана.
  return '';
}
