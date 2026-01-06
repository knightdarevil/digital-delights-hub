import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useDownloadProtection = () => {
  const { isVIP, canDownload } = useAuth();

  useEffect(() => {
    // Check for Cốc Cốc browser
    const isCocCoc = navigator.userAgent.includes('coc_coc_browser');
    
    if (isCocCoc) {
      console.warn('Cốc Cốc browser detected - downloads may be restricted');
    }

    // Attempt to detect download managers (limited browser capability)
    // This is a basic check and can be enhanced on the server side
    const detectDownloadManager = () => {
      // Check common download manager signatures in headers/requests
      // Note: This is limited in browser context
      return false;
    };

    return () => {};
  }, [isVIP, canDownload]);

  const validateDownload = (contentType: 'free' | 'vip', quality?: string): { allowed: boolean; message: string } => {
    // Check Cốc Cốc browser
    if (navigator.userAgent.includes('coc_coc_browser')) {
      return { 
        allowed: false, 
        message: 'Downloads are not supported in Cốc Cốc browser. Please use Chrome, Firefox, or Edge.' 
      };
    }

    // Check VIP content
    if (contentType === 'vip' && !isVIP) {
      return { 
        allowed: false, 
        message: 'This content is VIP only. Please upgrade to VIP to download.' 
      };
    }

    // Check 4K quality
    if (quality === '4K' && !isVIP) {
      return { 
        allowed: false, 
        message: '4K quality is VIP only. Please upgrade to VIP.' 
      };
    }

    // Check download limit
    if (!canDownload) {
      return { 
        allowed: false, 
        message: 'You have reached your weekly download limit. Please upgrade to VIP for unlimited downloads.' 
      };
    }

    return { allowed: true, message: '' };
  };

  return { validateDownload };
};
