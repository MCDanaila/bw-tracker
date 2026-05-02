import { type ReactNode, useRef, useState, useEffect } from 'react';

interface FilterChipRowProps {
  children: ReactNode;
}

export default function FilterChipRow({ children }: FilterChipRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      setAtStart(el.scrollLeft <= 0);
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative">
      {!atStart && (
        <div className="absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      )}
      <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto scrollbar-none">
        {children}
      </div>
      {!atEnd && (
        <div className="absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
      )}
    </div>
  );
}
