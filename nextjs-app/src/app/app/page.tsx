"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { getConversionCount, incrementConversionCount, initializeFingerprint } from "@/lib/fp";

const FREE_TIER_LIMIT = 5;

export default function ConverterPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversionCount, setConversionCount] = useState(0);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"text" | "file" | "batch" | "pdf" | "advanced">("text");

  // Advanced options state
  const [enableToc, setEnableToc] = useState(false);
  const [numberedSections, setNumberedSections] = useState(false);
  const [customHeader, setCustomHeader] = useState("");
  const [customFooter, setCustomFooter] = useState("");

  // Initialize fingerprint and conversion count
  useEffect(() => {
    const init = async () => {
      await initializeFingerprint();
      setConversionCount(getConversionCount());
    };
    init();
  }, []);

  const canConvert = isSignedIn || conversionCount < FREE_TIER_LIMIT;
  const conversionsRemaining = FREE_TIER_LIMIT - conversionCount;

  const getOptions = () => ({
    enableToc,
    numberedSections,
    customHeader,
    customFooter,
  });

  const handleConvertText = async (toPdf: boolean = false) => {
    if (!markdown.trim()) {
      setError("Please enter some Markdown text");
      return;
    }

    if (!canConvert && !isSignedIn) {
      setShowSignUpPrompt(true);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const endpoint = toPdf
        ? `${process.env.NEXT_PUBLIC_CONVERTER_URL}/convert-pdf`
        : `${process.env.NEXT_PUBLIC_CONVERTER_URL}/convert-text-advanced`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markdown, options: getOptions() }),
      });

      if (!response.ok) throw new Error("Conversion failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = toPdf ? "converted.pdf" : "converted.docx";
      a.click();
      window.URL.revokeObjectURL(url);

      if (!isSignedIn) {
        incrementConversionCount();
        setConversionCount(getConversionCount());
      }

      setMarkdown("");
    } catch (err) {
      setError("Failed to convert document. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, toPdf: boolean = false) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    if (!canConvert && !isSignedIn) {
      setShowSignUpPrompt(true);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("options", JSON.stringify(getOptions()));

      console.log("NEXT_PUBLIC_CONVERTER_URL:", process.env.NEXT_PUBLIC_CONVERTER_URL);
      const endpoint = toPdf
        ? `${process.env.NEXT_PUBLIC_CONVERTER_URL}/convert-pdf`
        : `${process.env.NEXT_PUBLIC_CONVERTER_URL}/convert-advanced`;
      console.log("Endpoint:", endpoint);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Conversion failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(/\.[^/.]+$/, toPdf ? ".pdf" : ".docx");
      a.click();
      window.URL.revokeObjectURL(url);

      if (!isSignedIn) {
        incrementConversionCount();
        setConversionCount(getConversionCount());
      }

      e.currentTarget.value = "";
    } catch (err) {
      setError("Failed to convert file. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;

    if (!canConvert && !isSignedIn) {
      setShowSignUpPrompt(true);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      formData.append("options", JSON.stringify(getOptions()));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CONVERTER_URL}/convert-batch`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Batch conversion failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "converted_files.zip";
      a.click();
      window.URL.revokeObjectURL(url);

      if (!isSignedIn) {
        incrementConversionCount();
        setConversionCount(getConversionCount());
      }

      e.currentTarget.value = "";
    } catch (err) {
      setError("Failed to convert batch. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 cursor-pointer hover:opacity-75">
              Markdown to DOCX
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            {!isSignedIn && isLoaded && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {conversionsRemaining} free conversions left
              </p>
            )}
            {isSignedIn && <UserButton />}
            {!isSignedIn && isLoaded && (
              <div className="flex gap-2">
                <Link href="/sign-in">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Conversion Limit Banner */}
      {!isSignedIn && isLoaded && conversionCount >= FREE_TIER_LIMIT && (
        <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 px-4 py-3">
          <div className="mx-auto max-w-6xl">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              You've used all {FREE_TIER_LIMIT} free conversions.{" "}
              <Link href="/sign-up" className="font-semibold underline hover:no-underline">
                Sign up for unlimited conversions
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-4xl w-full space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              Convert Markdown to Word & PDF
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              {isSignedIn
                ? "Convert unlimited Markdown documents to DOCX, PDF, and more"
                : `${conversionsRemaining} free conversions remaining (${FREE_TIER_LIMIT} total)`}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
            {["text", "file", "batch", "pdf", "advanced"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "border-zinc-900 dark:border-zinc-50 text-zinc-900 dark:text-zinc-50"
                    : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                }`}
              >
                {tab === "text" && "Paste Text"}
                {tab === "file" && "Upload File"}
                {tab === "batch" && "Batch"}
                {tab === "pdf" && "PDF"}
                {tab === "advanced" && "Options"}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Text Input Tab */}
          {activeTab === "text" && (
            <div className="space-y-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Paste your Markdown here..."
                disabled={!canConvert && !isSignedIn}
                className="w-full min-h-64 max-h-96 p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 resize-y overflow-y-scroll disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ height: '256px' }}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleConvertText(false)}
                  disabled={loading || (!canConvert && !isSignedIn)}
                  className="flex-1"
                >
                  {loading ? "Converting..." : "Convert to DOCX"}
                </Button>
              </div>
            </div>
          )}

          {/* File Upload Tab */}
          {activeTab === "file" && (
            <div className="space-y-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".md,.markdown,.txt"
                  onChange={(e) => handleFileUpload(e, false)}
                  disabled={!canConvert && !isSignedIn}
                  className="w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                  Supported: .md, .markdown, .txt
                </p>
              </div>
            </div>
          )}

          {/* Batch Conversion Tab */}
          {activeTab === "batch" && (
            <div className="space-y-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-8 text-center">
                <input
                  type="file"
                  multiple
                  accept=".md,.markdown,.txt"
                  onChange={handleBatchUpload}
                  disabled={!canConvert && !isSignedIn}
                  className="w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                  Upload multiple files - they'll be converted and downloaded as a ZIP
                </p>
              </div>
            </div>
          )}

          {/* PDF Conversion Tab */}
          {activeTab === "pdf" && (
            <div className="space-y-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Paste your Markdown here for PDF conversion..."
                disabled={!canConvert && !isSignedIn}
                className="w-full min-h-64 max-h-96 p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 resize-y overflow-y-scroll disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ height: '256px' }}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleConvertText(true)}
                  disabled={loading || (!canConvert && !isSignedIn)}
                  className="flex-1"
                >
                  {loading ? "Converting..." : "Convert to PDF"}
                </Button>
              </div>
            </div>
          )}

          {/* Advanced Options Tab */}
          {activeTab === "advanced" && (
            <div className="space-y-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="toc"
                    checked={enableToc}
                    onChange={(e) => setEnableToc(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  <label htmlFor="toc" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Table of Contents
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="numbered"
                    checked={numberedSections}
                    onChange={(e) => setNumberedSections(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  <label htmlFor="numbered" className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Numbered Sections
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Header/Title
                  </label>
                  <input
                    type="text"
                    value={customHeader}
                    onChange={(e) => setCustomHeader(e.target.value)}
                    placeholder="Enter document header/title"
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Footer
                  </label>
                  <input
                    type="text"
                    value={customFooter}
                    onChange={(e) => setCustomFooter(e.target.value)}
                    placeholder="Enter document footer"
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
                  />
                </div>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Configure these options, then use the other tabs to convert with your selected options.
              </p>
            </div>
          )}

          {/* Sign Up Prompt */}
          {showSignUpPrompt && !isSignedIn && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200">
                Unlock Unlimited Conversions
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Sign up for free to convert as many documents as you want.
              </p>
              <div className="flex gap-2">
                <Link href="/sign-up" className="flex-1">
                  <Button className="w-full">Sign Up Free</Button>
                </Link>
                <Link href="/sign-in" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
              </div>
              <button
                onClick={() => setShowSignUpPrompt(false)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Maybe later
              </button>
            </div>
          )}
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
