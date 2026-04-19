import { useEffect, useRef, useCallback } from 'react';

export function useToast() {
  const toastRef = useRef(null);

  const toast = useCallback((msg) => {
    if (!toastRef.current) return;
    toastRef.current.textContent = msg;
    toastRef.current.classList.add('show');
    setTimeout(() => {
      toastRef.current?.classList.remove('show');
    }, 3000);
  }, []);

  useEffect(() => {
    // Create toast element
    const toastEl = document.createElement('div');
    toastEl.id = 'toast';
    document.body.appendChild(toastEl);
    toastRef.current = toastEl;

    return () => {
      if (toastRef.current) {
        document.body.removeChild(toastRef.current);
      }
    };
  }, []);

  return { toast };
}

