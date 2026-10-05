// 2:33:45
import { Button } from "@/components/ui/button"
import { TypographyH1 } from "@/components/ui/typography-h1";
import Link from "next/link";

// default — Next.js берёт компонент страницы из экспорта по умолчанию файла
// page.tsx. Без default страница не откроется: Next.js выдаст ошибку
// Экспорт по умолчанию нужен в файлах, которые Next.js находит в app по имени:
//   - page, layout, template;
//   - loading, error, not-found, forbidden, unauthorized, default;
//   - файлы метаданных: icon, apple-icon, opengraph-image, twitter-image,
//   sitemap, robots, manifest.
export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      {/* S:3:01:03 */}
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center py-32 px-16">
        <TypographyH1>Заголовок</TypographyH1>
        <br />
        <Button>
          <Link href="/dashboard">Собрать</Link>
        </Button>
      </main>
      {/* E:3:03:35 */}
    </div>
  );
}
