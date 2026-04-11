import { useEffect } from 'react';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold z-50 animate-slide-up shadow-lg">
      {message}
    </div>
  );
}
