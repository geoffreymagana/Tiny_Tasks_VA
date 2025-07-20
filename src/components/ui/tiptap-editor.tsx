
"use client";

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { defaultEditorContent } from '@/app/admin/contracts/schema';

interface ToolbarProps {
  editor: Editor | null;
}

const EditorToolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-secondary/50 sticky top-0 z-10">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={cn("p-2 rounded hover:bg-muted", editor.isActive('bold') ? 'bg-muted' : '')}
        aria-label="Bold"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={cn("p-2 rounded hover:bg-muted", editor.isActive('italic') ? 'bg-muted' : '')}
        aria-label="Italic"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        className={cn("p-2 rounded hover:bg-muted", editor.isActive('underline') ? 'bg-muted' : '')}
        aria-label="Underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn("p-2 rounded hover:bg-muted", editor.isActive('heading', { level: 2 }) ? 'bg-muted' : '')}
        aria-label="Heading"
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn("p-2 rounded hover:bg-muted", editor.isActive('bulletList') ? 'bg-muted' : '')}
        aria-label="Bullet List"
      >
        <List className="h-4 w-4" />
      </button>
       <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn("p-2 rounded hover:bg-muted", editor.isActive('orderedList') ? 'bg-muted' : '')}
        aria-label="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
    </div>
  );
};


interface TiptapEditorProps {
  content: object; // Tiptap JSON content
  onChange: (newContent: object) => void;
  placeholder?: string;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ content, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: true },
        orderedList: { keepMarks: true, keepAttributes: true },
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: placeholder || "Start writing your contract..." }),
    ],
    content: content || defaultEditorContent,
    onUpdate({ editor }) {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert focus:outline-none max-w-full p-4',
      },
    },
  });

  return (
    <div className="border rounded-lg bg-background shadow-sm">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};
