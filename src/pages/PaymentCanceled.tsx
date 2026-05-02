import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentCanceled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center bg-card rounded-3xl p-8 shadow-lg border">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment canceled</h1>
        <p className="text-muted-foreground mb-6">
          Your payment was not completed. Your card has not been charged.
        </p>
        <div className="space-y-2">
          <Button onClick={() => navigate("/checkout")} className="w-full h-12">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to checkout
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="w-full h-10"
          >
            Go to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCanceled;
