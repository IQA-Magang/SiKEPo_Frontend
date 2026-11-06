import React from 'react';
import reloader from '../../../assets/reloader/reloader2.gif';

export default function LoadingState({
  message = 'Memuat data...',
  className = '',
}) {
  return (
    <div className={['ui-state ui-state--loading', className].filter(Boolean).join(' ')} role="status" aria-live="polite">
      <img className="ui-state__reloader" src={reloader} alt="" aria-hidden="true" />
      <span className="ui-state__text">{message}</span>
    </div>
  );
}
