'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Loader2, CheckCircle, Search, AlertCircle } from 'lucide-react';
import { parseLocaleNumber } from '@/lib/clinical/calculations';
import { useToast } from '@/components/providers/ToastProvider';

interface BatchTestOption {
  id: string;
  name: string;
  code: string;
  unit: string | null;
  minValue: number | null;
  maxValue: number | null;
  isGroup: boolean;
  parentId: string | null;
  resultType?: string;
  options?: string | null;
}

interface BatchResultItem {
  resultId: string;
  testId: string;
  value: string;
  originalValue: string;
  notes: string;
  isSaving?: boolean;
  saveStatus?: 'idle' | 'success' | 'error';
}

interface BatchPatientRow {
  analysisId: string;
  dailyId: string;
  status: string | null;
  results: Record<string, BatchResultItem>;
}

export function BatchEntry() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [tests, setTests] = useState<BatchTestOption[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  
  const [rows, setRows] = useState<BatchPatientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [saveSuccessGlobal, setSaveSuccessGlobal] = useState(false);
  
  // inputRefs[analysisId][testId]
  const inputRefs = useRef<Record<string, Record<string, HTMLInputElement | null>>>({});

  useEffect(() => {
    setDateStr(new Date().toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    async function fetchTests() {
      try {
        const res = await fetch('/api/tests');
        if (res.ok) {
          const data = await res.json();
          // NO FILTERING of parent tests so they can be selected!
          setTests(data);
        }
      } catch (e) {
        toast('error', 'Erreur de connexion lors du chargement des tests');
      }
    }
    fetchTests();
  }, []);

  // Helpers to resolve tree
  const getLeafTests = useCallback((allTests: BatchTestOption[], rootId: string): BatchTestOption[] => {
    const children = allTests.filter(t => t.parentId === rootId);
    if (children.length === 0) {
      const root = allTests.find(t => t.id === rootId);
      return root ? [root] : [];
    }
    return children.flatMap(c => getLeafTests(allTests, c.id));
  }, []);

  const leafTests = React.useMemo(() => {
    if (!selectedTestId || tests.length === 0) return [];
    return getLeafTests(tests, selectedTestId);
  }, [selectedTestId, tests, getLeafTests]);

  const loadBatchData = useCallback(async () => {
    if (!selectedTestId || !dateStr || leafTests.length === 0) {
      setRows([]);
      return;
    }
    
    setLoading(true);
    setSaveSuccessGlobal(false);
    try {
      const testIds = leafTests.map(t => t.id).join(',');
      const res = await fetch(`/api/analyses/batch?testIds=${testIds}&date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        
        const formattedRowsMap = new Map<string, BatchPatientRow>();
        
        data.forEach((item: any) => {
          const aId = item.analysis.id;
          if (!formattedRowsMap.has(aId)) {
            formattedRowsMap.set(aId, {
              analysisId: aId,
              dailyId: item.analysis.dailyId || '-',
              status: item.analysis.status,
              results: {}
            });
            inputRefs.current[aId] = {};
          }
          
          formattedRowsMap.get(aId)!.results[item.testId] = {
            resultId: item.id,
            testId: item.testId,
            value: item.value || '',
            originalValue: item.value || '',
            notes: item.notes || '',
            isSaving: false,
            saveStatus: 'idle',
          };
        });
        
        setRows(Array.from(formattedRowsMap.values()));
      }
    } catch (error) {
      toast('error', 'Erreur de connexion lors du chargement des résultats');
    } finally {
      setLoading(false);
    }
  }, [selectedTestId, dateStr, leafTests]);

  useEffect(() => {
    if (dateStr && selectedTestId && tests.length > 0) {
      loadBatchData();
    }
  }, [loadBatchData, dateStr, selectedTestId, tests.length]);

  const handleValueChange = (analysisId: string, testId: string, val: string) => {
    setRows(current => current.map(row => {
      if (row.analysisId !== analysisId) return row;
      const resItem = row.results[testId];
      if (!resItem) return row;
      return {
        ...row,
        results: {
          ...row.results,
          [testId]: {
            ...resItem,
            value: val,
            saveStatus: 'idle'
          }
        }
      };
    }));
    setSaveSuccessGlobal(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (rowIndex < rows.length - 1) {
        const nextAId = rows[rowIndex + 1].analysisId;
        const testId = leafTests[colIndex].id;
        inputRefs.current[nextAId]?.[testId]?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (rowIndex > 0) {
        const prevAId = rows[rowIndex - 1].analysisId;
        const testId = leafTests[colIndex].id;
        inputRefs.current[prevAId]?.[testId]?.focus();
      }
    } else if (e.key === 'ArrowRight' && e.ctrlKey) {
      e.preventDefault();
      if (colIndex < leafTests.length - 1) {
        const aId = rows[rowIndex].analysisId;
        const nextTestId = leafTests[colIndex + 1].id;
        inputRefs.current[aId]?.[nextTestId]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && e.ctrlKey) {
      e.preventDefault();
      if (colIndex > 0) {
        const aId = rows[rowIndex].analysisId;
        const prevTestId = leafTests[colIndex - 1].id;
        inputRefs.current[aId]?.[prevTestId]?.focus();
      }
    }
  };

  const saveCell = async (analysisId: string, testId: string) => {
    const row = rows.find(r => r.analysisId === analysisId);
    if (!row) return;
    const resItem = row.results[testId];
    if (!resItem || resItem.value === resItem.originalValue) return;

    const updateCellState = (updates: Partial<BatchResultItem>) => {
      setRows(current => current.map(r => {
        if (r.analysisId !== analysisId) return r;
        return {
          ...r,
          results: {
            ...r.results,
            [testId]: { ...r.results[testId], ...updates }
          }
        };
      }));
    };

    updateCellState({ isSaving: true, saveStatus: 'idle' });

    try {
      const res = await fetch('/api/analyses/batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          updates: [{
            resultId: resItem.resultId,
            analysisId: row.analysisId,
            value: resItem.value,
            notes: resItem.notes,
          }] 
        }),
      });
      
      if (res.ok) {
        updateCellState({ 
          isSaving: false, 
          saveStatus: 'success',
          originalValue: resItem.value 
        });
        setTimeout(() => updateCellState({ saveStatus: 'idle' }), 2000);
      } else {
        updateCellState({ isSaving: false, saveStatus: 'error' });
      }
    } catch (error) {
      updateCellState({ isSaving: false, saveStatus: 'error' });
      toast('error', 'Erreur lors de la sauvegarde du résultat');
    }
  };

  const handleSaveAll = async () => {
    const updatesToSave: any[] = [];
    rows.forEach(row => {
      Object.values(row.results).forEach(resItem => {
        if (resItem.value !== resItem.originalValue) {
          updatesToSave.push({
            resultId: resItem.resultId,
            analysisId: row.analysisId,
            value: resItem.value,
            notes: resItem.notes,
          });
        }
      });
    });

    if (updatesToSave.length === 0) return;

    setSavingGlobal(true);
    setSaveSuccessGlobal(false);
    
    try {
      const res = await fetch('/api/analyses/batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: updatesToSave }),
      });
      
      if (res.ok) {
        setSaveSuccessGlobal(true);
        setRows(current => current.map(row => {
          const newResults = { ...row.results };
          Object.keys(newResults).forEach(testId => {
            const item = newResults[testId];
            if (item.value !== item.originalValue) {
              newResults[testId] = { ...item, originalValue: item.value, saveStatus: 'success' };
            }
          });
          return { ...row, results: newResults };
        }));

        setTimeout(() => {
          setSaveSuccessGlobal(false);
          setRows(current => current.map(row => {
            const newResults = { ...row.results };
            Object.keys(newResults).forEach(testId => {
              newResults[testId] = { ...newResults[testId], saveStatus: 'idle' };
            });
            return { ...row, results: newResults };
          }));
        }, 3000);
      } else {
        toast('error', 'Erreur serveur lors de la sauvegarde globale');
      }
    } catch (error) {
      toast('error', 'Erreur réseau lors de la sauvegarde globale');
    } finally {
      setSavingGlobal(false);
    }
  };

  const hasUnsavedChanges = rows.some(r => Object.values(r.results).some(item => item.value !== item.originalValue));

  const getParentName = (parentId: string | null) => {
    if (!parentId || parentId === selectedTestId) return null;
    return tests.find(t => t.id === parentId)?.name;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-6">
      {/* Header & Controls */}
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] shrink-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/analyses')}
              className="p-2.5 bg-[var(--color-page)] hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl text-[var(--color-text-soft)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">Saisie en Série</h1>
              <p className="text-sm text-[var(--color-text-soft)] mt-1">Grille de saisie matricielle</p>
            </div>
          </div>
          
          <button 
            onClick={handleSaveAll}
            disabled={savingGlobal || !hasUnsavedChanges}
            className={`btn-primary h-12 px-6 rounded-2xl shadow-sm transition-all duration-300 ${
              saveSuccessGlobal ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 
              !hasUnsavedChanges && rows.length > 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {savingGlobal ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 
             saveSuccessGlobal ? <CheckCircle className="w-5 h-5 mr-2" /> : 
             <Save className="w-5 h-5 mr-2" />}
            {saveSuccessGlobal ? 'Enregistré !' : 'Enregistrer tout'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2 relative">
            <label className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-2 block ml-1">Test ou Bilan à saisir</label>
            <select 
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="input-premium w-full h-12 text-base font-medium rounded-2xl"
            >
              <option value="">-- Sélectionner un test ou un bilan --</option>
              {tests.filter(t => !t.parentId).map(t => (
                <option key={t.id} value={t.id}>{t.code} - {t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider mb-2 block ml-1">Date de création</label>
            <input 
              type="date" 
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="input-premium w-full h-12 text-base font-medium rounded-2xl"
            />
          </div>
        </div>
      </div>

      {/* Grid Area */}
      <div className="flex-1 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden relative">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-soft)]">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[var(--color-accent)]" />
            <p className="font-medium">Construction de la grille...</p>
          </div>
        ) : !selectedTestId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-soft)] opacity-70">
            <Search className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
            <p className="font-medium text-lg">Sélectionnez un test pour générer la grille de saisie.</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-soft)] opacity-70">
            <AlertCircle className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
            <p className="font-medium text-lg">Aucun dossier trouvé pour ce test à cette date.</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1 p-2">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="sticky top-0 z-10 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md shadow-sm">
                <tr>
                  <th className="px-4 py-4 font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)] w-24 bg-white/95 dark:bg-[#0f172a]/95 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">N° Paill.</th>
                  
                  {leafTests.map(test => {
                    const parentName = getParentName(test.parentId);
                    return (
                      <th key={test.id} className="px-4 py-3 font-semibold text-[var(--color-text)] border-b border-[var(--color-border)] min-w-[140px] align-bottom">
                        <div className="flex flex-col gap-1">
                          {parentName && <span className="text-[10px] font-black uppercase text-indigo-500/70 tracking-wider truncate" title={parentName}>{parentName}</span>}
                          <span className="text-sm font-bold text-[var(--color-accent)] truncate" title={test.name}>{test.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            {test.unit && <span className="text-[11px] font-medium text-slate-500" dangerouslySetInnerHTML={{ __html: test.unit }} />}
                            {(test.minValue !== null || test.maxValue !== null) && (
                              <span className="text-[10px] font-mono font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                [{test.minValue ?? '-'} - {test.maxValue ?? '-'}]
                              </span>
                            )}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-4 py-4 font-semibold text-[var(--color-text-secondary)] border-b border-[var(--color-border)] w-28">Statut</th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {rows.map((row, rowIndex) => (
                  <tr 
                    key={row.analysisId} 
                    className="group border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)] transition-all duration-200"
                  >
                    <td className="px-4 py-3 bg-white dark:bg-[#0f172a] group-hover:bg-[var(--color-surface-muted)] sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] h-8 rounded-lg bg-[var(--color-page)] font-mono font-bold text-[var(--color-text)] border border-[var(--color-border)] shadow-sm">
                        {row.dailyId}
                      </span>
                    </td>
                    
                    {leafTests.map((test, colIndex) => {
                      const resItem = row.results[test.id];
                      if (!resItem) {
                        return (
                          <td key={test.id} className="px-4 py-3">
                            <div className="w-full h-10 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center text-slate-400">
                              -
                            </div>
                          </td>
                        );
                      }

                      let abnormal = false;
                      if (test.minValue !== null || test.maxValue !== null) {
                        const num = parseLocaleNumber(resItem.value);
                        if (num !== null) {
                          if (test.minValue !== null && num < test.minValue) abnormal = true;
                          if (test.maxValue !== null && num > test.maxValue) abnormal = true;
                        }
                      }

                      return (
                        <td key={test.id} className="px-4 py-3 relative min-w-[120px]">
                          <div className="relative flex items-center">
                            {test.resultType === 'dropdown' ? (
                              <select
                                ref={(el: HTMLSelectElement | null) => { 
                                  if (!inputRefs.current[row.analysisId]) inputRefs.current[row.analysisId] = {};
                                  // @ts-ignore - we mix HTMLInputElement and HTMLSelectElement but it's fine for focus()
                                  inputRefs.current[row.analysisId][test.id] = el; 
                                }}
                                value={resItem.value}
                                onChange={(e) => handleValueChange(row.analysisId, test.id, e.target.value)}
                                onKeyDown={(e: any) => handleKeyDown(e, rowIndex, colIndex)}
                                onBlur={() => saveCell(row.analysisId, test.id)}
                                disabled={row.status === 'validated'}
                                className={`font-mono h-10 px-2 text-sm rounded-md border font-bold transition-all outline-none focus:ring-2 w-full shadow-sm disabled:opacity-50 disabled:cursor-not-allowed
                                  ${resItem.value && resItem.value === resItem.originalValue ? 'bg-emerald-50/50 border-emerald-200/60 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/40 dark:text-emerald-300' : 
                                    resItem.value !== resItem.originalValue ? 'bg-amber-50/50 border-amber-300 text-amber-900 shadow-[0_0_0_2px_rgba(252,211,77,0.2)] dark:bg-amber-900/20 dark:border-amber-700/60 dark:text-amber-200' :
                                    'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20'}`}
                              >
                                <option value="">--</option>
                                {test.options?.split(',').map((opt) => (
                                  <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                ref={el => { 
                                  if (!inputRefs.current[row.analysisId]) inputRefs.current[row.analysisId] = {};
                                  inputRefs.current[row.analysisId][test.id] = el; 
                                }}
                                type="text"
                                value={resItem.value}
                                onChange={(e) => handleValueChange(row.analysisId, test.id, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                                onBlur={() => saveCell(row.analysisId, test.id)}
                                disabled={row.status === 'validated'}
                                className={`font-mono h-10 px-3 text-sm rounded-md border font-bold transition-all outline-none focus:ring-2 w-full shadow-sm disabled:opacity-50 disabled:cursor-not-allowed
                                  ${resItem.value && resItem.value === resItem.originalValue && !abnormal ? 'bg-emerald-50/50 border-emerald-200/60 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/40 dark:text-emerald-300' : 
                                    resItem.value !== resItem.originalValue && !abnormal ? 'bg-amber-50/50 border-amber-300 text-amber-900 shadow-[0_0_0_2px_rgba(252,211,77,0.2)] dark:bg-amber-900/20 dark:border-amber-700/60 dark:text-amber-200' :
                                    abnormal ? 'border-rose-300 bg-rose-50 text-rose-600 focus:border-rose-400 focus:ring-rose-500/20' :
                                    'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20'}`}
                                placeholder="..."
                              />
                            )}
                            
                            {abnormal && <AlertCircle className="absolute right-2 top-1/2 -translate-y-1/2 text-rose-500/80 pointer-events-none" size={14} />}
                            
                            <div className="absolute right-2 flex items-center pointer-events-none">
                              {resItem.isSaving && <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />}
                              {resItem.saveStatus === 'success' && !abnormal && <CheckCircle className="w-3 h-3 text-emerald-500 animate-in zoom-in" />}
                              {resItem.value !== resItem.originalValue && !resItem.isSaving && resItem.saveStatus !== 'success' && !abnormal && (
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}

                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border ${
                        row.status === 'validated' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300' :
                        row.status === 'in_progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300' :
                        'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {row.status === 'validated' ? 'Validé' : 
                         row.status === 'in_progress' ? 'En cours' : 'Attente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
