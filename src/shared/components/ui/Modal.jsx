import React, { useEffect } from 'react';
import Button from './Button.jsx';

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className = '',
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ui-modal-backdrop" onClick={onClose}>
      <div
        className={['ui-modal', `ui-modal--${size}`, className].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'ui-modal-title' : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="ui-modal__header">
            {title && <h3 id="ui-modal-title" className="ui-modal__title">{title}</h3>}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Tutup modal">
                ✕
              </Button>
            )}
          </div>
        )}

        {description && <p className="ui-modal__description">{description}</p>}
        <div className="ui-modal__body">{children}</div>
        {footer && <div className="ui-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}
