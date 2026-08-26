import { prisma } from "./db";

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