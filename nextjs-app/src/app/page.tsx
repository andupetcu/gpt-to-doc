"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { isSignedIn } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Markdown to DOCX
          </h1>
          <div className="flex gap-3">
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/sign-up">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-2xl text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Convert Markdown to Word
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400">
              Transform your Markdown documents into professional Word files (.docx).
              Free with sign-up, no credit card required.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/app">
              <Button size="lg" className="w-full sm:w-auto">
                Try Now (3 Free Conversions)
              </Button>
            </Link>
            {!isSignedIn && (
              <Link href="/sign-up">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign Up for Unlimited
                </Button>
              </Link>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            <div className="space-y-2">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                ✨ Easy to Use
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Paste or upload Markdown, download DOCX instantly
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                🔒 Private
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Your documents are not stored or shared
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                ⚙️ Advanced Options
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                TOC, headers, footers, batch conversion, and PDF
              </p>
            </div>
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
