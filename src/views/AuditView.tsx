import React, { useState } from 'react';
import { History, RotateCcw, CheckCircle2, Mic, FileText, AlertCircle } from 'lucide-react';
import { StorageService } from '../services/storage';
import { AuditLog } from '../types';

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(() => StorageService.getAuditLogs());

  const refreshLogs = () => {
    setLogs(StorageService.getAuditLogs());
  };

  const handleUndo = (logId: string) => {
    if (confirm('Tem certeza que deseja desfazer esta operação? Os registros no sistema serão revertidos.')) {
      StorageService.undoAuditAction(logId);
      refreshLogs();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-amber-950 flex items-center gap-2">
          <History className="w-6 h-6 text-amber-800" />
          <span>Histórico & Auditoria de Operações</span>
        </h2>
        <p className="text-xs text-amber-800/80">
          Transparência total: rastreamento de todas as alterações, movimentações de estoque e reversão de ações.
        </p>
      </div>

      {/* Logs List */}
      <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-xs">
        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-amber-100">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-amber-800/60">
              Nenhum registro de auditoria encontrado.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 space-y-2.5 hover:bg-amber-50/40 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-amber-800 font-semibold">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    log.status === 'Aplicado' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {log.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-bold text-amber-950">
                    "{log.transcript || log.action}"
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                    {log.actionType || log.entityType}
                  </span>
                </div>

                <div className="text-[11px] text-amber-800 font-mono bg-amber-50/60 p-2 rounded-lg border border-amber-100 truncate">
                  {typeof log.details === 'string' ? log.details : JSON.stringify(log.details || '')}
                </div>

                {log.status === 'Aplicado' && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleUndo(log.id)}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-red-100 hover:text-red-800 text-amber-950 font-bold rounded-lg text-xs transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Desfazer Operação</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table with Smooth Scroll */}
        <div className="hidden md:block overflow-x-auto rounded-xl">
          <table className="w-full min-w-[680px] text-left text-xs sm:text-sm">
            <thead className="bg-amber-900/10 text-amber-900 font-bold border-b border-amber-200">
              <tr>
                <th className="p-3.5 whitespace-nowrap">Horário / Data</th>
                <th className="p-3.5">Ação Registrada</th>
                <th className="p-3.5 whitespace-nowrap">Tipo da Ação</th>
                <th className="p-3.5 hidden lg:table-cell">Detalhes da Alteração</th>
                <th className="p-3.5 whitespace-nowrap">Status</th>
                <th className="p-3.5 text-right whitespace-nowrap">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-amber-800/60">
                    Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-amber-50/60">
                    <td className="p-3.5 text-amber-800 font-semibold whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3.5 font-bold text-amber-950 max-w-xs">
                      "{log.transcript || log.action}"
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs">
                        {log.actionType || log.entityType}
                      </span>
                    </td>
                    <td className="p-3.5 text-amber-800 text-xs font-mono max-w-xs truncate hidden lg:table-cell">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details || '')}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        log.status === 'Aplicado' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {log.status === 'Aplicado' && (
                        <button
                          onClick={() => handleUndo(log.id)}
                          className="px-3 py-1.5 bg-amber-200 hover:bg-red-100 hover:text-red-800 text-amber-950 font-bold rounded-lg text-xs transition-colors inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Desfazer</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
