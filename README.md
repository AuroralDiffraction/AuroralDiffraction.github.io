# auroraldiffraction.github.io

Personal site built with [Hugo](https://gohugo.io/) and a custom theme in `themes/auroral`
(aurora-over-silicon background, blog, projects, about page, search, dark/light mode).

Needs **Hugo 0.130 or newer** (the standard edition works; extended isn't required).

## Run it locally

```bash
hugo server -D        # -D also shows drafts; open http://localhost:1313
hugo                  # build the public site into ./public
```

## Write a blog post

```bash
hugo new content blog/my-post.md
```

This creates `content/blog/my-post.md` from `archetypes/blog.md`. Write Markdown under the
front matter and set `draft: false` (or delete that line) when it's ready to publish.

```yaml
---
title: "Designing a bandgap reference"
date: 2026-10-03
draft: false
description: "One-line summary shown in lists and link previews."
tags: ["analog", "references"]
toc: true            # adds a table of contents (sidebar on wide screens)
---
```

**Posts with images.** Make the post a folder ("page bundle") and keep the images next to it:

```bash
hugo new content blog/my-first-chip/index.md
```

```
content/blog/my-first-chip/
├── index.md
├── layout.png
└── waveform.svg
```

Then use `![Top-level layout](layout.png "Optional caption")` in the post. Images in
`static/images/` work too: `![Alt text](/images/whatever.png)`.

**What a post can contain.** Everything is shown in `content/blog/markdown-guide.md`
(a draft, visible with `hugo server -D`). In short:

| You write | You get |
|---|---|
| ` ```verilog ` … ` ``` ` | Highlighted code with a copy button (Verilog, SystemVerilog, VHDL, Python, C, Tcl…). Unknown languages such as SPICE show as plain text. |
| `$g_m r_o$`, `$$ … $$` | Equations typeset with KaTeX (loaded only on pages that use maths) |
| ` ```mermaid ` … ` ``` ` | Block diagrams and flowcharts |
| `{{< note type="tip" >}} … {{< /note >}}` | Callout box: `note`, `tip` or `warning` |
| `{{< specs >}} Process \| 65 nm {{< /specs >}}` | Key/value spec table, one `name \| value` per line |
| `![alt](img.png "caption")` | Figure with caption, lazy loaded |
| `[@razavi2017]`, `[@a; @b, p. 4]` | Numbered citation [1] with a hover preview, and an IEEE-style reference list at the end |

## Cite references

Write citations the Pandoc way: `[@key]`, `[@key, p. 45]`, or `[@key1; @key2]`. They are numbered
in order of first use and a **References** list is added to the end of the post (and to its
table of contents). The entries use CSL fields, the format Zotero, Mendeley and JabRef export.
Hugo looks for a key in this order:

1. the post's front matter:

   ```yaml
   references:
     - id: pelgrom1989
       type: article-journal
       author:
         - { family: Pelgrom, given: M.J.M. }
       title: Matching properties of MOS transistors
       container-title: IEEE Journal of Solid-State Circuits
       volume: 24
       issue: 5
       page: 1433-1439
       issued: 1989
       DOI: 10.1109/JSSC.1989.572629
   ```

2. a `references.json` or `references.yaml` file next to the post (page bundle);
3. a site-wide library in `data/references.json` or `data/references.yaml` (or several files in
   `data/references/`). In Zotero: select items → *Export Items… → CSL JSON*. With the Better BibTeX
   plugin the `id`s are your usual citation keys.

Supported types: `book`, `article-journal`, `paper-conference`, `chapter`, `thesis`, `report`,
`webpage`. A key that isn't found shows as a red **?key** and `hugo` prints a warning.
Citations inside code are left alone.

## Add a project

```bash
hugo new content projects/my-adc.md
```

Front matter fields (all optional except the title):

```yaml
title: "10-bit SAR ADC"
description: "What it is in one or two sentences."
status: "Taped out"        # In progress | Completed | Taped out | Archived
featured: true             # shown on the home page, as a wide tile
weight: 1                  # lower numbers come first
tech: ["Cadence Virtuoso", "Spectre", "28 nm"]
links:
  - name: GitHub
    url: "https://github.com/..."
    icon: github           # github, link, scholar, email, linkedin, orcid
cover:
  image: "die-photo.jpg"   # page-bundle file or /images/... ; without one, a waveform is generated
  alt: "Die photo"
```

`content/projects/example-project.md` is a draft template you can copy or delete.

## Edit the about page and the home page

- About page: `content/about.md` (Markdown).
- Home page hero, social links and menu: `params.hero`, `params.social` and `menu` in `config.yml`.
- Turn the animated background off with `params.background: false`.
- Article width: `--post-w` at the top of `themes/auroral/assets/css/main.css` (default `58rem`).
- Default colour theme: `params.defaultTheme` (`dark`, `light` or `auto`).

## Where things live

```
config.yml                  site settings, menu, hero text, social links
content/blog/               blog posts (Markdown)
content/projects/           projects (Markdown)
content/about.md            about page
archetypes/                 templates used by `hugo new`
static/                     files copied as-is (images, favicons)
themes/auroral/
  layouts/                  HTML templates
  assets/css/main.css       all styles; colours are CSS variables at the top
  assets/js/background.js   the animated aurora + circuit background
  assets/js/site.js         theme toggle, copy buttons, contents sidebar, citation previews
  layouts/partials/content.html   turns [@key] citations into numbered links + reference list
```

Old links (`/post/about/`, `/blogs/`, `/archives/`) redirect to the new pages.

The earlier PaperMod version of the site is in the git history (commit `42c67e0`).
