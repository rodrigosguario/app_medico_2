import { useEffect } from 'react';

export const MobileOptimization = () => {
  useEffect(() => {
    // Detectar se é PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone || 
                  document.referrer.includes('android-app://');

    if (isPWA) {
      document.body.classList.add('pwa-mode');
    }

    // Configurações específicas para mobile
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      document.body.classList.add('mobile-device');
      
      // Prevenir zoom duplo clique no iOS
      let lastTouchEnd = 0;
      const preventZoom = (e: TouchEvent) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      };

      document.addEventListener('touchend', preventZoom, { passive: false });
      
      // Otimizar viewport para formulários
      const viewport = document.querySelector('meta[name=viewport]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
      }

      return () => {
        document.removeEventListener('touchend', preventZoom);
      };
    }
  }, []);

  return null; // Componente só para efeitos colaterais
};