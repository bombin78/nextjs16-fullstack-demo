import { auth } from "@/auth";
import { getBuildToEdit } from "@/lib/builds";
import { redirect } from "next/navigation";
import { EditBuildForm } from "./components/exit-build-form";

type Props = PageProps<'/builds/[buildId]/edit'>

export default async function EditBuildPage({
    // params — промис со значениями динамических сегментов адреса.
    // В Next.js 16 params доступен только асинхронно: через await в async
    // серверном компоненте или через use() из React. В Next.js 14 params был
    // обычным объектом, в Next.js 15 синхронный доступ ещё работал.
    params
}: Props) {
    const session = await auth();

    if (!session?.user.id) {
        redirect('/login');
    }

    const { buildId } = await params;

    const build = await getBuildToEdit(buildId);

    if (!build) {
        return;
    }

    const buildComponents = build.components.map((item) => ({
        id: item.component.id,
        name: item.component.name,
        price: item.component.price,
        type:  item.component.type,
        socket:  item.component.socket
    }));

    return (
        <div className="py-6">
            <EditBuildForm
                buildName={build.name}
                buildComponents={buildComponents}
            />
        </div>
    );
}
