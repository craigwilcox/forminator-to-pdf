"use client";

import { useState } from "react";

export default function SetupPage() {
  const [rawCsv, setRawCsv] = useState<File | null>(null);
  const [correctedCsv, setCorrectedCsv] = useState<File | null>(null);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successSlug, setSuccessSlug] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawCsv || !correctedCsv || !slug || !title) return;

    setLoading(true);
    setError(null);
    setSuccessSlug(null);

    try {
      const formData = new FormData();
      formData.append("rawCsv", rawCsv);
      formData.append("correctedCsv", correctedCsv);
      formData.append("slug", slug);
      formData.append("title", title);
      formData.append("description", description);

      const res = await fetch("/api/setup", { method: "POST", body: formData });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Setup failed");
      }

      setSuccessSlug(slug);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 space-y-6"
      >
        <h1 className="text-2xl font-bold text-center text-gray-800">
          Setup New Transform
        </h1>
        <p className="text-sm text-center text-gray-500">
          Upload a raw CSV and a manually corrected version. AI will figure out
          the column mapping.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Raw CSV (original export)
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setRawCsv(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Corrected CSV (desired output)
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCorrectedCsv(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug (URL path, e.g. &quot;moores&quot;)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              placeholder="moores"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Moores Survey CSV to PDF"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Upload a Forminator survey CSV..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!rawCsv || !correctedCsv || !slug || !title || loading}
          className="w-full py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Generating..." : "Generate Transform"}
        </button>

        {error && (
          <p className="text-sm text-center text-red-500">{error}</p>
        )}

        {successSlug && (
          <div className="text-center space-y-2">
            <p className="text-sm text-green-600">
              Transform created successfully!
            </p>
            <a
              href={`/${successSlug}`}
              className="text-sm text-blue-600 hover:underline"
            >
              Go to /{successSlug} &rarr;
            </a>
          </div>
        )}
      </form>
    </main>
  );
}
