"use client";

import { useState } from "react";
import { reorderPages } from "@/lib/api";



export default function SidebarPageList({ pages, allPages = [], setPages, selectPage, selectedPage }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [expanded, setExpanded] = useState({}); // 👈 State to track open folders

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (dropIndex) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const updatedSubset = [...pages];
    const [draggedItem] = updatedSubset.splice(draggedIndex, 1);
    updatedSubset.splice(dropIndex, 0, draggedItem);

    const reorderedSubset = updatedSubset.map((page, idx) => ({
      ...page,
      order_index: idx,
    }));

    const newGlobalPages = [...allPages];
    reorderedSubset.forEach((reorderedPage) => {
      const idx = newGlobalPages.findIndex((p) => p.id === reorderedPage.id);
      if (idx !== -1) {
        newGlobalPages[idx] = reorderedPage;
      }
    });

    setPages(newGlobalPages);
    setDraggedIndex(null);


    try {
      await reorderPages(
        reorderedSubset.map((p) => ({
          id: p.id,
          order_index: p.order_index,
        }))
      );
      window.location.reload();
    } catch (err) {
      console.error("Failed to save page order", err);
    }
  };

  // 👈 Function to toggle dropdown
  const toggleExpand = (e, pageId) => {
    e.stopPropagation(); // Prevents selecting the page when just clicking the chevron
    setExpanded((prev) => ({ ...prev, [pageId]: !prev[pageId] }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {pages.map((page, index) => {
        const isActive = selectedPage?.id === page.id;
        const isDragged = draggedIndex === index;

        // 👈 Find if this page has children inside allPages
        const subpages = allPages.filter((p) => p.parent_id && String(p.parent_id) === String(page.id));
        const hasSubpages = subpages.length > 0;
        const isExpanded = expanded[page.id];

        return (
          <div key={page.id}>
            {/* Main Row */}
            <div
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              onClick={() => selectPage(page)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 10px",
                borderRadius: 6,
                cursor: isDragged ? "grabbing" : "grab",
                fontSize: 13.5,
                color: isActive ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.72)",
                background: isActive ? "rgba(255,255,255,0.09)" : "transparent",
                minHeight: 32,
                transition: "background 0.12s ease",
                opacity: isDragged ? 0.4 : 1,
                border: isDragged ? "1px dashed rgba(255,255,255,0.3)" : "1px solid transparent",
              }}
              onMouseEnter={e => {
                if (!isDragged) e.currentTarget.style.background = isActive ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.07)";
              }}
              onMouseLeave={e => {
                if (!isDragged) e.currentTarget.style.background = isActive ? "rgba(255,255,255,0.09)" : "transparent";
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, width: 16, flexShrink: 0, letterSpacing: "-1px" }}>
                ⋮⋮
              </span>

              {/* Interactive Chevron */}
              <span
                onClick={(e) => toggleExpand(e, page.id)} // 👈 Removed the 'if (hasSubpages)' check!
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 11,
                  width: 16,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer", // 👈 Always show a pointer on hover
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.15s ease",
                }}
              >
                ▶
              </span>


              <span style={{ flex: 1, fontWeight: 450 }}>
                📄 {page.title || "Untitled"}
              </span>
            </div>

            {/* Render Subpages! 🪆 */}
            {isExpanded && (
              <div style={{ paddingLeft: 18 }}>
                {subpages.length > 0 ? (
                  <SidebarPageList
                    pages={subpages}
                    allPages={allPages}
                    setPages={setPages}
                    selectPage={selectPage}
                    selectedPage={selectedPage}
                  />
                ) : (
                  <div style={{ padding: "5px 10px", fontSize: 12, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                    No subpages found...
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}