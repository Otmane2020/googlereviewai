import { useState } from "react";
import { Button } from "./ui/button";
import { 
  Star, 
  Clock, 
  Sparkles, 
  Copy, 
  Send, 
  CheckCheck, 
  MessageSquare,
  Loader2,
  CheckCircle,
  Building2,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Google logo SVG
const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

interface ReviewCardProps {
  review: {
    id: number;
    author: string;
    rating: number;
    comment: string | null;
    review_date: string;
    replied: boolean;
    ai_response: string | null;
    published_to_google: boolean | null;
    location_id: string;
  };
  businessName: string;
  onGenerateResponse: (reviewId: number) => Promise<void>;
  onPublishToGoogle: (reviewId: number) => Promise<void>;
  onCopyToClipboard: (text: string) => void;
  isGenerating: boolean;
  isPublishing: boolean;
  creditsRemaining?: number;
}

export const ReviewCard = ({
  review,
  businessName,
  onGenerateResponse,
  onPublishToGoogle,
  onCopyToClipboard,
  isGenerating,
  isPublishing,
  creditsRemaining
}: ReviewCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-[#FBBC05] fill-[#FBBC05]" : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500"
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all">
      {/* Header with business info - Google style */}
      <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b border-border">
        <GoogleLogo />
        <span className="text-sm font-medium text-foreground">{businessName}</span>
        <span className="text-xs text-muted-foreground">• Google Avis</span>
      </div>

      {/* Review content */}
      <div className="p-4">
        {/* Author and rating */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${getAvatarColor(review.author)} flex items-center justify-center text-white font-semibold`}>
              {review.author.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-foreground">{review.author}</h4>
                {renderStars(review.rating)}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {new Date(review.review_date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </span>
                {review.published_to_google ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-secondary bg-secondary/10 px-2 py-1 rounded-full">
                    <CheckCheck className="w-3 h-3" />
                    Published
                  </span>
                ) : review.ai_response ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Response prête
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    En attente
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="flex items-center gap-2">

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem className="cursor-pointer">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Répondre manuellement
                </DropdownMenuItem>
                {review.ai_response && (
                  <DropdownMenuItem 
                    className="cursor-pointer"
                    onClick={() => onCopyToClipboard(review.ai_response!)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copier la réponse
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Comment */}
        {review.comment && (
          <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
            {review.comment.length > 200 && !expanded 
              ? `${review.comment.slice(0, 200)}...`
              : review.comment
            }
            {review.comment.length > 200 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-primary hover:underline ml-1 text-sm font-medium"
              >
                {expanded ? "Voir moins" : "Voir plus"}
              </button>
            )}
          </p>
        )}

        {/* AI Response */}
        {review.ai_response && (
          <div className="mt-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4 border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <span className="text-xs font-medium text-primary">Response générée par IA</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{review.ai_response}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          {!review.ai_response ? (
            <Button
              size="sm"
              className="gap-2"
              onClick={() => onGenerateResponse(review.id)}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGenerating ? "Generating..." : "Générer (1 crédit)"}
            </Button>
          ) : !review.published_to_google ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                className="gap-2"
                onClick={() => onPublishToGoogle(review.id)}
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isPublishing ? "Publication..." : "Publier sur Google"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => onGenerateResponse(review.id)}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Régénérer
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-secondary">
              <CheckCircle className="w-4 h-4" />
              <span>Response publiée sur Google Business</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
