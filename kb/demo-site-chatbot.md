---
title: Site chatbot demo
source: /demos
summary: How the site chatbot works, with one knowledge base answered by AWS or Azure.
---

# Site chatbot demo

The site chatbot answers questions about Dillon and this site. It shows in two places: the "Ask" button at the bottom left of every page, and its own demo page. On the Demos page it is listed as "Site chatbot (AWS and Azure)".

## Two clouds, one knowledge base

The chatbot has one knowledge base, a set of short markdown files about Dillon and the site. The same files feed two cloud backends:

- AWS: a Bedrock model in the Nova Lite class, with a Bedrock Knowledge Base that stores vectors in S3 Vectors.
- Azure: a small Azure OpenAI model, with Azure AI Search and text-embedding-3-small embeddings.

The visitor picks which cloud answers. Switching cloud keeps the conversation, and the next answer comes from the new cloud. Every answer shows a label with the cloud and response time, such as "AWS / 1.2 s". The demo page also has a compare view that sends one question to both clouds and shows the answers side by side.

## Tools

Both clouds share the same tools, which run in the site code:

1. Email Dillon: the bot drafts a message in a form card. Nothing is sent until the visitor presses Send.
2. Resume: view the HTML resume or download the PDF.
3. Go to a page: Demos, Videos, About or Contact.
4. Latest YouTube video, shown as a card.
5. Gym data: fixed, read-only queries over the Gym Tracker database.

## Limits and logging

- Each visitor has a rate limit, and there is a cap of 300 messages a day across both clouds. A compare question counts as two. Past the cap the bot points to the Contact page (/contact).
- Questions and answers are logged with a hashed visitor id, never the raw IP address. The chat panel says that chats are logged.

## Cost

Cost was the top design constraint, so each piece uses the cheapest option that works.
