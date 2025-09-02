import RegisterForm from "../../components/auth/register-form";
import KazuPaySolutionsLogo from "@/components/icons/payease-logo";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <KazuPaySolutionsLogo className="h-12 w-auto text-primary mx-auto" />
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-primary font-headline">
            Create your KazuPay Solutions  Account
          </h1>
          <p className="mt-2 text-muted-foreground">
            Fill in your details to get started.
          </p>
        </div>

        <RegisterForm />

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
