// CMS excerpts are markdown, but <meta> descriptions must be plain text: strip the syntax so
// "### Heading", "**bold**" and "[text](url)" never leak into meta/og/twitter tags.
export function toPlainText(input?: string | null): string {
  return (input ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '')
    .replace(/\*\*|__|\*|`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
