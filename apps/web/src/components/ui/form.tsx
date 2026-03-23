'use client';

import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './card';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Checkbox } from './checkbox';
import { Progress } from './progress';
import { Separator } from './separator';
import { ChevronLeft, ChevronRight, Check, Circle } from 'lucide-react';

interface FormFieldProps {
  label?: string;
  description?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  description,
  required,
  error,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {title && (
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

interface WizardStep {
  id: string;
  title: string;
  description?: string;
}

interface WizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  className?: string;
}

export function Wizard({ steps, currentStep, onStepChange, className }: WizardProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = index <= currentStep;

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isClickable && onStepChange(index)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  isCurrent && 'bg-primary text-primary-foreground',
                  isCompleted && 'bg-primary/20 text-primary hover:bg-primary/30',
                  !isCurrent && !isCompleted && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Circle className={cn('h-4 w-4', isCurrent && 'fill-current')} />
                )}
                <span className="hidden sm:inline">{step.title}</span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={cn('mx-2 h-px w-8 bg-border sm:w-16', isCompleted && 'bg-primary/40')}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface WizardFormProps {
  steps: WizardStep[];
  children: React.ReactNode;
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  className?: string;
}

export function WizardForm({
  steps,
  children,
  currentStep,
  onNext,
  onBack,
  onSubmit,
  isSubmitting,
  className,
}: WizardFormProps) {
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className={cn('space-y-6', className)}>
      <Wizard steps={steps} currentStep={currentStep} onStepChange={() => {}} />

      <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />

      <div className="min-h-[400px]">{children}</div>

      <Separator />

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} disabled={currentStep === 0}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">Сохранить черновик</Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isLastStep ? 'Создать' : 'Далее'}
            {!isLastStep && <ChevronRight className="ml-2 h-4 w-4" />}
            {isLastStep && <Check className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function FormActions({ children, className }: FormActionsProps) {
  return (
    <div className={cn('flex items-center justify-end gap-2 pt-4', className)}>{children}</div>
  );
}
