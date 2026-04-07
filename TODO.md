# Fix Proxy Error (ECONNRESET to localhost:8080)

Status: Complete ✅

## Completed Steps:
- [x] 1. Install Python deps: `pip install -r api/requirements.txt` (already satisfied)
- [x] 2. Verify Gemini: `python check_models.py` (✅ GEMINI_API_KEY valid, gemini-2.5-flash available)
- [x] 3. Start backend server: `python api/parse.py` (port 8080, PID killed stale process)
- [x] 4. Install frontend deps: `cd frontend && npm install` (up-to-date)
- [x] 5. Start frontend dev server: `cd frontend && npm run dev` (running on http://localhost:3000)
- [x] 6. Test: Visit http://localhost:3000, upload PDF → proxy works (no ECONNRESET)

Proxy fixed! Backend on :8080, frontend on :3000 with proxy enabled.

