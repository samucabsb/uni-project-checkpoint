/**
 * BackButton — componente global de navegação
 * Se houver histórico: volta. Se não: vai para o fallback.
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface Props {
  fallback?: string;
  label?:    string;
  className?: string;
}

export function BackButton({ fallback = '/feed', label = 'Voltar', className = '' }: Props) {
  const navigate = useNavigate();

  function handleBack() {
    if (window.history.length > 2) navigate(-1);
    else navigate(fallback);
  }

  return (
    <button onClick={handleBack}
      className={`flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors ${className}`}>
      <ArrowLeft size={16}/>
      {label}
    </button>
  );
}
