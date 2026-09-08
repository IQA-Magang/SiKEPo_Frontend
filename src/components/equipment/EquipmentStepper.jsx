import React from 'react';
import { Check } from 'lucide-react';

const STEPS = ['Informasi Alat', 'Dokumen', 'Konfirmasi'];

export default function EquipmentStepper({ currentStep }) {
  return (
    <div className="eq-stepper">
      {STEPS.map((label, idx) => {
        const step = idx + 1;
        const done = step < currentStep;
        const active = step === currentStep;
        return (
          <React.Fragment key={step}>
            <div className={`eq-step ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
              <div className="eq-step-circle">
                {done ? <Check size={14} /> : step}
              </div>
              <span className="eq-step-label">{label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`eq-step-line ${done ? 'done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
