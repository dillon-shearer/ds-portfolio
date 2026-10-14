# Data With Dillon portfolio

Next.js 15 App Router site, deployed on Vercel from GitHub main. Code: github.com/dillon-shearer/ds-portfolio, local checkout C:\Users\dills\ds-portfolio.

## Build and test by hand

Run these in the site checkout (needs Node 22.6 or later for the test scripts):

1. Install: `npm ci`
2. Build: `npm run build`
3. Test: `npm run lint && npm run test:gym && npm run test:gym-day-view && npm run test:gym-chat-catalog`

## Board setup

`.kanban95/config.json` holds the same steps for agents: `worktree_setup` runs `npm ci` in each new ticket worktree and `test` runs lint plus the gym tests. Both skip when there is no `package.json`, so they also pass in a folder that only holds `.kanban95`.
