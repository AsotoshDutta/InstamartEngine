# AI-Powered Discovery Engine — Swiggy Instamart

## Overview
An AI system that analyzes user feedback from multiple sources to generate actionable insights for increasing cross-category product adoption on Swiggy Instamart.
Built for the Growth Team as a grad project.
Deployed on Vercel (Hobby Plan) + Supabase (Free Tier).

## Problem Statement
- Quick commerce platforms have highly repetitive shopping behavior.
- Users rarely explore new categories.
- Goal: Increase % of Monthly Active Customers (MACs) who purchase from at least 1 new category monthly.

## Architecture
This project uses an **offline-heavy, runtime-light** approach to stay within free tier limits. Data collection, classification, and clustering happen via automated cron jobs, while the dashboard simply reads pre-computed insights.

```text
[Data Sources] -> (Cron Job) -> [API: /api/pipeline/collect] 
                                      |
                                      v
                             [Raw Feedback in Supabase]
                                      |
                              [API: /api/pipeline/process] <- (Cron Job + Gemini AI)
                                      |
                                      v
                           [Processed Feedback in Supabase]
                                      |
                             [API: /api/pipeline/cluster] <- (Cron Job + Gemini AI)
                                      |
                                      v
                             [Clusters in Supabase]
                                      |
                             [API: /api/pipeline/insights] <- (Cron Job + Gemini AI)
                                      |
                                      v
                             [Insights in Supabase]
                                      |
                              (Dashboard App) -> User
```

## Tech Stack
| Tech | Purpose |
| --- | --- |
| Next.js 16 | App framework + API routes |
| Gemini 2.0 Flash | AI classification, clustering, insight generation |
| Supabase | PostgreSQL database (free tier) |
| Vercel | Hosting + serverless + cron |
| Recharts | Dashboard charts |

## Features
- Multi-source data collection (Play Store, App Store, Reddit, CSV)
- AI-powered classification (sentiment, category, theme tags)
- Theme clustering with strategic question mapping (Q1-Q8)
- Actionable insight generation with confidence scoring
- Real-time dashboard with 5 views
- Pipeline controls with cron automation

## Quick Start
1. Clone the repo
   ```bash
   git clone <repository_url>
   cd instamart-discovery-engine
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Set up Supabase
   Create a new Supabase project and run the provided SQL setup scripts to create tables and RLS policies.
4. Configure environment variables
   Create a `.env.local` file in the project root and populate it with your keys.
5. Run the development server
   ```bash
   npm run dev
   ```
6. Open http://localhost:3000/dashboard

## Environment Variables
| Variable | Description | Required |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase public anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (for backend operations) | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `CRON_SECRET` | Secret to secure cron API routes | Yes |

## API Reference
| Method | Path | Description |
| --- | --- | --- |
| GET/POST | `/api/pipeline/collect` | Fetches raw feedback from various sources and stores it in Supabase. |
| GET/POST | `/api/pipeline/process` | Processes raw feedback using Gemini for sentiment and tagging. |
| GET/POST | `/api/pipeline/cluster` | Clusters processed feedback into themes. |
| GET/POST | `/api/pipeline/insights`| Generates actionable insights from clusters. |
| GET | `/api/feedback` | Retrieves feedback data for the dashboard. |
| GET | `/api/insights` | Retrieves insights data for the dashboard. |

## Project Structure
```text
src/
├── app/
│   ├── api/
│   │   ├── pipeline/
│   │   │   ├── collect/route.js
│   │   │   ├── process/route.js
│   │   │   ├── cluster/route.js
│   │   │   └── insights/route.js
│   │   ├── feedback/route.js
│   │   └── insights/route.js
│   ├── dashboard/
│   │   ├── page.js
│   │   └── layout.js
│   ├── globals.css
│   └── layout.js
├── components/
│   ├── Dashboard/
│   ├── UI/
│   └── PipelineControls.js
├── lib/
│   ├── supabase.js
│   ├── gemini.js
│   └── sources/
└── utils/
    ├── helpers.js
    └── confidenceScore.js
```

## Strategic Questions (Q1-Q8)
The engine maps insights to these 8 strategic questions to drive growth:
1. Q1: What friction points prevent users from exploring new categories?
2. Q2: Which category pairings have the highest untapped cross-selling potential?
3. Q3: How does delivery time expectation vary by product category?
4. Q4: What missing features or categories are most requested by high-frequency users?
5. Q5: What triggers a user to make their first purchase in a new category?
6. Q6: How do UI/UX issues impact category discovery?
7. Q7: Which promotional strategies are most effective at driving cross-category trials?
8. Q8: What are the main reasons for user drop-off during category exploration?

## Deployment
1. Push your code to a GitHub repository.
2. Import the project into Vercel.
3. Configure all environment variables in Vercel settings (including `CRON_SECRET`).
4. Vercel will automatically read the `vercel.json` file for cron configuration.
5. Deploy. The cron jobs will trigger the pipeline APIs automatically based on the schedule.

## Confidence Scoring
Insights are assigned a confidence score (0-100%) based on:
- **Volume**: Number of feedback items supporting the insight.
- **Sentiment Consistency**: Agreement in sentiment across the items.
- **Source Diversity**: Whether the feedback comes from multiple sources (e.g., Reddit AND Play Store).
- **Recency**: Newer feedback is weighted slightly higher.

## License
MIT
