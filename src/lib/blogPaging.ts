// One page size for every blog list: /blog/, /hi/blog/ and their /page/N/ pages. The first page and the
// numbered pages must agree, otherwise posts repeat (or go missing) between page 1 and page 2 and the
// page links count a different number of pages. 13 = the featured post + 12 cards on the first page.
export const POSTS_PER_PAGE = Number(import.meta.env.PUBLIC_POSTS_PER_PAGE) || 13;
