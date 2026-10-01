"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Heart,
  Mail,
  MessageCircle,
  User,
} from "lucide-react";

import api from "@/lib/api";
import { useNotifications } from "@/context/NotificationContext";

type Profile = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  coverPhoto: string | null;
  bio: string | null;
  emailVerified: boolean;
  createdAt: string;
};

type UserComment = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  replies: UserComment[];
};

type UserPost = {
  id: string;
  content: string;
  image: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
  };
  comments: UserComment[];
  _count: {
    likes: number;
    comments: number;
  };
};

export default function UserProfilePage() {
  const params = useParams();

  const userId = params.id as string;

  const { onlineUsers } =
    useNotifications();

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [posts, setPosts] =
    useState<UserPost[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const isOnline =
    profile?.id
      ? onlineUsers.includes(profile.id)
      : false;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * Authorization header is now handled
         * automatically by the Axios interceptor
         * inside lib/api.ts.
         */

        const profileResponse =
          await api.get<Profile>(
            `/users/${userId}`,
          );

        setProfile(
          profileResponse.data,
        );

        const postsResponse =
          await api.get<{
            data: UserPost[];
            meta: {
              total: number;
            };
          }>(
            `/users/${userId}/posts`,
          );

        setPosts(
          postsResponse.data.data,
        );
      } catch (error: any) {
        console.error(
          "Public profile error:",
          error,
        );

        setError(
          error?.response?.data?.message ||
            "Failed to load profile.",
        );
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />

          <p className="text-sm text-slate-400">
            Loading profile...
          </p>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-4">
          <p className="text-sm text-red-400">
            {error ||
              "User not found."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:py-14">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-cyan-400">
            Developer Profile
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {profile.name}
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            View profile and shared posts.
          </p>
        </div>

        {/* Profile Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
          {/* Cover Photo */}
          <div className="relative h-40 overflow-hidden sm:h-52">
            {profile.coverPhoto ? (
              <img
                src={profile.coverPhoto}
                alt={`${profile.name}'s cover`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-purple-500/20" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
          </div>

          <div className="relative px-6 pb-7 sm:px-8">
            <div className="-mt-14 flex items-end gap-5">
              {/* Avatar */}
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-slate-900 bg-slate-800 text-3xl font-bold text-cyan-400 shadow-xl">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={`${profile.name}'s avatar`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profile.name
                    .charAt(0)
                    .toUpperCase()
                )}

                {/* Online indicator */}
                <span
                  className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-slate-900 ${
                    isOnline
                      ? "bg-emerald-500"
                      : "bg-slate-500"
                  }`}
                />
              </div>

              {/* Name */}
              <div className="pb-1">
                <h2 className="text-2xl font-bold">
                  {profile.name}
                </h2>

                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isOnline
                        ? "bg-emerald-500"
                        : "bg-slate-500"
                    }`}
                  />

                  <span
                    className={`text-xs font-medium ${
                      isOnline
                        ? "text-emerald-400"
                        : "text-slate-500"
                    }`}
                  >
                    {isOnline
                      ? "Online"
                      : "Offline"}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                  <Mail size={15} />

                  {profile.email}
                </div>
              </div>
            </div>

            {/* About */}
            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950/50 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <User size={18} />
                </div>

                <h3 className="font-semibold">
                  About
                </h3>
              </div>

              <p className="mt-4 leading-7 text-slate-400">
                {profile.bio ||
                  "No bio added yet."}
              </p>
            </div>

            {/* Account Information */}
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/50 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                  <CheckCircle2 size={18} />
                </div>

                <h3 className="font-semibold">
                  Account Information
                </h3>
              </div>

              <div className="mt-5 divide-y divide-slate-800">
                <div className="flex items-center justify-between py-4">
                  <span className="text-sm text-slate-500">
                    Email Verification
                  </span>

                  <span
                    className={`flex items-center gap-2 text-sm font-medium ${
                      profile.emailVerified
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    <CheckCircle2
                      size={16}
                    />

                    {profile.emailVerified
                      ? "Verified"
                      : "Not Verified"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-4">
                  <span className="text-sm text-slate-500">
                    Joined
                  </span>

                  <span className="text-sm text-slate-300">
                    {new Date(
                      profile.createdAt,
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Posts */}
            <div className="mt-8">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">
                    Posts
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Posts shared by{" "}
                    {profile.name}
                  </p>
                </div>

                <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400">
                  {posts.length}{" "}
                  {posts.length === 1
                    ? "post"
                    : "posts"}
                </span>
              </div>

              {posts.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-500">
                    <MessageCircle
                      size={22}
                    />
                  </div>

                  <h4 className="mt-4 font-semibold text-slate-300">
                    No posts yet
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    {profile.name} has not
                    shared any posts yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {posts.map((post) => (
                    <article
                      key={post.id}
                      className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50"
                    >
                      {/* Author */}
                      <div className="flex items-center gap-3 p-5 pb-3">
                        {post.author.avatar ? (
                          <img
                            src={
                              post.author.avatar
                            }
                            alt={
                              post.author.name
                            }
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-cyan-400">
                            {post.author.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-semibold text-slate-200">
                            {post.author.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            {new Date(
                              post.createdAt,
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="px-5 pb-4">
                        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                          {post.content}
                        </p>
                      </div>

                      {/* Image */}
                      {post.image && (
                        <div className="border-y border-slate-800">
                          <img
                            src={post.image}
                            alt="Post image"
                            className="max-h-[500px] w-full object-cover"
                          />
                        </div>
                      )}

                      {/* Counts */}
                      <div className="border-t border-slate-800 px-5 py-3">
                        <div className="flex items-center gap-5 text-sm text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Heart
                              size={16}
                            />

                            {
                              post._count
                                .likes
                            }
                          </span>

                          <span className="flex items-center gap-1.5">
                            <MessageCircle
                              size={16}
                            />

                            {
                              post._count
                                .comments
                            }
                          </span>
                        </div>

                        {/* Comments */}
                        {post.comments.length >
                          0 && (
                          <div className="mt-5 space-y-4">
                            {post.comments.map(
                              (comment) => (
                                <div
                                  key={
                                    comment.id
                                  }
                                  className="flex gap-3"
                                >
                                  {comment.user
                                    .avatar ? (
                                    <img
                                      src={
                                        comment
                                          .user
                                          .avatar
                                      }
                                      alt={
                                        comment
                                          .user
                                          .name
                                      }
                                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-cyan-400">
                                      {comment.user.name
                                        .charAt(
                                          0,
                                        )
                                        .toUpperCase()}
                                    </div>
                                  )}

                                  <div className="min-w-0 flex-1">
                                    <div className="rounded-xl bg-slate-900 px-4 py-3">
                                      <p className="text-sm font-semibold text-slate-200">
                                        {
                                          comment
                                            .user
                                            .name
                                        }
                                      </p>

                                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                                        {
                                          comment.content
                                        }
                                      </p>
                                    </div>

                                    <p className="mt-1 px-2 text-xs text-slate-600">
                                      {new Date(
                                        comment.createdAt,
                                      ).toLocaleString()}
                                    </p>

                                    {/* Replies */}
                                    {comment
                                      .replies
                                      ?.length >
                                      0 && (
                                      <div className="mt-4 space-y-4 border-l-2 border-slate-800 pl-4">
                                        {comment.replies.map(
                                          (
                                            reply,
                                          ) => (
                                            <div
                                              key={
                                                reply.id
                                              }
                                              className="flex gap-3"
                                            >
                                              {reply
                                                .user
                                                .avatar ? (
                                                <img
                                                  src={
                                                    reply
                                                      .user
                                                      .avatar
                                                  }
                                                  alt={
                                                    reply
                                                      .user
                                                      .name
                                                  }
                                                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                                                />
                                              ) : (
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-cyan-400">
                                                  {reply.user.name
                                                    .charAt(
                                                      0,
                                                    )
                                                    .toUpperCase()}
                                                </div>
                                              )}

                                              <div className="min-w-0 flex-1">
                                                <div className="rounded-xl bg-slate-900/80 px-4 py-3">
                                                  <p className="text-sm font-semibold text-slate-200">
                                                    {
                                                      reply
                                                        .user
                                                        .name
                                                    }
                                                  </p>

                                                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                                                    {
                                                      reply.content
                                                    }
                                                  </p>
                                                </div>

                                                <p className="mt-1 px-2 text-xs text-slate-600">
                                                  {new Date(
                                                    reply.createdAt,
                                                  ).toLocaleString()}
                                                </p>
                                              </div>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
