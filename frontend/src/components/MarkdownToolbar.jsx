/**
 * MarkdownToolbar — lightweight formatting toolbar for Spaces post/reply composers.
 * Wraps selected text (or inserts at cursor) with markdown syntax.
 * Keeps it simple: Bold, Italic, Strikethrough, Link, Code, Quote, List.
 */
import { Bold, Italic, Strikethrough, Link, Code, Quote, List } from "lucide-react";

const ACTIONS = [
  {
    label: "Bold",
    icon: Bold,
    syntax: "**",
    wrap: true,
    placeholder: "bold text",
  },
  {
    label: "Italic",
    icon: Italic,
    syntax: "_",
    wrap: true,
    placeholder: "italic text",
  },
  {
    label: "Strikethrough",
    icon: Strikethrough,
    syntax: "~~",
    wrap: true,
    placeholder: "strikethrough",
  },
  {
    label: "Inline code",
    icon: Code,
    syntax: "`",
    wrap: true,
    placeholder: "code",
  },
  {
    label: "Quote",
    icon: Quote,
    syntax: "> ",
    wrap: false,
    prefix: true,
    placeholder: "quoted text",
  },
  {
    label: "Bullet list",
    icon: List,
    syntax: "- ",
    wrap: false,
    prefix: true,
    placeholder: "list item",
  },
  {
    label: "Link",
    icon: Link,
    wrap: false,
    custom: (selected) => `[${selected || "link text"}](url)`,
  },
];

function applyFormat(textarea, action, value, onChange) {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);
  let insert = "";
  let cursorOffset = 0;

  if (action.custom) {
    insert = action.custom(selected);
    cursorOffset = selected ? insert.length : insert.indexOf("url");
  } else if (action.wrap) {
    const inner = selected || action.placeholder;
    insert = `${action.syntax}${inner}${action.syntax}`;
    cursorOffset = selected ? insert.length : action.syntax.length;
  } else if (action.prefix) {
    insert = `${action.syntax}${selected || action.placeholder}`;
    cursorOffset = insert.length;
  }

  const newValue = value.slice(0, start) + insert + value.slice(end);
  onChange(newValue);

  // Restore cursor after React re-render
  requestAnimationFrame(() => {
    textarea.focus();
    if (selected) {
      textarea.setSelectionRange(start, start + insert.length);
    } else {
      const pos = start + cursorOffset;
      textarea.setSelectionRange(pos, pos + (action.placeholder?.length || 0));
    }
  });
}

export default function MarkdownToolbar({ textareaRef, value, onChange }) {
  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/40 bg-secondary/30 rounded-t-xl">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            type="button"
            title={action.label}
            aria-label={action.label}
            onMouseDown={(e) => {
              e.preventDefault(); // prevent textarea blur
              applyFormat(textareaRef?.current, action, value, onChange);
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
      <span className="ml-auto text-[10px] text-muted-foreground/60 pr-1 select-none">Markdown</span>
    </div>
  );
}
