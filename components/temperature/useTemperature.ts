import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useDirectPrint } from '@/lib/hooks/useDirectPrint';
import {
  EMPTY_INSTRUMENT_PAYLOAD,
  INSTRUMENT_TYPES,
  type CreateInstrumentPayload,
  type Instrument,
  type TemperaturePeriod,
} from '@/components/temperature/types';

export function useTemperature() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = session?.user?.role || 'TECHNICIEN';
  const canManage = role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [showRecord, setShowRecord] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [editingInstrument, setEditingInstrument] = useState<Instrument | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TemperaturePeriod>('matin');
  const [recordValue, setRecordValue] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingInstrument, setSavingInstrument] = useState(false);
  const [createPayload, setCreatePayload] = useState<CreateInstrumentPayload>(EMPTY_INSTRUMENT_PAYLOAD);
  const [editPayload, setEditPayload] = useState<CreateInstrumentPayload>(EMPTY_INSTRUMENT_PAYLOAD);
  const [customCreateType, setCustomCreateType] = useState('');
  const [customEditType, setCustomEditType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const { printUrl } = useDirectPrint();

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const loadInstruments = useCallback(async () => {
    setLoading(true);
    try {
      const query = canManage ? '?includeInactive=true' : '';
      const response = await fetch(`/api/temperature${query}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement des relevés.');
      }
      setInstruments(data as Instrument[]);
    } catch (error) {
      console.error('Temperature fetch error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [canManage, showNotification]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadInstruments();
    }
  }, [status, loadInstruments]);

  const summary = useMemo(() => {
    const missingCount = instruments.filter(
      (item) => item.todayStatus === 'missing' || item.todayStatus === 'empty'
    ).length;
    const alertCount = instruments.filter((item) => item.todayStatus === 'alert').length;
    return { missingCount, alertCount };
  }, [instruments]);

  const filteredInstruments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return instruments.filter((instrument) => {
      const matchesQuery =
        query.length === 0 ||
        instrument.name.toLowerCase().includes(query) ||
        instrument.type.toLowerCase().includes(query) ||
        (instrument.location || '').toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && instrument.isActive !== false) ||
        (statusFilter === 'inactive' && instrument.isActive === false);

      return matchesQuery && matchesStatus;
    });
  }, [instruments, searchQuery, statusFilter]);

  const openRecordModal = (instrument: Instrument, period: TemperaturePeriod) => {
    setSelectedInstrument(instrument);
    setSelectedPeriod(period);
    setRecordValue('');
    setCorrectiveAction('');
    setShowRecord(true);
  };

  const openEditModal = (instrument: Instrument) => {
    const knownType = INSTRUMENT_TYPES.find((item) => item === instrument.type);
    setEditingInstrument(instrument);
    setEditPayload({
      name: instrument.name,
      type: knownType || 'Autre',
      targetMin: String(instrument.targetMin),
      targetMax: String(instrument.targetMax),
      unit: instrument.unit,
      location: instrument.location || '',
    });
    setCustomEditType(knownType ? '' : instrument.type);
    setShowEdit(true);
  };

  const resolveTypeValue = (selected: string, custom: string) => {
    if (selected !== 'Autre') return selected.trim();
    return custom.trim();
  };

  const submitReading = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedInstrument) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/temperature/${selectedInstrument.id}/readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: Number(recordValue),
          period: selectedPeriod,
          correctiveAction: correctiveAction || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l’enregistrement');
      }
      showNotification('success', 'Relevé enregistré');
      setShowRecord(false);
      await loadInstruments();
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const submitInstrument = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    try {
      const response = await fetch('/api/temperature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createPayload.name.trim(),
          type: resolveTypeValue(createPayload.type, customCreateType),
          targetMin: Number(createPayload.targetMin),
          targetMax: Number(createPayload.targetMax),
          unit: createPayload.unit || '°C',
          location: createPayload.location || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création');
      }
      showNotification('success', 'Instrument créé');
      setShowCreate(false);
      setCreatePayload(EMPTY_INSTRUMENT_PAYLOAD);
      setCustomCreateType('');
      await loadInstruments();
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Erreur');
    } finally {
      setCreating(false);
    }
  };

  const submitInstrumentUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingInstrument) return;

    setSavingInstrument(true);
    try {
      const response = await fetch(`/api/temperature/${editingInstrument.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editPayload.name.trim(),
          type: resolveTypeValue(editPayload.type, customEditType),
          targetMin: Number(editPayload.targetMin),
          targetMax: Number(editPayload.targetMax),
          unit: editPayload.unit || '°C',
          location: editPayload.location || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur modification');
      }
      showNotification('success', 'Instrument mis à jour');
      setShowEdit(false);
      setEditingInstrument(null);
      setCustomEditType('');
      await loadInstruments();
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Erreur');
    } finally {
      setSavingInstrument(false);
    }
  };

  return {
    status,
    canManage,
    loading,
    instruments: filteredInstruments,
    summary,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    notification,
    showRecord,
    setShowRecord,
    showCreate,
    setShowCreate,
    showEdit,
    setShowEdit,
    selectedInstrument,
    editingInstrument,
    selectedPeriod,
    recordValue,
    setRecordValue,
    correctiveAction,
    setCorrectiveAction,
    submitting,
    creating,
    savingInstrument,
    createPayload,
    setCreatePayload,
    editPayload,
    setEditPayload,
    customCreateType,
    setCustomCreateType,
    customEditType,
    setCustomEditType,
    loadInstruments,
    openRecordModal,
    openEditModal,
    submitReading,
    submitInstrument,
    submitInstrumentUpdate,
    printUrl,
    router,
  };
}
