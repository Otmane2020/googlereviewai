import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Generate a unique visitor ID
const getOrCreateVisitorId = (): string => {
  const storageKey = 'googlereviewai.com_vid';
  let visitorId = localStorage.getItem(storageKey);
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(storageKey, visitorId);
  }
  return visitorId;
};

// Get UTM parameters from URL
const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
    utmContent: params.get('utm_content') || undefined,
    utmTerm: params.get('utm_term') || undefined,
  };
};

export const useVisitTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const trackVisit = async () => {
      try {
        const visitorId = getOrCreateVisitorId();
        const utmParams = getUTMParams();

        // Send to server
        await supabase.functions.invoke('track-visit', {
          body: {
            visitorId,
            page: location.pathname,
            referrer: document.referrer || 'direct',
            userAgent: navigator.userAgent,
            ...utmParams
          }
        });

        console.log(`[Tracking] Page view: ${location.pathname}`);
      } catch (e) {
        console.error('[Tracking] Failed to track visit:', e);
      }
    };

    trackVisit();
  }, [location.pathname]);
};

// Helper to get visitor ID
export const getVisitorId = (): string | null => {
  return localStorage.getItem('googlereviewai.com_vid');
};

// Helper to get current session data
export const getSessionData = () => {
  try {
    const data = sessionStorage.getItem('googlereviewai.com_session');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};
