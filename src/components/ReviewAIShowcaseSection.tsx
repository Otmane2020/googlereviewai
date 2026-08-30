import { useTranslation } from "react-i18next";

const productImages = [
  {
    src: "/landing/review-ai-workflow.jpg",
    alt: "Google Review AI extension generating a personalized reply to a Google review",
  },
  {
    src: "/landing/reply-to-reviews-ai.jpg",
    alt: "Business Review AI workflow from customer review to AI-generated reply",
  },
  {
    src: "/landing/smarter-review-replies.jpg",
    alt: "Business Review AI generating, editing and publishing smarter review replies",
  },
];

export const ReviewAIShowcaseSection = () => {
  const { i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith("fr");

  return (
    <section className="py-16 sm:py-24 bg-background overflow-hidden" aria-labelledby="review-ai-showcase-title">
      <div className="container mx-auto px-5">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary mb-4">
            {isFrench ? "Extension Business Review AI" : "Business Review AI extension"}
          </span>
          <h2 id="review-ai-showcase-title" className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            {isFrench ? "Répondez à vos avis Google en quelques secondes" : "Reply to Google reviews in seconds"}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            {isFrench
              ? "Sélectionnez un avis, générez une réponse personnalisée avec l’IA, puis modifiez-la ou publiez-la directement."
              : "Select a review, generate a personalized AI reply, then edit it or publish it directly."}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 max-w-6xl mx-auto">
          <figure className="lg:col-span-2 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
            <img
              src={productImages[0].src}
              alt={productImages[0].alt}
              width={1586}
              height={992}
              loading="lazy"
              decoding="async"
              className="w-full h-auto"
            />
          </figure>
          {productImages.slice(1).map((image) => (
            <figure key={image.src} className="overflow-hidden rounded-2xl border border-border bg-card shadow-md">
              <img
                src={image.src}
                alt={image.alt}
                width={image.src.includes("reply-to") ? 1573 : 1983}
                height={image.src.includes("reply-to") ? 1000 : 793}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
