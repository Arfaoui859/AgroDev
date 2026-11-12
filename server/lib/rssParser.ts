/**
 * Minimal, dependency-free RSS 2.0 / Atom parser.
 *
 * Feeds are the untrusted input here, so this parser is deliberately narrow:
 * it extracts only the fields the news feature needs, decodes common XML/HTML
 * entities, strips tags and CDATA, and never evaluates anything. It is not a
 * general XML parser and does not need to be one.
 */

export interface ParsedFeedItem {
  title: string;
  link: string;
  publishedAt: string | null;
  summary: string;
  categories: string[];
  author: string | null;
}

export interface ParsedFeed {
  title: string | null;
  language: string | null;
  items: ParsedFeedItem[];
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  laquo: "«",
  raquo: "»",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
  eacute: "é",
  egrave: "è",
  agrave: "à",
  ccedil: "ç",
  ugrave: "ù",
  ecirc: "ê",
  ocirc: "ô",
  icirc: "î",
  acirc: "â",
  bull: "•",
  deg: "°",
};

export function decodeEntities(input: string): string {
  if (!input) return "";
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity[0] === "#") {
      const isHex = entity[1] === "x" || entity[1] === "X";
      const code = parseInt(isHex ? entity.slice(2) : entity.slice(1), isHex ? 16 : 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    return NAMED_ENTITIES[entity] ?? match;
  });
}

function stripCdata(value: string): string {
  const trimmed = value.trim();
  const m = trimmed.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
  return m ? m[1] : trimmed;
}

/** Strip HTML tags and collapse whitespace for a safe plain-text summary. */
export function toPlainText(value: string): string {
  return decodeEntities(stripCdata(value))
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstTag(block: string, tag: string): string | null {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1] : null;
}

function linkFromBlock(block: string): string | null {
  // Atom: <link href="..." rel="alternate" />
  const href = block.match(/<link\b[^>]*\bhref="([^"]+)"/i);
  if (href) return decodeEntities(href[1]).trim();
  // RSS: <link>https://...</link>
  const text = firstTag(block, "link");
  return text ? decodeEntities(stripCdata(text)).trim() : null;
}

function categoriesFromBlock(block: string): string[] {
  const out: string[] = [];
  const re = /<category(?:\s[^>]*)?>([\s\S]*?)<\/category>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    const value = toPlainText(m[1]);
    if (value) out.push(value);
  }
  // Atom also allows <category term="..."/>
  const termRe = /<category\b[^>]*\bterm="([^"]+)"/gi;
  while ((m = termRe.exec(block)) !== null) {
    const value = decodeEntities(m[1]).trim();
    if (value) out.push(value);
  }
  return Array.from(new Set(out));
}

function normaliseDate(value: string | null): string | null {
  if (!value) return null;
  const raw = decodeEntities(stripCdata(value)).trim();
  const ts = Date.parse(raw);
  return Number.isFinite(ts) ? new Date(ts).toISOString() : null;
}

/**
 * Parse an RSS 2.0 or Atom document into items. Returns an empty item list for
 * a document that has no recognisable entries rather than throwing.
 */
export function parseFeed(xml: string): ParsedFeed {
  const doc = xml || "";
  const channel = doc.match(/<channel\b[\s\S]*?<\/channel>/i)?.[0] ?? doc;
  const feedTitle = firstTag(channel, "title");
  const feedLanguage =
    firstTag(channel, "language") ??
    doc.match(/<feed\b[^>]*\bxml:lang="([^"]+)"/i)?.[1] ??
    null;

  const itemBlocks: string[] = [];
  const itemRe = /<item\b[\s\S]*?<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(doc)) !== null) itemBlocks.push(m[0]);
  const entryRe = /<entry\b[\s\S]*?<\/entry>/gi;
  while ((m = entryRe.exec(doc)) !== null) itemBlocks.push(m[0]);

  const items: ParsedFeedItem[] = [];
  for (const block of itemBlocks) {
    const rawTitle = firstTag(block, "title");
    const link = linkFromBlock(block);
    if (!rawTitle || !link) continue;
    const title = toPlainText(rawTitle);
    if (!title) continue;
    const summarySource =
      firstTag(block, "description") ??
      firstTag(block, "summary") ??
      firstTag(block, "content:encoded") ??
      firstTag(block, "content") ??
      "";
    items.push({
      title,
      link,
      publishedAt: normaliseDate(
        firstTag(block, "pubDate") ??
          firstTag(block, "published") ??
          firstTag(block, "updated") ??
          firstTag(block, "dc:date"),
      ),
      summary: toPlainText(summarySource).slice(0, 600),
      categories: categoriesFromBlock(block),
      author: (() => {
        const author = firstTag(block, "author") ?? firstTag(block, "dc:creator");
        return author ? toPlainText(author) || null : null;
      })(),
    });
  }

  return {
    title: feedTitle ? toPlainText(feedTitle) : null,
    language: feedLanguage ? decodeEntities(stripCdata(feedLanguage)).trim().toLowerCase() : null,
    items,
  };
}
