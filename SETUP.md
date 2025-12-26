# Instantly.ai Clone - Complete Setup Guide

## Prerequisites

### 1. Install PostgreSQL
```bash
# Windows (using chocolatey)
choco install postgresql

# Start PostgreSQL
net start postgresql-x64-15

# Create database
psql -U postgres
CREATE DATABASE instantly;
\q
```

### 2. Install Redis
```bash
# Windows (using chocolatey)
choco install redis-64

# Start Redis
redis-server
```

## Environment Setup

Create/update `.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/instantly?schema=public"
REDIS_HOST="localhost"
REDIS_PORT="6379"
NEXTAUTH_URL="http://localhost:3000"
```

## Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push
```

## Running the Application

### Terminal 1: Next.js Dev Server
```bash
npm run dev
```

### Terminal 2: Background Workers
```bash
# Run all workers (email sending, reply detection, warmup)
npx tsx lib/start-workers.ts
```

This starts:
- **Email Sending Worker**: Processes campaign emails
- **Reply Detection Worker**: Polls IMAP every 60 seconds
- **Warmup Worker**: Sends warmup emails every hour

## Features Now Working

### ✅ Phase 1: Core Functionality
- Email account management (CRUD)
- Campaign management (CRUD)
- Lead import and management
- Sequence editor
- Campaign scheduling
- Email sending with tracking
- Open/click tracking
- Real-time analytics

### ✅ Phase 2: Advanced Features
- **Reply Detection**: Automatically detects when prospects reply
- **Warmup System**: Gradual sending ramp-up for new accounts
- **IMAP Sync**: Polls Gmail/Outlook for new emails
- **Auto-stop on Reply**: Campaigns stop when lead replies
- **Daily Limits**: Warmup respects daily sending limits

## How It Works

### Reply Detection
1. Worker polls IMAP every 60 seconds
2. Finds unread emails
3. Matches replies to sent emails via Message-ID
4. Creates "reply" event in database
5. Updates lead status to "replied"
6. Stops campaign if `stopOnReply` enabled

### Warmup System
1. New accounts start with 10 emails/day
2. Increases by 5 emails/day automatically
3. Sends warmup emails between your accounts
4. Tracks warmup progress
5. Campaigns respect warmup limits

## Manual Sync

Trigger manual reply sync:
```bash
curl -X POST http://localhost:3000/api/sync/replies
```

## Testing

### Test Reply Detection
1. Send test campaign to yourself
2. Reply to the email
3. Wait 60 seconds for sync
4. Check lead status → should be "replied"
5. Check campaign stats → reply count increased

### Test Warmup
1. Enable warmup on account
2. Set warmup limit (e.g., 20/day)
3. Wait for warmup worker (runs every hour)
4. Check warmup sent count

## Troubleshooting

### IMAP Connection Issues
- Ensure IMAP is enabled in Gmail/Outlook
- Use App Password, not regular password
- Check firewall settings

### Redis Connection Issues
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG
```

### Worker Not Starting
```bash
# Check if port 6379 is available
netstat -an | findstr 6379
```

## Production Deployment

1. **Database**: Use managed PostgreSQL (Supabase, Render)
2. **Redis**: Use managed Redis (Upstash, Redis Cloud)
3. **Workers**: Deploy to background worker service (Render, Railway)
4. **App**: Deploy to Vercel/Netlify

## Next Steps

- [ ] Implement authentication (NextAuth.js)
- [ ] Add bounce handling
- [ ] Add unsubscribe links
- [ ] Deploy to production
