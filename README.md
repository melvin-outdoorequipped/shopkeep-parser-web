# Shopkeep Parser Web

## Features
- PDF invoice parsing with coordinate-based size/quantity matching
- AI-powered item extraction using Gemini 2.5-flash (120s timeout, 3x retries)
- Vercel serverless deployment (maxDuration: 120s, 2GB memory)
- Frontend: Next.js with upload progress, client-side retries (130s timeout)
- Export to Excel/CSV

## Local Development
```bash
cd api && pip install -r requirements.txt
python api/parse.py  # Backend on :8080
cd frontend && npm run dev  # Frontend on :3000
```

## Deployment
```bash
vercel --prod
```

## Updates for Reliability (Fixed 504 Timeout)
- **Backend**: Gemini timeout 120s, tenacity retries (exp backoff 4-20s), gemini-2.5-flash → gemini-2.0-flash fallback
- **Frontend**: 3x retries with backoff, AbortController 130s timeout, detailed errors
- **Vercel**: maxDuration 120s, memory 2048MB

Test with complex PDFs - handles large docs without timeout.
