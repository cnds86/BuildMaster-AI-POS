import { useState } from 'react';

export function usePrint() {
  const [showIframeWarning, setShowIframeWarning] = useState(false);

  const handlePrint = () => {
    try {
      if (window.self !== window.top) {
        setShowIframeWarning(true);
      } else {
        window.print();
      }
    } catch (e) {
      setShowIframeWarning(true);
    }
  };

  return { showIframeWarning, setShowIframeWarning, handlePrint };
}
