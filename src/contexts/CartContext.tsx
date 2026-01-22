import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

export interface CartItem {
  id: string;
  type: "plan" | "module" | "credits";
  priceKey: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  isRecurring: boolean;
  interval?: "month" | "year";
}

interface CartContextType {
  items: CartItem[];
  billingCycle: "monthly" | "yearly";
  setBillingCycle: (cycle: "monthly" | "yearly") => void;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleItem: (item: Omit<CartItem, "id">) => void;
  clearCart: () => void;
  hasItem: (priceKey: string) => boolean;
  getItem: (priceKey: string) => CartItem | undefined;
  totalToday: number;
  totalRecurring: number;
  hasTrialPlan: boolean;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Plans that get free trial
const TRIAL_PRICE_KEYS = ["starter_monthly", "starter_yearly"];

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    const id = `${item.priceKey}-${Date.now()}`;
    setItems((prev) => {
      // If it's a plan, remove any existing plan first
      if (item.type === "plan") {
        const filtered = prev.filter((i) => i.type !== "plan");
        return [...filtered, { ...item, id }];
      }
      // For modules/credits, check if already exists
      const existing = prev.find((i) => i.priceKey === item.priceKey);
      if (existing) {
        return prev.map((i) =>
          i.priceKey === item.priceKey
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, { ...item, id }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  }, []);

  const toggleItem = useCallback((item: Omit<CartItem, "id">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.priceKey === item.priceKey);
      if (existing) {
        return prev.filter((i) => i.priceKey !== item.priceKey);
      }
      const id = `${item.priceKey}-${Date.now()}`;
      return [...prev, { ...item, id }];
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const hasItem = useCallback(
    (priceKey: string) => items.some((item) => item.priceKey === priceKey),
    [items]
  );

  const getItem = useCallback(
    (priceKey: string) => items.find((item) => item.priceKey === priceKey),
    [items]
  );

  const hasTrialPlan = useMemo(
    () => items.some((item) => TRIAL_PRICE_KEYS.includes(item.priceKey)),
    [items]
  );

  const totalToday = useMemo(() => {
    // If has trial plan, subscription items are 0€ today
    if (hasTrialPlan) {
      return items
        .filter((item) => !item.isRecurring)
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
    }
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items, hasTrialPlan]);

  const totalRecurring = useMemo(
    () =>
      items
        .filter((item) => item.isRecurring)
        .reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const itemCount = useMemo(() => items.length, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        billingCycle,
        setBillingCycle,
        addItem,
        removeItem,
        updateQuantity,
        toggleItem,
        clearCart,
        hasItem,
        getItem,
        totalToday,
        totalRecurring,
        hasTrialPlan,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
