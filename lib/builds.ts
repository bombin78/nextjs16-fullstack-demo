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
