'use server'

import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export type SaveBuildFormState = {
    status: 'idle' | 'success' | 'error',
    message?: string
}

type BuildResult =
    | { success: true; buildId: string }
    | { success: false; error: string };

type CheckedBuildInput =
    | { success: true; userId: string; name: string; totalPrice: number }
    | { success: false; error: string };

// Id деталей из скрытого поля componentIds формы SaveBuildDialog.
function readComponentIds(formData: FormData): string[] {
    return String(formData.get('componentIds'))
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
}

// Название сборки из поля name формы SaveBuildDialog.
function readName(formData: FormData): string {
    return String(formData.get('name') ?? '');
}

// Состояние формы для useActionState по результату createBuild или updateBuild.
function toFormState(result: BuildResult): SaveBuildFormState {
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

// Проверки, общие для создания и обновления сборки, и подсчёт общей цены.
async function checkBuildInput(
    name: string,
    componentIds: string[]
): Promise<CheckedBuildInput> {
    const session = await auth();

    if (!session?.user.id) {
        return { success: false, error: 'Необходимо войти'};
    }

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

    return {
        success: true,
        userId: session.user.id,
        name: trimmedName,
        totalPrice
    };
}

export async function createBuildAction(
    _prevState: SaveBuildFormState,
    formData: FormData
): Promise<SaveBuildFormState> {
    const name = readName(formData);
    const componentIds = readComponentIds(formData);
    const result = await createBuild(name, componentIds);

    return toFormState(result);
}

export async function updateBuildAction(
    buildId: string,
    _prevState: SaveBuildFormState,
    formData: FormData
): Promise<SaveBuildFormState> {
    const name = readName(formData);
    const componentIds = readComponentIds(formData);
    const result = await updateBuild(buildId, name, componentIds);

    return toFormState(result);
}

export async function createBuild(
    name: string,
    componentIds: string[]
): Promise<BuildResult> {
    const input = await checkBuildInput(name, componentIds);

    if (!input.success) {
        return input;
    }

    try {
        const build = await prisma.$transaction(
            async (tx) => {
                const newBuild = await tx.build.create({
                    data: {
                        name: input.name,
                        totalPrice: input.totalPrice,
                        userId: input.userId
                    }
                });

                await tx.buildComponent.createMany({
                    data: componentIds.map((componentId) => ({
                        buildId: newBuild.id,
                        componentId
                    }))
                });

                return newBuild;
            }
        );

        revalidatePath('/dashboard');
        revalidatePath('/builds');

        return { success: true, buildId: build.id};
    } catch {
        return { success: false, error: 'Не удалось сохранить сборку'};
    }
}

// Обновляет сборку, только если её владелец — вошедший пользователь.
async function updateBuild(
    buildId: string,
    name: string,
    componentIds: string[]
): Promise<BuildResult> {
    const input = await checkBuildInput(name, componentIds);

    if (!input.success) {
        return input;
    }

    try {
        const updated = await prisma.$transaction(
            async (tx) => {
                const { count } = await tx.build.updateMany({
                    where: {
                        id: buildId,
                        userId: input.userId
                    },
                    data: {
                        name: input.name,
                        totalPrice: input.totalPrice
                    }
                });

                if (count === 0) {
                    return false;
                }

                await tx.buildComponent.deleteMany({
                    where: { buildId }
                });

                await tx.buildComponent.createMany({
                    data: componentIds.map((componentId) => ({
                        buildId,
                        componentId
                    }))
                });

                return true;
            }
        );

        if (!updated) {
            return { success: false, error: 'Сборка не найдена'};
        }

        revalidatePath('/dashboard');
        revalidatePath('/builds');
        revalidatePath('/builds/explore');

        return { success: true, buildId };
    } catch {
        return { success: false, error: 'Не удалось сохранить сборку'};
    }
}
