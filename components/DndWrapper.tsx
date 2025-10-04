'use client';

import { ReactNode, useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend, TouchBackendOptions } from 'react-dnd-touch-backend';  // New import

interface DndWrapperProps {
  children: ReactNode;
  backend?: 'html5' | 'touch' | 'auto';  // 'auto' detects device
}

export default function DndWrapper({ children, backend = 'auto' }: DndWrapperProps) {
  const [selectedBackend, setSelectedBackend] = useState<'HTML5Backend' | 'TouchBackend'>('HTML5Backend');

  useEffect(() => {
    // Auto-detect: Use touch if on mobile/touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const finalBackend = backend === 'auto' 
      ? (isTouchDevice ? 'TouchBackend' : 'HTML5Backend')
      : (backend === 'touch' ? 'TouchBackend' : 'HTML5Backend');
    setSelectedBackend(finalBackend as any);
  }, [backend]);

  // Touch options: Customize delay, etc.
  const touchOptions: TouchBackendOptions = {
    enableMouseEvents: false,  // Disable mouse on touch devices
    enableKeyboardEvents: false,
    touchStartThreshold: 10,   // Pixels to start drag
    // The touch backend expects a numeric delay (ms) or an object depending on version.
    // We'll provide a single numeric lift delay to satisfy the runtime.
    delay: 200,
  };

  const Backend = selectedBackend === 'TouchBackend' ? TouchBackend : HTML5Backend;
  const backendOptions = selectedBackend === 'TouchBackend' ? touchOptions : undefined;

  return (
    <DndProvider backend={Backend} options={backendOptions}>
      {children}
    </DndProvider>
  );
}
