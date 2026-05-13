import { Analysis } from '@/lib/types';
import { HEMATOLOGY_THRESHOLDS as H_THRESH } from '@/lib/lab-rules';

export function getHematologyInterpretations(analysis: Analysis, results: Record<string, string>) {
  const flags: string[] = [];
  const getVal = (code: string) => {
    // Find result by test code
    const res = analysis.results.find(r => r.test?.code === code);
    if (!res) return null;
    const val = results[res.id];
    return val ? parseFloat(val.replace(',', '.')) : null;
  };

  const gb = getVal('GB');
  const hgb = getVal('HGB');
  const plt = getVal('PLT');
  const lymPercent = getVal('LYM%');
  const graPercent = getVal('GRA%');
  const vgm = getVal('VGM');
  const rdw = getVal('RDW') || getVal('IDW'); // Standard RDW or machine-specific IDW
  
  // Clinical Interpretations (Adult typical thresholds - simplified)
  if (gb !== null) {
    if (gb < H_THRESH.GB.LEUCOPENIA) flags.push("LEUCOPÉNIE");
    if (gb > H_THRESH.GB.HYPERLEUKOCYTOSIS) flags.push("HYPERLEUCOCYTOSE");
  }

  if (hgb !== null) {
    const isMale = analysis.patientGender === 'M';
    if (isMale && hgb < H_THRESH.HGB.ANEMIA_MALE) flags.push("ANÉMIE");
    if (!isMale && hgb < H_THRESH.HGB.ANEMIA_FEMALE) flags.push("ANÉMIE");
  }

  if (plt !== null) {
    if (plt < H_THRESH.PLT.THROMBOPENIA) flags.push("THROMBOPÉNIE");
    if (plt > H_THRESH.PLT.THROMBOCYTOSIS) flags.push("THROMBOCYTOSE");
  }

  if (lymPercent !== null && gb !== null) {
    const lymAbs = (lymPercent * gb) / 100;
    if (lymAbs > H_THRESH.LYM_ABS.LYMPHOCYTOSIS) flags.push("LYMPHOCYTOSE");
    if (lymAbs < H_THRESH.LYM_ABS.LYMPHOPENIA) flags.push("LYMPHOPÉNIE");
  }

  if (graPercent !== null && gb !== null) {
    const pnnAbs = (graPercent * gb) / 100;
    if (pnnAbs > H_THRESH.PNN_ABS.NEUTROPHILIA) flags.push("POLYNUCLÉOSE NEUTROPHILE");
    if (pnnAbs < H_THRESH.PNN_ABS.NEUTROPENIA) flags.push("NEUTROPÉNIE");
  }

  if (vgm !== null && hgb !== null) {
    if (vgm < H_THRESH.VGM.MICROCYTOSIS) flags.push("MICROCYTOSE");
    if (vgm > H_THRESH.VGM.MACROCYTOSIS) flags.push("MACROCYTOSE");
  }

  // Morphology from Histogram Data (RDW/IDW check)
  if (rdw !== null && rdw > H_THRESH.RDW.ANISOCYTOSIS) {
      flags.push("ANISOCYTOSE");
  }

  try {
    const data = JSON.parse(analysis.histogramData || '{}');
    if (data.rbc?.flags?.includes('Aniso')) {
      flags.push("ANISOCYTOSE");
    }
    if (data.plt?.flags?.includes('Aggr')) {
      flags.push("PRÉSENCE D'AGRÉGATS PLAQUETTAIRES");
    }
    if (data.wbc?.flags?.includes('Blasts')) {
       flags.push("PRÉSENCE POSSIBLE DE BLASTES (À VÉRIFIER)");
    }
  } catch (e) {}

  return Array.from(new Set(flags));
}
