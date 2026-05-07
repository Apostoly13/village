import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import IconButton from './village/IconButton';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };
  return <IconButton icon={dark ? Sun : Moon} label="Toggle theme" onClick={toggle} />;
}
