import React from 'react';

export default function Card({
  as: Component = 'section',
  title,
  subtitle,
  action,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  padding = true,
  style,
}) {
  const classes = ['ui-card', padding ? 'ui-card--padded' : '', className].filter(Boolean).join(' ');

  return (
    <Component className={classes} style={style}>
      {(title || subtitle || action) && (
        <div className={['ui-card__header', headerClassName].filter(Boolean).join(' ')}>
          <div className="ui-card__header-copy">
            {title && <h3 className="ui-card__title">{title}</h3>}
            {subtitle && <p className="ui-card__subtitle">{subtitle}</p>}
          </div>
          {action && <div className="ui-card__action">{action}</div>}
        </div>
      )}
      <div className={['ui-card__body', bodyClassName].filter(Boolean).join(' ')}>{children}</div>
    </Component>
  );
}
