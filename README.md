# FridgeFix

FridgeFix is a self-contained hackathon prototype for finding meals from available ingredients, improving an existing meal, tracking missing groceries, and saving meal ratings locally.

The project is fully static. `assets/fridgefix-logo.png` is used in the navigation and as the browser-tab icon; no `api` folder or server environment variable is required.

## Photo analysis

FridgeFix downloads the Apache-2.0 [`onnx-community/swin-finetuned-food101-ONNX`](https://huggingface.co/onnx-community/swin-finetuned-food101-ONNX) model and runs it directly in the visitor's browser with Transformers.js. No API key, paid account, server function, or custom training is required, and the uploaded photo stays on the visitor's device.

The first scan downloads a quantized model of about 60 MB. Browser Cache Storage and the Transformers.js WASM cache are explicitly enabled for later scans. A page reload still has to rebuild the in-memory model session, but cached model weights should not be downloaded again. Caches are separate for different domains and browser profiles, and can be removed by private browsing, clearing site data, storage pressure, or browser settings. WebGPU is used when available and WebAssembly is the fallback.

Food-101 is a 101-category whole-dish classifier. Its five results are alternative guesses, not a list of every component on the plate. It cannot reliably detect hidden ingredients, estimate portions, or calculate calories from pixels. The interface therefore preselects only the top result and asks the user to confirm, edit, or add components before FridgeFix uses its preset nutrition estimates.

Each confirmed prediction also has a user-selected portion: Small (0.75×), Medium (1×), or Large (1.5×). FridgeFix multiplies its typical-serving calories, protein, fibre, and sugar by that value. These are transparent approximations rather than image-derived weights.

Manually entered meals and meals transferred from a completed recipe now receive the same per-food portion controls. Changing a selector recalculates nutrition and swaps immediately.

The nutrition analyzer now covers all 101 labels produced by the classifier. Each label has a typical-serving nutrition profile and a practical alternative; these prototype values are grouped estimates and are not medical or laboratory measurements.

Saved meal-history entries are clickable. New records retain a recipe snapshot so the history detail view can show nutrition, ingredients, cooking steps, rating, leftovers, and feedback even if the main recipe data changes later.

Recipe ingredients mentioned in cooking instructions are treated as required. Recipes also retain at least three core required ingredients; optional status is reserved mainly for garnishes and toppings. Starting a new Improve-a-meal session clears the previous photo, predictions, entered foods, portions, and results while keeping the already-loaded classifier available in memory.

## Deploy

1. Upload this folder to a GitHub repository.
2. Enable GitHub Pages, or import the repository into Vercel.
3. Deploy the site as static files. No environment variables are needed for the local classifier.

An internet connection is needed for the first model download. Hosting through GitHub Pages or Vercel is preferred to opening `index.html` directly because browser module and model-loading rules vary for `file:` pages.
