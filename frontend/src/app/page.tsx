"use client";

import { useState } from "react";
import Link from "next/link";

import { useAuth } from "@/context/AuthContext";
import CreatePost from "@/components/CreatePost";
import PostFeed from "@/components/PostFeed";

// import SocketTest from "@/components/SocketTest";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  const [postRefreshKey, setPostRefreshKey] = useState(0);

  // Prevent the page from briefly showing the logged-out
  // landing page while authentication is being checked.
  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">
          Loading...
        </div>
      </main>
    );
  }

  // Logged-in users see the social feed.
  if (isAuthenticated) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-slate-50">
        {/* <SocketTest /> */}
        <section className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
          {/* Feed Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              News Feed
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              See what developers in the community are sharing.
            </p>
          </div>

          {/* Create Post */}
          <CreatePost
            onPostCreated={() => {
              setPostRefreshKey((prev) => prev + 1);
            }}
          />

          {/* Posts */}
          <div className="mt-8">
            <PostFeed key={postRefreshKey} />
          </div>
        </section>
      </main>
    );
  }

  // Logged-out users see the landing page.
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium text-blue-600">
            Developer Community Platform
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Connect, Share and Grow with Developers
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-gray-600">
            CodeSphere is a community platform where developers
            can share knowledge, discuss ideas, discover other
            developers, and grow together.
          </p>

          <div className="mt-8 flex gap-4">
            <Link
              href="/register"
              className="rounded-md bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              Join CodeSphere
            </Link>

            <Link
              href="/login"
              className="rounded-md border px-5 py-3 text-sm font-medium hover:bg-gray-50"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Features
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              What you can do
            </h2>

            <p className="mt-3 text-gray-600">
              Everything you need to connect with developers and
              grow together as a community.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border bg-white p-6">
              <h3 className="text-lg font-bold text-gray-900">
                Share Knowledge
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Share programming knowledge, experiences,
                tutorials, and useful resources with the
                community.
              </p>
            </div>

            <div className="rounded-xl border bg-white p-6">
              <h3 className="text-lg font-bold text-gray-900">
                Connect with Developers
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Follow developers, discover new people, and
                build meaningful connections.
              </p>
            </div>

            <div className="rounded-xl border bg-white p-6">
              <h3 className="text-lg font-bold text-gray-900">
                Grow Together
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                Discuss ideas, ask questions, and learn from
                developers around you.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
