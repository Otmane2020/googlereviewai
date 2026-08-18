import { useLocation } from "react-router-dom";
import Auth from "@/pages/Auth";
import ChoosePlan from "@/pages/ChoosePlan";
import Checkout from "@/pages/Checkout";
import Dashboard from "@/pages/Dashboard";
import Reviews from "@/pages/Reviews";
import AISettings from "@/pages/AISettings";
import Settings from "@/pages/Settings";
import Businesses from "@/pages/Businesses";
import Install from "@/pages/Install";
import SEOAutoPost from "@/pages/SEOAutoPost";
import AEORank from "@/pages/AEORank";
import MapsRank from "@/pages/MapsRank";
import Notifications from "@/pages/Notifications";
import ResetPassword from "@/pages/ResetPassword";
import MobileAds from "@/pages/MobileAds";
import PasswordAuth from "@/pages/PasswordAuth";
import Admin from "@/pages/Admin";
import Checklist from "@/pages/Checklist";
import GmbPost from "@/pages/GmbPost";
import Calendar from "@/pages/Calendar";
import Onboarding from "@/pages/Onboarding";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCanceled from "@/pages/PaymentCanceled";
import Boutique from "@/pages/Boutique";
import BoutiqueNFC from "@/pages/BoutiqueNFC";
import BoutiqueQRImprime from "@/pages/BoutiqueQRImprime";
import Commandes from "@/pages/Commandes";
import AdminOrders from "@/pages/AdminOrders";
import ProspectionStickers from "@/pages/ProspectionStickers";
import NotFound from "@/pages/NotFound";
import { DashboardLayout } from "@/components/DashboardLayout";

const Shell = ({ children }: { children: React.ReactNode }) => (
  <DashboardLayout>{children}</DashboardLayout>
);

const shellRoutes: Record<string, React.ReactNode> = {
  "/dashboard": <Dashboard />,
  "/calendar": <Calendar />,
  "/reviews": <Reviews />,
  "/ai-settings": <AISettings />,
  "/settings": <Settings />,
  "/businesses": <Businesses />,
  "/seo-autopost": <SEOAutoPost />,
  "/aeo-rank": <AEORank />,
  "/maps-rank": <MapsRank />,
  "/notifications": <Notifications />,
  "/gmb-post": <GmbPost />,
  "/boutique": <Boutique />,
  "/boutique/nfc": <BoutiqueNFC />,
  "/boutique/qr-imprime": <BoutiqueQRImprime />,
  "/commandes": <Commandes />,
  "/prospection-stickers": <ProspectionStickers />,
};

const plainRoutes: Record<string, React.ReactNode> = {
  "/auth": <Auth />,
  "/select-plan": <ChoosePlan />,
  "/choose-plan": <ChoosePlan />,
  "/checkout": <Checkout />,
  "/payment-success": <PaymentSuccess />,
  "/payment-canceled": <PaymentCanceled />,
  "/reset-password": <ResetPassword />,
  "/onboarding": <Onboarding />,
  "/install": <Install />,
  "/mobile-ads": <MobileAds />,
  "/PW": <PasswordAuth />,
  "/admin": <Admin />,
  "/admin/orders": <AdminOrders />,
  "/checklist": <Checklist />,
};

export default function LegacyClientRoutes() {
  const { pathname } = useLocation();
  const shellPage = shellRoutes[pathname];
  if (shellPage) return <Shell>{shellPage}</Shell>;

  const plainPage = plainRoutes[pathname];
  if (plainPage) return <>{plainPage}</>;

  return <NotFound />;
}
