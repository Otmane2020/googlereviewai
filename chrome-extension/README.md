# Business Reviews AI — Chrome Extension

Production-ready Chrome extension package for AI-assisted customer review replies.

## Brand

The extension reuses the official GoogleReviewAI visual system from the main application: official review-bubble mark, Inter/system typography, light slate surfaces, white cards, Google-style blue accents, AI blue `#1769FF`, and 12–14 px rounded corners.

Public extension name: **Business Reviews AI**.

## Single purpose

Help a user draft, review, copy, and insert an AI-assisted reply to a customer review they are currently viewing. The extension never automatically clicks the final publish/reply button.

## Privacy-first permissions

- `activeTab`: access only to the active tab after the user invokes the extension.
- `scripting`: detect visible review context and insert a user-approved draft on explicit action.
- `storage`: remember the business name locally.
- Supabase host permission: call the existing GoogleReviewAI AI-generation backend.

There is no persistent Google content script and no broad Google host permission.

## Local testing

1. Run `python chrome-extension/tools/build_store_assets.py` from the repository root (requires Pillow).
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Click **Load unpacked**.
5. Select `dist/chrome-extension/package`.

## Chrome Web Store files

The build creates:

- `dist/chrome-extension/business-reviews-ai-chrome-v1.0.0.zip` — upload this package to the Chrome Web Store.
- `dist/chrome-extension/store-assets/store-icon-128.png`
- `dist/chrome-extension/store-assets/screenshot-1280x800.png`
- `dist/chrome-extension/store-assets/promo-small-440x280.png`

GitHub Actions also publishes these as the `business-reviews-ai-chrome-store` workflow artifact after relevant pushes to `main`.

## Store metadata

See `chrome-extension/store-listing/STORE_LISTING.md` for the name, descriptions, single-purpose text, permission justifications, reviewer instructions and data-disclosure answers.

Privacy policy URL:
`https://googlereviewai.com/business-reviews-ai-extension-privacy.html`

## Final publisher-account steps

Chrome Web Store submission still requires the owner’s Chrome Web Store developer account to upload the generated ZIP, fill the listing fields, upload the generated graphics, complete the Privacy practices form, choose distribution, and click **Submit for review**. These account actions cannot be completed from the repository alone.
