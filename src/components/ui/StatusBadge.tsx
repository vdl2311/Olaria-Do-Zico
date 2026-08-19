import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Flame, Truck, Package } from 'lucide-react';

export type StatusType = 
  | 'concluida' | 'Concluída' | 'paga' | 'Paga' | 'entregue' | 'Entregue' | 'pronto' | 'Pronto'
  | 'pendente' | 'Pendente' | 'a_pagar' | 'A Pagar' | 'fiado' | 'Fiado'
  | 'em_producao' | 'Em Produção' | 'queima' | 'Queima' | 'secagem' | 'Secagem' | 'moldagem' | 'Moldagem'
  | 'cancelada' | 'Cancelada' | 'atrasado' | 'Atrasado'
  | 'alerta' | 'baixo_estoque';

export interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
}) => {
  const norm = String(status).toLowerCase().trim();

  let styleClass = 'bg-[#E7D5BE]/80 dark:bg-[#2E2A26] text-[#292724] dark:text-[#F2EBDD] border-[#D4BEA2] dark:border-[#3D3833]';
  let Icon = Clock;
  let textLabel = label || status;

  if (['concluida', 'paga', 'entregue', 'pronto'].includes(norm)) {
    styleClass = 'bg-[#667052]/25 dark:bg-[#2D3326] text-[#2E3B1C] dark:text-[#A4B38A] border-[#667052]/50 dark:border-[#3D4634]';
    Icon = CheckCircle2;
  } else if (['pendente', 'a pagar', 'a_pagar', 'fiado'].includes(norm)) {
    styleClass = 'bg-[#B85C38]/20 dark:bg-[#3D3220] text-[#803316] dark:text-[#E0B366] border-[#B85C38]/40 dark:border-[#52442C]';
    Icon = Clock;
  } else if (['queima', 'em produção', 'em_producao', 'secagem', 'moldagem'].includes(norm)) {
    styleClass = 'bg-[#CF734E]/25 dark:bg-[#3D2418] text-[#7A3619] dark:text-[#D67855] border-[#CF734E]/50 dark:border-[#522F20]';
    Icon = Flame;
  } else if (['cancelada', 'atrasado'].includes(norm)) {
    styleClass = 'bg-rose-100 dark:bg-[#3D2620] text-rose-900 dark:text-[#E07A6E] border-rose-400 dark:border-[#54332B]';
    Icon = XCircle;
  } else if (['alerta', 'baixo_estoque'].includes(norm)) {
    styleClass = 'bg-amber-100 dark:bg-[#3D3220] text-amber-950 dark:text-[#E0B366] border-amber-400 dark:border-[#52442C]';
    Icon = AlertTriangle;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold border tracking-wide whitespace-nowrap shrink-0 shadow-2xs ${styleClass} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
      <span>{textLabel}</span>
    </span>
  );
};
