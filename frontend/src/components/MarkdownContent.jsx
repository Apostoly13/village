/**
 * MarkdownContent — renders user-generated markdown for Spaces posts and replies.
 * Uses react-markdown + remark-gfm (tables, strikethrough, task lists, autolinks).
 * Scoped styles keep it consistent with the Village design system without leaking globally.
 */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const components = {
  // Headings — demoted so they never compete with the page <h1> title
  // h1 in markdown → renders as a bold subheading (not giant)
  h1: ({ children }) => <p className="font-heading font-medium text-base text-foreground mt-3 mb-1 leading-snug">{children}</p>,
  h2: ({ children }) => <p className="font-heading font-semibold text-sm text-foreground mt-2 mb-1 leading-snug">{children}</p>,
  h3: ({ children }) => <p className="font-semibold text-sm text-muted-foreground mt-2 mb-0.5">{children}</p>,

  // Paragraph
  p: ({ children }) => <p className="text-foreground leading-relaxed mb-3 last:mb-0">{children}</p>,

  // Inline
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="line-through text-muted-foreground">{children}</del>,

  // Code
  code: ({ inline, children }) =>
    inline ? (
      <code className="px-1.5 py-0.5 rounded text-[13px] font-mono bg-secondary text-foreground border border-border/50">
        {children}
      </code>
    ) : (
      <code>{children}</code>
    ),
  pre: ({ children }) => (
    <pre className="my-3 p-4 rounded-xl bg-secondary border border-border/50 overflow-x-auto text-sm font-mono leading-relaxed">
      {children}
    </pre>
  ),

  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="my-3 pl-4 border-l-4 border-[var(--line)] text-muted-foreground italic">
      {children}
    </blockquote>
  ),

  // Lists
  ul: ({ children }) => <ul className="my-2 pl-5 list-disc space-y-1 text-foreground">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 pl-5 list-decimal space-y-1 text-foreground">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  // Links — open in new tab, styled as primary
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:text-[var(--ink-2)] transition-colors break-words"
    >
      {children}
    </a>
  ),

  // Inline images
  img: ({ src, alt }) => (
    <img
      src={src}
      alt={alt || ""}
      className="my-3 rounded-xl max-w-full max-h-96 object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
      onClick={(e) => {
        const overlay = document.createElement("div");
        overlay.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:16px";
        const img = document.createElement("img");
        img.src = src;
        img.style.cssText = "max-width:100%;max-height:100%;object-fit:contain;border-radius:12px";
        overlay.appendChild(img);
        overlay.onclick = () => document.body.removeChild(overlay);
        document.body.appendChild(overlay);
      }}
    />
  ),

  // Horizontal rule
  hr: () => <hr className="my-4 border-border/50" />,

  // Tables (GFM)
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-border/50">
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-secondary text-muted-foreground font-medium">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-border/50">{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => <th className="px-4 py-2 font-semibold">{children}</th>,
  td: ({ children }) => <td className="px-4 py-2 text-foreground">{children}</td>,
};

export default function MarkdownContent({ content, className = "" }) {
  if (!content) return null;
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
