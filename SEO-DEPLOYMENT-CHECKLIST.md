# GlobalBirth SEO deployment checklist

The codebase contains the on-site SEO foundation. Search rankings also depend on deployment, indexing, verified business information, original evidence and reputable mentions elsewhere on the web. No developer or SEO provider can guarantee a number-one organic position.

## Publish and verify

1. Run `npm run audit:seo` from the website root and resolve every error. Warnings are review items and do not make the command fail.
2. Upload the public site, including `.htaccess`, `robots.txt`, `sitemap.xml`, `feed.xml`, the HTML pages, CSS, JavaScript and images. Exclude local audit profiles/screenshots, `.git`, `.env*`, Markdown documentation, `package.json`, `scripts/` and `templates/` from the public artifact when the hosting workflow allows it.
3. Confirm every sitemap URL loads over HTTPS, returns HTTP `200`, exposes its declared self-canonical and remains indexable. Confirm `/gallery.html` is `noindex` and absent from the sitemap.
4. Confirm `/index.html`, HTTP and `www` variants resolve to their final `https://globalbirthdevelopers.com/` equivalent without a loop. Test all combinations with `curl.exe -I` and inspect every `Location` header rather than relying on a browser cache.
5. Use one redirect owner. Hostinger's CDN/hPanel may force HTTP to HTTPS before Apache sees the request; configure its target directly to the non-www origin or disable the competing edge redirect, then purge the CDN. Repository `.htaccess` rules alone cannot prove a one-hop edge redirect. Refer to Hostinger's official guides for [HTTPS enforcement](https://support.hostinger.com/en/articles/1583201-how-to-enable-or-disable-https-for-your-website-at-hostinger) and [hPanel redirects](https://support.hostinger.com/en/articles/1583406-how-to-set-up-a-redirect).
6. Open the deployed `robots.txt`, `sitemap.xml` and `feed.xml`. Confirm robots disallows only `/templates/` and `/scripts/`, important CSS/JS/images remain crawlable, sitemap XML contains canonical indexable URLs only, and RSS items are newest first.
7. Check response headers: `header.html`, `footer.html`, `floating.html`, `404.html` and `feed.xml` should return `X-Robots-Tag: noindex, follow`; authoring/dev URLs should return `403` or remain outside the deployment. If the host does not use Apache or ignores `.htaccess`, reproduce these controls in the CDN/server configuration.
8. In Google Search Console, add or use the domain property for `globalbirthdevelopers.com`, submit `sitemap.xml`, and inspect/request indexing for:
   - `/corbett-eye.html`
   - `/blogs.html`
   - each newly published blog article
9. Validate representative pages in Schema.org Validator and Google's Rich Results Test, validate `feed.xml` in an RSS validator, and test mobile keyboard navigation and enquiry paths.
10. Review Search Console after recrawling for page indexing, Core Web Vitals, structured-data issues and queries containing “Corbett Eye”.

## Add verified project evidence

The largest remaining ranking and trust improvement is real, current project evidence. Replace representative stock images once approved media is available.

- Add original Corbett Eye entrance, internal-road, plot-demarcation, amenity and dated progress photographs, ideally 1,200 pixels or wider in WebP or AVIF.
- Supply an exact official map pin and site address.
- Publish verified current plot-size ranges and inventory only when they can be maintained.
- Publish the applicable RERA registration number or a clear, legally reviewed explanation of applicability only after verifying it on the government portal.
- Add a downloadable current brochure/master plan only when the document is approved for public use.
- Add a dated construction or infrastructure update whenever material progress occurs.

Update the visible page, metadata and structured data together. Do not change a published/modified date or sitemap `lastmod` unless the content changed substantially; a deployment, copyright-year change or small link correction is not a freshness update.

## Build authority around Corbett Eye

- Link the exact canonical Corbett Eye URL from all official GlobalBirth social profiles and relevant project announcements.
- Ask legitimate channel partners to link to the official project page as the primary source instead of copying the entire page.
- Keep the company name, office address, phone and domain consistent everywhere.
- Use a Google Business Profile only for a genuine, staffed, customer-facing location that meets Google's eligibility rules. Do not create a keyword-stuffed or virtual project listing.
- Invite genuine customer feedback without payment, incentives or review gating.

## Sustainable blog routine

- Publish one useful, original article or material project update regularly; quality matters more than volume.
- Use `BLOGGING.md` and `templates/blog-post-template.html` for each new post.
- Link each relevant post to the relevant project page and link the project page back to the most useful guides.
- Add each canonical article URL to `blogs.html`, `sitemap.xml` and `feed.xml`.
- Prefer original site photos, named company expertise and evidence from actual work over generic AI or copied locality text.

## Measurement

Track non-branded and branded queries separately. Useful monthly measures include Search Console impressions, clicks, average position, indexed pages, qualified calls/WhatsApp enquiries, and site-visit requests. Ranking movement normally requires recrawling and accumulated authority; metadata changes alone do not guarantee an immediate result.

## Requires external verification

- Confirm the CDN and origin agree on HTTPS/non-www redirects, status codes, cache invalidation and `X-Robots-Tag` headers.
- Verify Search Console ownership, sitemap processing, canonical selection, indexing and enhancement reports; repository checks cannot establish Google's live state.
- Review GA4 and consent configuration, conversion events, real enquiry attribution and phone/WhatsApp tracking without exposing personal data.
- Use Search Console Core Web Vitals or another field-data source for real-user LCP, INP and CLS; local screenshots are not field evidence.
- Verify the Google Business Profile is eligible, accurate and consistent with the crawlable company name, office address and phone.
- Review backlinks, citations, copied content, branded mentions and competitor visibility with an appropriate external dataset.
