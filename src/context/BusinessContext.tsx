import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BusinessSettings {
  id?: string;
  businessName: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  businessType?: string | null;
  ownerName?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  description?: string | null;
  operatingHours?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
}

interface BusinessContextType {
  settings: BusinessSettings | null;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: BusinessSettings = {
  businessName: 'Cheng-BOOM',
};

const BusinessContext = createContext<BusinessContextType>({
  settings: defaultSettings,
  isLoading: true,
  refreshSettings: async () => {},
});

export const useBusiness = () => useContext(BusinessContext);

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<BusinessSettings | null>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/business-settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load business settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <BusinessContext.Provider value={{ settings, isLoading, refreshSettings: fetchSettings }}>
      {children}
    </BusinessContext.Provider>
  );
};
