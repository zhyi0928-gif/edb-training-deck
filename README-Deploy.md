# Deploy Guide

This project now has a dedicated publish directory at `docs/`.

## What gets published

Only the files needed for the static deck are copied into `docs/`:

- `docs/index.html`
- `docs/404.html`
- `docs/style.css`
- `docs/interaction.js`
- `docs/assets/`

The working files in the project root, such as `source.docx` and `source-extract.md`, stay outside the publish directory.

## GitHub Pages

1. Push the repository to GitHub.
2. In the repository settings, open `Pages`.
3. Set the publishing source to:
   - Branch: `main` (or your default branch)
   - Folder: `/docs`
4. Save and wait for GitHub Pages to publish.

## Vercel

This repo includes a root `vercel.json` that points `outputDirectory` to `docs`.

Two safe ways to deploy:

1. Import the whole repository into Vercel and keep the default root.
   The deployment will use `docs/` as the published output directory.
2. Import the repository and set the Vercel Root Directory to `docs`.
   This also works well for a static site.

## Updating the published copy

When the deck changes, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\Sync-Deploy.ps1
```

This refreshes:

- `docs/index.html`
- `docs/style.css`
- `docs/interaction.js`
- `docs/assets/`
- `docs/404.html`
