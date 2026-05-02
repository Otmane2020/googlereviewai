import { useState, useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Lock, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InnerFormProps {
  amount: number;
  email: string;
  returnUrl: string;
}

const InnerPaymentForm = ({ amount, email, returnUrl }: InnerFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
        receipt_email: email,
      },
    });

    if (confirmError) {
      setError(confirmError.message || "An error occurred during payment.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full h-12 text-base font-semibold"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <CreditCard className="w-5 h-5 mr-2" />
        )}
        {loading
          ? "Processing..."
          : `Pay $${amount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="w-3.5 h-3.5" />
        100% secure payment powered by Stripe
      </div>
    </form>
  );
};

interface StripePaymentFormProps {
  clientSecret: string;
  publishableKey: string;
  amount: number;
  returnUrl: string;
  email: string;
}

const StripePaymentForm = ({
  clientSecret,
  publishableKey,
  amount,
  returnUrl,
  email,
}: StripePaymentFormProps) => {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: "stripe" },
        locale: "en",
      }}
    >
      <InnerPaymentForm amount={amount} email={email} returnUrl={returnUrl} />
    </Elements>
  );
};

export default StripePaymentForm;
