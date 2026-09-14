# GlobalBirth Developers Private Limited: SEO Keyword and Intent Map

Audit date: 2026-09-14

Scope: local repository review before the September 2026 SEO implementation

Canonical origin: `https://globalbirthdevelopers.com`

This is a decision document, not a ranking report. Scores are diagnostic estimates from the local HTML, metadata, schema, crawl files, content, imagery and interaction patterns. Search Console, analytics, server responses and real field data were not available, so no score should be read as a measured Google result.

## Baseline SEO Scorecard

| Area | Baseline / 100 | Evidence behind the baseline |
|---|---:|---|
| Technical SEO | 64 | Most public pages had self-referencing canonicals and crawlable HTML, but the sitemap included a low-value gallery, omitted the new Delhi NCR guide, and schema coverage was inconsistent. Server redirects and status codes were not locally provable. |
| On-page SEO | 59 | Core pages had titles, descriptions and H1s, but the homepage targeted the vague phrase “real estate projects in India,” the About page used a mismatched entity description, and several pages relied on generic marketing headings. |
| Content quality | 48 | Project and blog content supplied useful facts, but the Shubh Kadam hub was thin, the About page used generic worldwide claims, and the homepage used unsupported value language and testimonial copy. |
| Local SEO | 44 | Ramnagar, Jim Corbett, NH-309, Bhimtal and Moradabad appeared in project content, but the Sector 142 Noida office was not consistently distinguished from project sites. |
| Entity SEO | 40 | The homepage named the legal entity in Organization schema, but visible brand naming varied among “Globalbirth Real Estate,” “GlobalBirth,” and “GlobalBirth Developers,” and the About page lacked entity schema. |
| Structured data | 43 | Homepage and blog schema existed, but the About page and Shubh Kadam collection had no structured data and many project pages had no breadcrumb or page schema. |
| Internal linking | 54 | Header, footer, project and blog links provided a usable base, but the homepage did not surface the Delhi NCR guide and the Shubh Kadam name conflict lacked a clear linking rule. |
| Performance | 66 | Static HTML and local CSS/JS are favourable, but large remote Unsplash images, rotating hero backgrounds, third-party fonts/icons and inconsistent intrinsic dimensions created LCP/CLS risk. |
| Mobile UX | 69 | Responsive grids and a mobile menu existed; real-device interaction, form completion and sticky-element overlap still require testing. |
| Accessibility | 52 | Many images had alt text and the shared menu used buttons, but key pages lacked skip links/main targets and the gallery lightbox was not keyboard- or dialog-accessible. |
| Conversion optimisation | 61 | Project and contact CTAs existed, but vague trust claims competed with the more useful actions of requesting current details, comparing documents and arranging an exact-site visit. |
| Trust / E-E-A-T | 33 | The baseline included unverified named testimonials, five-star visuals, 100%/24-7 claims, “leading/worldwide/global market” copy, and stock photos that could be mistaken for company or project evidence. |

## Baseline Findings by Priority

### Critical

- The homepage displayed named testimonials and five-star visuals without repository evidence that the reviews, identities or permissions were genuine.
- The About page described a “global,” “leading” and “worldwide” business while the repository substantiated a Noida contact office and named project locations in Uttarakhand and Uttar Pradesh.
- The Gallery page was indexable and framed third-party Unsplash images as moments from the company’s work, including a stock portrait labelled “Founder.”

### High

- Homepage claims such as 100% commitment, 24/7 support and future/long-term value were not backed by service terms or verifiable evidence.
- GlobalBirth’s legal entity, office, founder and project geography were not consistently connected in visible copy and schema.
- `shubhkadam.html` did not provide enough comparison value to justify a collection URL and could blur the separate Corbett Eye plotted project with the Shubh Kadam–Nirvana legacy URL.
- Stock imagery frequently had alt text that described it as a named project, office, team or founder image.
- The sitemap exposed `gallery.html` while the newer Delhi NCR buyer guide was not represented in the baseline sitemap.

### Medium

- About and Shubh Kadam lacked breadcrumbs, skip links, main targets and page-specific JSON-LD.
- Several project URLs had no WebPage/Breadcrumb structured data, and their current claims require project-level verification before richer Product, Offer, Residence or accommodation schema could be safe.
- Project pages, project hubs and informational guides needed sharper intent boundaries to prevent “Jim Corbett property” cannibalisation.
- The mixed-case `Shubh-Kadam-Park-Resort.html` URL is stable but inconsistent with the rest of the lowercase URL set.

### Low / Opportunity

- Replace stock art with dated, geolocated, rights-cleared company and project photography when available.
- Publish project-specific evidence libraries only after image provenance, captions and update dates are verified.
- Expand buyer education around exact-site inspection and independent legal review rather than creating near-duplicate city doorway pages.

## Indexable URL Intent Map

One primary search intent is assigned to every currently intended indexable URL. Secondary phrases support the primary purpose; they must not become separate near-duplicate landing pages without genuinely different user value.

| Canonical URL | Page role and **one primary intent** | Supporting topics / geography | Canonical and schema decision | Internal-link and CTA decision |
|---|---|---|---|---|
| `/` | **Branded company and project-portfolio discovery**: GlobalBirth Developers Private Limited | Ramnagar, Jim Corbett region, Bhimtal, Moradabad, Dalpatpur–Kashipur | Canonical to `/`; Organization + WebSite + WebPage. The Organization node is the primary entity source. | Link to About, each project family, buyer guides and Contact. Primary CTA: compare projects; secondary CTA: contact the company. |
| `/about.html` | **Branded entity verification**: about GlobalBirth Developers Private Limited | Founder, Sector 142 Noida office, project-vs-office geography, published portfolio | Self-canonical; AboutPage + Organization + Person + BreadcrumbList implemented. Reuse the homepage Organization `@id`. | Link to portfolio hub, Corbett Eye, regional projects, due-diligence/site-visit/Delhi NCR guides and Contact. CTA: request current project details. |
| `/contact.html` | **Branded contact and site-visit action** | Noida office, phone, email, WhatsApp, project enquiry | Self-canonical; use ContactPage + BreadcrumbList and reference the site Organization when the page is next revised. Do not mark the Noida office as a project location. | Receive links from every commercial/project page. CTA: submit an enquiry, call, email or arrange an exact-project visit. |
| `/shubhkadam.html` | **Commercial comparison of the Shubh Kadam project collection** | Cottage, studio and resort concepts in Village Malkhan, Dhela, Jim Corbett region and Bhimtal | Self-canonical; CollectionPage + ItemList + BreadcrumbList implemented. Do not add Offer or rating schema. | Link to all five distinct child pages, Corbett Eye for name clarification, buyer guides and Contact. CTA: choose a project and request current details. |
| `/shubh-kadam-2.html` | **Branded project research for Shubh Kadam 2.0 duplex cottages** | Published Village Malkhan, Ramnagar concept; stated 10 duplex cottages / 20,424 sq. ft. | Self-canonical; decision is WebPage + BreadcrumbList. Avoid Offer/availability schema until price, inventory and seller evidence are current and verified. | Receive link from Shubh Kadam hub; link back to comparison, site-visit guidance and Contact. CTA: request current cottage details or visit. |
| `/shubh-kadam-jim-corbett.html` | **Branded project research for Shubh Kadam Jim Corbett studio units** | Published Dhela, Ramnagar, Nainital district concept; stated 20 studios / 13,616 sq. ft. | Self-canonical; decision is WebPage + BreadcrumbList. No lodging, review, price or rental schema without an evidenced current operating model. | Receive link from hub; link to Jim Corbett due diligence, Delhi NCR travel research and Contact. CTA: request current unit details and intended-use terms. |
| `/shubh-kadam-bhimtal.html` | **Branded project research for Shubh Kadam Bhimtal hill property** | Published Pandey Gaun, Bhimtal, Nainital concept; cottages, villas, studios; stated 137 Nali | Self-canonical; decision is WebPage + BreadcrumbList. Avoid unverified distance, view, return and availability markup. | Receive link from hub/About; link to comparison and Contact. CTA: request exact site, unit mix and visit details. |
| `/shubh-kadam-corbett-eye.html` | **Branded project research for the Shubh Kadam–Nirvana cottage concept** | Legacy URL; stated 21 simplex cottages / 13,000 sq. ft.; published as near Jim Corbett | Keep self-canonical because this is distinct content, not a duplicate of Corbett Eye. Decision is WebPage + BreadcrumbList with visible name “Shubh Kadam–Nirvana.” | Anchors should say “Shubh Kadam–Nirvana,” with a clear link to the separate Corbett Eye plotted page. CTA: verify legacy naming, exact site and current documents. |
| `/Shubh-Kadam-Park-Resort.html` | **Branded research for Shubh Kadam Jim Corbett Park and Resort** | Published hospitality concept; stated 18 studios, 21 duplex cottages / 22,126 sq. ft. | Retain the existing self-canonical mixed-case URL until a tested server-side 301 can support a lowercase replacement. Decision is WebPage + BreadcrumbList; no Hotel/Offer/rating schema without operating evidence. | Receive link from hub; link to intended-use checks and Contact. CTA: confirm exact site, status, operating model and charges. |
| `/corbett-eye.html` | **Transactional project research for Corbett Eye residential plots in Ramnagar** | Approximately 8.5 acres; NH-309; Ramnagar–Jim Corbett corridor, Uttarakhand | Self-canonical; WebPage + Thing + Place + BreadcrumbList currently used. Do not add price, availability, review or approval claims without verification. | Link from homepage/About/hub clarification and relevant guides. CTA: request current inventory, all-inclusive price, documents and site visit. |
| `/grah-pravesh.html` | **Branded project research for Grah Pravesh plots and villas in Moradabad** | Ladawali, Kanth Road, Moradabad; residential plots, commercial plots, villas | Self-canonical; decision is WebPage + BreadcrumbList. Project claims need current written confirmation before richer schema. | Link from homepage/About; link to Contact and general buyer checks. CTA: request current format, availability and site visit. |
| `/global-green-village.html` | **Branded project research for Global Green Village** | Dalpatpur–Kashipur Highway; published gated-community concept | Self-canonical; decision is WebPage + BreadcrumbList. No sustainability, amenity, price or status markup unless evidenced. | Link from homepage/About; link to Contact and buyer checks. CTA: request exact location, layout, current specifications and visit. |
| `/blogs.html` | **Informational discovery hub for Ramnagar and Jim Corbett property research** | Corbett Eye, plot due diligence, Ramnagar site visits, Delhi NCR buyer planning | Self-canonical; CollectionPage + ItemList. Keep article order and dates aligned with visible cards/feed. | Receive global navigation links; distribute authority to every guide and relevant project. CTA: choose a guide, then explore the relevant project or contact. |
| `/blog-corbett-eye-ramnagar-guide.html` | **Commercial investigation: what to check before visiting Corbett Eye Ramnagar** | Project positioning, NH-309 location, questions, documents, site inspection | Self-canonical; BlogPosting + WebPage + BreadcrumbList. | Link to Corbett Eye, due-diligence guide, site-visit checklist and Contact. CTA: review project facts and request current documents. |
| `/blog-buying-plots-near-jim-corbett.html` | **Informational due diligence for buying plots near Jim Corbett** | Title, land use, access, utilities, total cost, construction rules, agreements | Self-canonical; BlogPosting + WebPage + BreadcrumbList. | Link to Corbett Eye as one relevant project, not as a guaranteed recommendation; link to site-visit and Delhi NCR guides. CTA: use the checklist and seek independent advice. |
| `/blog-ramnagar-property-site-visit.html` | **Informational Ramnagar property site-visit checklist** | Before/during/after inspection, route planning, evidence capture, follow-up | Self-canonical; BlogPosting + WebPage + BreadcrumbList. | Link to Corbett Eye, due diligence, Delhi NCR planning and Contact. CTA: save the checklist and arrange an exact-site visit. |
| `/blog-investing-ramnagar-property-from-delhi-ncr.html` | **Informational planning for Delhi NCR buyers researching Ramnagar property** | Delhi, Noida, Greater Noida, Ghaziabad, Faridabad, Gurugram as buyer origins; Ramnagar as property location | Self-canonical; BlogPosting + WebPage + BreadcrumbList. One consolidated NCR guide avoids doorway pages. | Visible homepage/About/Shubh Kadam links; link to Corbett Eye, due diligence and site-visit workflow. CTA: prepare remotely and request a documented visit. |
| `/privacy-policy.html` | **Navigational/legal intent: GlobalBirth Developers privacy policy** | Data collection, contact and user rights | Keep self-canonical while indexable; WebPage schema is sufficient. If Search Console shows no search value, `noindex,follow` may be considered without removing user access. | Link from footer and forms. CTA: contact the company about privacy questions. |
| `/terms.html` | **Navigational/legal intent: GlobalBirth Developers website terms** | Website use, property-information limitations and enquiries | Keep self-canonical while indexable; WebPage schema is sufficient. If later noindexed, remove from sitemap but retain footer access. | Link from footer and relevant forms/disclaimers. CTA: contact the company for project-specific current terms. |

## Deliberately Non-Indexable or Non-Canonical URLs

| URL | Decision | Reason and linking treatment |
|---|---|---|
| `/gallery.html` | `noindex,follow`; self-canonical retained; exclude from XML sitemap and primary navigation | The current library contains only representative Unsplash editorial stock art and has no unique project-evidence value. Retain the URL for existing visitors and the legacy gallery redirect, but restore navigation prominence only after adding rights-cleared project evidence. |
| `/404.html` | `noindex,follow`; no self-canonical | Error utility, not a search landing page. It should return HTTP 404 in production and link users back to core content. |
| `/index.html` | Canonicalise to `/` | It is a file-system alias of the homepage, not a second indexable intent. Internal links should prefer `/` where deployment paths allow. |
| Header/footer/floating HTML fragments and `/templates/` files | Do not expose as standalone indexable documents | These are includes/templates, not user-facing landing pages. Production routing should return 404 or otherwise prevent standalone indexation if direct URLs are reachable. |

## Cannibalisation Decisions

1. **Homepage vs About:** `/` owns broad branded portfolio discovery. `/about.html` owns entity, leadership, office and company-verification intent. About must not become another generic “projects in Ramnagar” landing page.
2. **Corbett Eye project vs articles:** `/corbett-eye.html` owns transactional project research. The Corbett Eye guide owns pre-visit commercial investigation; the Jim Corbett plot guide owns category-level due diligence; the site-visit page owns the inspection workflow.
3. **Shubh Kadam hub vs children:** `/shubhkadam.html` owns comparison. Each child owns its exact branded project and property format. Child pages should not repeat the full collection copy.
4. **Corbett Eye naming conflict:** `/corbett-eye.html` is the residential plotted development. `/shubh-kadam-corbett-eye.html` remains a separate legacy URL for Shubh Kadam–Nirvana cottages. Use “Shubh Kadam–Nirvana” as the internal anchor and never canonicalise one page to the other.
5. **Delhi NCR buyer origins:** the consolidated Delhi NCR guide serves Delhi, Noida, Greater Noida, Ghaziabad, Faridabad and Gurugram buyers. Do not create six pages with city-name substitutions. A future city page is justified only by unique routes, meeting workflows, data and local questions.
6. **Ramnagar and Jim Corbett phrasing:** use Ramnagar/NH-309 for the actual plotted-project geography and Jim Corbett as nearby regional context where the project source supports it. Avoid making every project page target the same generic “plots near Jim Corbett” phrase, especially for non-plot formats.
7. **Legal/utility pages:** privacy and terms exist for trust and navigation, not commercial phrases. Gallery and 404 are excluded from search targeting.
8. **Mixed-case resort URL:** retain the live URL to avoid an unimplemented migration. If changed later, create one lowercase destination, one direct 301, update every internal link/canonical/sitemap entry, and verify that no redirect chain exists.

## Canonical, Schema and CTA Guardrails

- Use one HTTPS, non-`www` canonical origin consistently. Production redirects from HTTP, `www`, `/index.html`, trailing-slash variants and case variants require server verification.
- Reuse `https://globalbirthdevelopers.com/#organization` for the legal entity and `#website` for the website. Do not create conflicting names, phone numbers or addresses in page-level graphs.
- Organization data may include the published Noida office contact, but project pages must express their own `contentLocation`; the office is not a Ramnagar, Bhimtal or Moradabad project address.
- Do not publish AggregateRating, Review, Offer, price, availability, possession, RERA, approval, rental, appreciation or return schema without current visible evidence and external verification.
- Project CTAs should request current written details, exact-site visits and document review. Informational CTAs should move the visitor to the relevant project or checklist rather than promise returns.
- Representative stock images must be labelled as such in visible copy and accurate alt text. Replace them only with rights-cleared photographs whose subject, project, date and status are known.

## External Verification Gaps

The following cannot be established from repository code and must remain labelled **Requires external verification**:

- **Corporate identity:** Ministry of Corporate Affairs record, exact legal-name styling, CIN, incorporation date, registered office and whether the published Noida address is registered or operational.
- **Leadership:** founder/director designation, professional biography, credentials and permission to publish the leadership photograph.
- **Project authority:** land ownership or development rights, promoter/seller identity, exact survey/plot references, official site pins and project addresses.
- **Regulatory and legal status:** RERA applicability/registration, land use, sanctioned layouts, planning/environmental permissions, construction permissions, encumbrances and title chain.
- **Current commercial facts:** inventory, prices, taxes/fees, payment schedules, possession or completion status, specifications, amenity delivery, maintenance/management obligations and refund terms.
- **Published measurements:** acreage, square footage, Nali area and unit/cottage counts should be reconciled with current signed project documents.
- **Location and access:** NH-309 positioning, approach rights, road condition, exact distances, drive times and seasonal access require official maps, live routing and on-ground inspection.
- **Hospitality claims:** operating model, licences, rental/management arrangements, occupancy, income and any resort services require documentary evidence; proximity to tourism does not guarantee demand or returns.
- **Local presence:** Google Business Profile ownership, category, NAP consistency, map pin, hours, reviews and duplicate listings.
- **Search performance:** Search Console ownership, index coverage, submitted sitemap status, canonical selection, manual actions, rankings, queries, backlinks and crawl logs.
- **Analytics:** GA4/tag configuration, consent behaviour, organic leads, calls, WhatsApp conversions and form attribution.
- **Technical delivery:** live HTTP status codes, redirects, TLS/security headers, caching, compression, CDN behaviour and fragment/template exposure.
- **Real-user experience:** Core Web Vitals field data, real-device mobile usability, browser compatibility and assisted-technology testing.
- **Media rights:** Unsplash use compliance plus ownership, consent, date, location and authenticity for any future company/team/project photographs or testimonials.

## Content Growth Queue (No Doorway Pages)

Future work should prioritise evidence-backed depth rather than URL volume:

1. A current-document explainer for plotted-property buyers in Uttarakhand, reviewed by a named qualified professional.
2. An exact-site and access checklist for hill/cottage concepts, including slope, drainage, services and maintenance questions.
3. A versioned project-update format containing only dated, attributable photographs and written status evidence.
4. A transparent “how we handle enquiries and site visits” page if the operating process can be documented.
5. City-specific Delhi NCR content only when it adds unique route/meeting data beyond the consolidated NCR guide.
