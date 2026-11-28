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

// Every page prints its own title as the page's one <h1>. Some articles are written with "# Section"
// headings, which added 10-20 more <h1> per page. When the text uses <h1> at all, every heading moves
// one level down (h1 -> h2, h2 -> h3 ...), so the article keeps its own structure under the page title.
const HEADINGS_ONE_LEVEL_DOWN = { h1: 'h2', h2: 'h3', h3: 'h4', h4: 'h5', h5: 'h6' };

export async function renderMarkdown(text: string | null | undefined): Promise<string> {
  if (!text) return '';
  const html = await marked.parse(text);
  const hasH1 = /<h1[\s>]/i.test(html);
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      ...(hasH1 ? HEADINGS_ONE_LEVEL_DOWN : {}),
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow' }, true),
    },
  });
}
