"use client";

import { useEffect } from "react";

import socket from "@/lib/socket";

import { useAuth } from "@/context/AuthContext";

export default function SocketTest() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    socket.connect();

    const handleConnect = () => {
      console.log(
        "WebSocket connected:",
        socket.id,
      );

      socket.emit("register", user.id);
    };

    const handleNotification = (data: {
      type: string;
      postId: string;
      userName: string;
      message: string;
    }) => {
      console.log(
        "🔔 Real-time notification:",
        data,
      );
    };

    socket.on("connect", handleConnect);

    socket.on(
      "notification",
      handleNotification,
    );

    return () => {
      socket.off("connect", handleConnect);

      socket.off(
        "notification",
        handleNotification,
      );

      socket.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  return null;
}
