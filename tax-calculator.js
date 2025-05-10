// tax-calculator.js - Tax calculation functions

/**
 * Calculate German income tax based on the current tax law (2024)
 * @param {number} income - Taxable income in EUR
 * @param {string} taxStatus - 'single' or 'married'
 * @return {number} Calculated income tax in EUR
 */
export function calculateGermanIncomeTax(income, taxStatus = 'single') {
  let taxableIncome = income;
  
  // For married couples, income is halved for calculation (splitting)
  if (taxStatus === 'married') {
    taxableIncome = income / 2;
  }
  
  // Initialize tax
  let tax = 0;
  
  // 2024 values
  const grundfreibetrag = 12096; // Basic tax-free allowance in EUR (2024)
  
  // Tax zone boundaries
  const zone1EndIncome = 17443;  // First progression zone
  const zone2EndIncome = 68480;  // Second progression zone
  const zone3EndIncome = 277825; // Third zone (42%)
  // > 277.825 € (fourth zone - 45%)
  
  // Income tax calculation according to 2024 German tax law
  if (taxableIncome <= grundfreibetrag) {
    // a) Up to 12,096 Euro: Tax = 0
    tax = 0;
  } 
  else if (taxableIncome <= zone1EndIncome) {
    // b) From 12,097 Euro to 17,443 Euro
    const y = (taxableIncome - grundfreibetrag) / 10000;
    tax = (932.3 * y + 1400) * y;
  } 
  else if (taxableIncome <= zone2EndIncome) {
    // c) From 17,444 Euro to 68,480 Euro
    const z = (taxableIncome - 17443) / 10000;
    tax = (176.64 * z + 2397) * z + 1015.13;
  } 
  else if (taxableIncome <= zone3EndIncome) {
    // d) From 68,481 Euro to 277,825 Euro
    tax = 0.42 * taxableIncome - 10911.92;
  } 
  else {
    // e) Above 277,826 Euro
    tax = 0.45 * taxableIncome - 19246.67;
  }
  
  // For married couples, double the tax
  if (taxStatus === 'married') {
    tax = tax * 2;
  }
  
  // Round to full Euro (as done by tax authorities)
  return Math.round(tax);
}

/**
 * Calculate church tax based on income tax
 * @param {number} incomeTax - Income tax amount in EUR
 * @param {boolean} hasChurchTax - Whether church tax applies
 * @param {number} churchTaxRate - Church tax rate in percent
 * @return {number} Calculated church tax in EUR
 */
export function calculateChurchTax(incomeTax, hasChurchTax, churchTaxRate) {
  if (!hasChurchTax) return 0;
  return incomeTax * (churchTaxRate / 100);
}

/**
 * Calculate and return tax information based on form inputs
 * @return {Object} Tax information object
 */
export function calculateTaxInfo() {
  const annualIncome = parseFloat(document.getElementById('annual-income').value);
  const taxStatus = document.getElementById('tax-status').value;
  const hasChurchTax = document.getElementById('church-tax').value === 'yes';
  const churchTaxRate = parseFloat(document.getElementById('church-tax-rate').value);
  
  // Calculate income tax
  const incomeTax = calculateGermanIncomeTax(annualIncome, taxStatus);
  
  // Calculate church tax
  const churchTax = calculateChurchTax(incomeTax, hasChurchTax, churchTaxRate);
  
  // Calculate tax rate
  const taxRate = (incomeTax / annualIncome) * 100;
  
  // Update display
  document.getElementById('tax-rate').value = taxRate.toFixed(1);
  
  return {
    annualIncome,
    taxStatus,
    incomeTax,
    hasChurchTax,
    churchTaxRate,
    churchTax,
    taxRate
  };
}
