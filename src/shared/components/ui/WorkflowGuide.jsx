import { FileCheck } from "lucide-react";

export default function WorkflowGuide({ title, description, steps }) {
  return (
    <section className="workflow-guide" aria-label={title}>
      <div className="workflow-guide-heading">
        <FileCheck size={18} aria-hidden="true" />
        <h2>{title}</h2>
      </div>
      {description && <p className="workflow-guide-description">{description}</p>}
      <ol className="workflow-guide-steps">
        {steps.map((step, index) => (
          <li className="workflow-guide-step" key={step.title}>
            <span className="workflow-guide-number" aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
