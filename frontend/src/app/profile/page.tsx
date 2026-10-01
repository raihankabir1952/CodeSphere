"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Camera,
  CheckCircle2,
  Edit3,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Save,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

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

type PostAuthor = {
  id: string;
  name: string;
  avatar: string | null;
};

type Reply = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  replies: Reply[];
};

type Post = {
  id: string;
  content: string;
  image: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  comments: Comment[];
  _count: {
    likes: number;
    comments: number;
  };
};

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [name, setName] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [avatarUploading, setAvatarUploading] =
    useState(false);

  const [avatarDeleting, setAvatarDeleting] =
    useState(false);

  const [coverUploading, setCoverUploading] =
    useState(false);

  const [coverDeleting, setCoverDeleting] =
    useState(false);

  const [coverPreview, setCoverPreview] =
    useState<string | null>(null);

  const [coverFile, setCoverFile] =
    useState<File | null>(null);

  const [editingPostId, setEditingPostId] =
    useState<string | null>(null);

  const [editingContent, setEditingContent] =
    useState("");

  const [updatingPost, setUpdatingPost] =
    useState(false);

  const [deletingPostId, setDeletingPostId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const profileResponse =
        await api.get<Profile>(
          "/users/profile",
        );

      const profileData =
        profileResponse.data;

      setProfile(profileData);
      setName(profileData.name);
      setBio(profileData.bio || "");
      setCoverPreview(
        profileData.coverPhoto,
      );

      const postsResponse =
        await api.get<{
          data: Post[];
          meta: {
            total: number;
          };
        }>(
          `/users/${profileData.id}/posts`,
        );

      setPosts(postsResponse.data.data);
    } catch (err) {
      console.error(
        "Failed to load profile:",
        err,
      );

      setError(
        "Failed to load profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    loadProfile();
  }, [authLoading, user]);

  const handleProfileSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    try {
      setSavingProfile(true);
      setMessage("");

      const response =
        await api.patch<Profile>(
          "/users/profile",
          {
            name: name.trim(),
            bio: bio.trim(),
          },
        );

      setProfile(response.data);

      setName(response.data.name);
      setBio(response.data.bio || "");

      setMessage(
        "Profile updated successfully.",
      );
    } catch (err) {
      console.error(
        "Failed to update profile:",
        err,
      );

      setMessage(
        "Failed to update profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setAvatarUploading(true);
      setMessage("");

      const formData = new FormData();

      formData.append(
        "avatar",
        file,
      );

      const response =
        await api.post<Profile>(
          "/users/profile/avatar",
          formData,
        );

      setProfile(response.data);

      setMessage(
        "Profile photo updated successfully.",
      );
    } catch (err) {
      console.error(
        "Failed to upload avatar:",
        err,
      );

      setMessage(
        "Failed to upload profile photo.",
      );
    } finally {
      setAvatarUploading(false);

      event.target.value = "";
    }
  };

  const handleDeleteAvatar = async () => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete your profile photo?",
      );

    if (!confirmed) {
      return;
    }

    try {
      setAvatarDeleting(true);
      setMessage("");

      const response =
        await api.delete<Profile>(
          "/users/profile/avatar",
        );

      setProfile(response.data);

      setMessage(
        "Profile photo deleted successfully.",
      );
    } catch (err) {
      console.error(
        "Failed to delete avatar:",
        err,
      );

      setMessage(
        "Failed to delete profile photo.",
      );
    } finally {
      setAvatarDeleting(false);
    }
  };

  const handleCoverChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setCoverFile(file);

    const previewUrl =
      URL.createObjectURL(file);

    setCoverPreview(previewUrl);

    event.target.value = "";
  };

  const handleSaveCover = async () => {
    if (!coverFile) {
      setMessage(
        "Please select a cover photo first.",
      );

      return;
    }

    try {
      setCoverUploading(true);
      setMessage("");

      const formData = new FormData();

      formData.append(
        "cover",
        coverFile,
      );

      const response =
        await api.post<Profile>(
          "/users/profile/cover",
          formData,
        );

      setProfile(response.data);

      setCoverPreview(
        response.data.coverPhoto,
      );

      setCoverFile(null);

      setMessage(
        "Cover photo updated successfully.",
      );
    } catch (err) {
      console.error(
        "Failed to upload cover:",
        err,
      );

      setMessage(
        "Failed to update cover photo.",
      );
    } finally {
      setCoverUploading(false);
    }
  };

  const handleDeleteCover = async () => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete your cover photo?",
      );

    if (!confirmed) {
      return;
    }

    try {
      setCoverDeleting(true);
      setMessage("");

      const response =
        await api.delete<Profile>(
          "/users/profile/cover",
        );

      setProfile(response.data);

      setCoverPreview(null);
      setCoverFile(null);

      setMessage(
        "Cover photo deleted successfully.",
      );
    } catch (err) {
      console.error(
        "Failed to delete cover:",
        err,
      );

      setMessage(
        "Failed to delete cover photo.",
      );
    } finally {
      setCoverDeleting(false);
    }
  };

  const handleEditPost = (
    post: Post,
  ) => {
    setEditingPostId(post.id);
    setEditingContent(post.content);
    setMessage("");
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditingContent("");
  };

  const handleUpdatePost = async (
    postId: string,
  ) => {
    if (!editingContent.trim()) {
      setMessage(
        "Post content cannot be empty.",
      );

      return;
    }

    try {
      setUpdatingPost(true);
      setMessage("");

      const response =
        await api.patch<Post>(
          `/posts/${postId}`,
          {
            content:
              editingContent.trim(),
          },
        );

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                ...response.data,
              }
            : post,
        ),
      );

      setEditingPostId(null);
      setEditingContent("");

      setMessage(
        "Post updated successfully.",
      );
    } catch (err) {
      console.error(
        "Failed to update post:",
        err,
      );

      setMessage(
        "Failed to update post.",
      );
    } finally {
      setUpdatingPost(false);
    }
  };

  const handleDeletePost = async (
    postId: string,
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this post?",
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingPostId(postId);
      setMessage("");

      await api.delete(
        `/posts/${postId}`,
      );

      setPosts((currentPosts) =>
        currentPosts.filter(
          (post) =>
            post.id !== postId,
        ),
      );

      setMessage(
        "Post deleted successfully.",
      );
    } catch (err) {
      console.error(
        "Failed to delete post:",
        err,
      );

      setMessage(
        "Failed to delete post.",
      );
    } finally {
      setDeletingPostId(null);
    }
  };

  const formatDate = (
    date: string,
  ) => {
    return new Date(
      date,
    ).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <Loader2
            className="animate-spin text-cyan-400"
            size={32}
          />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <UserRound
              className="mx-auto mb-4 text-cyan-400"
              size={40}
            />

            <h1 className="text-2xl font-semibold">
              Please login first
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              You need to be logged in to view
              your profile.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-6">
          <div className="text-center">
            <p className="text-red-400">
              {error ||
                "Profile not found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {message && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-300">
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Profile Header */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          {/* Cover */}
          <div className="relative h-56 overflow-hidden bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950">
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Cover photo"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageIcon
                  size={48}
                  className="text-white/20"
                />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

            <div className="absolute right-4 top-4 flex flex-wrap gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm font-medium backdrop-blur transition hover:bg-black/70">
                <Camera size={16} />

                <span>
                  {coverPreview
                    ? "Change Cover"
                    : "Add Cover"}
                </span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleCoverChange
                  }
                  className="hidden"
                />
              </label>

              {coverFile && (
                <button
                  type="button"
                  onClick={
                    handleSaveCover
                  }
                  disabled={
                    coverUploading
                  }
                  className="flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {coverUploading ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={16} />
                  )}

                  <span>
                    {coverUploading
                      ? "Saving..."
                      : "Save Cover"}
                  </span>
                </button>
              )}

              {coverPreview && !coverFile && (
                <button
                  type="button"
                  onClick={
                    handleDeleteCover
                  }
                  disabled={
                    coverDeleting
                  }
                  className="flex items-center gap-2 rounded-lg bg-red-500/90 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {coverDeleting ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={16} />
                  )}

                  <span>
                    {coverDeleting
                      ? "Deleting..."
                      : "Delete"}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Profile info */}
          <div className="relative px-6 pb-6">
            <div className="-mt-16 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
                <div className="relative">
                  <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-slate-950 bg-slate-800">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UserRound
                          size={48}
                          className="text-slate-500"
                        />
                      </div>
                    )}
                  </div>

                  <label className="absolute bottom-1 right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-slate-950 bg-cyan-500 text-slate-950 transition hover:bg-cyan-400">
                    {avatarUploading ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Camera size={17} />
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleAvatarChange
                      }
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="pb-1">
                  <h1 className="text-3xl font-bold">
                    {profile.name}
                  </h1>

                  <p className="mt-1 text-sm text-slate-400">
                    {profile.email}
                  </p>

                  {profile.emailVerified && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle2 size={14} />
                      Email verified
                    </div>
                  )}
                </div>
              </div>

              {profile.avatar && (
                <button
                  type="button"
                  onClick={
                    handleDeleteAvatar
                  }
                  disabled={
                    avatarDeleting
                  }
                  className="flex items-center justify-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {avatarDeleting ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={16} />
                  )}

                  {avatarDeleting
                    ? "Deleting..."
                    : "Delete Profile Photo"}
                </button>
              )}
            </div>

            {profile.bio && (
              <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-300">
                {profile.bio}
              </p>
            )}
          </div>
        </section>

        {/* Profile Edit */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5 flex items-center gap-3">
            <Edit3 className="text-cyan-400" size={20} />

            <div>
              <h2 className="text-lg font-semibold">
                Edit Profile
              </h2>

              <p className="text-sm text-slate-400">
                Update your basic profile information.
              </p>
            </div>
          </div>

          <form
            onSubmit={
              handleProfileSubmit
            }
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Bio
              </label>

              <textarea
                value={bio}
                onChange={(event) =>
                  setBio(
                    event.target.value,
                  )
                }
                rows={4}
                placeholder="Tell the community about yourself..."
                className="w-full resize-none rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingProfile ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Save size={17} />
              )}

              {savingProfile
                ? "Saving..."
                : "Save Profile"}
            </button>
          </form>
        </section>

        {/* About */}
        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-5 text-lg font-semibold">
              About
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Name
                </p>

                <p className="mt-1 text-sm text-slate-200">
                  {profile.name}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Bio
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-300">
                  {profile.bio ||
                    "No bio added yet."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-5 text-lg font-semibold">
              Account Information
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Email
                </p>

                <p className="mt-1 text-sm text-slate-200">
                  {profile.email}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Email Status
                </p>

                <p
                  className={`mt-1 text-sm ${
                    profile.emailVerified
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                >
                  {profile.emailVerified
                    ? "Verified"
                    : "Not verified"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Joined
                </p>

                <p className="mt-1 text-sm text-slate-200">
                  {formatDate(
                    profile.createdAt,
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Posts */}
        <section className="mt-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                My Posts
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Manage your posts from your profile.
              </p>
            </div>

            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
              {posts.length} posts
            </span>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
              <MessageCircle
                className="mx-auto mb-3 text-slate-600"
                size={36}
              />

              <p className="text-slate-400">
                You have not created any posts yet.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => {
                const isEditing =
                  editingPostId ===
                  post.id;

                const isDeleting =
                  deletingPostId ===
                  post.id;

                return (
                  <article
                    key={post.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-800">
                          {post.author
                            .avatar ? (
                            <img
                              src={
                                post
                                  .author
                                  .avatar
                              }
                              alt={
                                post
                                  .author
                                  .name
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <UserRound
                                size={18}
                                className="text-slate-500"
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-semibold">
                            {post.author.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            {formatDate(
                              post.createdAt,
                            )}

                            {post.updatedAt !==
                              post.createdAt &&
                              " · Edited"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleEditPost(
                              post,
                            )
                          }
                          disabled={
                            isDeleting
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-400 disabled:opacity-50"
                          title="Edit post"
                        >
                          <Edit3
                            size={16}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeletePost(
                              post.id,
                            )
                          }
                          disabled={
                            isDeleting
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-400 disabled:opacity-50"
                          title="Delete post"
                        >
                          {isDeleting ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2
                              size={16}
                            />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      {isEditing ? (
                        <div className="space-y-3">
                          <textarea
                            value={
                              editingContent
                            }
                            onChange={(
                              event,
                            ) =>
                              setEditingContent(
                                event
                                  .target
                                  .value,
                              )
                            }
                            rows={5}
                            className="w-full resize-none rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm leading-6 outline-none transition focus:border-cyan-400"
                          />

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdatePost(
                                  post.id,
                                )
                              }
                              disabled={
                                updatingPost
                              }
                              className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
                            >
                              {updatingPost ? (
                                <Loader2
                                  size={
                                    16
                                  }
                                  className="animate-spin"
                                />
                              ) : (
                                <Save
                                  size={
                                    16
                                  }
                                />
                              )}

                              {updatingPost
                                ? "Saving..."
                                : "Save Changes"}
                            </button>

                            <button
                              type="button"
                              onClick={
                                handleCancelEdit
                              }
                              disabled={
                                updatingPost
                              }
                              className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
                            >
                              <X
                                size={16}
                              />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
                          {post.content}
                        </p>
                      )}
                    </div>

                    {post.image && (
                      <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                        <img
                          src={post.image}
                          alt="Post image"
                          className="max-h-[500px] w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-5 border-t border-white/10 pt-4 text-xs text-slate-500">
                      <span>
                        {post._count.likes}{" "}
                        {post._count.likes ===
                        1
                          ? "like"
                          : "likes"}
                      </span>

                      <span>
                        {post._count.comments}{" "}
                        {post._count.comments ===
                        1
                          ? "comment"
                          : "comments"}
                      </span>
                    </div>

                    {/* Comments */}
                    {post.comments &&
                      post.comments.length >
                        0 && (
                        <div className="mt-5 border-t border-white/10 pt-5">
                          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-300">
                            <MessageCircle
                              size={16}
                              className="text-cyan-400"
                            />

                            Comments
                          </h3>

                          <div className="space-y-4">
                            {post.comments.map(
                              (comment) => (
                                <div
                                  key={
                                    comment.id
                                  }
                                >
                                  <div className="flex gap-3">
                                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-800">
                                      {comment
                                        .user
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
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                          <UserRound
                                            size={
                                              14
                                            }
                                            className="text-slate-500"
                                          />
                                        </div>
                                      )}
                                    </div>

                                    <div className="min-w-0 flex-1 rounded-xl bg-slate-900/80 px-4 py-3">
                                      <p className="text-xs font-semibold text-slate-300">
                                        {
                                          comment
                                            .user
                                            .name
                                        }
                                      </p>

                                      <p className="mt-1 text-sm leading-6 text-slate-400">
                                        {
                                          comment.content
                                        }
                                      </p>

                                      <p className="mt-2 text-[11px] text-slate-600">
                                        {formatDate(
                                          comment.createdAt,
                                        )}

                                        {comment.updatedAt !==
                                          comment.createdAt &&
                                          " · Edited"}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Replies */}
                                  {comment
                                    .replies
                                    ?.length >
                                    0 && (
                                    <div className="ml-11 mt-3 space-y-3">
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
                                            <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-800">
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
                                                  className="h-full w-full object-cover"
                                                />
                                              ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                  <UserRound
                                                    size={
                                                      13
                                                    }
                                                    className="text-slate-500"
                                                  />
                                                </div>
                                              )}
                                            </div>

                                            <div className="min-w-0 flex-1 rounded-xl bg-slate-900/60 px-3 py-2">
                                              <p className="text-xs font-semibold text-slate-400">
                                                {
                                                  reply
                                                    .user
                                                    .name
                                                }
                                              </p>

                                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                                {
                                                  reply.content
                                                }
                                              </p>
                                            </div>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
