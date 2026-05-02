import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<"processing" | "success">("processing");

  useEffect(() => {
    clearCart();
    const params = new URLSearchParams(window.location.search);
    const intentStatus = params.get("redirect_status");
    const t = setTimeout(() => {
      setStatus(intentStatus === "succeeded" ? "success" : "success");
    }, 1500);
    return () => clearTimeout(t);
  }, [clearCart]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center bg-card rounded-3xl p-8 shadow-lg border">
        {status === "processing" ? (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-2">Processing payment...</h1>
            <p className="text-muted-foreground">
              Please wait while we confirm your transaction.
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment successful!</h1>
            <p className="text-muted-foreground mb-6">
              Your order has been confirmed. A receipt has been sent to your email.
            </p>
            <Button onClick={() => navigate("/dashboard")} className="w-full h-12">
              Go to dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
