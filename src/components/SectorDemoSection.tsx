import { useState, useEffect } from "react";
import { Sparkles, Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { useTranslation } from "react-i18next";

const SECTOR_KEYS = ["restaurant", "hotel", "beauty", "auto", "retail"] as const;
type SectorKey = (typeof SECTOR_KEYS)[number];
type ReviewType = "positive" | "negative";

export const SectorDemoSection = () => {
  const { t } = useTranslation();
  const [activeSector, setActiveSector] = useState<SectorKey>("restaurant");
  const [reviewType, setReviewType] = useState<ReviewType>("positive");
  const [displayedResponse, setDisplayedResponse] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const review = {
    author: t(`sectorDemo.reviews.${activeSector}.${reviewType}.author`),
    rating: reviewType === "positive" ? 5 : 2,
    date: t(`sectorDemo.reviews.${activeSector}.${reviewType}.date`),
    text: t(`sectorDemo.reviews.${activeSector}.${reviewType}.text`),
    response: t(`sectorDemo.reviews.${activeSector}.${reviewType}.response`),
  };

  // Typewriter effect
  useEffect(() => {
    setDisplayedResponse("");
    setIsTyping(true);

    const startTimer = setTimeout(() => {
      let i = 0;
      const text = review.response;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayedResponse(text.substring(0, i + 1));
          i++;
        } else {
          setIsTyping(false);
          clearInterval(interval);
        }
      }, 15);
      return () => clearInterval(interval);
    }, 400);

    return () => clearTimeout(startTimer);
  }, [activeSector, reviewType, review.response]);

  return (
    <section className="py-14 sm:py-20 bg-background">
      <div className="container mx-auto px-5">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              {t("sectorDemo.description")}{" "}
              <span className="font-semibold text-primary">{t("sectorDemo.brandName")}</span>.
              <br />
              {t("sectorDemo.selectIndustry")}
            </p>
          </div>

          {/* Demo Card */}
          <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-2xl p-5 sm:p-8 border border-border/50 shadow-lg">
            {/* Sector chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
              {SECTOR_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveSector(key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeSector === key
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-card text-muted-foreground border border-border hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {t(`sectorDemo.sectors.${key}`)}
                </button>
              ))}
            </div>

            {/* Review type toggle */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <button
                onClick={() => setReviewType("positive")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  reviewType === "positive"
                    ? "bg-foreground text-background shadow-md"
                    : "bg-card text-muted-foreground border border-border hover:text-foreground"
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                {t("sectorDemo.positiveReview")}
              </button>
              <button
                onClick={() => setReviewType("negative")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  reviewType === "negative"
                    ? "bg-foreground text-background shadow-md"
                    : "bg-card text-muted-foreground border border-border hover:text-foreground"
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                {t("sectorDemo.negativeReview")}
              </button>
            </div>

            {/* Review bubble */}
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-sm font-bold text-muted-foreground">
                {review.author.charAt(0)}
              </div>
              <div className="flex-1 bg-card rounded-2xl rounded-tl-sm p-4 border border-border shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <span className="font-semibold text-foreground text-sm">{review.author}</span>
                  <span className="text-xs text-muted-foreground">{review.date}</span>
                </div>
                <div className="flex mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-muted"}`}
                    />
                  ))}
                </div>
                <p className="text-foreground text-sm leading-relaxed">{review.text}</p>
              </div>
            </div>

            {/* AI Response bubble */}
            <div className="flex items-start gap-3 justify-end">
              <div className="flex-1 bg-gradient-to-br from-primary/5 to-secondary/10 rounded-2xl rounded-tr-sm p-4 border border-primary/20 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary">{t("sectorDemo.aiResponseLabel")}</span>
                  {isTyping && (
                    <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium animate-pulse">
                      {t("sectorDemo.typing")}
                    </span>
                  )}
                </div>
                <p className="text-foreground text-sm leading-relaxed">
                  {displayedResponse}
                  {isTyping && <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                IA
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
