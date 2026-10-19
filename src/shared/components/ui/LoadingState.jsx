import React from 'react';

export default function LoadingState({
  message = 'Memuat data...',
  className = '',
}) {
  return (
    <div className={['ui-state ui-state--loading', className].filter(Boolean).join(' ')} role="status" aria-live="polite">
      <span className="ui-state__spinner" aria-hidden="true" />
      <span className="ui-state__text">{message}</span>
    </div>
  );
}
