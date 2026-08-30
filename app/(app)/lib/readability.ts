import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export class ExtractError extends Error {}

const FETCH_TIMEOUT_MS = 10_000;

// Blocks the obvious SSRF targets (internal/loopback/link-local addresses) —
// this app fetches whatever URL a signed-in user pastes, so it must not
// become a way to probe the server's own network.
function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host === '0.0.0.0') return true;
  if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) {
    return true;
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }

  return false;
}

export async function extractArticleFromUrl(
  url: string,
): Promise<{ title: string; content: string }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ExtractError("That doesn't look like a valid URL.");
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ExtractError('Only http:// and https:// URLs are supported.');
  }
  if (isPrivateHost(parsed.hostname)) {
    throw new ExtractError("That URL isn't allowed.");
  }

  let html: string;
  try {
    const res = await fetch(parsed.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ReadEasyBot/1.0; +https://readeasy.ai)',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new ExtractError(`Couldn't fetch that page (HTTP ${res.status}).`);
    }
    html = await res.text();
  } catch (err) {
    if (err instanceof ExtractError) throw err;
    throw new ExtractError("Couldn't reach that URL. Check the link and try again.");
  }

  const pageDom = new JSDOM(html, { url: parsed.toString() });
  const article = new Readability(pageDom.window.document).parse();

  if (!article?.content) {
    throw new ExtractError(
      "Couldn't find readable article content on that page. Try pasting the text instead.",
    );
  }

  // Readability's `content` is cleaned-up HTML, not plain text — re-parse it
  // and pull block-level text so paragraphs stay separated the same way
  // pasted text is (split on blank lines), matching what /read/[id] expects.
  const articleDom = new JSDOM(article.content);
  const content = Array.from(
    articleDom.window.document.querySelectorAll('p, li, h1, h2, h3, h4, blockquote'),
  )
    .map((el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '')
    .filter(Boolean)
    .join('\n\n');

  if (!content) {
    throw new ExtractError(
      "Couldn't find readable article content on that page. Try pasting the text instead.",
    );
  }

  return {
    title: article.title?.trim() || parsed.hostname,
    content,
  };
}
