---
title: Variant Report Tool
source: /demos
summary: The production web app Dillon built at Answer ALS for exploring whole genome sequencing variant data.
---

# Variant Report Tool

The Variant Report Tool is a production web app Dillon built at Answer ALS, in its ALS research data portal, for exploring whole genome sequencing (WGS) variant data. It is listed on the Demos page (/demos) and on Dillon's resume. It runs on Azure at neuromine-variant-reports-prod.azurewebsites.net.

## What it does

- Builds multi-sheet Excel variant reports for a chosen gene list and participant set.
- Runs genotype-first lookups: given a locus or an rsID, it finds the participants who carry that variant.
- Plots cohort variants in an embedded igv.js genome browser.

## How it is built

- Python with Panel for the web app.
- Azure SQL for the variant data.
- Azure Blob Storage for files.
- igv.js for the genome browser.
- Azure App Service for hosting.

