# TODO: Fix 504 Timeout in AI Parsing
Status: In Progress

## Steps:
- [x] 1. Update api/requirements.txt (add tenacity)\n- [x] 2. Read & backup current vercel.json\n- [x] 3. Update vercel.json for timeout
- [x] 4. Update api/parse.py (timeout, chunking, retries)
- [x] 5. Read frontend/pages/index.tsx
- [x] 6. Update frontend/pages/index.tsx (retries, progress)
- [x] 7. pip install -r api/requirements.txt
- [x] 8. Local test & vercel deploy
- [x] 9. Update README.md
- [x] 10. Mark complete
