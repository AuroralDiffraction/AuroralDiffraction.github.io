---
title: "Markdown guide for this blog"
date: 2026-10-03
draft: true            # drafts only show with `hugo server -D`; delete this file whenever you like
description: "Everything a post can contain: code, equations, figures, diagrams, callouts, spec tables and references."
tags: ["meta"]
toc: true

# References used by [@key] citations in this post (CSL format, the same fields Zotero exports).
# For references shared by many posts, put them in data/references.yaml or data/references.json instead.
references:
  - id: razavi2017
    type: book
    author:
      - { family: Razavi, given: Behzad }
    title: Design of Analog CMOS Integrated Circuits
    edition: 2
    publisher: McGraw-Hill
    issued: 2017
  - id: gray2009
    type: book
    author:
      - { family: Gray, given: Paul R. }
      - { family: Hurst, given: Paul J. }
      - { family: Lewis, given: Stephen H. }
      - { family: Meyer, given: Robert G. }
    title: Analysis and Design of Analog Integrated Circuits
    edition: 5
    publisher: Wiley
    issued: 2009
  - id: pelgrom1989
    type: article-journal
    author:
      - { family: Pelgrom, given: M.J.M. }
      - { family: Duinmaijer, given: A.C.J. }
      - { family: Welbers, given: A.P.G. }
    title: Matching properties of MOS transistors
    container-title: IEEE Journal of Solid-State Circuits
    volume: 24
    issue: 5
    page: 1433-1439
    issued: 1989
    DOI: 10.1109/JSSC.1989.572629
  - id: walden1999
    type: article-journal
    author:
      - { family: Walden, given: R.H. }
    title: Analog-to-digital converter survey and analysis
    container-title: IEEE Journal on Selected Areas in Communications
    volume: 17
    issue: 4
    page: 539-550
    issued: 1999
    DOI: 10.1109/49.761034
---

This post is a reference for writing on this site. It is a **draft**, so it only shows up when you run `hugo server -D`.

## Text

Regular Markdown works as expected: *italics*, **bold**, `inline code`, [links](https://gohugo.io/) and footnotes.[^1]

> Block quotes are good for pulling out a key point.

- Bullet lists
- [ ] and task lists
- [x] with checkboxes

[^1]: Footnotes are collected at the end of the post.

## Code

Fenced code blocks are highlighted at build time. Name the language after the backticks:

```verilog
module counter #(parameter WIDTH = 8) (
    input  wire             clk,
    input  wire             rst_n,
    output reg [WIDTH-1:0]  count
);
    always @(posedge clk or negedge rst_n)
        if (!rst_n) count <= '0;
        else        count <= count + 1'b1;
endmodule
```

```spice
* Common-source stage
M1 out in 0 0 nmos W=2u L=180n
RD vdd out 10k
VDD vdd 0 1.8
.op
.end
```

Languages the highlighter doesn't know, like SPICE netlists, are shown as plain text. Add `{hl_lines=[3]}` or `{linenos=true}` after the language to highlight lines or show line numbers.

## Equations

Write LaTeX between `$…$` for inline maths and `$$…$$` for display maths. KaTeX loads automatically on any page that uses it.

The square-law drain current of a MOSFET in saturation is $I_D = \tfrac{1}{2}\mu_n C_{ox}\tfrac{W}{L}(V_{GS}-V_{th})^2$, which gives a transconductance of

$$
g_m = \frac{\partial I_D}{\partial V_{GS}} = \sqrt{2\mu_n C_{ox}\frac{W}{L} I_D}
$$

## Figures

Put images in `static/images/` and reference them with a leading slash, or keep them next to the post in a page bundle (see the README). The text in quotes becomes the caption:

![Portrait](/images/profile/profilePic.jpg "Images with a title get a caption.")

## Diagrams

A `mermaid` code block becomes a diagram:

```mermaid
flowchart LR
  A[Schematic] --> B[Simulation] --> C[Layout] --> D[Tape-out]
  B -- iterate --> A
```

## Callouts and spec tables

{{< note title="Note" >}}
Use the `note` shortcode for asides. Types: `note`, `tip`, `warning`.
{{< /note >}}

{{< note type="warning" title="Watch out" >}}
Mismatch matters more than you think [@pelgrom1989].
{{< /note >}}

{{< specs >}}
Process | 65 nm CMOS
Supply | 1.2 V
Bandwidth | 1 GHz
Power | 2.4 mW
{{< /specs >}}

## Citations and references

Cite a source by writing its key in square brackets with an `@`, the same syntax as Pandoc and Quarto. Citations are numbered in order of first use, IEEE style, and the reference list is added to the end of the post automatically. Hover over a number to preview the reference.

| You write | You get |
|-----------|---------|
| `[@razavi2017]` | a single citation [@razavi2017] |
| `[@razavi2017, p. 45]` | a citation with a page or chapter [@razavi2017, p. 45] |
| `[@gray2009; @walden1999]` | several sources at once [@gray2009; @walden1999] |

For example: the square-law model above is derived in most analog design textbooks [@razavi2017; @gray2009], and the trade-off between ADC resolution and speed has been surveyed for decades [@walden1999].

The references themselves can live in three places, and a post can mix them:

1. **In the post's front matter**, under `references:`, as in this post. Open this file to see the format.
2. **In a file next to the post**, `references.json` or `references.yaml`, when the post is a folder (page bundle).
3. **In a site-wide library**, `data/references.json` or `data/references.yaml`, shared by every post. In Zotero, select the items and use *Export… → CSL JSON*; the Better BibTeX plugin keeps the citation keys stable.

A key that can't be found shows up as a red ?key and Hugo prints a warning when it builds. Footnotes[^2] still work alongside citations for side remarks.

[^2]: Like this one. Footnotes and references are listed separately.

## Tables

| Parameter | Symbol | Unit |
|-----------|--------|------|
| Transconductance | $g_m$ | S |
| Output resistance | $r_o$ | Ω |
| Intrinsic gain | $g_m r_o$ | V/V |
