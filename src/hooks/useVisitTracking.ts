import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface VisitSession {
  date: string;
  page: string;
  referrer: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

interface VisitData {
  visitorId: string;
  firstVisit: string;
  lastVisit: string;
  visitCount: number;
  pageViews: number;
  sessions: VisitSession[];
  utmHistory: {
    source: string;
    medium: string;
    campaign: string;
    date: string;
  }[];
}

// Generate a unique visitor ID
const generateVisitorId = (): string => {
  return 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
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
    const storageKey = 'starlinko_visitor';
    const now = new Date().toISOString();
    const utmParams = getUTMParams();

    try {
      const existingData = localStorage.getItem(storageKey);
      let visitData: VisitData;

      if (existingData) {
        visitData = JSON.parse(existingData);
        visitData.lastVisit = now;
        visitData.pageViews += 1;
      } else {
        // New visitor
        visitData = {
          visitorId: generateVisitorId(),
          firstVisit: now,
          lastVisit: now,
          visitCount: 1,
          pageViews: 1,
          sessions: [],
          utmHistory: []
        };
      }

      // Check if this is a new session (30 min timeout)
      const lastSession = visitData.sessions[visitData.sessions.length - 1];
      const isNewSession = !lastSession || 
        (new Date(now).getTime() - new Date(lastSession.date).getTime() > 30 * 60 * 1000);

      if (isNewSession) {
        visitData.visitCount += 1;
      }

      // Record page view
      const session: VisitSession = {
        date: now,
        page: location.pathname,
        referrer: document.referrer || 'direct',
        ...utmParams
      };
      
      visitData.sessions.push(session);

      // Keep last 100 sessions
      if (visitData.sessions.length > 100) {
        visitData.sessions = visitData.sessions.slice(-100);
      }

      // Track UTM if present (for Facebook ads attribution)
      if (utmParams.utmSource) {
        visitData.utmHistory.push({
          source: utmParams.utmSource,
          medium: utmParams.utmMedium || '',
          campaign: utmParams.utmCampaign || '',
          date: now
        });

        // Keep last 20 UTM entries
        if (visitData.utmHistory.length > 20) {
          visitData.utmHistory = visitData.utmHistory.slice(-20);
        }
      }

      localStorage.setItem(storageKey, JSON.stringify(visitData));
      
      console.log(`[Tracking] Page view: ${location.pathname} | Visitor: ${visitData.visitorId} | Views: ${visitData.pageViews}`);
      
      // Also store in sessionStorage for current session analytics
      const sessionKey = 'starlinko_session';
      const sessionData = {
        startPage: sessionStorage.getItem(sessionKey) ? 
          JSON.parse(sessionStorage.getItem(sessionKey)!).startPage : 
          location.pathname,
        currentPage: location.pathname,
        pagesViewed: (JSON.parse(sessionStorage.getItem(sessionKey) || '{\\\"pagesViewed\\\":0}').pagesViewed || 0) + 1,
        startTime: sessionStorage.getItem(sessionKey) ? 
          JSON.parse(sessionStorage.getItem(sessionKey)!).startTime : 
          now,
        utmSource: utmParams.utmSource || 
          (sessionStorage.getItem(sessionKey) ? JSON.parse(sessionStorage.getItem(sessionKey)!).utmSource : undefined)
      };
      sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));

    } catch (e) {
      console.error('[Tracking] Failed to track visit:', e);
    }
  }, [location.pathname]);
};

// Helper to get visitor data (useful for analytics)
export const getVisitorData = (): VisitData | null => {
  try {
    const data = localStorage.getItem('starlinko_visitor');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

// Helper to get current session data
export const getSessionData = () => {
  try {
    const data = sessionStorage.getItem('starlinko_session');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};
