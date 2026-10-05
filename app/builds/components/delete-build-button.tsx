// 5:41:04
'use client'

import { Button } from "@/components/ui/button";
import { useTransition } from "react";

type Props = {
    buildId: string;
    deleteAction: (formData: FormData) => void;
}

export function DeleteBuildButton({
    buildId,
    deleteAction
}: Props) {
    // useTransition — хук React, который отслеживает выполнение переданной ему функции.
    // Он возвращает массив из двух элементов:
    //   isPending — true, пока функция, переданная в startTransition, не завершилась;
    //   startTransition — функция, которая сразу вызывает переданную ей функцию.
    // Ниже в startTransition передаётся () => deleteAction(formData). deleteAction —
    // Server Action deleteBuildAction (app/builds/actions.ts). Он async и
    // возвращает промис, поэтому isPending остаётся true, пока сервер
    // не удалит сборку. На это время кнопка заблокирована: disabled={isPending}.
    const [isPending, startTransition] = useTransition();

    const handleClick = () => {
        if (!confirm('Удалить сборку?')) {
            return;
        }

        const formData = new FormData();
        formData.set('buildId', buildId);

        startTransition(() => deleteAction(formData));
    };

    return (
        <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={handleClick}
        >
            Удалить
        </Button>
    );
}
