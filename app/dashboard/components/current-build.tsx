// 3:06:28
// Здесь клиентский компонент 'use client', потому что данный компонент хранит выбор в useState и обрабатывает onClick,
// а в серверном компоненте этого делать нельзя.
// 'use client' нужен также для useEffect, браузерных объектов (window, localStorage) и собственных хуков.
// 'use client' нужен только в тех файлах, чьи компоненты вставляются прямо в серверный компонент.
// CurrentBuild как раз такой: его вставляет серверный компонент app/dashboard/page.tsx
'use client'

import { Button } from "@/components/ui/button";
import { TypographyH1 } from "@/components/ui/typography-h1";
import type { Component } from "@/lib/types";
import { useCallback, useState } from "react";
import { TableParts } from "./table";
import { componentCategories } from "@/lib/constants";
import { SaveBuildDialog } from "./save-build-dialog";

export const CurrentBuild = () => {
    const [selectedByCategory, setSelectedByCategory] = useState<Record<string, Component | null>>({});
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);

    console.log('selectedByCategory', selectedByCategory);

    // useCallback — мемоизация функции. При каждой отрисовке CurrentBuild стрелочная функция ниже создаётся заново,
    // но useCallback отбрасывает её и возвращает функцию, сохранённую при первой отрисовке.
    // Список зависимостей [] пуст, поэтому сохранённая функция не меняется никогда.
    //
    // Зачем: TableParts обёрнут в memo. memo сравнивает каждый новый пропс с прошлым через Object.is
    // и предотвращает отрисовку TableParts, если все пропсы совпали.
    // Без useCallback onSelectComponent при каждой отрисовке CurrentBuild был бы новым объектом функции,
    // Object.is(старая, новая) давал бы false, и memo не предотвращал бы отрисовку TableParts.
    //
    // Пример: нажатие «Собрать» меняет saveDialogOpen, и CurrentBuild отрисовывается заново.
    // Но memo предотвращает отрисовку TableParts, потому что все его три пропса остаются прежними:
    // components — константа, selectedByCategory не менялся, onSelectComponent — та же функция благодаря useCallback.
    const onSelectComponent = useCallback((categoryId: string, component: Component | null) => {
        // В setSelectedByCategory передаётся не новое значение, а функция. React вызывает её
        // и передаёт в prev текущее значение selectedByCategory.
        // Обычный вызов setSelectedByCategory({...selectedByCategory, [categoryId]: component}) здесь сломался бы:
        // из-за useCallback с [] эта функция создана при первой отрисовке и видит selectedByCategory
        // только из неё, то есть всегда {}. Каждый новый выбор стирал бы предыдущие.
        // Пример: пользователь выбрал процессор, потом видеокарту.
        // обычный вызов: {...{}, gpu: видеокарта}  → { gpu: видеокарта }, процессор потерян
        // вызов с prev:  {...{ cpu: процессор }, gpu: видеокарта} → { cpu: процессор, gpu: видеокарта }
        setSelectedByCategory(prev => ({...prev, [categoryId]: component}));
    },[]);

    return (
        <>
            <div className="flex justify-between mb-8">
                <TypographyH1>Собери свою сборку</TypographyH1>
                {/* Кнопка открывающая модальное окно "Сохранить сборку" */}
                <Button onClick={() => setSaveDialogOpen(true)}>Собрать</Button>
            </div>
            <div className="min-w-0 overflow-x-auto">
                {/* Таблица выбора компонентов */}
                <TableParts
                    components={componentCategories}
                    onSelectedComponent={onSelectComponent}
                    selectedByCategory={selectedByCategory}
                />
                {/* Модальное окно "Сохранить сборку" */}
                <SaveBuildDialog
                    open={saveDialogOpen}
                    onOpenChange={setSaveDialogOpen}
                    selectedByCategory={selectedByCategory}
                />
            </div>
        </>
    )
}