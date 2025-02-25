'use client';

import { usePathname } from 'next/navigation';
import ChevronUpIcon from './icons/ChevronUpIcon';

const FloatingButton = () => {
  const pathname = usePathname();

  if (
    pathname.startsWith('/game') ||
    pathname.startsWith('/login/kakao/callback')
  ) {
    return null;
  }

  return (
    <button
      className='fixed bottom-12 right-12 flex h-12 w-12 items-center justify-center rounded-full border border-slate-400 bg-slate-600 hover:scale-105'
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label='A button for moving to top'
    >
      <ChevronUpIcon />
    </button>
  );
};

export default FloatingButton;
