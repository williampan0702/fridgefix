# FridgeFix

FridgeFix is a self-contained hackathon prototype for finding meals from available ingredients, improving an existing meal, tracking missing groceries, and saving meal ratings locally.

## Photo analysis

The browser sends an uploaded meal photo to `/api/analyze-meal`. The serverless function calls a pretrained vision model and returns tentative food names, confidence estimates, and visual portion estimates. Users must confirm or edit these predictions before nutrition analysis.

No model training is required. Keep the API key on the server—never paste it into `index.html` or commit it to GitHub.

## Deploy on Vercel

1. Upload this folder to a GitHub repository.
2. Import the repository into Vercel.
3. Add `OPENAI_API_KEY` in the Vercel project's Environment Variables settings.
4. Optionally set `OPENAI_VISION_MODEL` to a different vision-capable model.
5. Deploy. Vercel will serve `index.html` and the `/api/analyze-meal` function from the same origin.

The rest of the site works as a static prototype. Photo identification needs the deployed serverless endpoint (or `vercel dev`) and a valid API key. Opening `index.html` directly or hosting only on GitHub Pages can display the selected photo, but it cannot execute the `/api/analyze-meal` server function.
