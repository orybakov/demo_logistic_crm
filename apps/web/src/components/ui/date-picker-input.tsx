'use client';

import * as React from 'react';
import { Input, type InputProps } from './input';

export const DatePickerInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ onFocus, onClick, ...props }, ref) => {
    const localRef = React.useRef<HTMLInputElement | null>(null);

    const attachRef = (node: HTMLInputElement | null) => {
      localRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    };

    const openPicker = () => {
      localRef.current?.showPicker?.();
    };

    return (
      <Input
        ref={attachRef}
        {...props}
        onFocus={(e) => {
          onFocus?.(e);
          openPicker();
        }}
        onClick={(e) => {
          onClick?.(e);
          openPicker();
        }}
      />
    );
  }
);

DatePickerInput.displayName = 'DatePickerInput';
