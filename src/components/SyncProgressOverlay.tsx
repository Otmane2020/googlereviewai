import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Building2, MessageSquare, CheckCircle2 } from "lucide-react";
import { BrandSparkle } from "@/components/BrandSparkle";

interface SyncStep {
  id: string;
  label: string;
  icon: React.ElementType;
}

const steps: SyncStep[] = [
  { id: "businesses", label: "Searching for businesses", icon: Building2 },
  { id: "reviews", label: "Syncing reviews", icon: MessageSquare },
  { id: "complete", label: "Done!", icon: CheckCircle2 },
];

interface SyncProgressOverlayProps {
  isVisible: boolean;
  currentStep: "businesses" | "reviews" | "complete";
  onComplete?: () => void;
}

export const SyncProgressOverlay = ({ 
  isVisible, 
  currentStep,
  onComplete 
}: SyncProgressOverlayProps) => {
  const [progress, setProgress] = useState(0);
  const [animatedStep, setAnimatedStep] = useState(0);

  // Calculate step index
  const stepIndex = steps.findIndex(s => s.id === currentStep);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setAnimatedStep(0);
      return;
    }

    // Animate progress based on current step
    const targetProgress = currentStep === "complete" 
      ? 100 
      : currentStep === "reviews" 
        ? 66 
        : 33;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= targetProgress) {
          clearInterval(interval);
          return targetProgress;
        }
        return prev + 2;
      });
    }, 30);

    setAnimatedStep(stepIndex);

    return () => clearInterval(interval);
  }, [isVisible, currentStep, stepIndex]);

  // Auto-hide after complete
  useEffect(() => {
    if (currentStep === "complete" && progress === 100) {
      const timeout = setTimeout(() => {
        onComplete?.();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [currentStep, progress, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 space-y-8">
        {/* Logo / Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
            <BrandSparkle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Syncing in progress</h2>
          <p className="text-sm text-muted-foreground">Connecting to Google My Business</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <Progress value={progress} className="h-2" />
          <p className="text-center text-sm font-medium text-primary">{progress}%</p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isActive = index === animatedStep;
            const isCompleted = index < animatedStep;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? "bg-primary/10 border border-primary/30" 
                    : isCompleted 
                      ? "bg-green-500/10 border border-green-500/30" 
                      : "bg-muted/50 border border-transparent opacity-50"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isActive 
                    ? "bg-primary text-white" 
                    : isCompleted 
                      ? "bg-green-500 text-white" 
                      : "bg-muted text-muted-foreground"
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className={`w-5 h-5 ${isActive ? "animate-pulse" : ""}`} />
                  )}
                </div>
                <span className={`font-medium ${
                  isActive 
                    ? "text-primary" 
                    : isCompleted 
                      ? "text-green-600" 
                      : "text-muted-foreground"
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
