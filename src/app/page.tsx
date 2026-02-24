"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const downloadRef = useRef<HTMLAnchorElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError(null);
    setDone(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    if (f && f.name.endsWith(".csv")) {
      setFile(f);
      setError(null);
      setDone(false);
    } else {
      setError("Please drop a .csv file.");
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setDone(false);

    try {
      const formData = new FormData();
      formData.append("csv", file);

      const res = await fetch("/api/convert", { method: "POST", body: formData });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Conversion failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = downloadRef.current!;
      a.href = url;
      a.download = "survey-responses.zip";
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-800">
          CSV to PDF
        </h1>
        <p className="text-sm text-center text-gray-500">
          Upload a CSV to generate per-row PDFs.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => document.getElementById("csv-input")?.click()}
        >
          <input
            id="csv-input"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          {file ? (
            <p className="text-gray-700 font-medium">{file.name}</p>
          ) : (
            <p className="text-gray-400">
              Drag &amp; drop a CSV here, or click to browse
            </p>
          )}
        </div>

        {/* Convert button */}
        <button
          onClick={handleConvert}
          disabled={!file || loading}
          className="w-full py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Converting..." : "Convert & Download ZIP"}
        </button>

        {/* Status messages */}
        {error && (
          <p className="text-sm text-center text-red-500">{error}</p>
        )}
        {done && (
          <p className="text-sm text-center text-green-600">
            Done! Your ZIP has been downloaded.
          </p>
        )}

        {/* Hidden download link */}
        <a ref={downloadRef} className="hidden" />
      </div>
    </main>
  );
}
