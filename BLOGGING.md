# Publishing a GlobalBirth blog post

The live blog index is `blogs.html`. Published article files live in the website root so the shared `header.html`, `footer.html`, `floating.html` and `js/common.js` fragment paths continue to work.

## Create the article

1. Copy `templates/blog-post-template.html` into the website root.
2. Rename the copy with a short, lowercase, hyphenated filename, for example `blog-ramnagar-plot-document-checklist.html`.
3. Never publish the template from inside `templates/`. Its asset and fragment paths are deliberately written for a root-level article.
4. Replace every `REPLACE_...` token. A quick check is:

   ```powershell
   rg -n "REPLACE_" blog-your-new-slug.html
   ```

5. Write the article for a real buyer question. Use one descriptive H1, useful H2/H3 sections, short paragraphs, lists or a table where they improve understanding, and a clear next action.
6. Link naturally to the most relevant project page, `blogs.html`, at least one related article and `contact.html`. Do not stuff repeated exact-match keywords into headings or links.
7. Link to the homepage as `/` (or `/#section-id`), never `index.html`, so internal links do not pass through the homepage redirect.

## Update page metadata

Every article needs unique values for:

- `<title>` (describe the article clearly; usually keep it near 50–60 characters);
- meta description (a useful summary, usually near 140–160 characters);
- canonical URL using `https://globalbirthdevelopers.com/FILENAME.html`;
- Open Graph title, description, URL, image and image alt;
- Twitter title, description, image and image alt;
- `article:published_time` and `article:modified_time`; and
- visible H1, standfirst, author, reading time and `<time datetime="YYYY-MM-DD">`.

Use an image that can be loaded over HTTPS. Give every content image meaningful alt text plus explicit `width` and `height`. If a stock image represents a topic rather than the actual project, say so plainly in both the alt text and visible caption. Keep `loading="lazy"` and `decoding="async"` on below-the-fold article images.

## Update structured data

The template contains a JSON-LD `@graph` with `BlogPosting` and `BreadcrumbList`. Update all of these together:

- the article `@id`, `mainEntityOfPage.@id` and third breadcrumb URL;
- `headline`, `description`, `image`, `datePublished`, `dateModified` and `articleSection`;
- the visible page title/date so they agree with the schema; and
- the third breadcrumb name.

Keep the organisation author/publisher details and logo URL unless the publisher changes. Paste the published URL into Schema.org Validator and Google Rich Results Test after deployment. Do not add `FAQPage` markup merely because an article contains questions; only use structured data that accurately matches eligible, visible content and current search-engine guidance.

## Add the article to discovery files

### Blog index

Add a new `<article class="blog-card">` inside the `.blog-grid` in `blogs.html`. Update its image, transparent stock-image caption, category, H2, visible date, reading time, excerpt and link. In the `CollectionPage` JSON-LD:

1. increase `mainEntity.numberOfItems`;
2. put the newest card first, prepend its `ListItem` at position 1 and renumber every later item contiguously;
3. update `dateModified`.

Feature the newest guide so the featured story, visible card order and structured-data order stay aligned. Avoid showing a post as published before its actual publication date.

### Sitemap

Add the canonical article URL to `sitemap.xml` with a correct `<lastmod>` date. Also update the `blogs.html` entry when the index changes. Use ISO dates (`YYYY-MM-DD`) and do not invent change frequencies or priority values that the site does not maintain.

`lastmod` records the last substantive content change, not the upload time. Do not bump unchanged URLs during a deployment, and keep article `lastmod`, `article:modified_time` and JSON-LD `dateModified` aligned.

### RSS feed

Add an `<item>` to `feed.xml` containing the article title, canonical link, stable GUID, publication date and a concise description. Put newest items first, escape XML characters such as `&` as `&amp;`, and update the channel build date.

Use an RFC 822-style date with the India offset, for example `Mon, 14 Sep 2026 00:00:00 +0530`. The channel `lastBuildDate` must not predate the newest item.

## Dates and genuine freshness

- Keep a year in an SEO title or heading only when the article contains genuinely year-specific information that will be reviewed and maintained.
- Do not add a year to the blog index title, heading or card title merely to imply freshness.
- Change a published article's modified date only after a meaningful factual or editorial update; typo-only or link-only edits do not justify a freshness bump.
- Retain the original publication date when updating an article and record the real modification date separately.

## Editorial and SEO quality checks

- Confirm time-sensitive project details, inventory, prices, permissions and contact information before publication.
- Never promise appreciation, rental returns, guaranteed income, legal approval or RERA status without current official evidence reviewed for the exact claim.
- Label planned, under-construction and operational features accurately.
- Provide general education as general education. Tell readers when a lawyer, surveyor, accountant or other qualified professional is needed.
- Use the location name naturally; do not create near-duplicate posts solely to target spelling variants.
- Make each page useful even if the reader never submits an enquiry.
- Review spelling (`Corbett`, `Ramnagar`, `Uttarakhand`) and names consistently.

## Pre-publish validation

Run these checks from the website root:

```powershell
rg -n "REPLACE_|FAQPage" blog-your-new-slug.html
rg -n "canonical|og:url|datePublished|dateModified|BreadcrumbList|BlogPosting" blog-your-new-slug.html
npm run audit:seo
```

Then confirm manually:

- exactly one visible H1;
- no broken internal links or missing images;
- canonical, Open Graph URL and schema URLs all match the final HTTPS URL;
- metadata and JSON-LD parse without errors;
- the RSS item and blog-index `ItemList` match the visible title, URL, date and newest-first order;
- the mobile layout, keyboard focus and shared navigation work;
- the new card opens the correct page; and
- both `sitemap.xml` and `feed.xml` contain the final canonical URL.

After deployment, verify the final URL returns `200`, its canonical is present in the rendered HTML, and `sitemap.xml` and `feed.xml` return valid XML. Test the URL in Schema.org Validator and Google's Rich Results Test, submit or refresh the sitemap in the verified Google Search Console domain property, and inspect/request indexing for the new article. Validate the feed in an RSS validator or feed reader. Then monitor indexing, impressions, queries and qualified enquiries. These checks aid discovery and diagnosis; they do not guarantee indexing or a ranking position.
