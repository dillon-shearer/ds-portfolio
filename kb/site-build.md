---
title: How this site is built
source: /colophon
summary: The stack, content model, design system, checks and hosting behind datawithdillon.com.
---

# How this site is built

The site at datawithdillon.com is called Data With Dillon. The Site notes page (/colophon) describes how it is built. The source code is public in the ds-portfolio repository on GitHub (github.com/dillon-shearer/ds-portfolio).

## Application

The site uses the Next.js 15 App Router with TypeScript. Routes are server-rendered by default, with client components where interaction needs them.

## Content

Page copy lives in typed TypeScript modules under a content folder. This keeps content separate from page layout and gives repeated structures a shared shape.

## Styling

CSS Modules scope page styles. Shared colors, type sizes, spacing, borders and motion values live in one design token file.

## Design system

The interface follows a design system called Studio Ledger: paper and ink colors, thin hairline rules, a restrained type scale and compact index-list layouts. The site avoids rounded corners, shadows and gradients. The chat widget is the one exception, with rounded bubbles and a soft shadow.

## Checks

Every change passes ESLint, an ASCII-only content check and a production build before it ships.

## Hosting

The site deploys on Vercel from the GitHub repository.

## AI agents

Much of the site is built with AI coding agents working through a ticket board. Some of these build sessions are on the YouTube channel (/videos).
