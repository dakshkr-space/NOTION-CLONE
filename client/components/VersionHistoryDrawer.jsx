"use client";

import { useEffect, useState } from "react";
import { getPageVersions, restorePageVersion } from "@/lib/api";

export default function VersionHistoryDrawer({ pageId, isOpen, onClose, onRestored }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState(null);

  useEffect(() => {
    if (isOpen && pageId) {
      loadVersions();
    }
  }, [isOpen, pageId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const data = await getPageVersions(pageId);
      setVersions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load versions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId) => {
    if (!confirm("Are you sure you want to revert to this version?")) return;
    setRestoringId(versionId);
    try {
      const res = await restorePageVersion(pageId, versionId);
      if (res.page) {
        onRestored(res.page);
        onClose();
      }
    } catch (err) {
      console.error("Failed to restore version", err);
    } finally {
      setRestoringId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="position-fixed top-0 end-0 bottom-0 bg-white shadow-lg p-3 border-start" style={{ width: "420px", zIndex: 1050, overflowY: "auto" }}>
      <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
        <h5 className="m-0 fw-bold">
          <i className="bi bi-clock-history me-2"></i>Version History
        </h5>
        <button className="btn-close" onClick={onClose}></button>
      </div>

      {loading ? (
        <div className="text-center py-4 text-muted">Loading snapshots...</div>
      ) : versions.length === 0 ? (
        <div className="text-center py-4 text-muted">No historical versions recorded yet. Updates will generate snapshots automatically.</div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {versions.map((v) => (
            <div key={v.id} className="card border shadow-sm p-3 rounded">
              <div className="d-flex justify-content-between align-items-start mb-2">
               <strong
                    className="flex-grow-1 me-2"
                         style={{ wordBreak: "break-word" }}
                        >
                {v.title?.trim() ? v.title : "Untitled"}
                </strong>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => handleRestore(v.id)} 
                  disabled={restoringId === v.id}
                >
                  {restoringId === v.id ? "Restoring..." : "Restore"}
                </button>
              </div>

              <div className="text-muted small mb-2">
                <div>
                  <i className="bi bi-person me-1"></i>
                  {v.created_by?.name || v.created_by?.email || "User"}
                </div>
                <div>
                  <i className="bi bi-calendar me-1"></i>
                 {new Date(v.created_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                 timeStyle: "short",
               })}
                </div>
              </div>

            
            </div>
          ))}
        </div>
      )}
    </div>
  );
}