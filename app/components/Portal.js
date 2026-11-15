'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Renders overlays at the end of <body>. Ancestors with blur/transform (like the sticky nav)
// would otherwise trap `position: fixed` children inside themselves.
export default function Portal({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}
