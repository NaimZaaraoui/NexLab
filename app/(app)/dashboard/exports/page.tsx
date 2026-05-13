'use client';

import { useState, useEffect } from 'react';
import { 
  DownloadCloud, 
  Calendar, 
  Users, 
  Activity, 
  FileSpreadsheet, 
  Package,
  BarChart3,
  ListOrdered,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay } from 'date-fns';
import { 
  exportToExcel, 
  formatPatientsForExcel, 
  formatAnalysesForExcel, 
  formatResultsForExcel,
  formatTestsForExcel,
  formatDailySummaryForExcel,
  formatMonthlySummaryForExcel,
  formatCategorySummaryForExcel,
  formatPatientAnalysesForExcel
} from '@/lib/excel-utils';
import { ExportFiltersPanel } from '@/components/exports/ExportFiltersPanel';
import { ExportSidebar } from '@/components/exports/ExportSidebar';
import { ExportTypeSelector } from '@/components/exports/ExportTypeSelector';
import type { Category, ExportConfigItem, ExportType } from '@/components/exports/types';
import { PageBackLink } from '@/components/ui/PageBackLink';

const EXPORT_CONFIG: readonly ExportConfigItem[] = [
  {
    id: 'analyses',
    label: 'Liste des Analyses',
    description: 'Export complet des dossiers avec patients et statuts',
    icon: Activity
  },
  {
    id: 'results',
    label: 'Résultats Détaillés',
    description: 'Valeurs de chaque test avec références et unités',
    icon: FileSpreadsheet
  },
  {
    id: 'daily',
    label: 'Synthèse Journalière',
    description: 'Statistiques agrégées par jour',
    icon: ListOrdered
  },
  {
    id: 'monthly',
    label: 'Synthèse Mensuelle',
    description: 'Statistiques agrégées par mois',
    icon: Calendar
  },
  {
    id: 'by_category',
    label: 'Répartition par Catégorie',
    description: 'Nombre de résultats normaux/anormaux par catégorie',
    icon: BarChart3
  },
  {
    id: 'by_patient',
    label: 'Historique par Patient',
    description: 'Liste des patients avec nombre d\'analyses et dépenses',
    icon: Users
  },
  {
    id: 'patients',
    label: 'Fichier Patients',
    description: 'Coordonnées complètes des patients inscrits',
    icon: Users
  },
  {
    id: 'catalog',
    label: 'Catalogue des Tests',
    description: 'Liste des tests avec tarifs et valeurs de référence',
    icon: Package
  }
];

export default function ExportsPage() {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportType, setExportType] = useState<ExportType>('analyses');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [quickPreset, setQuickPreset] = useState<'today' | 'month' | 'year' | 'custom'>('month');
  const [statusFilter, setStatusFilter] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [currencyUnit, setCurrencyUnit] = useState('DA');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) return;
        const data = await response.json();
        setCurrencyUnit(data.amount_unit || 'DA');
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);

  const handleExport = async () => {
    if (needsDateRange) {
      if (!dateRange.start || !dateRange.end) {
        setErrorMessage('Veuillez renseigner une date de début et une date de fin.');
        setStatusMessage(null);
        return;
      }

      if (dateRange.start > dateRange.end) {
        setErrorMessage('La date de début doit être antérieure ou égale à la date de fin.');
        setStatusMessage(null);
        return;
      }
    }

    setErrorMessage(null);
    setStatusMessage('Préparation de l’export...');
    setLoading(true);
    try {
      let url = '';
      let fileName = '';
      let formatter: ((data: unknown[]) => Record<string, unknown>[]) | null = null;
      let sheetName = '';

      const statusParam = statusFilter ? `&status=${statusFilter}` : '';
      const categoryParam = selectedCategory ? `&category=${selectedCategory}` : '';

      switch (exportType) {
        case 'patients':
          url = `/api/patients?start=${dateRange.start}&end=${dateRange.end}&limit=10000`;
          fileName = 'Patients';
          formatter = formatPatientsForExcel;
          sheetName = 'Liste_Patients';
          break;
        case 'analyses':
          url = `/api/analyses?start=${dateRange.start}&end=${dateRange.end}${statusParam}`;
          fileName = 'Analyses';
          formatter = (data) => formatAnalysesForExcel(data, currencyUnit);
          sheetName = 'Liste_Analyses';
          break;
        case 'results':
          url = `/api/analyses?start=${dateRange.start}&end=${dateRange.end}&includeResults=true`;
          fileName = 'Resultats_Detailles';
          formatter = formatResultsForExcel;
          sheetName = 'Resultats';
          break;
        case 'catalog':
          url = `/api/tests?includeGrouped=false${categoryParam}`;
          fileName = selectedCategory 
            ? `Catalogue_${categories.find(c => c.id === selectedCategory)?.name || 'Filtre'}`
            : 'Catalogue_Tests';
          formatter = (data) => formatTestsForExcel(data, currencyUnit);
          sheetName = 'Catalogue';
          break;
        case 'daily':
          url = `/api/analyses?start=${dateRange.start}&end=${dateRange.end}`;
          fileName = 'Synthese_Journaliere';
          formatter = (data) => formatDailySummaryForExcel(data, currencyUnit);
          sheetName = 'Par_Jour';
          break;
        case 'monthly':
          url = `/api/analyses?start=${dateRange.start}&end=${dateRange.end}`;
          fileName = 'Synthese_Mensuelle';
          formatter = (data) => formatMonthlySummaryForExcel(data, currencyUnit);
          sheetName = 'Par_Mois';
          break;
        case 'by_category':
          url = `/api/analyses?start=${dateRange.start}&end=${dateRange.end}&includeResults=true`;
          fileName = 'Par_Categorie';
          formatter = formatCategorySummaryForExcel;
          sheetName = 'Categories';
          break;
        case 'by_patient':
          url = `/api/analyses?start=${dateRange.start}&end=${dateRange.end}`;
          fileName = 'Par_Patient';
          formatter = (data) => formatPatientAnalysesForExcel(data, currencyUnit);
          sheetName = 'Patients';
          break;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }
      const data = await response.json();

      if (!formatter) {
        throw new Error(`Aucun formateur défini pour le type d'export ${exportType}.`);
      }

      if (data && Array.isArray(data)) {
        setStatusMessage('Formatage des données...');
        const formattedData = formatter(data);
        if (!formattedData.length) {
          setErrorMessage('Aucune donnée trouvée pour les filtres sélectionnés.');
          setStatusMessage(null);
          return;
        }
        exportToExcel(formattedData, fileName, sheetName);
        setStatusMessage(
          `Export terminé: ${formattedData.length} ligne${formattedData.length > 1 ? 's' : ''} générée${formattedData.length > 1 ? 's' : ''}.`
        );
      } else {
        setErrorMessage('Format de réponse invalide. Merci de réessayer.');
        setStatusMessage(null);
      }
    } catch (error) {
      console.error('Export error:', error);
      setErrorMessage('Échec de l’export. Vérifiez les filtres puis réessayez.');
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const setQuickRange = (type: 'today' | 'month' | 'year') => {
    const now = new Date();
    let start: Date, end: Date;

    switch (type) {
      case 'today':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
    }

    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    });
    setQuickPreset(type);
  };

  const getColumnsPreview = () => {
    switch (exportType) {
      case 'analyses': return ['N° Commande', 'Patient', 'Statut', 'Prix', 'Date', 'Validé par'];
      case 'patients': return ['Nom', 'Prénom', 'Sexe', 'Âge', 'Téléphone', 'Date Inscription'];
      case 'results': return ['Date', 'N° Dossier', 'Patient', 'Test', 'Résultat', 'Unité', 'Référence'];
      case 'catalog': return ['Code', 'Nom', 'Catégorie', 'Type', 'Unité', 'Référence', 'Prix'];
      case 'daily': return ['Date', 'Nb Analyses', `Total (${currencyUnit})`, 'Validées', 'En Cours', 'Taux'];
      case 'monthly': return ['Mois', 'Nb Analyses', `Total (${currencyUnit})`, 'Validées', 'En Cours', 'Taux'];
      case 'by_category': return ['Catégorie', 'Nb Résultats', 'Normaux', 'Anormaux', 'Taux'];
      case 'by_patient': return ['Patient', 'Sexe', 'Âge', 'Nb Analyses', `Total (${currencyUnit})`, 'Dernière Visite'];
      default: return [];
    }
  };

  const selectedConfig = EXPORT_CONFIG.find(e => e.id === exportType);
  const needsDateRange = !['catalog'].includes(exportType);
  const needsStatusFilter = exportType === 'analyses';
  const needsCategoryFilter = exportType === 'catalog';
  const columnsPreview = getColumnsPreview();

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <section className="rounded-3xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <PageBackLink href="/" />
          
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-white">
               <DownloadCloud size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[var(--color-text)]">Exports de données</h1>
              <p className="mt-1 text-sm text-[var(--color-text-soft)]">Générer des rapports Excel personnalisés pour votre gestion.</p>
            </div>
          </div>
        </div>

        
      </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <ExportTypeSelector exportType={exportType} config={EXPORT_CONFIG} onChange={setExportType} />
          <ExportFiltersPanel
            exportType={exportType}
            selectedConfig={selectedConfig}
            loading={loading}
            needsDateRange={needsDateRange}
            needsCategoryFilter={needsCategoryFilter}
            needsStatusFilter={needsStatusFilter}
            dateRange={dateRange}
            quickPreset={quickPreset}
            statusFilter={statusFilter}
            selectedCategory={selectedCategory}
            categories={categories}
            loadingCategories={loadingCategories}
            statusMessage={statusMessage}
            errorMessage={errorMessage}
            onQuickRangeChange={setQuickRange}
            onDateRangeChange={(field, value) => {
              setDateRange((prev) => ({ ...prev, [field]: value }));
              setQuickPreset('custom');
            }}
            onStatusFilterChange={setStatusFilter}
            onCategoryChange={setSelectedCategory}
            onExport={handleExport}
          />
        </div>

        <ExportSidebar
          selectedLabel={selectedConfig?.label}
          loading={loading}
          needsDateRange={needsDateRange}
          dateRange={dateRange}
          columnsPreview={columnsPreview}
        />
      </div>
    </div>
  );
}
