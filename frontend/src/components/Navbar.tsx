"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  Bell,
  Check,
  Home,
  LogIn,
  LogOut,
  MessageCircle,
  Heart,
  Reply,
  UserPlus,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";

export default function Navbar() {
  const {
    user,
    loading,
    isAuthenticated,
    logout,
  } = useAuth();

  const {
    notifications,
    unreadCount,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  const [showNotifications, setShowNotifications] =
    useState(false);

  const notificationRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent,
    ) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target as Node,
        )
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  const handleNotificationToggle = () => {
    const nextState = !showNotifications;

    setShowNotifications(nextState);

    if (nextState && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const getNotificationIcon = (
    type: string,
  ) => {
    if (type === "like") {
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
          <Heart size={17} fill="currentColor" />
        </div>
      );
    }

    if (type === "reply") {
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
          <Reply size={17} />
        </div>
      );
    }

    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-600">
        <MessageCircle size={17} />
      </div>
    );
  };

  const formatTime = (
    createdAt: string,
  ) => {
    const date = new Date(createdAt);

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
            C
          </div>

          <span className="text-lg font-bold tracking-tight text-slate-900">
            Code<span className="text-cyan-600">
              Sphere
            </span>
          </span>
        </Link>

        {!loading && (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Home */}
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <Home size={17} />

              <span className="hidden sm:inline">
                Home
              </span>
            </Link>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div
                  ref={notificationRef}
                  className="relative"
                >
                  <button
                    onClick={
                      handleNotificationToggle
                    }
                    className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Notifications"
                  >
                    <Bell size={19} />

                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount > 99
                          ? "99+"
                          : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 top-12 z-50 w-[350px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">
                            Notifications
                          </h3>

                          <p className="text-xs text-slate-500">
                            {notifications.length}{" "}
                            notification
                            {notifications.length !==
                            1
                              ? "s"
                              : ""}
                          </p>
                        </div>

                        {notifications.length > 0 && (
                          <button
                            onClick={
                              clearNotifications
                            }
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-red-500"
                          >
                            <X size={13} />
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Notification list */}
                      <div className="max-h-[420px] overflow-y-auto">
                        {notifications.length ===
                        0 ? (
                          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                              <Bell size={22} />
                            </div>

                            <p className="text-sm font-medium text-slate-700">
                              No notifications yet
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              You&apos;ll see likes,
                              comments and replies
                              here.
                            </p>
                          </div>
                        ) : (
                          notifications.map(
                            (notification) => (
                              <div
                                key={
                                  notification.id
                                }
                                className="flex gap-3 border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50"
                              >
                                {getNotificationIcon(
                                  notification.type,
                                )}

                                <div className="min-w-0 flex-1">
                                  <p className="text-sm leading-5 text-slate-700">
                                    {
                                      notification.message
                                    }
                                  </p>

                                  <p className="mt-1 text-[11px] text-slate-400">
                                    {formatTime(
                                      notification.createdAt,
                                    )}
                                  </p>
                                </div>

                                <Check
                                  size={15}
                                  className="mt-1 shrink-0 text-cyan-500"
                                />
                              </div>
                            ),
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile */}
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-100"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                      {user?.name
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <span className="hidden max-w-32 truncate text-sm font-semibold text-slate-700 sm:block">
                    {user?.name}
                  </span>
                </Link>

                {/* Divider */}
                <div className="hidden h-8 w-px bg-slate-200 sm:block" />

                {/* Logout */}
                <button
                  onClick={logout}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut size={17} />

                  <span className="hidden sm:inline">
                    Logout
                  </span>
                </button>
              </>
            ) : (
              <>
                {/* Login */}
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <LogIn size={17} />

                  <span>Login</span>
                </Link>

                {/* Register */}
                <Link
                  href="/register"
                  className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  <UserPlus size={17} />

                  <span className="hidden sm:inline">
                    Register
                  </span>
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
