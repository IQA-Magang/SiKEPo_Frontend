import React from 'react';
import { Search } from 'lucide-react';

export default function TableFilters({ fields = [], actions, className = '' }) {
  return (
    <div className={`table-filters ${className}`.trim()}>
      <div className="table-filters-fields">
        {fields.map((field) => (
          <div className="table-filter-field" key={field.id}>
            <label className="form-label" htmlFor={field.id}>
              {field.label}
            </label>
            {field.type === 'select' ? (
              <select
                id={field.id}
                className="form-select"
                value={field.value}
                onChange={field.onChange}
              >
                <option value={field.placeholderValue ?? ''}>
                  {field.placeholder}
                </option>
                {(field.options || []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="table-filter-search">
                <Search size={16} aria-hidden="true" />
                <input
                  id={field.id}
                  className="form-input"
                  type="search"
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={field.onChange}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      {actions && <div className="table-filters-actions">{actions}</div>}
    </div>
  );
}
