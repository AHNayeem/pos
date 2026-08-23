import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Next.js SignIn Page | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Signin Page TailAdmin Dashboard Template",
};

function SignInFallback() {
  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 dark:bg-gray-700"></div>
          <div className="h-4 bg-gray-200 rounded mb-8 dark:bg-gray-700"></div>
          <div className="space-y-4">
            <div className="h-11 bg-gray-200 rounded dark:bg-gray-700"></div>
            <div className="h-11 bg-gray-200 rounded dark:bg-gray-700"></div>
            <div className="h-11 bg-gray-200 rounded dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInForm />
    </Suspense>
  );
}
