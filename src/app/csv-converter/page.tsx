"use client";

import { useState } from "react";

interface ColumnMapping {
  outputName: string;
  sourceIndex: number;
}

export default function SetupPage() {
  const [rawCsv, setRawCsv] = useState<File | null>(null);
  const [correctedCsv, setCorrectedCsv] = useState<File | null>(null);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successSlug, setSuccessSlug] = useState<string | null>(null);

  // Step 2 state: column mapping generated, user picks title column
  const [columns, setColumns] = useState<ColumnMapping[] | null>(null);
  const [titleColumn, setTitleColumn] = useState("");
  const [saving, setSaving] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawCsv || !correctedCsv || !slug || !title) return;

    setLoading(true);
    setError(null);
    setColumns(null);
    setSuccessSlug(null);

    try {
      const formData = new FormData();
      formData.append("rawCsv", rawCsv);
      formData.append("correctedCsv", correctedCsv);
      formData.append("slug", slug);
      formData.append("title", title);
      formData.append("description", description);

      const res = await fetch("/api/setup?action=generate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Setup failed");
      }

      const data = await res.json();
      setColumns(data.columns);
      // Default to first column that looks like a name field
      const nameCol = data.columns.find(
        (c: ColumnMapping) =>
          c.outputName.toLowerCase().includes("name") ||
          c.outputName.toLowerCase().includes("customer")
      );
      setTitleColumn(nameCol?.outputName || data.columns[0]?.outputName || "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWithTitle = async () => {
    if (!titleColumn || !columns) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/setup?action=save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          description,
          titleColumn,
          columns,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Save failed");
      }

      setSuccessSlug(slug);
      setColumns(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Simplur CSV to PDF
      </h1>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <h2 className="text-xl font-bold text-center text-gray-800">
          Setup New Transform
        </h2>
        <p className="text-sm text-center text-gray-500">
          Upload a raw CSV and a manually corrected version. AI will figure out
          the column mapping.
        </p>

        {!columns && !successSlug && (
          <form onSubmit={handleGenerate} className="space-y-4">
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
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                  )
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

            <button
              type="submit"
              disabled={
                !rawCsv || !correctedCsv || !slug || !title || loading
              }
              className="w-full py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Generating mapping..." : "Generate Transform"}
            </button>
          </form>
        )}

        {columns && !successSlug && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 font-medium">
                Column mapping generated ({columns.length} columns)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Which column should be the PDF title/filename?
              </label>
              <select
                value={titleColumn}
                onChange={(e) => setTitleColumn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {columns.map((col) => (
                  <option key={col.outputName} value={col.outputName}>
                    {col.outputName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSaveWithTitle}
              disabled={!titleColumn || saving}
              className="w-full py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Save Transform"}
            </button>
          </div>
        )}

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

        <p className="text-sm text-center text-gray-500">
          <a href="/" className="text-blue-600 hover:underline">
            &larr; Back to CSV to PDF
          </a>
        </p>
      </div>
    </main>
  );
}
