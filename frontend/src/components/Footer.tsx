import Link from "next/link";
import { Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="flex items-center gap-2"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
                C
              </div>

              <span className="text-lg font-bold tracking-tight text-slate-900">
                Code<span className="text-cyan-600">Sphere</span>
              </span>
            </Link>

            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
              A developer community where people can share
              knowledge, connect with others, and grow together.
            </p>
          </div>

          {/* Contact */}
          <a
            href="mailto:hello@codesphere.dev"
            aria-label="Email"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <Mail size={18} />
          </a>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="text-center text-xs text-slate-400">
            © {new Date().getFullYear()} CodeSphere. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
