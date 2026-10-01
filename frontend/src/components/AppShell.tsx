"use client";

import { ReactNode } from "react";

import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({
  children,
}: AppShellProps) {
  const { isAuthenticated, loading } = useAuth();

  return (
    <>
      <Navbar />

      {children}

      {!loading && !isAuthenticated && <Footer />}
    </>
  );
}
