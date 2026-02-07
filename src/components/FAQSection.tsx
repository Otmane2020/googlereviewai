import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQItem[];
  title?: string;
  subtitle?: string;
  badgeText?: string;
  className?: string;
}

export const FAQSection = ({
  faqs,
  title = "Questions fréquentes",
  subtitle,
  badgeText = "FAQ",
  className = "",
}: FAQSectionProps) => {
  return (
    <section className={`py-16 sm:py-24 bg-muted/50 ${className}`}>
      <div className="container mx-auto px-5">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full mb-4">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-semibold">{badgeText}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
              {title}
            </h2>
            {subtitle && (
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>

          {/* Accordion */}
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left text-foreground font-semibold text-base hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
