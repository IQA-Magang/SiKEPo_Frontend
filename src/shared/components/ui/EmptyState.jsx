import React from 'react';

export default function EmptyState({
  title,
  description,
  action,
  icon,
  className = '',
}) {
  return (
    <div className={['ui-empty-state', className].filter(Boolean).join(' ')}>
      {icon && <div className="ui-empty-state__icon">{icon}</div>}
      <h3 className="ui-empty-state__title">{title}</h3>
      {description && <p className="ui-empty-state__description">{description}</p>}
      {action && <div className="ui-empty-state__action">{action}</div>}
    </div>
  );
}
