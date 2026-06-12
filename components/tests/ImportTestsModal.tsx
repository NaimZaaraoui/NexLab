'use client';

import { useState, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Upload, X, AlertCircle, FileSpreadsheet, Loader2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { importTestsAction, type ImportTestInput } from '@/app/actions/import-tests';

interface ImportTestsModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportTestsModal({ open, onClose, onSuccess }: ImportTestsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportTestInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    parseFile(selectedFile);
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        if (jsonData.length === 0) {
          setError("Le fichier est vide.");
          return;
        }

        // Map and validate rows loosely for preview
        const mappedData: ImportTestInput[] = jsonData.map((row) => ({
          code: String(row.code || row.Code || row.CODE || '').trim(),
          name: String(row.name || row.Name || row.nom || row.Nom || '').trim(),
          categoryName: String(row.category || row.Category || row.categorie || row.Catégorie || row.Categorie || '') || null,
          unit: String(row.unit || row.Unit || row.unite || row.Unité || '') || null,
          minValue: parseFloat(row.minValue || row.min || row['Valeur Min']) || null,
          maxValue: parseFloat(row.maxValue || row.max || row['Valeur Max']) || null,
          minValueM: parseFloat(row.minValueM || row.minM || row['Valeur Min (H)']) || null,
          maxValueM: parseFloat(row.maxValueM || row.maxM || row['Valeur Max (H)']) || null,
          minValueF: parseFloat(row.minValueF || row.minF || row['Valeur Min (F)']) || null,
          maxValueF: parseFloat(row.maxValueF || row.maxF || row['Valeur Max (F)']) || null,
          price: parseFloat(row.price || row.Price || row.prix || row.Prix) || 0,
          decimals: parseInt(row.decimals || row.Decimals || row.décimales || row.Décimales) || 1,
          resultType: row.resultType || row['Type de Résultat'] || row.type || 'numeric',
          sampleType: String(row.sampleType || row['Type d\'échantillon'] || row.Echantillon || row.Prélèvement || '') || null,
          sampleContainer: String(row.sampleContainer || row.Récipient || row.Tube || '') || null,
          options: String(row.options || row.Options || row.Choix || row.Formule || '') || null,
          rank: parseInt(row.rank || row.Rank || row.Ordre || row.ordre) || 0,
          isGroup: !!(row.isGroup || row.Groupe || row.groupe || row.IsGroup),
          isOptional: !!(row.isOptional || row.Optionnel || row.optionnel || row.IsOptional),
          parentId: String(row.parentId || row.ParentId || row.Parent || row.parent || row['Code Parent'] || row.CodeParent || '') || null,
        }));

        const invalidRows = mappedData.filter(r => !r.code || !r.name);
        if (invalidRows.length > 0) {
          setError(`Attention : ${invalidRows.length} ligne(s) n'ont pas de code ou de nom et seront ignorées si vous importez.`);
        }

        setPreviewData(mappedData.filter(r => r.code && r.name));
      } catch (err) {
        console.error(err);
        setError("Erreur lors de la lecture du fichier. Assurez-vous qu'il s'agit d'un fichier CSV ou Excel valide.");
      }
    };
    reader.onerror = () => {
      setError("Erreur lors de la lecture du fichier.");
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;
    
    setIsImporting(true);
    setError(null);

    try {
      const result = await importTestsAction(previewData);
      
      if (result.success) {
        onSuccess();
        handleClose();
      } else {
        setError(result.error || "Erreur inconnue");
      }
    } catch (err) {
      setError("Une erreur est survenue lors de la communication avec le serveur.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (isImporting) return;
    setFile(null);
    setPreviewData([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        Code: 'GLY',
        Nom: 'Glycémie à jeun',
        Catégorie: 'Biochimie',
        Unité: 'g/L',
        'Valeur Min': 0.70,
        'Valeur Max': 1.10,
        'Valeur Min (H)': '',
        'Valeur Max (H)': '',
        'Valeur Min (F)': '',
        'Valeur Max (F)': '',
        'Prix': 30,
        'Type de Résultat': 'numeric',
        'Décimales': 2,
        "Type d'échantillon": 'Plasma',
        'Récipient': 'Tube Fluorure',
        'Options': '',
        'Ordre': 1,
        'Est un groupe': false,
        'Est optionnel': false,
        'Code Parent': ''
      },
      {
        Code: 'CREA',
        Nom: 'Créatinine',
        Catégorie: 'Biochimie',
        Unité: 'mg/L',
        'Valeur Min': '',
        'Valeur Max': '',
        'Valeur Min (H)': 7.0,
        'Valeur Max (H)': 12.0,
        'Valeur Min (F)': 5.0,
        'Valeur Max (F)': 10.0,
        'Prix': 40,
        'Type de Résultat': 'numeric',
        'Décimales': 1,
        "Type d'échantillon": 'Sérum',
        'Récipient': 'Tube Sec',
        'Options': '',
        'Ordre': 2,
        'Est un groupe': false,
        'Est optionnel': false,
        'Code Parent': ''
      },
      {
        Code: 'GS',
        Nom: 'Groupe Sanguin',
        Catégorie: 'Hématologie',
        Unité: '',
        'Valeur Min': '',
        'Valeur Max': '',
        'Valeur Min (H)': '',
        'Valeur Max (H)': '',
        'Valeur Min (F)': '',
        'Valeur Max (F)': '',
        'Prix': 60,
        'Type de Résultat': 'dropdown',
        'Décimales': 0,
        "Type d'échantillon": 'Sang Total',
        'Récipient': 'Tube EDTA',
        'Options': 'A Positif,A Négatif,B Positif,B Négatif,AB Positif,AB Négatif,O Positif,O Négatif',
        'Ordre': 3,
        'Est un groupe': false,
        'Est optionnel': false,
        'Code Parent': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Auto-size columns loosely based on headers
    const cols = Object.keys(templateData[0]).map(key => ({ wch: Math.max(key.length, 15) }));
    worksheet['!cols'] = cols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Analyses');
    XLSX.writeFile(workbook, 'Modele_Import_Analyses.xlsx');
  };

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] p-0 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-3xl bg-[var(--color-surface)] shadow-2xl border border-[var(--color-border)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4 bg-[var(--color-surface-muted)]/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Upload size={20} />
                </div>
                <div>
                  <Dialog.Title className="text-lg font-bold text-[var(--color-text)]">
                    Importer des analyses
                  </Dialog.Title>
                  <p className="text-sm text-[var(--color-text-soft)]">
                    CSV ou Excel (code, nom, catégorie, prix, etc.)
                  </p>
                </div>
              </div>
              <Dialog.Close asChild>
                <button 
                  className="rounded-full p-2 text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)] transition-colors"
                  disabled={isImporting}
                >
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {!file ? (
                <div 
                  className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)]/30 py-12 px-4 transition-colors hover:bg-[var(--color-surface-muted)]/60 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileSpreadsheet className="mb-4 h-12 w-12 text-[var(--color-text-soft)]" />
                  <p className="text-center font-medium text-[var(--color-text)]">
                    Cliquez pour sélectionner un fichier
                  </p>
                  <p className="mt-1 text-center text-sm text-[var(--color-text-soft)]">
                    .csv, .xlsx, .xls
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl bg-[var(--color-surface-muted)] p-4 border border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-8 w-8 text-indigo-500" />
                      <div>
                        <p className="font-medium text-[var(--color-text)]">{file.name}</p>
                        <p className="text-xs text-[var(--color-text-soft)]">
                          {(file.size / 1024).toFixed(1)} KB • {previewData.length} analyses valides trouvées
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setFile(null)}
                      className="text-sm font-medium text-red-500 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      disabled={isImporting}
                    >
                      Changer
                    </button>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-amber-800 dark:bg-amber-500/10 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  )}

                  {previewData.length > 0 && (
                    <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden">
                      <div className="max-h-[300px] overflow-y-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="sticky top-0 bg-[var(--color-surface-muted)] text-[var(--color-text-soft)] z-10 shadow-sm">
                            <tr>
                              <th className="px-4 py-3 font-medium">Code</th>
                              <th className="px-4 py-3 font-medium">Nom</th>
                              <th className="px-4 py-3 font-medium">Catégorie</th>
                              <th className="px-4 py-3 font-medium text-right">Prix</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--color-border)]">
                            {previewData.slice(0, 50).map((row, idx) => (
                              <tr key={idx} className="hover:bg-[var(--color-surface-muted)]/30 transition-colors">
                                <td className="px-4 py-2 font-mono text-xs">{row.code}</td>
                                <td className="px-4 py-2 font-medium">{row.name}</td>
                                <td className="px-4 py-2 text-[var(--color-text-soft)]">{row.categoryName || '-'}</td>
                                <td className="px-4 py-2 text-right">{row.price}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {previewData.length > 50 && (
                        <div className="bg-[var(--color-surface-muted)] p-2 text-center text-xs text-[var(--color-text-soft)] border-t border-[var(--color-border)]">
                          Et {previewData.length - 50} autres lignes...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--color-border)] px-6 py-4 bg-[var(--color-surface-muted)]/30">
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                <Download size={16} />
                <span>Modèle Excel</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isImporting}
                  className="btn-secondary-md"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={!file || previewData.length === 0 || isImporting}
                  className="btn-primary-md min-w-[120px] justify-center"
                >
                  {isImporting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Importation...</span>
                    </>
                  ) : (
                    <span>Confirmer l'import</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
