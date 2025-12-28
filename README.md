Cold Email Outreach Tool
Live Demo: https://instantly-ai.vercel.app

📖 Overview
Instantly-AI is a powerful, scalable cold email outreach tool designed to help businesses, agencies, and freelancers scale their outreach campaigns effortlessly. Inspired by industry leaders like Instantly.ai, this open-source alternative allows users to manage unlimited email accounts, warm up inboxes, and automate sequences to boost deliverability and reply rates.

Whether you are looking to generate leads, build B2B relationships, or simply automate your email workflows, this tool provides a unified interface to handle it all.

✨ Key Features
📧 Unlimited Email Accounts: Connect and manage multiple sender accounts (Gmail, Outlook, SMTP) from a single dashboard.

🔥 Automated Warmup: Built-in intelligent warmup algorithms to gradually increase sending volume and improve sender reputation.

🤖 AI-Powered Sequences: Leverage AI to generate personalized email copy and follow-up sequences that convert.

📥 Unified Inbox (Unibox): Manage replies from all your diverse email accounts in one centralized master inbox.

📊 Advanced Analytics: Real-time tracking of open rates, click-through rates (CTR), and reply rates to optimize campaign performance.

🛡️ Deliverability Protection: Smart sending patterns and variable delays to mimic human behavior and avoid spam filters.

📋 Lead Management: easy CSV import/export and contact tagging system.

🛠️ Tech Stack
Frontend: Next.js (React), Tailwind CSS, Framer Motion

Backend: Node.js / Next.js API Routes

Database: PostgreSQL / Supabase / MongoDB (Update based on your actual DB)

Authentication: NextAuth.js / Clerk

Deployment: Vercel

🚀 Getting Started
Follow these instructions to set up the project locally.

Prerequisites
Node.js (v18 or higher)

npm or yarn

A database instance (e.g., Supabase, Vercel Postgres)

Installation
Clone the repository

Bash

git clone https://github.com/yourusername/instantly-ai-clone.git
cd instantly-ai-clone
Install dependencies

Bash

npm install
# or
yarn install
Environment Setup Create a .env.local file in the root directory and add your environment variables:

Code snippet

DATABASE_URL=your_database_string
NEXTAUTH_SECRET=your_auth_secret
NEXT_PUBLIC_API_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_key_optional
Run the development server

Bash

npm run dev
Open http://localhost:3000 with your browser to see the result.
