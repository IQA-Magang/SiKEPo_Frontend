import React from "react";

export default function Tabs({
  tabs,
  activeId,
  onChange,
  className = "tabs",
  ariaLabel,
}) {
  return (
    <div className={className} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={tab.idAttribute}
          type="button"
          role="tab"
          aria-selected={activeId === tab.id}
          className={`tab-btn${activeId === tab.id ? " active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
