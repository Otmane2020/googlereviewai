---
name: reviewsai
description: Use when the user wants to read, answer or analyze their Google Business Profile reviews, stats or Google Maps ranking through ReviewsAI.
---

# ReviewsAI

1. Call `list_managed_businesses` to get `business_id` values when the user has several locations or names one.
2. Use `list_reviews` with `status: "unanswered"` to find reviews that still need a reply. Filter with `max_rating` for negative reviews.
3. Call `generate_review_reply` for each review the user wants to answer. Show every draft with the reviewer's name, rating and comment.
4. Only call `publish_review_reply` after the user explicitly approves the exact text of that reply. Pass `reply_text` when the user edited the draft. Publishing is public and cannot be undone from ChatGPT.
5. For performance questions use `get_business_insights`. For "where do I rank" questions, check `get_ranking_history` first and only run `check_maps_ranking` (slow, uses quota) when no recent scan exists or the user asks for a fresh one.

Never invent review content, ratings or statistics; quote what the tools return. If a tool says Google must be reconnected or credits are exhausted, relay the link it gives.
