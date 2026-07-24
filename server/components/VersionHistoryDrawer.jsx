import React, { useEffect, useState } from "react";
import { getPageVersions, restorePageVersion } from "@/lib/api";

export default function VersionHistoryDrawer({ pageId, isOpen, onClose, onRestored }) {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (isOpen && pageId) loadVersions();
  }, [isOpen, pageId]);

  async function loadVersions() {
    setLoading(true);
    try {
      const data = await getPageVersions(pageId);
      setVersions(data || []);
      if (data && data.length > 0) setSelectedVersion(data[0]);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(versionId) {
    if (!confirm("Restore this version?")) return;
    setRestoring(true);
    try {
      const updatedPage = await restorePageVersion(pageId, versionId);
      if (onRestored) onRestored(updatedPage);
      onClose();
    } catch (err) {
      alert("Failed to restore version.");
    } finally {
      setRestoring(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Version History</h3>
            <p className="text-xs text-zinc-500">Restore earlier versions</p>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">✕</button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/2 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="p-4 text-xs text-zinc-400">Loading...</div>
            ) : versions.length === 0 ? (
              <div className="p-4 text-xs text-zinc-400">No versions found.</div>
            ) : (
              versions.map((ver) => (
                <button
                  key={ver.id}
                  onClick={() => setSelectedVersion(ver)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition ${
                    selectedVersion?.id === ver.id
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-medium"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {new Date(ver.created_at || ver.CreatedAt).toLocaleString()}
                </button>
              ))
            )}
          </div>

          <div className="w-1/2 p-4 flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950">
            {selectedVersion ? (
              <>
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-semibold text-zinc-400">Preview</span>
                  <div className="text-xs text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 p-3 rounded-md border border-zinc-200 dark:border-zinc-800 max-h-80 overflow-y-auto font-mono whitespace-pre-wrap">
                    {typeof selectedVersion.content === "string"
                      ? selectedVersion.content
                      : JSON.stringify(selectedVersion.content, null, 2)}
                  </div>
                </div>

                <button
                  disabled={restoring}
                  onClick={() => handleRestore(selectedVersion.id)}
                  className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium disabled:opacity-50"
                >
                  {restoring ? "Restoring..." : "Restore version"}
                </button>
              </>
            ) : (
              <div className="text-xs text-zinc-400 my-auto text-center">Select a version</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
