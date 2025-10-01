"use client";

import { useEffect } from "react";
import LoginForm from "@/components/auth/login-form";
import KazuPaySolutionsLogo from "@/components/icons/payease-logo";
import Link from "next/link";
import Aurora from "@/components/auth/Aurora";

export default function LoginPage() {
  // useEffect(() => {
  //   const pingServer = async () => {
  //     try {
  //       await fetch("https://payroll-3m6o.onrender.com", { method: "GET" });
  //       console.log("Pinged Render server ✅");
  //     } catch (err) {
  //       console.error("Ping failed ❌", err);
  //     }
  //   };

  //   // run only if we are on LoginPage
  //   pingServer(); // immediate ping

  //   const interval = setInterval(pingServer, 50 * 1000);

  //   return () => clearInterval(interval); // stop when leaving login page
  // }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-transparent p-4">
      <Aurora/>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            {/* <KazuPaySolutionsLogo className="h-12 w-auto max-w-full text-primary mx-auto" /> */}
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-primary font-headline whitespace-nowrap">
            Welcome to KazuPay Solutions
          </h1>

          <p className="mt-2 text-muted-foreground">
            Sign in to access your payroll dashboard.
          </p>
        </div>

        <LoginForm />

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-accent hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
