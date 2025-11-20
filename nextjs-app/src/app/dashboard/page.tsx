"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      redirect("/sign-in");
    }
  }, [isSignedIn, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Markdown to DOCX
          </h1>
          <UserButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-2xl text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              Welcome Back!
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              You now have unlimited access to convert Markdown files to Word documents.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                What can you do?
              </h3>
              <ul className="text-left space-y-2 text-zinc-600 dark:text-zinc-400">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  Convert Markdown text to DOCX
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  Upload Markdown files for conversion
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  Batch convert multiple files
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  Export to PDF with advanced formatting
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  Add table of contents, headers, footers, and more
                </li>
              </ul>
            </div>

            <Link href="/app" className="w-full">
              <Button size="lg" className="w-full">
                Go to Converter
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>Built with Next.js and powered by Pandoc</p>
        </div>
      </footer>
    </div>
  );
}
