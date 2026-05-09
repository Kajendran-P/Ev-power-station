export default function WizardStepper({ currentStep, steps }) {
  return (
    <div className="wz-stepper">
      <div className="wz-stepper-inner">
        {steps.map((step, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          const cls = isCompleted ? 'completed' : isActive ? 'active' : '';
          return (
            <div key={i} className={`wz-stepper-item ${cls}`}>
              <div className="wz-stepper-indicator">
                <div className="wz-stepper-circle">
                  {isCompleted ? (
                    <i className="fa-solid fa-check"></i>
                  ) : (
                    <span>{stepNum}</span>
                  )}
                </div>
                {i < steps.length - 1 && <div className="wz-stepper-line"><div className="wz-stepper-line-fill"></div></div>}
              </div>
              <div className="wz-stepper-content">
                <span className="wz-stepper-label">{step.label}</span>
                <span className="wz-stepper-desc">{step.desc}</span>
              </div>
            </div>
          );
        })}
      </div>
      {/* Progress bar */}
      <div className="wz-progress-bar">
        <div className="wz-progress-fill" style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}></div>
      </div>
      <div className="wz-progress-text">
        <span>Step {currentStep} of {steps.length}</span>
        <span>{Math.round(((currentStep - 1) / (steps.length - 1)) * 100)}%</span>
      </div>
    </div>
  );
}
