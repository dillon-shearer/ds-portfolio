---
title: Gym Tracker demo
source: /demos/gym
summary: What the live Gym Tracker dashboard shows and how it is built.
---

# Gym Tracker demo

The Gym Tracker is Dillon's personal training dashboard, live at /demos/gym. It is built on every workout he logs. It is listed on the Demos page (/demos) and on his resume.

## What it shows

- Weekly training volume over time.
- Training splits and how often each body part is trained.
- Exercise personal records (PRs).
- An interactive 3D body diagram that maps training volume onto body parts.
- A day view with the sets and exercises from a single session.
- An AI coach chat that answers questions about the training data.
- A download of the data as JSON or CSV.

## How it is built

- Next.js and TypeScript for the app.
- PostgreSQL stores every logged set.
- Recharts draws the charts.
- React Three Fiber (Three.js) renders the 3D body diagram.
- The AI coach uses OpenAI models and reads the data through read-only SQL.

## Asking about the gym data

Questions about the actual numbers, such as last week's volume, a lift PR or how often a muscle was trained, are answered from the live database by the chatbot's gym data tool, not from this entry. The engineering write-up is on the Gym Tracker case study page (/work/gym-tracker).
