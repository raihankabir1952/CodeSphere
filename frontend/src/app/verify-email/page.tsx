"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [message, setMessage] = useState(
    token ? "Verifying your email..." : "Invalid verification link.",
  );

  const [error, setError] = useState(!token);

  useEffect(() => {
    if (!token) {
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.get(`/auth/verify-email/${token}`);

        setMessage(response.data.message);
        setError(false);
      } catch (error: any) {
        console.error("Email verification error:", error);

        setError(true);

        setMessage(
          error?.response?.data?.message ||
            "Email verification failed.",
        );
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="mb-3 text-2xl font-bold">
          Email Verification
        </h1>

        <p className={error ? "text-red-500" : "text-green-600"}>
          {message}
        </p>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center">
            <h1 className="mb-3 text-2xl font-bold">
              Email Verification
            </h1>

            <p>Loading...</p>
          </div>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
