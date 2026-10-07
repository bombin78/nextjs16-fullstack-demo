import { auth } from "@/auth";
import { TypographyH3 } from "@/components/ui/typography-h3";
import { getMyBuilds } from "@/lib/builds";
import { redirect } from "next/navigation";
import { BuildCard } from "./components/builds-card";
import { DeleteBuildButton } from "./components/delete-build-button";
import { deleteBuildAction, setBuildPublicAction } from "./actions";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function MyBuilds() {
    const session = await auth();

    if (!session?.user.id) {
        redirect('/login');
    }

    const builds = await getMyBuilds(session.user.id);

    return (
        <div className="py-6">
            <TypographyH3>Мои сборки</TypographyH3>
            <br />
            <div className="grid gap-4 lg:grid-cols-3">
                {
                    builds.length > 0 ? (
                        builds.map((build) => (
                            <BuildCard
                                key={build.id}
                                build={build}
                            >
                                <DeleteBuildButton buildId={build.id} deleteAction={deleteBuildAction}/>
                                <form action={setBuildPublicAction} className="contents">
                                    <input type="hidden" name="buildId" value={build.id}/>
                                    <input type="hidden" name="isPublic" value={build.isPublic ? "false" : "true"} />
                                    <Button
                                        type="submit"
                                        variant={`${build.isPublic ? 'default' : 'ghost'}`}
                                    >
                                        <Share2 className={`
                                            h-4 w-4 mr-1 ${build.isPublic ? 'fill-background' : ""}    
                                        `}/>
                                    </Button>
                                </form>
                            </BuildCard>
                        ))
                    ) : (
                        <p className="text-muted-foreground">Пока нет сохраненных сборок</p>
                    )
                }
            </div>
        </div>
    );
}
