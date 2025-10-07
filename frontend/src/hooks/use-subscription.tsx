"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Plan = 'Basic' | 'Pro' | 'Enterprise' | null;

interface SubscriptionContextType {
  plan: Plan;
  setSubscriptionPlan: (newPlan: Plan) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<Plan>(null);

  useEffect(() => {
    const storedPlan = localStorage.getItem('subscriptionPlan') as Plan;
    if (storedPlan && ['Basic', 'Pro', 'Enterprise'].includes(storedPlan)) {
      setPlan(storedPlan);
    } else {
      const defaultPlan = 'Basic';
      localStorage.setItem('subscriptionPlan', defaultPlan);
      setPlan(defaultPlan);
    }
  }, []);

  const setSubscriptionPlan = (newPlan: Plan) => {
    if (newPlan) {
      localStorage.setItem('subscriptionPlan', newPlan);
      setPlan(newPlan);
    }
  };

  return (
    <SubscriptionContext.Provider value={{ plan, setSubscriptionPlan }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
