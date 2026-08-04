"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useEffect } from "react";

// Toolbar button component
function ToolbarButton({ onClick, active, children, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        padding: "4px 10px",
        borderRadius: 5,
        border: "none",
        background: active ? "rgba(255,255,255,0.15)" : "transparent",
        color: active ? "#fff" : "rgba(255,255,255,0.6)",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        transition: "background 0.12s ease, color 0.12s ease",
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.08)";
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ content, onChange, editable = true }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: content || "",
    editable,
    immediatelyRender: false,
    onUpdate({ editor }) {
      // Every time content changes, call onChange with the HTML string
      // HTML is stored in your existing `content` column in Postgres
      if (onChange) onChange(editor.getHTML());
    },
  });

  // When the page changes (e.g. switching between pages in sidebar),
  // update the editor content to show the new page's content
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [content]);

  if (!editor) return null;

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, overflow: "hidden" }}>

      {/* Toolbar — only shown when editable */}
      {editable && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          padding: "6px 8px",
          background: "#1a1a1a",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold (Ctrl+B)"
          >
            <b>B</b>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic (Ctrl+I)"
          >
            <i>I</i>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="Strikethrough"
          >
            <s>S</s>
          </ToolbarButton>

          <div style={{ width: 1, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            H1
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            H2
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            H3
          </ToolbarButton>

          <div style={{ width: 1, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet list"
          >
            • List
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Numbered list"
          >
            1. List
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            active={editor.isActive("taskList")}
            title="Checklist"
          >
            ☑ Check
          </ToolbarButton>

          <div style={{ width: 1, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="Code block"
          >
            {"</>"}
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Blockquote"
          >
            ❝
          </ToolbarButton>

          <div style={{ width: 1, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo (Ctrl+Z)"
          >
            ↩
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo (Ctrl+Shift+Z)"
          >
            ↪
          </ToolbarButton>
        </div>
      )}

      {/* Editor content area */}
      <div style={{ padding: "14px 16px", minHeight: 200, background: "#0c0f13" }}>
        <EditorContent editor={editor} />
      </div>

      {/* TipTap editor styles */}
      <style>{`
        .ProseMirror {
          outline: none;
          color: rgba(255,255,255,0.85);
          font-size: 14px;
          line-height: 1.9;
          min-height: 180px;
        }
        .ProseMirror p { margin: 0 0 12px 0; }
        .ProseMirror h1 { font-size: 1.8rem; font-weight: 700; margin: 16px 0 8px 0; color: #fff; }
        .ProseMirror h2 { font-size: 1.4rem; font-weight: 600; margin: 14px 0 6px 0; color: #fff; }
        .ProseMirror h3 { font-size: 1.1rem; font-weight: 600; margin: 12px 0 4px 0; color: #fff; }
        .ProseMirror ul { padding-left: 20px; margin: 8px 0; }
        .ProseMirror ol { padding-left: 20px; margin: 8px 0; }
        .ProseMirror li { margin: 4px 0; }
        .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 4px; }
        .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 8px; }
        .ProseMirror ul[data-type="taskList"] li > label { margin-top: 2px; }
        .ProseMirror ul[data-type="taskList"] li > div { flex: 1; }
        .ProseMirror pre { background: #1e1e1e; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 12px 16px; font-family: monospace; font-size: 13px; color: #a8ff78; margin: 8px 0; overflow-x: auto; }
        .ProseMirror code { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #a8ff78; }
        .ProseMirror blockquote { border-left: 3px solid rgba(255,255,255,0.2); padding-left: 14px; margin: 8px 0; color: rgba(255,255,255,0.5); font-style: italic; }
        .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: rgba(255,255,255,0.25); pointer-events: none; float: left; height: 0; }
      `}</style>
    </div>
  );
}