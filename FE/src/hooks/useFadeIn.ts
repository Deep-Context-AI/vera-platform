import { useState } from 'react';

export function useFadeIn() {
  const [isDisabled, setIsDisabled] = useState(false);
  
  return {
    isDisabled,
    setDisabled: setIsDisabled,
    enable: () => setIsDisabled(false),
    disable: () => setIsDisabled(true),
  };
} 