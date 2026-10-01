// 1:25:57
import { auth } from "@/auth"
import { LoginForm } from "@/components/login-form"
import { redirect } from "next/navigation";

export default async function Page() {
  // S:2:28:42
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }
  // E:2:30:02

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
