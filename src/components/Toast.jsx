import { useEffect } from 'react';
import Icon from './Icon';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2600);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="toast fixed bottom-8 right-8 z-50">
      <span className="toast-check"><Icon name="check" size={13} strokeWidth={3} /></span>
      {message}
    </div>
  );
}
