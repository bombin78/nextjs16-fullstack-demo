import { prisma } from "./db";

export async function getMyBuilds(userId: string) {
    return prisma.build.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc'},
        include: {
            user: { select: { email: true }},
            components: {
                include: {
                    component: { 
                        select: { name: true, type: true, price: true}
                    }
                }
            }
        }
    });
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
    });
}

export async function getBuildToEdit(id: string, userId: string) {
    return await prisma.build.findUnique({
        where: { id, userId },
        include: {
            components: {
                include: {
                    component: true
                }
            }
        } 
    });
}

export async function getPopularBuild(limit = 3) {
    return prisma.build.findMany({
        where: {
            isPublic: true,
            // Только сборки, у которых есть хотя бы один лайк.
            // some берёт сборку, если хотя бы один её лайк подходит под
            // условие в скобках. Условие {} пустое, ему подходит любой лайк.
            // Похожие фильтры: none — ни один лайк не подходит,
            // every — подходят все лайки.
            likes: { some: {}}
        },
        orderBy: { likes: { _count: "desc"}},
        take: limit,
        include: {
            _count: { select: { likes: true} }
        }
    });
}
