import { Star, MessageSquareReply } from "lucide-react";

const examples = [
  {
    industry: "Restaurant",
    location: "Brooklyn, NY",
    rating: 5,
    review: "Hands down the best carbonara in the neighborhood. Service was warm and the patio is magical.",
    reply: "Thank you so much, Maria! We're thrilled the carbonara hit the spot — Chef Marco will be smiling all week. We can't wait to welcome you back to our patio soon.",
  },
  {
    industry: "Boutique Hotel",
    location: "Austin, TX",
    rating: 5,
    review: "Stayed two nights for a wedding. The room was stunning and the concierge went above and beyond.",
    reply: "Thanks for choosing us for such a special weekend, Daniel. We've passed your kind words on to our concierge team — they'll be over the moon. Come back anytime.",
  },
  {
    industry: "Auto Repair",
    location: "Santa Monica, CA",
    rating: 4,
    review: "Quick turnaround, fair pricing. Wish the waiting area was a bit more comfortable.",
    reply: "Appreciate the honest feedback, Jen. Glad we got you back on the road quickly. Good news — our waiting lounge gets a full refresh next month, hope to see you then.",
  },
];

export const ReviewsAISection = () => {
  return (
    <section id="reviews-ai" className="py-20 sm:py-28 bg-card">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border text-foreground text-xs font-semibold mb-4">
            <MessageSquareReply className="w-3.5 h-3.5" /> Reviews AI
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
            Every review answered. <span className="text-primary">Automatically.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            On-brand AI replies published to Google Business in minutes — fueling both your reputation and your AI ranking.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {examples.map((e) => (
            <div
              key={e.industry}
              className="bg-background border border-border rounded-2xl p-5 hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">{e.industry}</div>
                  <div className="text-sm font-bold text-foreground">{e.location}</div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < e.rating ? "fill-foreground text-foreground" : "text-muted"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-3 mb-3">
                <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Customer review</div>
                <p className="text-sm text-foreground leading-snug">"{e.review}"</p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-[8px] font-bold text-primary-foreground">AI</span>
                  </div>
                  <div className="text-[10px] uppercase font-bold text-primary">Ranki AI Reply</div>
                </div>
                <p className="text-sm text-foreground leading-snug">{e.reply}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
