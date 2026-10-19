import React from 'react';

const toneClassNames = {
  neutral: 'ui-badge--neutral',
  primary: 'ui-badge--primary',
  success: 'ui-badge--success',
  warning: 'ui-badge--warning',
  danger: 'ui-badge--danger',
  info: 'ui-badge--info',
  dark: 'ui-badge--dark',
};

export default function Badge({ tone = 'neutral', className = '', children, ...props }) {
  const classes = ['ui-badge', toneClassNames[tone] || toneClassNames.neutral, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
