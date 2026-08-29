# Google Review AI Chrome Extension

A lightweight Manifest V3 Chrome extension for generating AI replies to Google reviews without leaving Google Maps or Google Business Profile.

## What it does

- Detects a visible/selected Google review when possible
- Falls back to manual paste if Google changes its page markup
- Uses the existing `generate-demo-response` Supabase Edge Function
- Generates a professional reply without exposing the OpenRouter key in the extension
- Copies the reply to the clipboard
- Inserts the reply into an open Google reply field
- Never clicks Google's final Publish/Reply button automatically; the user reviews before publishing

## Install locally

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `chrome-extension` folder.
6. Open a Google Maps / Google Business Profile review and click the Google Review AI extension icon.

## Test flow

1. Open a review on Google Maps or the Google Business Profile interface.
2. Optionally select the review text if automatic detection cannot identify it.
3. Click **Detect review**.
4. Confirm business, author and rating.
5. Click **Generate AI reply**.
6. Review the generated text.
7. Open Google's reply field and click **Insert in Google**, or use **Copy**.
8. Publish manually in Google.

## Supported pages

The initial version registers its content script on Google Maps / Google Search in `google.com` and `google.fr`, plus `business.google.com`.

## Security

No OpenRouter or Google OAuth secret is stored in the Chrome extension. AI generation stays server-side in the project's Supabase Edge Function.

## Chrome Web Store

Before public submission, add final PNG icons (16, 32, 48 and 128 px), screenshots, a privacy-policy URL and the production support URL to the store listing. Keep permissions minimal; this extension currently requests only `activeTab`, `storage`, `clipboardWrite`, and access to the project's Supabase function host.
