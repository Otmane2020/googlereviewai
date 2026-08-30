# Business Reviews AI — Chrome Web Store listing

## Product name
Business Reviews AI

## Short description
Draft professional AI replies to customer reviews on Google Maps™ and Business Profile™, then copy or insert them.

## Detailed description
Business Reviews AI helps business owners and teams respond to customer reviews faster without leaving the review they are working on.

Open a review in Google Maps™ or Google Business Profile™, click the extension, and Business Reviews AI can detect the visible review, its rating, and the business name. Generate a professional AI-assisted draft, edit it if needed, copy it, or insert it into the visible reply field.

You always keep control of publishing. Business Reviews AI never clicks Google’s final publish/reply button automatically.

Key features:
- Detect the review currently visible on the active tab
- Draft a professional AI-assisted reply
- Edit the generated reply before use
- Copy the reply in one click
- Insert the draft into a visible reply field
- French and English extension interface
- No continuous background monitoring
- No advertising or cross-site tracking

Privacy-first design:
The extension only accesses the active page after the user opens it. For AI generation, the review text, rating and business name are sent to the GoogleReviewAI backend solely to generate the requested reply. The extension may keep the business name in local Chrome storage for convenience.

Google Maps and Google Business Profile are trademarks of Google LLC. Business Reviews AI is independent and is not affiliated with, sponsored by, or endorsed by Google LLC.

## Category
Productivity

## Language
Primary: French
Additional: English

## Homepage
https://googlereviewai.com

## Support URL
https://googlereviewai.com

## Privacy policy URL
https://googlereviewai.com/business-reviews-ai-extension-privacy.html

## Single purpose statement
Business Reviews AI helps a user draft, review, copy, and insert an AI-assisted reply to a customer review the user is currently viewing.

## Permission justifications

### activeTab
Used only after the user opens the extension, so it can inspect the currently active review page. It is not used for continuous browsing monitoring.

### scripting
Used only on explicit user actions to extract the visible review context and to insert the user-approved draft into a visible reply field.

### storage
Used to store the business name locally for convenience between extension sessions.

### Host permission: hlruprayqfnatnldrski.supabase.co
Used only to send the review text, rating, and business name to the GoogleReviewAI backend when the user requests AI reply generation.

## Chrome Web Store data disclosure
Data type handled: Website content (visible review text, rating, and business name) when the user explicitly requests detection/generation.

Purposes:
- App functionality

Not used for:
- Advertising
- Personalized ads
- Creditworthiness
- Selling to third parties
- Cross-site tracking

The extension does not collect authentication credentials, financial/payment information, health information, precise location, or browsing history.

## Reviewer test instructions
1. Open any public Google Maps business page with visible reviews.
2. Open the Business Reviews AI extension.
3. Click “Detect review”. If Google’s current DOM prevents automatic detection, select the visible review text and click “Detect review” again, or paste the review manually.
4. Enter/confirm a business name and rating if needed.
5. Click “Generate AI reply”.
6. Edit/copy the draft.
7. To test insertion, open a visible Google reply field and click “Insert in Google”.
8. The extension intentionally does not press Google’s final publish/reply control.
