import React from 'react';

const variantClassNames = {
  primary: 'ui-button--primary',
  secondary: 'ui-button--secondary',
  outline: 'ui-button--outline',
  ghost: 'ui-button--ghost',
  danger: 'ui-button--danger',
  warning: 'ui-button--warning',
};

const sizeClassNames = {
  sm: 'ui-button--sm',
  md: 'ui-button--md',
  lg: 'ui-button--lg',
};

export default function Button({
  as: Component = 'button',
  type = 'button',
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  children,
  ...props
}) {
  const classes = [
    'ui-button',
    variantClassNames[variant] || variantClassNames.primary,
    sizeClassNames[size] || sizeClassNames.md,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const componentProps = Component === 'button' ? { type, ...props } : props;

  return (
    <Component className={classes} {...componentProps}>
      {icon ? <span className="ui-button__icon">{icon}</span> : null}
      {children}
    </Component>
  );
}
