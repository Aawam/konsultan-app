type StepWizardProps = {
  steps: string[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function StepWizard({ steps, currentStep, onStepClick }: StepWizardProps) {
  return (
    <div className="flex items-center gap-0 mb-6 flex-wrap gap-y-2">
      {steps.map((label, i) => {
        const num = i + 1
        const done = num < currentStep
        const active = num === currentStep
        return (
          <div key={label} className="flex items-center">
            <button
              type="button"
              onClick={() => done && onStepClick?.(num)}
              className={[
                'flex items-center gap-2',
                done && onStepClick ? 'cursor-pointer' : 'cursor-default',
              ].join(' ')}
            >
              <div className={[
                'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0',
                done   ? 'bg-brand text-white' :
                active ? 'bg-brand/20 text-brand border border-brand' :
                         'bg-muted text-muted-foreground border border-border',
              ].join(' ')}>
                {done ? '✓' : num}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div className={`mx-3 h-px w-8 ${num < currentStep ? 'bg-brand' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
