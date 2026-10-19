import React from 'react';
import Button from './Button.jsx';

export default function ErrorState({
  title = 'Terjadi kesalahan',
  message,
  action,
  retryLabel = 'Coba lagi',
  onRetry,
  className = '',
}) {
  const retryAction = action || (onRetry ? (
    <Button variant="secondary" onClick={onRetry}>{retryLabel}</Button>
  ) : null);

  return (
    <div className={['ui-state ui-state--error', className].filter(Boolean).join(' ')} role="alert">
      <div className="ui-state__icon" aria-hidden="true">!</div>
      <h3 className="ui-state__title">{title}</h3>
      {message && <p className="ui-state__text">{message}</p>}
      {retryAction && <div className="ui-state__action">{retryAction}</div>}
    </div>
  );
}
