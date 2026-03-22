<!--Github stop bundling my sections into one line for god's sake!-->
# NovaMD (Nova Markdown) Formatting

This formatting is intended for use on ***<ins>PUBLIC GITHUB GISTS</ins>*** and ***not Pastebin***.

## Components Content

C = Components Message

C.cX = Components container X

C.cX.c = Container Colour (Hex like `#954ad7`)

C.cX.t = Component Text box (`C.cX.t` or `C.t`)

C.cX.i = Component Image (`StandardMD: ![<placeholder>](<url>)`)

C.cX.b = Component Button (`Label | Action`)

C.cX.l = Component Link (`<url>`)

C.cX.s = Component Section Divider (`Visual separator`)

C.cX.f = Component Field (`Field Key | Field Value`)

C.cX.m = Component Metadata (`Non-visible or contextual data`)

C.cX.e = Component End (`Explicit container termination`)

## Embed Content
X = seperate embed, 5 embeds max!! (X should basically be a number 1-5 as zeros are ignored.)

Xt = Embed Title

Xa = Embed Author

Xd = Embed Description

Xf = Embed Field (`Field Key | Field Value`)

Xt = Embed Footer

Xl = Embed Link

Xc = Embed Colour (HEX VALUE ONLY!!)

Xi = Embed Image (StandardMD: `![<placeholder>](<url>)`)

Xj = Embed Inline Start (Applies to next 3 lines max)

Xh = Embed Inline End (Applies to first 3 lines regardless of total lines.)

## Text Effects
#### c is shorthand for content because I'm lazy.
ts = Text Small (DiscordMD: `-# <c>`)

tn = Text Normal (DiscordMD: `<c>`) [This is mostly just for ensuring size changes between lines work properly as it's automatically added to lines without other size definitions.]

tm = Text Medium (DiscordMD: `### <c>`)

tb = Text Big (DiscordMD: `## <c>`)

tl = Text Large (DiscordMD: `# <c>`)

*<content>* = Italics (DiscordMD: `*<c>*`)
  
_<content>_ = Italics (DiscordMD: `_<c>_`)
  
**<content>** = Bold (DiscordMD: `**<c>**`)
  
***<content>*** = Bold Italics (DiscordMD: `***<c>***`)
  
~~<content>~~ = Strikethrough (DiscordMD: `~~<c>~~`)
  
__<content>__ = Underline (DiscordMD: `__<c>__`)

## NovaMD Example (w/ Embeds):
```
1c #690fcf
1t This is a *Title*
1a This is an Author
1d This is a **Description**
1f This is a Key | This is a ***Value***
1t This is a Footer
1l https://nova.nirmini.dev
```
---
**This is a concept and can change at any time with or without notice!!**
  
Written by KitKatt\([@SimplyKatt/@thatWest7014](https://github.com/thatwest7014)\)

A Part of: [Nirmini Nova](https://github.com/Nirmini/Nova).

> `© Nirmini 2025, All rights reserved.`