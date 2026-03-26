"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const resetState = useCallback(() => {
    setOriginalImage(null);
    setResultImage(null);
    setError(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be smaller than 12MB.");
      return;
    }
    setError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setResultImage(null);
    };
    reader.readAsDataURL(file);
  }, []);

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

  const handleRemoveBackground = useCallback(async () => {
    if (!originalImage) return;
    setIsLoading(true);
    setError(null);
    setResultImage(null);

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

  useEffect(() => {
    return () => {
      if (resultImage) {
        URL.revokeObjectURL(resultImage);
      }
    };
  }, [resultImage]);

  return (
    <main className="container">
      <header>
        <h1>🪄 SnapBackground</h1>
        <p>Remove image backgrounds in seconds</p>
      </header>

      <div className="card">
        {!originalImage ? (
          <div
            className={`upload-area ${isDragging ? "dragging" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="upload-icon">📤</div>
            <p className="upload-text">
              Drag & drop an image here, or click to select
            </p>
            <p className="upload-hint">Supports JPEG, PNG, WebP • Max 12MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              style={{ display: "none" }}
            />
          </div>
        ) : (
          <div className="preview-section">
            <p className="preview-label">Original Image</p>
            <img src={originalImage} alt="Original" className="preview-image" />
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}

        {originalImage && (
          <div className="btn-group">
            <button
              className="btn btn-primary"
              onClick={handleRemoveBackground}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Removing background...
                </>
              ) : (
                "✨ Remove Background"
              )}
            </button>
            <button className="btn btn-primary" onClick={resetState}>
              ↺ Upload Another Image
            </button>
          </div>
        )}

        {resultImage && (
          <div className="preview-section">
            <p className="preview-label">Result</p>
            <div className="chessboard">
              <img
                src={resultImage}
                alt="Result"
                className="image-result"
                style={{ display: "block" }}
              />
            </div>
            <div className="btn-group">
              <button className="btn btn-primary" onClick={handleDownload}>
                ⬇️ Download PNG
              </button>
            </div>
          </div>
        )}
      </div>

      <footer>
        Powered by{" "}
        <a href="https://www.remove.bg" target="_blank" rel="noopener noreferrer">
          remove.bg
        </a>
      </footer>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </main>
  );
}
