import React, { useState } from 'react';
import { History, RotateCcw, CheckCircle2, Mic, FileText, AlertCircle } from 'lucide-react';
import { StorageService } from '../services/storage';
import { AuditLog } from '../types';
import { Button, Card, useToast } from '../components/ui';

export const AuditView: React.FC = () => {
  const { showSuccess } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>(() => StorageService.getAuditLogs());

  const refreshLogs = () => {
    setLogs(StorageService.getAuditLogs());
  };

  const handleUndo = (logId: string) => {
    if (confirm('Tem certeza que deseja desfazer esta operação? Os registros no sistema serão revertidos.')) {
      StorageService.undoAuditAction(logId);
      refreshLogs();
      showSuccess('Ação Revertida', 'Operação revertida com sucesso.');
    }
  };

  return (
    <div className="space-y-6 pb-20 font-brand-sans">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#292724] dark:text-[#F7F1E7] font-brand-serif flex items-center gap-3">
          <History className="w-7 h-7 text-[#B85C38]" />
          <span>Histórico & Auditoria de Operações</span>
        </h2>
        <p className="text-sm sm:text-base text-[#5C5852] dark:text-[#C9BFA8] mt-1">
          Transparência total: rastreamento de todas as alterações, movimentações de estoque e reversão de ações.
        </p>
      </div>

      {/* Logs List */}
      <Card variant="default" className="p-0 overflow-hidden">
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-[#E7D5BE] dark:divide-stone-800">
          {logs.length === 0 ? (
            <div className="p-10 text-center text-[#5C5852] dark:text-[#C9BFA8]">
              Nenhum registro de auditoria encontrado.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 space-y-3 hover:bg-[#F7F1E7]/50 dark:hover:bg-stone-800/50 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#8A5A44] dark:text-[#C9BFA8]">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    log.status === 'Aplicado'
                      ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
                  }`}>
                    {log.status}
                  </span>
                </div>

                <div>
                  <p className="text-base font-bold text-[#292724] dark:text-[#F7F1E7]">
                    "{log.transcript || log.action}"
                  </p>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-md bg-[#E7D5BE]/60 dark:bg-stone-700 text-[#292724] dark:text-[#F7F1E7] font-bold text-xs">
                    {log.actionType || log.entityType}
                  </span>
                </div>

                <div className="text-xs text-[#8A5A44] dark:text-[#C9BFA8] font-mono bg-[#FAF6EF] dark:bg-[#1A1816] p-2.5 rounded-lg border border-[#E7D5BE] dark:border-stone-800 truncate">
                  {typeof log.details === 'string' ? log.details : JSON.stringify(log.details || '')}
                </div>

                {log.status === 'Aplicado' && (
                  <div className="flex justify-end pt-1">
                    <Button
                      onClick={() => handleUndo(log.id)}
                      variant="secondary"
                      size="sm"
                      icon={RotateCcw}
                    >
                      Desfazer Operação
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table with Legible Typography */}
        <div className="hidden md:block overflow-x-auto rounded-xl">
          <table className="w-full min-w-[720px] text-left text-sm sm:text-base font-brand-sans">
            <thead className="bg-[#E7D5BE]/60 dark:bg-[#2E2A26] text-[#8A5A44] dark:text-[#D67855] font-bold border-b border-[#E7D5BE] dark:border-stone-800">
              <tr>
                <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Horário / Data</th>
                <th className="p-4 text-sm font-bold uppercase tracking-wider">Ação Registrada</th>
                <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Tipo</th>
                <th className="p-4 hidden lg:table-cell text-sm font-bold uppercase tracking-wider">Detalhes</th>
                <th className="p-4 whitespace-nowrap text-sm font-bold uppercase tracking-wider">Status</th>
                <th className="p-4 text-right whitespace-nowrap text-sm font-bold uppercase tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7D5BE]/60 dark:divide-stone-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-[#5C5852] dark:text-[#C9BFA8]">
                    Nenhum registro de auditoria no sistema.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F7F1E7]/80 dark:hover:bg-[#2E2A26] transition-colors">
                    <td className="p-4 whitespace-nowrap text-xs sm:text-sm text-[#8A5A44] dark:text-[#C9BFA8] font-mono">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-4 font-bold text-[#292724] dark:text-[#F7F1E7]">
                      {log.transcript || log.action}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-[#E7D5BE]/60 dark:bg-stone-700 text-[#292724] dark:text-[#F7F1E7] font-bold text-xs">
                        {log.actionType || log.entityType}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell font-mono text-xs text-[#5C5852] dark:text-[#C9BFA8] max-w-xs truncate">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details || '')}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        log.status === 'Aplicado'
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      {log.status === 'Aplicado' && (
                        <Button
                          onClick={() => handleUndo(log.id)}
                          variant="secondary"
                          size="sm"
                          icon={RotateCcw}
                        >
                          Desfazer
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
