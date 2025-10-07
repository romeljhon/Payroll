import RegisterForm from '../../components/auth/register-form';
import KazuPayGraphicalLogo from '@/components/icons/kazupay-graphical-logo';
import Link from 'next/link';
import Aurora from '@/components/auth/Aurora';

export default function RegisterPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Panel */}
      <div className="relative hidden lg:flex flex-col items-center justify-center bg-gray-900 text-white p-8 md:p-12">
        <Aurora />
        <div className="relative z-10 text-center">
          <Link href="/">
            <KazuPayGraphicalLogo className="h-16 w-auto mx-auto" />
          </Link>
          <h1 className="mt-6 text-3xl md:text-4xl font-extrabold tracking-tight">
            Join KazuPay
          </h1>
          <p className="mt-4 text-md md:text-lg text-gray-300 max-w-md mx-auto">
            Create an account to start managing your payroll with ease.
          </p>
        </div>
        <div className="absolute bottom-6 md:bottom-8 text-xs md:text-sm text-gray-400">
          &copy; {new Date().getFullYear()} KazuPay. All rights
          reserved.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-sm md:max-w-md">
          <div className="lg:hidden mb-6 md:mb-8 text-center">
            <Link href="/" className="inline-block">
              <KazuPayGraphicalLogo className="h-12 w-auto mx-auto" />
            </Link>
          </div>
          <RegisterForm />
          <p className="mt-6 md:mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
