"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Strikethrough,
  Underline as UnderlineIcon,
  Baseline,
  Highlighter,
} from "lucide-react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt("URL");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const btnClass = (active: boolean) => cn(
    "h-8 w-8 rounded-sm transition-all",
    active 
      ? "bg-[#0176D3] text-white" 
      : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
  );

  return (
    <div className="flex flex-wrap items-center gap-1 p-1 border-b bg-muted/10">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive("bold"))}
      >
        <Bold className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive("italic"))}
      >
        <Italic className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btnClass(editor.isActive("underline"))}
      >
        <UnderlineIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btnClass(editor.isActive("strike"))}
      >
        <Strikethrough className="size-4" />
      </Button>
      <div className="w-px h-4 bg-border mx-1" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive("bulletList"))}
      >
        <List className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive("orderedList"))}
      >
        <ListOrdered className="size-4" />
      </Button>
      <div className="w-px h-4 bg-border mx-1" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={addLink}
        className={btnClass(editor.isActive("link"))}
      >
        <LinkIcon className="size-4" />
      </Button>
      <div className="w-px h-4 bg-border mx-1" />
      <div className="flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 flex items-center justify-center hover:bg-muted"
              title="Text Color"
            >
              <div className="flex flex-col items-center gap-0.5">
                <Baseline className="size-4" />
                <div 
                  className="h-1 w-4 rounded-full border border-black/10" 
                  style={{ backgroundColor: editor.getAttributes("textStyle").color || "#000000" }} 
                />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Theme Colors</p>
              <div className="grid grid-cols-8 gap-1">
                {[
                  "#000000", "#444444", "#666666", "#999999", "#CCCCCC", "#EEEEEE", "#F3F3F3", "#FFFFFF",
                  "#FF0000", "#FF9900", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#9900FF", "#FF00FF",
                  "#F4CCCC", "#FCE5CD", "#FFF2CC", "#D9EAD3", "#D0E0E3", "#CFE2F3", "#D9D2E9", "#EAD1DC",
                  "#EA9999", "#F9CB9C", "#FFE599", "#B6D7A8", "#A2C4C9", "#9FC5E8", "#B4A7D6", "#D5A6BD",
                  "#E06666", "#F6B26B", "#FFD966", "#93C47D", "#76A5AF", "#6FA8DC", "#8E7CC3", "#C27BA0",
                  "#C00000", "#E69138", "#F1C232", "#6AA84F", "#45818E", "#3D85C6", "#674EA7", "#A64D79",
                  "#900000", "#B45F06", "#BF9000", "#38761D", "#134F5C", "#0B5394", "#351C75", "#741B47",
                  "#660000", "#783F04", "#7F6000", "#274E13", "#0C343D", "#073763", "#20124D", "#4C1130",
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="size-6 rounded-sm border border-black/5 hover:scale-110 transition-transform focus:ring-1 focus:ring-primary outline-none"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                    }}
                    title={color}
                  />
                ))}
              </div>
              <div className="pt-2 border-t flex items-center justify-between">
                <span className="text-[10px] font-medium text-muted-foreground">Custom Color</span>
                <input
                  type="color"
                  onInput={(event: any) => editor.chain().focus().setColor(event.target.value).run()}
                  value={editor.getAttributes("textStyle").color || "#000000"}
                  className="size-5 cursor-pointer bg-transparent border-none p-0"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={btnClass(editor.isActive("highlight"))}
          title="Highlight"
        >
          <Highlighter className="size-4" />
        </Button>
      </div>
      <div className="flex-1" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
      >
        <Undo className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
      >
        <Redo className="size-4" />
      </Button>
    </div>
  );
};

export function Editor({ content, onChange, placeholder, readOnly }: EditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#0176D3] underline cursor-pointer",
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] p-4 text-sm font-medium leading-relaxed",
          readOnly && "prose-p:m-0 min-h-0 p-0"
        ),
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className={cn(
      "border transition-all bg-background rounded-sm overflow-hidden",
      !readOnly && "border-input focus-within:border-[#0176D3]",
      readOnly && "border-none bg-transparent"
    )}>
      {!readOnly && <MenuBar editor={editor} />}
      <div className={cn(!readOnly && "bg-white dark:bg-black")}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
