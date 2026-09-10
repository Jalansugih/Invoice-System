export type CostBasis = 'tender' | 'hpp' | 'direct_cost';
export type CostInputType = 'rp' | 'percent';

export interface CostComponentInput {
  id?: string;
  name: string;
  inputType: CostInputType;
  inputValue: number;
  basis?: CostBasis | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CostComponentResult extends CostComponentInput {
  basis: CostBasis | null;
  amount: number;
}

export interface CostingCalculationInput {
  nilaiTender: number;
  hppBarang: number;
  komponenBiaya: CostComponentInput[];
  targetMargin: number;
}

export interface CostingCalculationResult {
  nilaiTender: number;
  hppBarang: number;
  biayaLangsung: number;
  totalBiaya: number;
  estimasiLaba: number;
  marginPersen: number | null;
  markupPersen: number | null;
  hargaBep: number | null;
  hargaTarget: number | null;
  hppMaksimal: number | null;
  status: 'safe' | 'warning' | 'danger';
  targetMargin: number;
  komponen: CostComponentResult[];
}

const EPSILON = 1e-9;

const cleanNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
};

const roundRp = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Costing engine is intentionally pure: no React, localStorage, or database access.
 * Percentage costs are calculated against one of three explicit bases. For
 * direct_cost, the basis means fixed direct costs excluding HPP and excluding
 * percentage components, which prevents circular calculations.
 */
export function calculateCosting(input: CostingCalculationInput): CostingCalculationResult {
  const nilaiTender = cleanNumber(input.nilaiTender);
  const hppBarang = cleanNumber(input.hppBarang);
  const targetMargin = Math.min(99.99, cleanNumber(input.targetMargin));
  const components = (input.komponenBiaya || []).filter((c) => c && c.isActive !== false);

  const effectiveComponents = components.filter((c) => c.id !== 'hpp');
  const fixedComponents = effectiveComponents.filter((c) => c.inputType === 'rp');
  const percentComponents = effectiveComponents.filter((c) => c.inputType === 'percent');

  const directFixed = fixedComponents.reduce((sum, c) => sum + cleanNumber(c.inputValue), 0);
  const biayaLangsung = directFixed;
  const percentTender = percentComponents
    .filter((c) => c.basis === 'tender')
    .reduce((sum, c) => sum + cleanNumber(c.inputValue) / 100, 0);
  const percentHpp = percentComponents
    .filter((c) => c.basis === 'hpp')
    .reduce((sum, c) => sum + cleanNumber(c.inputValue) / 100, 0);
  const percentDirect = percentComponents
    .filter((c) => c.basis === 'direct_cost')
    .reduce((sum, c) => sum + cleanNumber(c.inputValue) / 100, 0);

  const componentResults: CostComponentResult[] = components.map((c) => {
    const value = cleanNumber(c.inputValue);
    const basis = c.inputType === 'percent' ? (c.basis || 'tender') : null;
    let amount = value;
    if (c.inputType === 'percent') {
      const basisValue = basis === 'tender' ? nilaiTender : basis === 'hpp' ? hppBarang : directFixed;
      amount = basisValue * (value / 100);
    }
    return { ...c, inputValue: value, basis, amount: roundRp(amount) };
  });

  // Cost = HPP + fixed direct + (% on HPP) + (% on direct) + (% on tender).
  const fixedCostBase = hppBarang * (1 + percentHpp) + directFixed * (1 + percentDirect);
  const tenderCostRate = percentTender;
  const totalBiaya = roundRp(fixedCostBase + nilaiTender * tenderCostRate);
  const estimasiLaba = roundRp(nilaiTender - totalBiaya);
  const marginPersen = nilaiTender > EPSILON ? roundRp((estimasiLaba / nilaiTender) * 100) : null;
  const markupPersen = hppBarang > EPSILON ? roundRp(((nilaiTender - hppBarang) / hppBarang) * 100) : null;

  const denominatorBep = 1 - tenderCostRate;
  const hargaBep = denominatorBep > EPSILON ? roundRp(fixedCostBase / denominatorBep) : null;

  const targetDenominator = 1 - tenderCostRate - targetMargin / 100;
  const hargaTarget = targetDenominator > EPSILON ? roundRp(fixedCostBase / targetDenominator) : null;

  // Solve HPP from: target margin = 1 - tenderRate -
  // [HPP*(1+hppRate) + directFixed*(1+directRate)] / tender.
  const targetCostAtCurrentTender = nilaiTender * (1 - tenderCostRate - targetMargin / 100);
  const hppDenominator = 1 + percentHpp;
  const hppMaksimal = hppDenominator > EPSILON
    ? roundRp((targetCostAtCurrentTender - directFixed * (1 + percentDirect)) / hppDenominator)
    : null;

  let status: CostingCalculationResult['status'] = 'warning';
  if (marginPersen !== null && marginPersen >= targetMargin) status = 'safe';
  else if (marginPersen !== null && marginPersen < 0) status = 'danger';

  return {
    nilaiTender: roundRp(nilaiTender),
    hppBarang: roundRp(hppBarang),
    biayaLangsung: roundRp(biayaLangsung),
    totalBiaya,
    estimasiLaba,
    marginPersen,
    markupPersen,
    hargaBep,
    hargaTarget,
    hppMaksimal,
    status,
    targetMargin: roundRp(targetMargin),
    komponen: componentResults,
  };
}
