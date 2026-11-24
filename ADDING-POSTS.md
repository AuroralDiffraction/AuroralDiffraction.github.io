# Adding posts

The site has two places for writing:

| Section | URL | Use it for | What you add |
|---|---|---|---|
| **Blog** | `/blog/` | Articles written in Markdown | one `.md` file, or a folder with `index.md` and images |
| **Interactive posts** | `/interactive/` | Complete HTML pages with charts, sliders or simulations | a folder with `index.md` (title, date, tags) and the `.html` page |

Both show up under *Latest writing* on the home page, in search, in the tag pages and in the RSS feed.
Interactive posts get a small violet **Interactive** label in lists.

Every post can also have a Chinese version (or be written in Chinese only), see
[Writing in two languages](#3-writing-in-two-languages).

You don't need anything except a text editor and Git to publish. Every push to `main` builds the
site on GitHub and publishes it within a minute or two. Installing Hugo is optional, but it lets you
preview a post before anyone else sees it (see [Preview on your computer](#preview-on-your-computer)).

---

## 1. A Markdown post

### The quick way

Create a file in `content/blog/`. The file name becomes the URL, so use lowercase words and hyphens:

```
content/blog/designing-a-bandgap.md   →   https://auroraldiffraction.github.io/blog/designing-a-bandgap/
```

Start the file with front matter between `---` lines, then write Markdown below it:

```markdown
---
title: "Designing a bandgap reference"
date: 2026-11-01
description: "One-line summary shown in lists, search results and link previews."
tags: ["analog", "references"]
toc: true          # optional: table of contents in a sidebar
draft: false       # true keeps it off the live site
---

A bandgap reference adds a voltage that falls with temperature to one that rises...

## Why the base-emitter voltage drifts

Text, $g_m r_o$ maths, code blocks, figures and so on.
```

If Hugo is installed, `hugo new content blog/designing-a-bandgap.md` creates this file for you from the
template in `archetypes/blog.md`. The template starts with `draft: true`, so change it to `false` (or
delete the line) when you're ready to publish.

### A post with images

Make the post a folder and put the images next to it. The folder name becomes the URL:

```
content/blog/my-first-chip/
├── index.md          ← the post (same front matter as above)
├── layout.png
└── waveform.svg
```

In `index.md`, refer to the images by file name:

```markdown
![Top-level layout of the chip](layout.png "Optional caption shown under the figure")
```

Images shared between posts can go in `static/images/` instead, and are referenced with a leading slash:
`![Alt text](/images/whatever.png)`.

### What else a post can contain

Code with highlighting and a copy button, `$…$` and `$$…$$` equations, Mermaid diagrams, callout
boxes, spec tables and numbered citations with a reference list. `README.md` has the full table and
`content/blog/markdown-guide.md` shows every feature in use (it's a draft, so it only appears with
`hugo server -D`).

### Front matter fields

| Field | Required | What it does |
|---|---|---|
| `title` | yes | Post title |
| `date` | yes | Publication date (`2026-11-01`). Posts with a future date stay hidden until that day. |
| `description` | recommended | Summary in lists, search and link previews. Without it, the first paragraph is used. |
| `tags` | no | List of tags, e.g. `["analog", "layout"]`. Avoid `/` in a tag name. |
| `toc` | no | `true` adds a table of contents |
| `draft` | no | `true` hides the post from the live site |
| `math` | no | `true` forces KaTeX on (it is normally detected automatically) |
| `cover` | no | `image`, `alt`, `caption` for a picture at the top and in link previews |
| `references` | no | Sources for `[@key]` citations (see README) |
| `original` | no | On a translation: the language the post was first written in (`en` or `zh`). Shows “Originally written in …” with a link. See [section 3](#3-writing-in-two-languages). |

---

## 2. HTML in a post

There are two cases, depending on how much HTML you have.

### 2a. A bit of HTML inside a Markdown post

Raw HTML is allowed in Markdown, so for a small element you can paste it straight into a normal blog
post and it appears in the site's styling:

```markdown
Some Markdown text.

<details>
  <summary>Derivation</summary>
  <p>The long algebra goes here.</p>
</details>

<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" title="Talk" allowfullscreen></iframe>

More Markdown text.
```

This also works for an embedded video, a `<table>` with merged cells, or a small `<script>` widget.
Leave a blank line before and after an HTML block so the Markdown around it is still processed.

Don't paste a complete HTML document (one with its own `<html>`, `<head>` and `<style>`) into a
Markdown post: its styles would clash with the site's. That is what interactive posts are for.

### 2b. A complete HTML page → an interactive post

Use this for a self-contained page, such as an explainer with live plots exported from Claude or
written by hand. The page keeps its own design and scripts. The site wraps it with the site header,
title, date, tags and an **Open full page** button, and shows it in a frame that grows to the
page's full height, so readers scroll the site normally and never get a second scrollbar.

**Steps**

1. Create a folder for the post in `content/interactive/`. The folder name becomes the URL:

   ```
   content/interactive/sar-adc-explorer/
   ```

2. Copy your HTML file into that folder. Name it `page.html` (or keep its own name, see the `html:`
   field below). Any images, scripts or data files the page loads with relative paths
   (`src="chart.png"`) go in the same folder, and they are published with it.

3. Next to it, create `index.md` with the post's details:

   ```markdown
   ---
   title: "SAR ADC explorer"
   date: 2026-11-01
   description: "Step through a successive-approximation conversion bit by bit."
   tags: ["analog", "data converters"]
   html: "page.html"
   ---
   ```

   With Hugo installed, `hugo new content interactive/sar-adc-explorer/index.md` creates this file
   from `archetypes/interactive.md`. As with blog posts, that template starts as a draft.

   The folder now looks like this:

   ```
   content/interactive/sar-adc-explorer/
   ├── index.md      ← title, date, description, tags
   ├── page.html     ← the interactive page, unchanged
   └── chart.png     ← anything page.html loads (optional)
   ```

4. Preview it if you like, then commit and push (see below).

The gm/ID tutorial, `content/interactive/gm-id-method/`, is a working example of this setup.

**Extra front matter fields for interactive posts**

| Field | What it does |
|---|---|
| `html` | Which HTML file in the folder to show. Can be left out if the folder has only one `.html` file. |
| `height` | A fixed frame height in pixels, e.g. `height: 800`. Leave it out and the frame grows to fit the page. Set it for pages designed to fill the screen (full-height canvas, a game, a page with its own scrolling panels), which would otherwise keep stretching. |

Anything you write in `index.md` below the front matter (notes, a download link, references with
`[@key]` citations) appears in a normal text panel underneath the interactive page. Leave it empty
for none.

**Making a page fit in well**

- **Light and dark mode.** The site tells the page which theme is active by setting
  `data-theme="dark"` or `data-theme="light"` on the page's `<html>` element, and updates it when
  the reader flips the theme switch. A page whose CSS uses `:root[data-theme="dark"] { … }` follows
  along (the gm/ID page does this). A page that doesn't simply keeps its own colours.
- **Links.** Links to other pages open in the whole browser window. Links to a section of the same
  page (`href="#results"`) scroll to that section.
- **Fonts and libraries.** Loading them from a CDN (Google Fonts, cdnjs, jsDelivr) is fine.
- **Search.** The page's visible text is indexed, so readers can find it with the site search.
- **Title.** The site shows the `title` from `index.md` above the frame. The page can still have its
  own large heading inside.

**About other `.html` files in `content/`**

Only Markdown files become pages on this site (set by `contentTypes` in `config.yml`). An `.html`
file anywhere in `content/` is published unchanged at the matching address. For example,
`content/blog/scratch.html` would be reachable at `/blog/scratch.html`, but with no site header and
no entry in any list. To have an HTML page listed and framed in the site, use the folder setup above.

---

## 3. Writing in two languages

The site has an English side and a Chinese (简体中文) side:

| Language | Addresses | Interface |
|---|---|---|
| English | `/`, `/blog/…`, `/interactive/…` (unchanged) | English |
| 简体中文 | `/zh/`, `/zh/blog/…`, `/zh/interactive/…` | Chinese |

The **EN / 中** button in the header switches language. On a post that has a translation it opens
the translation; otherwise it opens the other language's home page.

### The rule: same file name, with `.zh` before `.md`

A translation sits next to the original and has the same name with `.zh` added. Hugo pairs the two
files by name, so nothing else needs linking:

| You want | Files |
|---|---|
| English only (as before) | `content/blog/designing-a-bandgap.md` |
| English and Chinese | `content/blog/designing-a-bandgap.md` + `content/blog/designing-a-bandgap.zh.md` |
| Chinese only | `content/blog/designing-a-bandgap.zh.md` |
| Post with images | `content/blog/my-first-chip/index.md` + `index.zh.md` in the same folder. The images are shared, so add them once. |

Both versions use the same URL name: `/blog/designing-a-bandgap/` and `/zh/blog/designing-a-bandgap/`.

A Chinese post uses the same front matter, written in Chinese. **Keep the tags in English** (the
same tags as the English version), so both languages share one set of tag pages:

```markdown
---
title: "带隙基准源设计"
date: 2026-11-01
description: "列表、搜索和链接预览中显示的一句话摘要。"
tags: ["analog", "references"]
original: en
---

带隙基准源把随温度下降的电压与随温度上升的电压相加……
```

### Marking a translation: `original`

On a translated post, set `original:` to the language the post was first written in (`en` or
`zh`). The translation then shows a small note under the date:

- English page translated from Chinese: *Originally written in **Chinese**.*
- Chinese page translated from English: *本文原文为**英文**。*

The language name links to the original post. Leave `original` out on the original itself (or set it
to the page's own language, which shows nothing). It works on blog posts, interactive posts,
projects and the About page.

### Posts that only exist in one language

You don't have to translate everything. A post with no translation still shows on the other side,
in the home page, the Blog/Interactive/Projects lists, the tag pages and search, with a small
**EN** or **中** label. Clicking it opens the post in its own language. As soon as you add the
translation, the label disappears and each side shows its own version.

The RSS feeds are per language (`/index.xml` and `/zh/index.xml`) and only contain posts written or
translated into that language.

### Interactive posts in two languages

Add `index.zh.md` next to `index.md` in the post's folder. Then either:

- **reuse the English page:** `html: "page.html"` in `index.zh.md` (the interactive page stays in
  English, the title, description and notes around it are Chinese), or
- **use a translated page:** save it next to the original as `page.zh.html` and put
  `html: "page.zh.html"` in `index.zh.md`.

```
content/interactive/gm-id-method/
├── index.md        ← html: "page.html"
├── index.zh.md     ← html: "page.zh.html", original: en
├── page.html
└── page.zh.html    ← optional translated page
```

If you translate the HTML page itself, also change `<html lang="en">` to `<html lang="zh-CN">` at
its top, so browsers pick Chinese fonts and line breaking.

### Section pages, About and Search

Each section has a Chinese title and description in `content/blog/_index.zh.md`,
`content/interactive/_index.zh.md` and `content/projects/_index.zh.md`. The Chinese search page
is `content/search.zh.md`. For a Chinese About page, add `content/about.zh.md` (same front matter as
`about.md`, with `layout: about`). Until it exists, the 关于 menu item opens the English page.

### Where the rest of the Chinese text lives

| What | Where |
|---|---|
| Home page text (subtitle, intro, buttons), site description, date format | `languages.zh.params` in `config.yml` (English: `languages.en.params`) |
| Interface words: menu, “Latest writing”, “min read”, search messages… | `themes/auroral/i18n/zh.yaml` (English: `en.yaml`) |

### Translating with AI

Copy the original file to the `.zh.md` (or plain `.md`) name, translate the title, description
and body, keep `date`, `tags`, `html`, image names, code and maths unchanged, and add `original:`.
Read it through once before publishing: AI translations often slip on technical terms
(e.g. 跨导 for transconductance, 反型 for inversion).

---

## Preview on your computer

Install Hugo once. On Windows, in PowerShell:

```powershell
winget install Hugo.Hugo
```

Any version from 0.130 up works. GitHub builds the site with 0.152.2 (`.github/workflows/hugo.yaml`).
Then, in the repo folder:

```powershell
cd C:\projects\AuroralDiffraction.github.io
hugo server -D
```

Open <http://localhost:1313>. `-D` includes drafts. The page reloads by itself every time you save a
file. Stop the server with `Ctrl+C`.

## Publish

```powershell
git add content/
git commit -m "Add post: SAR ADC explorer"
git push
```

The **Actions** tab on GitHub shows the build. When it turns green, the post is live. If it fails,
the log under *Build* names the file and line that caused it.

## Checklist and common problems

| Symptom | Cause |
|---|---|
| Post doesn't appear on the live site | `draft: true` is still set, or `date` is in the future |
| Post shows locally but not live | Not pushed yet, or the GitHub build failed (check Actions) |
| Image is missing | The image isn't in the post's folder, or the file name's capitals differ (`Layout.PNG` ≠ `layout.png`; GitHub is case-sensitive, Windows isn't) |
| Interactive post says “The interactive page for this post is missing” | No `.html` file in the folder, or `html:` names a file that isn't there |
| Interactive page keeps growing or is cut off | Add `height: 800` (or a value that suits it) to `index.md` |
| Interactive page ignores the site's dark/light switch | Its CSS doesn't style `:root[data-theme="dark"]`. Optional, see above |
| A tag links to a strange address | The tag contains `/`. Use words and spaces only. |
| A translation shows up as a separate post with an **EN**/**中** label | The file names don't match: it must be exactly the original's name plus `.zh` (`bandgap.zh.md` next to `bandgap.md`, `index.zh.md` next to `index.md`) |
| “Originally written in …” has no link | The original isn't published (still a draft, future date) or `original:` names the wrong language |
| Chinese post shows `Analog` and `模拟` as two different tags | Tags were translated. Use the English tags in both versions. |
