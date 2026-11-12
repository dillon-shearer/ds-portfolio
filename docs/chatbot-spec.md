# Site chatbot spec

The single reference for the site chatbot project. Every chatbot ticket builds from this
document. Owner decisions date from 2026-11-11.

## What it is

A chatbot that answers questions about Dillon and this site. It has one knowledge base and
two cloud backends, AWS first and Azure second. It shows in two places:

- A floating widget at the bottom left of every page.
- A demo page at `/demos/chatbot`.

The visitor can pick which cloud answers. The chatbot replaces the old gym chat, which is
removed late in the project.

## Architecture

- Knowledge base: markdown files in `kb/`. The same files feed both clouds.
- The model and the knowledge base search run on each cloud.
- The tools run in the site code and are shared by both clouds.
- No Bedrock Agents and no Azure agent service.

### AWS

- Model: Bedrock, Nova Lite class. The exact model id is confirmed by the AWS setup ticket.
- Knowledge base: Bedrock Knowledge Base with vectors stored in S3 Vectors.

### Azure

- Model: Azure OpenAI small model, nano or mini class. The exact model id is confirmed by
  the Azure setup ticket.
- Search: Azure AI Search free tier.
- Embeddings: `text-embedding-3-small`.
- Calls use `fetch`. No Azure SDK package.

### Cost

Cost is the top constraint. Always pick the cheapest option that works, vector storage in
particular.

## Limits

- A per-visitor rate limit.
- A hard cap of 300 messages a day across both clouds combined.
- A compare-view question counts as 2 messages.
- Both are built on `lib/rate-limit.ts` and the `rate_limits` table.
- Past the cap the bot says it is done for the day and points to `/contact`.

## Logging

- Every question and answer is stored in Postgres.
- Each row holds a hashed visitor id (never the raw IP), the cloud, the response time and
  the token counts.
- The chat panel shows a short notice that chats are logged.

## Tools

The same five tools on both clouds.

1. Email Dillon. The bot drafts the message, the visitor edits it in a form card and
   presses Send. Nothing is sent without that click. Reuses the Resend logic in
   `app/contact/actions.ts`.
2. Resume. View the HTML resume (`/resume`) or download the PDF.
3. Go to a page. Demos, Videos, About or Contact, shown as a button.
4. Latest YouTube video, shown as a card. Uses `lib/videos.ts`.
5. Gym data. New fixed, parameterized, read-only queries. No model-written SQL. Nothing
   is ported from `lib/gym-chat`.

## Voice

The bot never says or implies that Dillon is looking for work. It states facts in plain
sentences and does not lead with a job role.

## UI picks

1. Look: the soft chat exception. Rounded bubbles, a pill input and one soft shadow under
   the panel. Chat only. See "Chat exception" in `.claude/STYLE.md`.
2. Launcher: a labelled button "Ask" with an icon, at the bottom left.
3. Cloud choice: hovering the launcher shows two chips above it, "AWS" and "Azure".
   Clicking a chip opens the chat on that cloud. Clicking the button opens the last cloud
   used (AWS the first time). On touch devices the first tap shows the chips.
4. A two-way AWS | Azure toggle in the panel header.
5. Switching cloud keeps the conversation. The next answer comes from the new cloud.
6. Every answer has a small label such as "AWS / 1.2 s", in the widget and on the demo page.
7. Desktop panel: compact, about 380 by 560, with an expand button (about 640 wide and 80%
   of the window height).
8. Phones (under 720px): full screen with a close button at the top.
9. First screen: one greeting line, three suggested questions, and a row of four actions
   (Email Dillon, Resume, Demos, Latest video).
10. Sources: a short list of page links, always shown under an answer that used the
    knowledge base.
11. Email: a form card in the chat with name, email and message fields, and Send and
    Cancel buttons.
12. Resume, pages and video show as cards and buttons, not plain links.
13. Gym answers: text, tables, and a small chart when the question is about a trend
    (Recharts is already installed).
14. Answers stream in.
15. The widget never opens or nudges by itself.
16. No bot name. The panel header reads "Ask about Dillon's work".
17. Demo page compare view: two columns, AWS on the left and Azure on the right, each with
    its response time. Stacked on phones.
18. Demo entry title: "Site chatbot (AWS and Azure)".

A cloud that is not configured is not offered. With one cloud there are no chips and no
toggle.

## Working rules

- ASCII only in every tracked text file.
- No code comments. Notes for future agents go in the brain.
- Surgical changes. Existing behaviour is preserved.
- Approved new packages: `@aws-sdk/client-bedrock-runtime` and
  `@aws-sdk/client-bedrock-agent-runtime` only. Azure uses `fetch`.
- Approved new routes: `/api/chat`, `/api/chat/email` and `/demos/chatbot`.
- Any other package or route needs owner approval first.
