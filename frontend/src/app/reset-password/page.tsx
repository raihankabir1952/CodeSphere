"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState(
    token ? "" : "Invalid password reset link.",
  );

  const [error, setError] = useState(!token);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      setError(true);
      setMessage("Invalid password reset link.");
      return;
    }

    if (password !== confirmPassword) {
      setError(true);
      setMessage("Passwords do not match.");
      return;
    }

    setMessage("");
    setError(false);
    setLoading(true);

    try {
      const response = await api.post(
        `/auth/reset-password/${token}`,
        {
          password,
        },
      );

      setError(false);
      setSuccess(true);
      setMessage(response.data.message);

      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Reset password error:", error);

      setError(true);

      setMessage(
        error?.response?.data?.message ||
          "Password reset failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold">
          Reset Password
        </h1>

        <p className="mb-6 text-sm text-gray-600">
          Enter your new password below.
        </p>

        {!error || token ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium"
              >
                New Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={6}
                required
                className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium"
              >
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirm new password"
                minLength={6}
                required
                className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        ) : null}

        {/* Message */}
        {message && (
          <div
            className={`mt-4 rounded-md p-3 ${
              error ? "bg-red-50" : "bg-green-50"
            }`}
          >
            <p
              className={`text-sm ${
                error ? "text-red-600" : "text-green-600"
              }`}
            >
              {message}
            </p>
          </div>
        )}

        {/* Login after successful reset */}
        {success && (
          <Link
            href="/login"
            className="mt-4 block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700"
          >
            Go to Login
          </Link>
        )}

        {/* Forgot Password */}
        {!success && (
          <p className="mt-6 text-center text-sm text-gray-600">
            Need a new reset link?{" "}
            <Link
              href="/forgot-password"
              className="font-medium text-blue-600 hover:underline"
            >
              Forgot Password
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center">
            <h1 className="mb-3 text-2xl font-bold">
              Reset Password
            </h1>

            <p>Loading...</p>
          </div>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}