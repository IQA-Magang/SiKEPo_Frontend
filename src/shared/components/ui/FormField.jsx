import React from 'react';

export default function FormField({
  label,
  htmlFor,
  hint,
  hintId,
  error,
  required = false,
  className = '',
  labelClassName = '',
  style,
  children,
}) {
  return (
    <div className={['ui-form-field', className].filter(Boolean).join(' ')} style={style}>
      {label && (
        <label htmlFor={htmlFor} className={['ui-form-field__label', labelClassName].filter(Boolean).join(' ')}>
          {label}
          {required && <span className="ui-form-field__required">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="ui-form-field__message ui-form-field__message--error">{error}</span>
      ) : hint ? (
        <span id={hintId} className="ui-form-field__message">{hint}</span>
      ) : null}
    </div>
  );
}
