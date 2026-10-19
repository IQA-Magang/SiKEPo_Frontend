import React from 'react';
import Button from './Button.jsx';

export default function IconButton({
  icon,
  label,
  variant = 'secondary',
  className = '',
  ...props
}) {
  return (
    <Button
      {...props}
      variant={variant}
      icon={icon}
      aria-label={label || props['aria-label']}
      className={['ui-icon-button', className].filter(Boolean).join(' ')}
    />
  );
}
