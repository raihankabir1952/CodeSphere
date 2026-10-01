"use client";

import Link from "next/link";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  Heart,
  Loader2,
  MessageCircle,
  Pencil,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";

import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import socket from "@/lib/socket";

type Post = {
  id: string;
  content: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;

  author: {
    id: string;
    name: string;
    avatar: string | null;
  };

  likeCount: number;
  commentCount: number;
  likedByCurrentUser: boolean;
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

  replies: Comment[];
};

type PostsResponse = {
  data: Post[];

  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export default function PostFeed() {
  const { user } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [likingPostId, setLikingPostId] =
    useState<string | null>(null);

  const [openCommentPostId, setOpenCommentPostId] =
    useState<string | null>(null);

  const [comments, setComments] = useState<
    Record<string, Comment[]>
  >({});

  const [commentsLoading, setCommentsLoading] =
    useState<string | null>(null);

  const [replyText, setReplyText] = useState("");

  const [commentText, setCommentText] = useState<
    Record<string, string>
  >({});

  const [
    commentSubmittingPostId,
    setCommentSubmittingPostId,
  ] = useState<string | null>(null);

  const [editingCommentId, setEditingCommentId] =
    useState<string | null>(null);

  const [editingCommentText, setEditingCommentText] =
    useState("");

  const [commentUpdatingId, setCommentUpdatingId] =
    useState<string | null>(null);

  const [commentDeletingId, setCommentDeletingId] =
    useState<string | null>(null);

  const [replyingToCommentId, setReplyingToCommentId] =
    useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [userSuggestions, setUserSuggestions] = useState<
    {
      id: string;
      name: string;
      avatar: string | null;
    }[]
  >([]);

  const [showSuggestions, setShowSuggestions] =
    useState(false);

  /* ---------------- Fetch Posts ---------------- */

  const fetchPosts = useCallback(
    async (
      pageNumber = 1,
      append = false,
      searchValue = search,
    ) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        setError("");

        const token =
          localStorage.getItem("accessToken");

        const response =
          await api.get<PostsResponse>(
            `/posts?page=${pageNumber}&limit=10&search=${encodeURIComponent(
              searchValue,
            )}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

        const newPosts = response.data.data;

        if (append) {
          setPosts((currentPosts) => [
            ...currentPosts,
            ...newPosts,
          ]);
        } else {
          setPosts(newPosts);
        }

        setPage(response.data.meta.page);

        setHasMore(
          response.data.meta.page <
          response.data.meta.totalPages,
        );
      } catch (error: any) {
        console.error(
          "Fetch posts error:",
          error,
        );

        setError(
          error?.response?.data?.message ||
          "Failed to load posts.",
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search],
  );

  useEffect(() => {
    fetchPosts(1, false, search);
  }, [fetchPosts, search]);

  /* ---------------- Real-time Like Update ---------------- */

  useEffect(() => {
    const handleLikeUpdated = (data: {
      postId: string;
      liked: boolean;
      likeCount: number;
    }) => {
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === data.postId
            ? {
              ...post,
              likeCount: data.likeCount,
            }
            : post,
        ),
      );
    };

    socket.on(
      "likeUpdated",
      handleLikeUpdated,
    );

    return () => {
      socket.off(
        "likeUpdated",
        handleLikeUpdated,
      );
    };
  }, []);


  /* ---------------- Real-time Comment Update ---------------- */

  useEffect(() => {
    const handleCommentCreated = (data: {
      postId: string;
      comment: Comment;
    }) => {
      const { postId, comment } = data;

      if (comment.userId === user?.id) {
        return;
      }

      setComments((currentComments) => {
        const existingComments =
          currentComments[postId] || [];

        // Prevent duplicate comment
        if (existingComments.some((item) => item.id === comment.id)) {
          return currentComments;
        }

        // Normal comment
        if (!comment.parentId) {
          return {
            ...currentComments,
            [postId]: [
              ...existingComments,
              comment,
            ],
          };
        }

        // Reply
        return {
          ...currentComments,
          [postId]: existingComments.map(
            (item) =>
              item.id === comment.parentId
                ? {
                  ...item,
                  replies: [
                    ...(item.replies || []),
                    comment,
                  ],
                }
                : item,
          ),
        };
      });

      // Update comment count
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
              ...post,
              commentCount:
                post.commentCount + 1,
            }
            : post,
        ),
      );
    };

    socket.on(
      "commentCreated",
      handleCommentCreated,
    );

    return () => {
      socket.off(
        "commentCreated",
        handleCommentCreated,
      );
    };
  }, []);





  /* ---------------- People Search ---------------- */

  useEffect(() => {
    const searchUsers = async () => {
      const value = searchInput.trim();

      if (!value) {
        setUserSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const response = await api.get<{
          data: {
            id: string;
            name: string;
            avatar: string | null;
          }[];
        }>(
          `/users/search?q=${encodeURIComponent(value)}`,
        );

        setUserSuggestions(response.data.data);
        setShowSuggestions(true);
      } catch (error) {
        console.error(
          "Search users error:",
          error,
        );

        setUserSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ---------------- Load More ---------------- */

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    await fetchPosts(page + 1, true);
  };

  /* ---------------- Like ---------------- */

  const handleLike = async (postId: string) => {
    if (likingPostId) return;

    try {
      setLikingPostId(postId);

      const token =
        localStorage.getItem("accessToken");

      const response = await api.post<{
        liked: boolean;
        likeCount: number;
      }>(
        `/likes/${postId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const { liked, likeCount } =
        response.data;

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
              ...post,
              likedByCurrentUser: liked,
              likeCount,
            }
            : post,
        ),
      );
    } catch (error: any) {
      console.error("Like error:", error);

      setError(
        error?.response?.data?.message ||
        "Failed to update like.",
      );
    } finally {
      setLikingPostId(null);
    }
  };

  /* ---------------- Comments ---------------- */

  const handleCommentToggle = async (
    postId: string,
  ) => {
    if (openCommentPostId === postId) {
      setOpenCommentPostId(null);
      setEditingCommentId(null);
      return;
    }

    setOpenCommentPostId(postId);

    if (comments[postId]) {
      return;
    }

    try {
      setCommentsLoading(postId);

      const response = await api.get<{
        data: Comment[];
        meta: {
          total: number;
        };
      }>(`/comments/${postId}`);

      setComments((currentComments) => ({
        ...currentComments,
        [postId]: response.data.data,
      }));
    } catch (error: any) {
      console.error(
        "Fetch comments error:",
        error,
      );

      setError(
        error?.response?.data?.message ||
        "Failed to load comments.",
      );
    } finally {
      setCommentsLoading(null);
    }
  };

  const handleCommentSubmit = async (
    e: FormEvent<HTMLFormElement>,
    postId: string,
  ) => {
    e.preventDefault();

    const text =
      commentText[postId]?.trim();

    if (!text) return;

    if (commentSubmittingPostId) return;

    try {
      setCommentSubmittingPostId(postId);
      setError("");

      const token =
        localStorage.getItem("accessToken");

      const response =
        await api.post<Comment>(
          `/comments/${postId}`,
          {
            content: text,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

      const newComment = response.data;

      setComments((currentComments) => ({
        ...currentComments,
        [postId]: [
          ...(currentComments[postId] || []),
          newComment,
        ],
      }));

      setCommentText((currentText) => ({
        ...currentText,
        [postId]: "",
      }));

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
              ...post,
              commentCount:
                post.commentCount + 1,
            }
            : post,
        ),
      );
    } catch (error: any) {
      console.error(
        "Create comment error:",
        error,
      );

      setError(
        error?.response?.data?.message ||
        "Failed to create comment.",
      );
    } finally {
      setCommentSubmittingPostId(null);
    }
  };

  /* ---------------- Reply ---------------- */

  const handleReplySubmit = async (
    postId: string,
    parentId: string,
  ) => {
    const text = replyText.trim();

    if (!text) return;

    try {
      const token =
        localStorage.getItem("accessToken");

      if (!token) return;

      setError("");

      await api.post<Comment>(
        `/comments/${postId}`,
        {
          content: text,
          parentId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setReplyText("");
      setReplyingToCommentId(null);

      const response = await api.get<{
        data: Comment[];
        meta: {
          total: number;
        };
      }>(`/comments/${postId}`);

      setComments((prev) => ({
        ...prev,
        [postId]: response.data.data,
      }));

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
              ...post,
              commentCount:
                post.commentCount + 1,
            }
            : post,
        ),
      );
    } catch (error: any) {
      console.error("Reply error:", error);

      setError(
        error?.response?.data?.message ||
        "Failed to create reply.",
      );
    }
  };

  /* ---------------- Edit Comment ---------------- */

  const startEditingComment = (
    comment: Comment,
  ) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const handleCommentUpdate = async (
    e: FormEvent<HTMLFormElement>,
    postId: string,
    commentId: string,
  ) => {
    e.preventDefault();

    const text = editingCommentText.trim();

    if (!text) return;

    try {
      setCommentUpdatingId(commentId);
      setError("");

      const token =
        localStorage.getItem("accessToken");

      const response = await api.patch<Comment>(
        `/comments/${commentId}`,
        {
          content: text,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const updatedComment = response.data;

      setComments((currentComments) => ({
        ...currentComments,
        [postId]: currentComments[postId].map(
          (comment) => {
            if (comment.id === commentId) {
              return updatedComment;
            }

            return {
              ...comment,
              replies: comment.replies.map(
                (reply) =>
                  reply.id === commentId
                    ? updatedComment
                    : reply,
              ),
            };
          },
        ),
      }));

      cancelEditingComment();
    } catch (error: any) {
      console.error(
        "Update comment error:",
        error,
      );

      setError(
        error?.response?.data?.message ||
        "Failed to update comment.",
      );
    } finally {
      setCommentUpdatingId(null);
    }
  };

  /* ---------------- Delete Comment ---------------- */

  const handleCommentDelete = async (
    postId: string,
    commentId: string,
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this comment?",
    );

    if (!confirmed) return;

    try {
      setCommentDeletingId(commentId);
      setError("");

      const token =
        localStorage.getItem("accessToken");

      await api.delete(
        `/comments/${commentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setComments((currentComments) => ({
        ...currentComments,
        [postId]: currentComments[postId]
          .filter(
            (comment) =>
              comment.id !== commentId,
          )
          .map((comment) => ({
            ...comment,
            replies: comment.replies.filter(
              (reply) =>
                reply.id !== commentId,
            ),
          })),
      }));

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
              ...post,
              commentCount: Math.max(
                0,
                post.commentCount - 1,
              ),
            }
            : post,
        ),
      );

      if (
        editingCommentId === commentId
      ) {
        cancelEditingComment();
      }
    } catch (error: any) {
      console.error(
        "Delete comment error:",
        error,
      );

      setError(
        error?.response?.data?.message ||
        "Failed to delete comment.",
      );
    } finally {
      setCommentDeletingId(null);
    }
  };

  /* ---------------- Loading ---------------- */

  if (loading) {
    return (
      <div className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-indigo-50 p-10 shadow-sm">
        <div className="flex flex-col items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-200">
            <Loader2
              size={26}
              className="animate-spin"
            />
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Loading your feed...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Discover what the community is sharing.
          </p>
        </div>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="rounded-3xl border border-red-100 bg-gradient-to-br from-red-50 to-orange-50 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <X size={19} />
          </div>

          <div>
            <p className="text-sm font-bold text-red-700">
              Something went wrong
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-indigo-50 p-5 shadow-sm sm:p-6">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-200/30 blur-2xl" />

        <div className="pointer-events-none absolute -bottom-12 right-20 h-28 w-28 rounded-full bg-indigo-200/30 blur-2xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-200">
                <MessageCircle size={20} />
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  News Feed
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  See what developers are sharing.
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="flex w-full gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:w-72">
              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                }}
                onFocus={() => {
                  if (
                    userSuggestions.length > 0
                  ) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder="Search people or posts..."
                className="w-full rounded-xl border border-slate-200 bg-white/90 py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10"
              />

              {/* Suggestions */}
              {showSuggestions &&
                userSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-indigo-50 px-4 py-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-600">
                        People
                      </p>
                    </div>

                    {userSuggestions.map(
                      (suggestedUser) => (
                        <button
                          key={suggestedUser.id}
                          type="button"
                          onClick={() => {
                            setSearchInput(
                              suggestedUser.name,
                            );

                            setShowSuggestions(false);

                            window.location.href = `/profile/${suggestedUser.id}`;
                          }}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-cyan-50/60"
                        >
                          {suggestedUser.avatar ? (
                            <img
                              src={
                                suggestedUser.avatar
                              }
                              alt={
                                suggestedUser.name
                              }
                              className="h-9 w-9 rounded-full object-cover ring-2 ring-cyan-100"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-sm font-bold text-white">
                              {suggestedUser.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                          <span className="text-sm font-semibold text-slate-800">
                            {
                              suggestedUser.name
                            }
                          </span>
                        </button>
                      ),
                    )}
                  </div>
                )}
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch(searchInput.trim());
                setPage(1);
                setPosts([]);
                setShowSuggestions(false);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-200 transition hover:from-cyan-600 hover:to-indigo-700 active:scale-[0.98]"
            >
              <Search size={16} />
              Search
            </button>
          </div>
        </div>
      </div>

      {/* ================= EMPTY ================= */}
      {!loading && posts.length === 0 && (
        <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-indigo-100 text-indigo-600">
            <Search size={23} />
          </div>

          <p className="mt-4 text-sm font-bold text-slate-700">
            No posts found
          </p>

          {search && (
            <p className="mt-1 text-sm text-slate-500">
              No posts matched "{search}".
            </p>
          )}

          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSearchInput("");
                setPage(1);
                setPosts([]);
              }}
              className="mt-5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* ================= POSTS ================= */}
      {posts.map((post) => (
        <article
          key={post.id}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-[1px] hover:shadow-lg"
        >
          {/* Colorful top accent */}
          <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600" />

          {/* Author */}
          <div className="bg-gradient-to-r from-cyan-50/50 via-white to-indigo-50/50 p-5 pb-4 sm:px-6">
            <Link
              href={`/profile/${post.author.id}`}
              className="group inline-flex items-center gap-3 rounded-2xl p-1.5 transition hover:bg-white/80"
            >
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-cyan-100 transition group-hover:ring-cyan-300"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                  {post.author.name
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-slate-900 transition group-hover:text-cyan-600">
                  {post.author.name}
                </h3>

                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                  <CalendarDays size={13} />

                  <time dateTime={post.createdAt}>
                    {new Date(
                      post.createdAt,
                    ).toLocaleString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              </div>
            </Link>
          </div>

          {/* Content */}
          <div className="px-5 py-5 sm:px-6">
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {post.content}
            </p>
          </div>

          {/* Image */}
          {post.image && (
            <div className="border-y border-slate-100 bg-slate-50">
              <img
                src={post.image}
                alt="Post image"
                className="max-h-[520px] w-full object-cover"
              />
            </div>
          )}

          {/* Actions */}
          <div className="px-5 pb-5 sm:px-6">
            <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-cyan-50/50 p-1.5">
              <div className="flex items-center gap-1">
                {/* Like */}
                <button
                  type="button"
                  onClick={() =>
                    handleLike(post.id)
                  }
                  disabled={
                    likingPostId === post.id
                  }
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${post.likedByCurrentUser
                      ? "bg-red-100 text-red-500 shadow-sm"
                      : "text-slate-500 hover:bg-white hover:text-red-500 hover:shadow-sm"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {likingPostId === post.id ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Heart
                      size={18}
                      fill={
                        post.likedByCurrentUser
                          ? "currentColor"
                          : "none"
                      }
                    />
                  )}

                  <span>
                    {post.likeCount > 0
                      ? post.likeCount
                      : "Like"}
                  </span>
                </button>

                {/* Comment */}
                <button
                  type="button"
                  onClick={() =>
                    handleCommentToggle(
                      post.id,
                    )
                  }
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${openCommentPostId ===
                      post.id
                      ? "bg-cyan-100 text-cyan-600 shadow-sm"
                      : "text-slate-500 hover:bg-white hover:text-cyan-600 hover:shadow-sm"
                    }`}
                >
                  <MessageCircle size={18} />

                  <span>
                    {post.commentCount > 0
                      ? `${post.commentCount} Comment`
                      : "Comment"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ================= COMMENTS ================= */}
          {openCommentPostId === post.id && (
            <div className="border-t border-cyan-100 bg-gradient-to-br from-cyan-50/50 via-white to-indigo-50/40 px-5 py-5 sm:px-6">
              {/* Comment Input */}
              <form
                onSubmit={(e) =>
                  handleCommentSubmit(
                    e,
                    post.id,
                  )
                }
                className="mb-5 rounded-2xl border border-cyan-100 bg-white p-3 shadow-sm"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={
                      commentText[post.id] || ""
                    }
                    onChange={(e) =>
                      setCommentText(
                        (currentText) => ({
                          ...currentText,
                          [post.id]:
                            e.target.value,
                        }),
                      )
                    }
                    placeholder="Write a comment..."
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                  />

                  <button
                    type="submit"
                    disabled={
                      !commentText[
                        post.id
                      ]?.trim() ||
                      commentSubmittingPostId ===
                      post.id
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-200 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Submit comment"
                  >
                    {commentSubmittingPostId ===
                      post.id ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Send size={17} />
                    )}
                  </button>
                </div>
              </form>

              {/* Comments Loading */}
              {commentsLoading === post.id ? (
                <div className="flex justify-center py-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
                    <Loader2
                      size={21}
                      className="animate-spin"
                    />
                  </div>
                </div>
              ) : comments[post.id]?.length ? (
                <div className="space-y-5">
                  {comments[post.id].map(
                    (comment) => {
                      const isOwnComment =
                        user?.id ===
                        comment.user.id;

                      const isEditing =
                        editingCommentId ===
                        comment.id;

                      return (
                        <div
                          key={comment.id}
                          className="flex gap-3"
                        >
                          {/* Avatar */}
                          {comment.user.avatar ? (
                            <img
                              src={
                                comment.user
                                  .avatar
                              }
                              alt={
                                comment.user
                                  .name
                              }
                              className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 text-xs font-bold text-white">
                              {comment.user.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            {/* Comment Bubble */}
                            <div className="rounded-2xl rounded-tl-md border border-slate-100 bg-white px-4 py-3 shadow-sm">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <p className="text-sm font-bold text-slate-900">
                                  {
                                    comment.user
                                      .name
                                  }
                                </p>

                                <span className="text-xs text-slate-400">
                                  {new Date(
                                    comment.createdAt,
                                  ).toLocaleString(
                                    "en-US",
                                    {
                                      month:
                                        "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "numeric",
                                      minute:
                                        "2-digit",
                                    },
                                  )}
                                </span>

                                {comment.updatedAt !==
                                  comment.createdAt && (
                                    <span className="text-xs text-cyan-500">
                                      edited
                                    </span>
                                  )}
                              </div>

                              {/* Editing */}
                              {isEditing ? (
                                <form
                                  onSubmit={(e) =>
                                    handleCommentUpdate(
                                      e,
                                      post.id,
                                      comment.id,
                                    )
                                  }
                                  className="mt-3"
                                >
                                  <textarea
                                    value={
                                      editingCommentText
                                    }
                                    onChange={(e) =>
                                      setEditingCommentText(
                                        e.target
                                          .value,
                                      )
                                    }
                                    rows={3}
                                    autoFocus
                                    className="w-full resize-none rounded-xl border border-cyan-400 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-4 ring-cyan-500/10"
                                  />

                                  <div className="mt-2 flex items-center gap-2">
                                    <button
                                      type="submit"
                                      disabled={
                                        !editingCommentText.trim() ||
                                        commentUpdatingId ===
                                        comment.id
                                      }
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                                    >
                                      {commentUpdatingId ===
                                        comment.id ? (
                                        <Loader2
                                          size={
                                            14
                                          }
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <Pencil
                                          size={
                                            14
                                          }
                                        />
                                      )}

                                      Save
                                    </button>

                                    <button
                                      type="button"
                                      onClick={
                                        cancelEditingComment
                                      }
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                                    >
                                      <X
                                        size={14}
                                      />

                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                  {
                                    comment.content
                                  }
                                </p>
                              )}
                            </div>

                            {/* Comment Actions */}
                            {!isEditing && (
                              <div className="mt-2 flex items-center gap-4 px-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingToCommentId(
                                      replyingToCommentId ===
                                        comment.id
                                        ? null
                                        : comment.id,
                                    );

                                    setReplyText("");
                                  }}
                                  className="text-xs font-semibold text-slate-400 transition hover:text-cyan-600"
                                >
                                  Reply
                                </button>

                                {isOwnComment && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        startEditingComment(
                                          comment,
                                        )
                                      }
                                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-cyan-600"
                                    >
                                      <Pencil
                                        size={
                                          12
                                        }
                                      />
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCommentDelete(
                                          post.id,
                                          comment.id,
                                        )
                                      }
                                      disabled={
                                        commentDeletingId ===
                                        comment.id
                                      }
                                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-red-500 disabled:opacity-50"
                                    >
                                      {commentDeletingId ===
                                        comment.id ? (
                                        <Loader2
                                          size={
                                            12
                                          }
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <Trash2
                                          size={
                                            12
                                          }
                                        />
                                      )}
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Reply Input */}
                            {replyingToCommentId ===
                              comment.id && (
                                <div className="mt-3 rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-indigo-50 p-3">
                                  <textarea
                                    rows={2}
                                    value={replyText}
                                    onChange={(e) =>
                                      setReplyText(
                                        e.target
                                          .value,
                                      )
                                    }
                                    placeholder={`Reply to ${comment.user.name}...`}
                                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none shadow-sm focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10"
                                  />

                                  <div className="mt-2 flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleReplySubmit(
                                          post.id,
                                          comment.id,
                                        )
                                      }
                                      disabled={
                                        !replyText.trim()
                                      }
                                      className="rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                                    >
                                      Reply
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setReplyingToCommentId(
                                          null,
                                        )
                                      }
                                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}

                            {/* Replies */}
                            {comment.replies?.length >
                              0 && (
                                <div className="mt-4 ml-2 space-y-4 border-l-2 border-cyan-100 pl-4">
                                  {comment.replies.map(
                                    (reply) => {
                                      const isOwnReply =
                                        user?.id ===
                                        reply.user.id;

                                      const isEditingReply =
                                        editingCommentId ===
                                        reply.id;

                                      return (
                                        <div
                                          key={
                                            reply.id
                                          }
                                          className="flex gap-3"
                                        >
                                          {reply.user
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
                                              className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white"
                                            />
                                          ) : (
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                                              {reply
                                                .user
                                                .name
                                                .charAt(
                                                  0,
                                                )
                                                .toUpperCase()}
                                            </div>
                                          )}

                                          <div className="min-w-0 flex-1">
                                            <div className="rounded-2xl rounded-tl-md border border-indigo-100 bg-indigo-50/50 px-4 py-3">
                                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                <p className="text-xs font-bold text-slate-900">
                                                  {
                                                    reply
                                                      .user
                                                      .name
                                                  }
                                                </p>

                                                <span className="text-[11px] text-slate-400">
                                                  {new Date(
                                                    reply.createdAt,
                                                  ).toLocaleString(
                                                    "en-US",
                                                    {
                                                      month:
                                                        "short",
                                                      day: "numeric",
                                                      year: "numeric",
                                                      hour: "numeric",
                                                      minute:
                                                        "2-digit",
                                                    },
                                                  )}
                                                </span>

                                                {reply.updatedAt !==
                                                  reply.createdAt && (
                                                    <span className="text-[11px] text-indigo-500">
                                                      edited
                                                    </span>
                                                  )}
                                              </div>

                                              {isEditingReply ? (
                                                <form
                                                  onSubmit={(
                                                    e,
                                                  ) =>
                                                    handleCommentUpdate(
                                                      e,
                                                      post.id,
                                                      reply.id,
                                                    )
                                                  }
                                                  className="mt-2"
                                                >
                                                  <textarea
                                                    value={
                                                      editingCommentText
                                                    }
                                                    onChange={(
                                                      e,
                                                    ) =>
                                                      setEditingCommentText(
                                                        e
                                                          .target
                                                          .value,
                                                      )
                                                    }
                                                    rows={
                                                      2
                                                    }
                                                    autoFocus
                                                    className="w-full resize-none rounded-xl border border-indigo-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-4 ring-indigo-500/10"
                                                  />

                                                  <div className="mt-2 flex items-center gap-2">
                                                    <button
                                                      type="submit"
                                                      disabled={
                                                        !editingCommentText.trim() ||
                                                        commentUpdatingId ===
                                                        reply.id
                                                      }
                                                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                                                    >
                                                      {commentUpdatingId ===
                                                        reply.id ? (
                                                        <Loader2
                                                          size={
                                                            14
                                                          }
                                                          className="animate-spin"
                                                        />
                                                      ) : (
                                                        <Pencil
                                                          size={
                                                            14
                                                          }
                                                        />
                                                      )}

                                                      Save
                                                    </button>

                                                    <button
                                                      type="button"
                                                      onClick={
                                                        cancelEditingComment
                                                      }
                                                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
                                                    >
                                                      Cancel
                                                    </button>
                                                  </div>
                                                </form>
                                              ) : (
                                                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                                  {
                                                    reply.content
                                                  }
                                                </p>
                                              )}
                                            </div>

                                            {!isEditingReply &&
                                              isOwnReply && (
                                                <div className="mt-2 flex items-center gap-3 px-2">
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      startEditingComment(
                                                        reply,
                                                      )
                                                    }
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-indigo-600"
                                                  >
                                                    <Pencil
                                                      size={
                                                        12
                                                      }
                                                    />
                                                    Edit
                                                  </button>

                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleCommentDelete(
                                                        post.id,
                                                        reply.id,
                                                      )
                                                    }
                                                    disabled={
                                                      commentDeletingId ===
                                                      reply.id
                                                    }
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-red-500 disabled:opacity-50"
                                                  >
                                                    {commentDeletingId ===
                                                      reply.id ? (
                                                      <Loader2
                                                        size={
                                                          12
                                                        }
                                                        className="animate-spin"
                                                      />
                                                    ) : (
                                                      <Trash2
                                                        size={
                                                          12
                                                        }
                                                      />
                                                    )}

                                                    Delete
                                                  </button>
                                                </div>
                                              )}
                                          </div>
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-cyan-200 bg-white/70 px-5 py-7 text-center">
                  <MessageCircle
                    size={22}
                    className="mx-auto text-cyan-300"
                  />

                  <p className="mt-2 text-sm font-medium text-slate-400">
                    No comments yet.
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Be the first one to join the
                    conversation.
                  </p>
                </div>
              )}
            </div>
          )}
        </article>
      ))}

      {/* ================= LOAD MORE ================= */}
      {hasMore && posts.length > 0 && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-gradient-to-r from-white to-cyan-50 px-6 py-2.5 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <Loader2
                  size={16}
                  className="animate-spin"
                />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
