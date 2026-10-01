"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import socket from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";

export type Notification = {
  id: string;
  type: "like" | "comment" | "reply";
  postId: string;
  userName: string;
  message: string;
  createdAt: string;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  onlineUsers: string[];
  markAllAsRead: () => void;
  clearNotifications: () => void;
};

const NotificationContext =
  createContext<NotificationContextType | undefined>(
    undefined,
  );

export function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [onlineUsers, setOnlineUsers] =
    useState<string[]>([]);

  // Load saved notifications + unread count
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    const notificationKey =
      `notifications_${user.id}`;

    const unreadKey =
      `notifications_unread_${user.id}`;

    const savedNotifications =
      localStorage.getItem(notificationKey);

    const savedUnreadCount =
      localStorage.getItem(unreadKey);

    // Load notifications
    if (savedNotifications) {
      try {
        const parsedNotifications =
          JSON.parse(
            savedNotifications,
          ) as Notification[];

        setNotifications(parsedNotifications);
      } catch (error) {
        console.error(
          "Failed to load notifications:",
          error,
        );
      }
    }

    // Load unread count
    if (savedUnreadCount) {
      const parsedUnreadCount =
        Number(savedUnreadCount);

      if (!Number.isNaN(parsedUnreadCount)) {
        setUnreadCount(parsedUnreadCount);
      }
    }
  }, [isAuthenticated, user?.id]);

  // Save notifications
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    const notificationKey =
      `notifications_${user.id}`;

    localStorage.setItem(
      notificationKey,
      JSON.stringify(notifications),
    );
  }, [
    notifications,
    isAuthenticated,
    user?.id,
  ]);

  // Save unread count
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    const unreadKey =
      `notifications_unread_${user.id}`;

    localStorage.setItem(
      unreadKey,
      String(unreadCount),
    );
  }, [
    unreadCount,
    isAuthenticated,
    user?.id,
  ]);

  // WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    socket.connect();

    const handleConnect = () => {
      console.log(
        "Notification socket connected:",
        socket.id,
      );

      socket.emit("register", user.id);
    };

    const handleNotification = (data: {
      type: "like" | "comment" | "reply";
      postId: string;
      userName: string;
      message: string;
    }) => {
      const newNotification: Notification = {
        id: `${Date.now()}-${Math.random()}`,
        ...data,
        createdAt: new Date().toISOString(),
      };

      // Add new notification
      setNotifications((current) => [
        newNotification,
        ...current,
      ]);

      // Increase unread count
      setUnreadCount((current) => current + 1);
    };

    // Receive currently online users
    const handleOnlineUsers = (data: {
      userIds: string[];
    }) => {
      setOnlineUsers(data.userIds);
    };

    // User comes online
    const handleUserOnline = (data: {
      userId: string;
    }) => {
      setOnlineUsers((currentUsers) => {
        if (currentUsers.includes(data.userId)) {
          return currentUsers;
        }

        return [
          ...currentUsers,
          data.userId,
        ];
      });
    };

    // User goes offline
    const handleUserOffline = (data: {
      userId: string;
    }) => {
      setOnlineUsers((currentUsers) =>
        currentUsers.filter(
          (id) => id !== data.userId,
        ),
      );
    };

    socket.on(
      "connect",
      handleConnect,
    );

    socket.on(
      "notification",
      handleNotification,
    );

    socket.on(
      "onlineUsers",
      handleOnlineUsers,
    );

    socket.on(
      "userOnline",
      handleUserOnline,
    );

    socket.on(
      "userOffline",
      handleUserOffline,
    );

    return () => {
      socket.off(
        "connect",
        handleConnect,
      );

      socket.off(
        "notification",
        handleNotification,
      );

      socket.off(
        "onlineUsers",
        handleOnlineUsers,
      );

      socket.off(
        "userOnline",
        handleUserOnline,
      );

      socket.off(
        "userOffline",
        handleUserOffline,
      );

      socket.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  // Mark all notifications as read
  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        onlineUsers,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context =
    useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider",
    );
  }

  return context;
}
