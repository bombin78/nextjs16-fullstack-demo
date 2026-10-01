// 1:20:42
import { auth } from "@/auth";
import { SignupForm } from "@/components/signup-form"
import { redirect } from "next/navigation";

export default async function Page() {
  // S:2:30:03
  const session = await auth();
  
  if (session?.user) {
    redirect('/dashboard');
  }
  // E:2:30:33

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  )
}
