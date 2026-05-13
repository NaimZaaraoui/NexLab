'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AnalysePatientForm, PatientSearchItem } from './analyse-form-types';

interface UsePatientSelectionOptions {
  initialPatientId?: string | null;
}

const EMPTY_PATIENT: AnalysePatientForm = {
  patientFirstName: '',
  patientLastName: '',
  patientBirthDate: '',
  patientGender: 'M',
  patientPhone: '',
  patientEmail: '',
  patientAddress: '',
};

export function usePatientSelection({ initialPatientId }: UsePatientSelectionOptions) {
  const [patient, setPatient] = useState<AnalysePatientForm>(EMPTY_PATIENT);
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [insuranceCoverage, setInsuranceCoverage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PatientSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const selectPatient = useCallback((selected: PatientSearchItem) => {
    setPatient({
      patientFirstName: selected.firstName,
      patientLastName: selected.lastName,
      patientGender: selected.gender,
      patientBirthDate: selected.birthDate ? new Date(selected.birthDate).toISOString().split('T')[0] : '',
      patientPhone: selected.phoneNumber || '',
      patientEmail: selected.email || '',
      patientAddress: selected.address || '',
    });
    setInsuranceProvider(selected.insuranceProvider || '');
    setInsuranceNumber(selected.insuranceNumber || '');
    setSelectedPatientId(selected.id);
    setSearchTerm('');
    setSearchResults([]);
  }, []);

  const clearSelection = useCallback(() => {
    setPatient(EMPTY_PATIENT);
    setInsuranceProvider('');
    setInsuranceNumber('');
    setInsuranceCoverage('');
    setSelectedPatientId(null);
  }, []);

  const searchPatients = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/patients?query=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const fetchPatientDetails = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/patients/${id}/history`);
      if (!res.ok) return;

      const data = await res.json();
      setPatient({
        patientFirstName: data.firstName,
        patientLastName: data.lastName,
        patientGender: data.gender,
        patientBirthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : '',
        patientPhone: data.phoneNumber || '',
        patientEmail: data.email || '',
        patientAddress: data.address || '',
      });
      setInsuranceProvider(data.insuranceProvider || '');
      setInsuranceNumber(data.insuranceNumber || '');
      setSelectedPatientId(data.id);
    } catch (error) {
      console.error('Error loading patient', error);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchPatients(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchPatients, searchTerm]);

  useEffect(() => {
    if (initialPatientId) {
      fetchPatientDetails(initialPatientId);
    }
  }, [fetchPatientDetails, initialPatientId]);

  return {
    patient,
    setPatient,
    insuranceProvider,
    setInsuranceProvider,
    insuranceNumber,
    setInsuranceNumber,
    insuranceCoverage,
    setInsuranceCoverage,
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    selectedPatientId,
    selectPatient,
    clearSelection,
  };
}
