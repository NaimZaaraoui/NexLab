export type LoincEntry = {
  code: string;
  name: string;
  category: string;
};

export const COMMON_LOINC_CODES: LoincEntry[] = [
  // === HÉMATOLOGIE ===
  { code: '718-7',    name: 'Hémoglobine (Hb)',                          category: 'Hématologie' },
  { code: '20570-8',  name: 'Hématocrite (Hte)',                         category: 'Hématologie' },
  { code: '26464-8',  name: 'Leucocytes (GB)',                           category: 'Hématologie' },
  { code: '26515-7',  name: 'Plaquettes (PLT)',                          category: 'Hématologie' },
  { code: '26499-4',  name: 'Polynucléaires neutrophiles',               category: 'Hématologie' },
  { code: '26474-7',  name: 'Lymphocytes',                               category: 'Hématologie' },
  { code: '26484-6',  name: 'Monocytes',                                 category: 'Hématologie' },
  { code: '26449-9',  name: 'Éosinophiles',                              category: 'Hématologie' },
  { code: '26444-0',  name: 'Basophiles',                                category: 'Hématologie' },
  { code: '30428-7',  name: 'Volume Globulaire Moyen (VGM)',             category: 'Hématologie' },
  { code: '28539-5',  name: 'Teneur Globulaire Moyenne en Hb (TGMH)',   category: 'Hématologie' },
  { code: '28540-3',  name: 'Concentration Corpusculaire en Hb (CCMH)', category: 'Hématologie' },
  { code: '788-0',    name: 'Indice de Distribution des GR (IDR)',       category: 'Hématologie' },
  { code: '30341-2',  name: 'Vitesse de Sédimentation (VS)',             category: 'Hématologie' },
  { code: '4544-3',   name: 'Hématocrite (méthode spin)',                category: 'Hématologie' },

  // === BIOCHIMIE — Glucides ===
  { code: '14749-6',  name: 'Glycémie (Glucose à jeun)',                 category: 'Biochimie' },
  { code: '14743-9',  name: 'Glycémie (capillaire)',                     category: 'Biochimie' },
  { code: '4548-4',   name: 'Hémoglobine glyquée (HbA1c) %',            category: 'Biochimie' },
  { code: '17856-6',  name: 'Hémoglobine glyquée (HbA1c) mmol/mol',    category: 'Biochimie' },

  // === BIOCHIMIE — Fonction rénale ===
  { code: '3091-6',   name: 'Urée sanguine (BUN)',                       category: 'Biochimie' },
  { code: '2160-0',   name: 'Créatinine sérique',                        category: 'Biochimie' },
  { code: '2164-2',   name: 'Clairance créatinine (calculée)',           category: 'Biochimie' },
  { code: '62238-1',  name: 'DFG estimé (CKD-EPI)',                      category: 'Biochimie' },
  { code: '1920-8',   name: 'Acide urique (Uricémie)',                   category: 'Biochimie' },
  { code: '2161-8',   name: 'Créatininurie',                             category: 'Biochimie' },
  { code: '2888-6',   name: 'Protéinurie 24h',                           category: 'Biochimie' },
  { code: '14957-5',  name: 'Microalbuminurie (Albuminurie)',            category: 'Biochimie' },

  // === BIOCHIMIE — Bilan lipidique ===
  { code: '2093-3',   name: 'Cholestérol total',                         category: 'Biochimie' },
  { code: '2085-9',   name: 'Cholestérol HDL',                           category: 'Biochimie' },
  { code: '18262-6',  name: 'Cholestérol LDL (direct)',                  category: 'Biochimie' },
  { code: '2089-1',   name: 'Cholestérol LDL (calculé)',                 category: 'Biochimie' },
  { code: '2571-8',   name: 'Triglycérides',                             category: 'Biochimie' },

  // === BIOCHIMIE — Bilan hépatique ===
  { code: '1742-6',   name: 'ALAT / SGPT (Transaminases)',               category: 'Biochimie' },
  { code: '1920-8',   name: 'ASAT / SGOT (Transaminases)',               category: 'Biochimie' },
  { code: '2324-2',   name: 'Gamma-GT (GGT)',                            category: 'Biochimie' },
  { code: '6768-6',   name: 'Phosphatases Alcalines (PAL)',              category: 'Biochimie' },
  { code: '1975-2',   name: 'Bilirubine totale',                         category: 'Biochimie' },
  { code: '1968-7',   name: 'Bilirubine directe (conjuguée)',            category: 'Biochimie' },
  { code: '1970-3',   name: 'Bilirubine indirecte (libre)',              category: 'Biochimie' },
  { code: '2885-2',   name: 'Protéines totales',                         category: 'Biochimie' },
  { code: '1751-7',   name: 'Albumine sérique',                          category: 'Biochimie' },
  { code: '2460-4',   name: 'Electrophorèse des protéines',              category: 'Biochimie' },

  // === BIOCHIMIE — Ionogramme ===
  { code: '2951-2',   name: 'Sodium (Na⁺)',                              category: 'Biochimie' },
  { code: '2823-3',   name: 'Potassium (K⁺)',                            category: 'Biochimie' },
  { code: '2075-0',   name: 'Chlorure (Cl⁻)',                            category: 'Biochimie' },
  { code: '1963-8',   name: 'Bicarbonates (HCO₃⁻)',                     category: 'Biochimie' },
  { code: '17861-6',  name: 'Calcium total',                             category: 'Biochimie' },
  { code: '2777-1',   name: 'Phosphore (Phosphatémie)',                  category: 'Biochimie' },
  { code: '2601-3',   name: 'Magnésium',                                 category: 'Biochimie' },

  // === BIOCHIMIE — Bilan martial & Inflammation ===
  { code: '2498-4',   name: 'Fer sérique (Sidérémie)',                   category: 'Biochimie' },
  { code: '2276-4',   name: 'Ferritine',                                 category: 'Biochimie' },
  { code: '3034-6',   name: 'Transferrine',                              category: 'Biochimie' },
  { code: '1988-5',   name: 'CRP (Protéine C-Réactive)',                 category: 'Biochimie' },
  { code: '30341-2',  name: 'CRP ultrasensible (hs-CRP)',               category: 'Biochimie' },
  { code: '3255-7',   name: 'Fibrinogène',                               category: 'Biochimie' },

  // === HÉMOSTASE ===
  { code: '5902-2',   name: 'Taux de Prothrombine (TP)',                 category: 'Hémostase' },
  { code: '6301-6',   name: 'INR (International Normalized Ratio)',      category: 'Hémostase' },
  { code: '3173-2',   name: 'TCA (Temps Céphaline Activée)',             category: 'Hémostase' },
  { code: '3255-7',   name: 'Fibrinogène (Clauss)',                      category: 'Hémostase' },
  { code: '3243-3',   name: 'Temps de saignement (TS)',                  category: 'Hémostase' },
  { code: '6690-2',   name: 'D-Dimères',                                 category: 'Hémostase' },

  // === THYROÏDE ===
  { code: '3016-3',   name: 'TSH (Thyréostimuline)',                     category: 'Hormones' },
  { code: '3024-7',   name: 'T4 libre (FT4)',                            category: 'Hormones' },
  { code: '3051-0',   name: 'T3 libre (FT3)',                            category: 'Hormones' },
  { code: '3053-6',   name: 'T3 totale',                                 category: 'Hormones' },
  { code: '3026-2',   name: 'T4 totale (Thyroxine)',                     category: 'Hormones' },

  // === HORMONES ===
  { code: '2118-8',   name: 'β-HCG (Test de grossesse)',                 category: 'Hormones' },
  { code: '19080-1',  name: 'β-HCG quantitatif',                        category: 'Hormones' },
  { code: '10508-0',  name: 'PSA total (Prostate)',                      category: 'Hormones' },
  { code: '12841-3',  name: 'PSA libre',                                 category: 'Hormones' },
  { code: '2842-3',   name: 'Prolactine (PRL)',                          category: 'Hormones' },
  { code: '2243-4',   name: 'FSH (Hormone folliculo-stimulante)',        category: 'Hormones' },
  { code: '10501-5',  name: 'LH (Hormone lutéinisante)',                 category: 'Hormones' },
  { code: '2986-8',   name: 'Testostérone totale',                       category: 'Hormones' },
  { code: '14913-8',  name: 'Œstradiol (E2)',                            category: 'Hormones' },
  { code: '2143-6',   name: 'Cortisol',                                  category: 'Hormones' },
  { code: '14629-0',  name: 'Insuline',                                  category: 'Hormones' },

  // === SÉROLOGIE & IMMUNOLOGIE ===
  { code: '5196-1',   name: 'Antigène HBs (AgHBs)',                      category: 'Sérologie' },
  { code: '10900-9',  name: 'Anticorps anti-HBs',                        category: 'Sérologie' },
  { code: '16128-1',  name: 'Anticorps anti-HBc (IgG)',                  category: 'Sérologie' },
  { code: '13955-0',  name: 'Anticorps anti-VHC (HCV)',                  category: 'Sérologie' },
  { code: '75622-1',  name: 'VIH Ag/Ac combiné (HIV)',                   category: 'Sérologie' },
  { code: '25271-7',  name: 'Syphilis TPHA/TPPA',                        category: 'Sérologie' },
  { code: '20507-0',  name: 'VDRL / RPR (Syphilis)',                     category: 'Sérologie' },
  { code: '22587-0',  name: 'Widal Salmonella typhi O',                  category: 'Sérologie' },
  { code: '22586-2',  name: 'Widal Salmonella typhi H',                  category: 'Sérologie' },
  { code: '21010-6',  name: 'ASLO (Antistreptolysines O)',               category: 'Sérologie' },
  { code: '4537-7',   name: 'Facteur rhumatoïde (FR)',                   category: 'Sérologie' },
  { code: '33498-1',  name: 'Anticorps anti-nucléaires (ANA)',           category: 'Sérologie' },
  { code: '26824-4',  name: 'Anticorps anti-CCP',                        category: 'Sérologie' },
  { code: '22581-3',  name: 'Toxoplasmose IgG',                          category: 'Sérologie' },
  { code: '25542-1',  name: 'Toxoplasmose IgM',                          category: 'Sérologie' },
  { code: '31982-5',  name: 'Rubéole IgG',                               category: 'Sérologie' },
  { code: '40667-8',  name: 'Rubéole IgM',                               category: 'Sérologie' },
  { code: '7904-3',   name: 'CMV IgG',                                   category: 'Sérologie' },
  { code: '30325-5',  name: 'CMV IgM',                                   category: 'Sérologie' },
  { code: '22590-4',  name: 'Herpès HSV IgG',                            category: 'Sérologie' },
  { code: '15272-6',  name: 'Chlamydia trachomatis Ac',                  category: 'Sérologie' },
  { code: '14176-2',  name: 'Brucella Ac (Wright)',                       category: 'Sérologie' },

  // === BIOLOGIE URINAIRE ===
  { code: '630-4',    name: 'ECBU — Culture urinaire',                   category: 'Microbiologie' },
  { code: '5767-9',   name: 'Aspect des urines',                         category: 'Microbiologie' },
  { code: '20405-7',  name: 'Leucocyturie (BU)',                         category: 'Microbiologie' },
  { code: '20407-3',  name: 'Nitriturie (BU)',                           category: 'Microbiologie' },
  { code: '5792-7',   name: 'Glucosurie (BU)',                           category: 'Microbiologie' },
  { code: '20454-5',  name: 'Protéinurie (BU)',                          category: 'Microbiologie' },
  { code: '13648-1',  name: 'pH urinaire',                               category: 'Microbiologie' },

  // === PARASITOLOGIE ===
  { code: '634-6',    name: 'Examen Parasitologique des Selles (EPS)',   category: 'Microbiologie' },
  { code: '7959-7',   name: 'Frottis sanguin (Paludisme)',               category: 'Microbiologie' },
  { code: '32700-0',  name: 'Test rapide Paludisme (TDR)',               category: 'Microbiologie' },
];
