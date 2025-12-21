"use client";

import { useState } from "react";
import DeleteAssetButton from "./DeleteAssetButton";

interface FileAsset {
  id: string;
  url: string;
  filename: string;
  createdAt: Date;
}

interface FileListProps {
  files: FileAsset[];
  stepId: string;
  isAdmin: boolean;
}

export default function FileList({ files, stepId, isAdmin }: FileListProps) {
  const [previewFile, setPreviewFile] = useState<FileAsset | null>(null);

  const getFileType = (filename: string): "pdf" | "image" | "video" | "other" => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    if (ext === "pdf") return "pdf";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) return "image";
    if (["mp4", "webm", "mov", "avi"].includes(ext)) return "video";
    return "other";
  };

  return (
    <>
      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Files</h2>
        <div className="grid gap-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900">{f.filename}</p>
                <p className="text-xs text-zinc-500">
                  Added {new Date(f.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => setPreviewFile(f)}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Review
                </button>
                <a
                  href={f.url}
                  download={f.filename}
                  className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Download
                </a>
                {isAdmin && <DeleteAssetButton stepId={stepId} assetId={f.id} />}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          style={{ zIndex: 9999 }}
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-auto rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
              <h3 className="truncate text-sm font-semibold text-zinc-900 max-w-md">
                {previewFile.filename}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.url}
                  download={previewFile.filename}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Download
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              {getFileType(previewFile.filename) === "pdf" ? (
                <iframe
                  src={previewFile.url}
                  className="h-[75vh] w-[80vw] max-w-4xl rounded border border-zinc-200"
                  title={previewFile.filename}
                />
              ) : getFileType(previewFile.filename) === "image" ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.filename}
                  className="max-h-[75vh] max-w-full rounded object-contain"
                />
              ) : getFileType(previewFile.filename) === "video" ? (
                <video
                  src={previewFile.url}
                  controls
                  className="max-h-[75vh] max-w-full rounded"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12 px-8">
                  <div className="rounded-full bg-zinc-100 p-4">
                    <svg className="h-12 w-12 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-zinc-600">
                    Preview not available for this file type
                  </p>
                  <a
                    href={previewFile.url}
                    download={previewFile.filename}
                    className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                  >
                    Download to view
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
