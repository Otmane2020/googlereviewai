import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  Clock, 
  MessageSquare, 
  TrendingUp, 
  ChefHat, 
  Utensils,
  ThumbsUp,
  Zap,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { FAQPageSchema, BreadcrumbSchema } from "@/components/StructuredData";

interface AvisAIRestaurantProps {
  canonicalSlug?: string;
  breadcrumbName?: string;
  pageTitle?: string;
  pageDescription?: string;
}

const AvisAIRestaurant = ({
  canonicalSlug = "avis-ai-restaurant",
  breadcrumbName = "AI Reviews for Restaurants",
  pageTitle = "AI Google Reviews for Restaurants – Auto Replies | Ranki.ai",
  pageDescription = "Automate Google review management for your restaurant with AI. Personalized replies in under 2 hours, tone tuned for hospitality. Free 7-day trial.",
}: AvisAIRestaurantProps = {}) => {
  const canonicalUrl = `https://ranki.ai/${canonicalSlug}`;
  const benefits = [
    { icon: Clock, title: "Reply within 2 hours", description: "Your guests get a personalized reply automatically — even at night and on weekends." },
    { icon: MessageSquare, title: "Tone tuned for hospitality", description: "The AI understands culinary vocabulary and replies with warmth and professionalism." },
    { icon: TrendingUp, title: "+40% more positive reviews", description: "Happy guests leave more reviews when they see you actually engage with feedback." },
    { icon: ThumbsUp, title: "Smart handling of criticism", description: "Diplomatic responses to negative reviews to protect your reputation." }
  ];

  const useCases = [
    { type: "Fine dining", example: "Thank you so much for this wonderful feedback! Our chef will be delighted to hear that the scallop tartare won you over. We can't wait to welcome you back to discover our new seasonal menu." },
    { type: "Pizzeria", example: "Grazie mille! 🍕 We're glad our wood-fired pizzas hit the spot. See you very soon for another delicious evening!" },
    { type: "Brasserie", example: "Thanks a lot for your review! Our team takes pride in serving high-quality traditional cuisine. We'll be waiting for you for the next daily special!" }
  ];

  const stats = [
    { value: "2h", label: "Average response time" },
    { value: "98%", label: "Reviews handled automatically" },
    { value: "+4.6", label: "Average customer rating" },
    { value: "15min", label: "Saved every day" }
  ];

  const restaurantFaqs = [
    { question: "How do I automate Google review responses for my restaurant?", answer: "Ranki.ai connects to your Google Business Profile and uses AI to analyze every review you receive. The AI generates a personalized reply tuned for the restaurant industry and publishes it automatically within 2 hours — including evenings and weekends." },
    { question: "Does the AI understand culinary vocabulary when replying?", answer: "Yes. Ranki.ai's AI is specifically trained for the hospitality sector. It understands culinary terms, adapts its tone to your venue type (fine dining, bistro, pizzeria), and can reference specific dishes or services mentioned in the review." },
    { question: "How does the AI handle negative restaurant reviews?", answer: "Ranki.ai generates diplomatic, professional responses to negative reviews. The AI acknowledges the issue, offers a sincere apology and proposes a resolution — all while protecting your restaurant's image. You can validate or edit the reply before publishing if you wish." },
    { question: "What impact do review replies have on a restaurant's Google rating?", answer: "Restaurants that consistently reply to reviews get on average +40% more positive reviews. Fast, personalized replies encourage happy guests to share their experience and reassure future customers reading your responses." },
    { question: "How much time does a restaurant owner save with Ranki.ai?", answer: "On average, restaurant owners using Ranki.ai save 15 minutes per day on review management. The AI handles 98% of reviews automatically so you can focus on your kitchen and your service." }
  ];

  return (
    <>
      <FAQPageSchema faqs={restaurantFaqs} />
      <BreadcrumbSchema items={[
        { name: "Home", url: "https://ranki.ai" },
        { name: "AI Reviews for Restaurants", url: "https://ranki.ai/avis-ai-restaurant" }
      ]} />
      <Helmet>
        <title>AI Google Reviews for Restaurants – Auto Replies | Ranki.ai</title>
        <meta name="description" content="Automate Google review management for your restaurant with AI. Personalized replies in under 2 hours, tone tuned for hospitality. Free 7-day trial." />
        <meta name="keywords" content="restaurant google reviews, automated review reply, AI hospitality, restaurant reputation, GEO restaurant" />
        <link rel="canonical" href="https://ranki.ai/avis-ai-restaurant" />
        
        <meta property="og:title" content="AI Google Review Management for Restaurants" />
        <meta property="og:description" content="Reply automatically to your restaurant reviews. Personalized, fast, professional." />
        <meta property="og:url" content="https://ranki.ai/avis-ai-restaurant" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Ranki.ai for Restaurants",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "description": "AI solution for automated Google review management for restaurants",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "description": "Free 7-day trial" },
            "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "150" }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          <section className="py-16 sm:py-24 bg-gradient-to-b from-orange-50 to-background dark:from-orange-950/20">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <Badge className="mb-4 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                  <ChefHat className="w-3 h-3 mr-1" />
                  Solution for Restaurants
                </Badge>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                  Manage your Google reviews{" "}
                  <span className="text-orange-500">automatically</span>
                </h1>
                
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Reply to every guest review in under 2 hours with personalized responses tuned for the hospitality industry. Save time, build loyalty.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild className="bg-orange-500 hover:bg-orange-600">
                    <Link to="/auth">
                      Start free 7-day trial
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to="/select-plan">View pricing</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="py-12 border-y bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-orange-500 mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-16 sm:py-24">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why restaurants choose Ranki.ai</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  A solution built for hospitality professionals who don't have the time to manually reply to every review.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="border-orange-100 dark:border-orange-900/30">
                    <CardContent className="pt-6">
                      <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
                        <benefit.icon className="w-6 h-6 text-orange-500" />
                      </div>
                      <h3 className="font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <section className="py-16 sm:py-24 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">AI-generated reply examples</h2>
                <p className="text-muted-foreground">Responses adapted to every type of venue</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {useCases.map((useCase, index) => (
                  <Card key={index} className="bg-card">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Utensils className="w-4 h-4 text-orange-500" />
                        <span className="font-medium text-sm">{useCase.type}</span>
                      </div>
                      <div className="flex gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground italic">"{useCase.example}"</p>
                      <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600">
                        <Zap className="w-3 h-3" />
                        Generated automatically
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <section className="py-16 sm:py-24">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
              </div>
              
              <div className="max-w-3xl mx-auto space-y-6">
                {[
                  { step: "1", title: "Connect your Google profile", desc: "Link your Google Business Profile in 2 clicks" },
                  { step: "2", title: "AI analyzes every review", desc: "Understands context, tone and key points mentioned" },
                  { step: "3", title: "Personalized reply generated", desc: "Tailored to your restaurant and the review content" },
                  { step: "4", title: "Auto-published", desc: "The reply is posted directly on Google" }
                ].map((item, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-16 sm:py-24 bg-orange-500 text-white">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to automate your replies?</h2>
              <p className="text-orange-100 mb-8 max-w-xl mx-auto">
                Join restaurant owners saving 15 minutes a day with Ranki.ai.
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth">
                  Start free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AvisAIRestaurant;
