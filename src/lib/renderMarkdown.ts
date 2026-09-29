// Renders CMS-authored markdown/HTML (blog/review/page body & excerpt text) into
// safe HTML. The adminorg backend does not sanitize this content on save, and
// `marked` passes raw inline HTML straight through, so this is the only place
// that stands between admin-authored content and every site visitor's browser.
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  ...sanitizeHtml.defaults.allowedTags,
  'img',
  'h1',
  'h2',
];

const ALLOWED_ATTRIBUTES = {
  ...sanitizeHtml.defaults.allowedAttributes,
  a: ['href', 'name', 'target', 'rel', 'title'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  '*': ['class'],
};

export async function renderMarkdown(text: string | null | undefined): Promise<string> {
  if (!text) return '';
  const html = await marked.parse(text);
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow' }, true),
    },
  });
}
