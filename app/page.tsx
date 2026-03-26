"use client";

import { useState, useRef, useCallback } from "react";

const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Please upload a JPEG, PNG, or WebP image.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Image must be smaller than 12MB. Your image is ${formatFileSize(file.size)}.`;
    }
    return null;
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setFileName(file.name);
    setFileSize(file.size);
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setResultImage(null);
    };
    reader.readAsDataURL(file);
  }, [validateFile]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const resetState = useCallback(() => {
    setOriginalImage(null);
    setResultImage(null);
    setError(null);
    setFileName(null);
    setFileSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleRemoveBackground = useCallback(async () => {
    if (!originalImage) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/remove-background", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: originalImage }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResultImage(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove background. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [originalImage]);

  const handleDownload = useCallback(() => {
    if (!resultImage) return;
    const link = document.createElement("a");
    link.href = resultImage;
    link.download = `removed-bg-${fileName || "image"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [resultImage, fileName]);

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-500">🪄 SnapBackground</h1>
          <p className="text-gray-500 mt-2">Remove image backgrounds in seconds</p>
        </header>

        {/* Main Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          {/* Upload Area */}
          {!originalImage ? (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="text-5xl mb-4">📤</div>
              <p className="text-gray-600 text-lg">
                Drag & drop an image here, or click to select
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Supports JPEG, PNG, WebP • Max 12MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
              />
            </div>
          ) : (
            /* Preview Section */
            <div className="space-y-6">
              {/* Original Image */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Original Image
                </p>
                <div className="relative rounded-lg border border-gray-200 overflow-hidden">
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full h-auto object-contain max-h-80"
                  />
                </div>
                <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                  <span>{fileName}</span>
                  <span>{fileSize && formatFileSize(fileSize)}</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-100">
                  ⚠️ {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  onClick={handleRemoveBackground}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Removing background...
                    </>
                  ) : (
                    <>
                      ✨ Remove Background
                    </>
                  )}
                </button>
                <button
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                  onClick={resetState}
                  disabled={isLoading}
                >
                  ↺ Upload Another Image
                </button>
              </div>

              {/* Result Section */}
              {resultImage && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Result
                  </p>
                  {/* Chessboard Background */}
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{
                      backgroundImage: `
                        linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
                        linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
                        linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)
                      `,
                      backgroundSize: "16px 16px",
                      backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                      backgroundColor: "#fff",
                    }}
                  >
                    <img
                      src={resultImage}
                      alt="Result"
                      className="w-full h-auto object-contain"
                      style={{ display: "block" }}
                    />
                  </div>
                  <button
                    className="w-full mt-4 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    onClick={handleDownload}
                  >
                    ⬇️ Download PNG
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 text-gray-400 text-sm">
          Powered by{" "}
          <a
            href="https://www.remove.bg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 hover:underline"
          >
            remove.bg
          </a>
        </footer>
      </div>
    </main>
  );
}
