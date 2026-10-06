import { prisma } from "./db";

export async function getMyBuilds(userId: string) {
    return prisma.build.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc'},
        include: {
            // кем создана сборка
            user: { select: { email: true }},
            components: {
                include: {
                    component: { 
                        select: { name: true, type: true, price: true}
                    }
                }
            }
        }
    })
}

export async function getPublicBuild(userId: string) {
    return prisma.build.findMany({
        where: { isPublic: true },
        orderBy: { createdAt: 'desc'},
        include: {
            user: { select: { email: true, name: true }},
            components: {
                include: {
                    component: { 
                        select: { name: true }
                    }
                }
            },
            _count: { select: { likes: true }},
            likes: { where: { userId }, select: { id: true }}
        }
    })
}

export async function getBuildToEdit(id: string) {
    // findFirst возвращает первую запись, подходящую под where, или null.
    // Здесь where ищет по id, а id в модели Build помечен @id и уникален,
    // поэтому запись всегда одна и findFirst не обязателен.
    // Варианты:
    // - findUnique: where обязан содержать уникальное поле (здесь id),
    //   тоже возвращает запись или null. Рядом с id можно добавить
    //   неуникальные поля, например userId, чтобы найти только свою сборку.
    // - findUniqueOrThrow: как findUnique, но вместо null выбрасывает
    //   ошибку с кодом P2025.
    return await prisma.build.findFirst({
        where: { id },
        include: {
            components: {
                include: {
                    component: true
                }
            }
        } 
    })
}

export async function getPopularBuild(limit = 3) {
    return prisma.build.findMany({
        where: {
            isPublic: true,
            likes: { some: {}}
        },
        orderBy: { likes: { _count: "desc"}},
        take: limit,
        include: {
            _count: { select: { likes: true} }
        }
    })
}
