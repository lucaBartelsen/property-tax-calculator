// cashflow-calculator.js - Cashflow and investment calculations

import { formatCurrency } from './ui-utils.js';
import { calculateGermanIncomeTax, calculateChurchTax, calculateTaxInfo } from './tax-calculator.js';
import { calculatePurchase } from './property-calculator.js';
import { calculateOngoing } from './property-calculator.js';
import { createCashflowChart } from './chart-utils.js';

/**
 * Calculate cashflow and investment metrics
 * @return {Object} Calculation results
 */
export function calculateCashflow() {
  // Get input data
  const purchaseData = window.calculationState.purchaseData || calculatePurchase();
  const ongoingData = window.calculationState.ongoingData || calculateOngoing();
  const taxInfo = window.calculationState.taxInfo || calculateTaxInfo();
  
  // Get financing details
  const financingType = document.getElementById('financing-type').value;
  const downPayment = parseFloat(document.getElementById('down-payment').value);
  const interestRate = parseFloat(document.getElementById('interest-rate').value) / 100;
  const repaymentRate = parseFloat(document.getElementById('repayment-rate').value) / 100;
  
  // Get depreciation details
  const depreciationRate = parseFloat(document.getElementById('depreciation-rate').value) / 100;
  const buildingValue = parseFloat(document.getElementById('building-value').value);
  const furnitureValue = parseFloat(document.getElementById('furniture-value').value);
  const furnitureDepreciationRate = parseFloat(document.getElementById('furniture-depreciation-rate').value) / 100;
  
  // Get projection details
  const appreciationRate = parseFloat(document.getElementById('expected-appreciation').value) / 100;
  const rentIncreaseRate = parseFloat(document.getElementById('expected-rent-increase').value) / 100;
  const calculationPeriod = parseInt(document.getElementById('calculation-period').value);
  
  // Extract tax info
  const annualIncome = taxInfo.annualIncome;
  const taxStatus = taxInfo.taxStatus;
  const hasChurchTax = taxInfo.hasChurchTax;
  const churchTaxRate = taxInfo.churchTaxRate;
  
  // Calculate financing
  let loanAmount = 0;
  let annuity = 0;
  
  if (financingType === 'loan') {
    loanAmount = purchaseData.totalCost - downPayment;
    annuity = loanAmount * (interestRate + repaymentRate);
  }
  
  // Calculate depreciation
  const annualBuildingDepreciation = buildingValue * depreciationRate;
  const annualFurnitureDepreciation = furnitureValue * furnitureDepreciationRate;
  
  // Initial year calculations
  let yearlyInterest = loanAmount * interestRate;
  let yearlyPrincipal = Math.min(annuity - yearlyInterest, loanAmount);
  let yearlyFinancingCosts = yearlyInterest + yearlyPrincipal;
  let remainingLoan = loanAmount - yearlyPrincipal;
  
  // Handle UI elements for church tax
  updateChurchTaxUIVisibility(hasChurchTax);
  
  // Calculate first year cashflow
  const cashflowBeforeTax = ongoingData.effectiveRent - ongoingData.totalOngoing - yearlyFinancingCosts;
  
  // Consider broker costs as consulting if checked
  const brokerAsConsulting = document.getElementById('broker-as-consulting').checked;
  const brokerConsultingCosts = brokerAsConsulting ? purchaseData.brokerFee : 0;
  
  // Update depreciation UI
  updateDepreciationUI(annualBuildingDepreciation, annualFurnitureDepreciation, purchaseData.annualMaintenance, brokerAsConsulting, brokerConsultingCosts);
  
  // Calculate total depreciation
  const totalDepreciation = annualBuildingDepreciation + annualFurnitureDepreciation + purchaseData.annualMaintenance + brokerConsultingCosts;
  
  // Calculate taxable income
  const taxableIncome = cashflowBeforeTax + yearlyPrincipal - annualBuildingDepreciation - annualFurnitureDepreciation - purchaseData.annualMaintenance - brokerConsultingCosts;
  
  // Calculate taxes
  const previousIncomeTax = calculateGermanIncomeTax(annualIncome, taxStatus);
  const totalTaxableIncome = Math.max(0, annualIncome + taxableIncome);
  const newIncomeTax = calculateGermanIncomeTax(totalTaxableIncome, taxStatus);
  
  // Calculate church tax
  const previousChurchTax = calculateChurchTax(previousIncomeTax, hasChurchTax, churchTaxRate);
  const newChurchTax = calculateChurchTax(newIncomeTax, hasChurchTax, churchTaxRate);
  
  // Calculate tax savings
  const incomeTaxSavings = previousIncomeTax - newIncomeTax;
  const churchTaxSavings = previousChurchTax - newChurchTax;
  const taxSavings = incomeTaxSavings + churchTaxSavings;
  
  // Calculate cashflow after tax
  const cashflowAfterTax = cashflowBeforeTax + taxSavings;
  const monthlyCashflow = cashflowAfterTax / 12;
  
  // Update UI with results
  updateCashflowUI(
    ongoingData.effectiveRent,
    ongoingData.totalOngoing,
    yearlyFinancingCosts,
    totalDepreciation,
    taxableIncome,
    annualIncome,
    totalTaxableIncome,
    previousIncomeTax,
    previousChurchTax,
    newIncomeTax,
    newChurchTax,
    taxSavings,
    cashflowAfterTax,
    monthlyCashflow,
    financingType === 'loan' ? downPayment : purchaseData.totalCost
  );
  
  // Initialize yearly data for charts and tables
  const yearlyData = initializeYearlyData(
    cashflowAfterTax,
    purchaseData.purchasePrice,
    financingType,
    remainingLoan,
    downPayment,
    ongoingData,
    yearlyInterest,
    yearlyPrincipal,
    yearlyFinancingCosts,
    annualBuildingDepreciation,
    annualFurnitureDepreciation,
    purchaseData.annualMaintenance,
    brokerConsultingCosts,
    totalDepreciation,
    cashflowBeforeTax,
    taxableIncome,
    annualIncome,
    previousIncomeTax,
    previousChurchTax,
    totalTaxableIncome,
    newIncomeTax,
    newChurchTax,
    taxSavings
  );
  
  // Calculate future years
  const futureYearlyData = calculateFutureYears(
    purchaseData,
    ongoingData,
    annualIncome,
    taxStatus,
    hasChurchTax,
    churchTaxRate,
    previousIncomeTax,
    calculationPeriod,
    rentIncreaseRate,
    appreciationRate,
    financingType,
    interestRate,
    repaymentRate,
    annuity,
    annualBuildingDepreciation,
    annualFurnitureDepreciation,
    remainingLoan,
    downPayment
  );
  
  // Combine first year and future years data
  const allYearlyData = [yearlyData, ...futureYearlyData];
  
  // Prepare data for charts
  const chartData = prepareChartData(allYearlyData, calculationPeriod);
  
  // Create chart
  createCashflowChart(
    chartData.years,
    chartData.cashflows,
    chartData.propertyValues,
    chartData.equityValues,
    chartData.loanValues
  );
  
  // Store results for summary
  const calculationResults = {
    totalCost: purchaseData.totalCost,
    downPayment,
    loanAmount,
    annuity,
    monthlyPayment: annuity / 12,
    monthlyCashflow,
    finalPropertyValue: chartData.propertyValues[calculationPeriod - 1],
    remainingLoan: chartData.loanValues[calculationPeriod - 1],
    finalEquity: chartData.equityValues[calculationPeriod - 1],
    initialEquity: financingType === 'loan' ? downPayment : purchaseData.totalCost
  };
  
  // Store data in global state
  window.calculationState.calculationResults = calculationResults;
  window.calculationState.yearlyData = allYearlyData;
  
  return calculationResults;
}

/**
 * Update UI elements for church tax visibility
 * @param {boolean} hasChurchTax - Whether church tax is applicable
 */
function updateChurchTaxUIVisibility(hasChurchTax) {
  const churchTaxRows = document.querySelectorAll('.detail-row[data-category="tax"][data-church-tax="true"]');
  churchTaxRows.forEach(row => {
    row.style.display = hasChurchTax ? '' : 'none';
  });
}

/**
 * Update depreciation UI elements
 * @param {number} buildingDepreciation - Annual building depreciation
 * @param {number} furnitureDepreciation - Annual furniture depreciation
 * @param {number} maintenanceDeduction - Annual maintenance deduction
 * @param {boolean} brokerAsConsulting - Whether broker fee is counted as consulting
 * @param {number} brokerCosts - Broker costs if counted as consulting
 */
function updateDepreciationUI(buildingDepreciation, furnitureDepreciation, maintenanceDeduction, brokerAsConsulting, brokerCosts) {
  document.getElementById('result-cf-building-depreciation').textContent = formatCurrency(buildingDepreciation);
  document.getElementById('result-cf-furniture-depreciation').textContent = formatCurrency(furnitureDepreciation);
  document.getElementById('result-cf-maintenance-deduction').textContent = formatCurrency(maintenanceDeduction);
  
  const brokerConsultingItem = document.getElementById('broker-consulting-item');
  if (brokerConsultingItem) {
    brokerConsultingItem.style.display = brokerAsConsulting ? 'flex' : 'none';
    document.getElementById('result-cf-broker-consulting').textContent = formatCurrency(brokerCosts);
  }
}

/**
 * Update cashflow UI with calculation results
 * @param {Object} params - Various calculation results to display
 */
function updateCashflowUI(
  effectiveRent,
  totalOngoing,
  yearlyFinancingCosts,
  totalDepreciation,
  taxableIncome,
  annualIncome,
  totalTaxableIncome,
  previousIncomeTax,
  previousChurchTax,
  newIncomeTax,
  newChurchTax,
  taxSavings,
  cashflowAfterTax,
  monthlyCashflow,
  initialInvestment
) {
  // Main cashflow elements
  document.getElementById('result-cf-annual-rent').textContent = formatCurrency(effectiveRent);
  document.getElementById('result-cf-ongoing-costs').textContent = formatCurrency(totalOngoing);
  document.getElementById('result-cf-financing').textContent = formatCurrency(yearlyFinancingCosts);
  document.getElementById('result-cf-total-depreciation').textContent = formatCurrency(totalDepreciation);
  
  // Tax information
  document.getElementById('result-cf-taxable-income').textContent = formatCurrency(taxableIncome);
  document.getElementById('result-cf-previous-income').textContent = formatCurrency(annualIncome);
  document.getElementById('result-cf-total-income').textContent = formatCurrency(totalTaxableIncome);
  document.getElementById('result-cf-previous-tax').textContent = formatCurrency(previousIncomeTax);
  document.getElementById('result-cf-income-tax').textContent = formatCurrency(newIncomeTax);
  
  // Church tax elements if present
  if (document.getElementById('result-cf-previous-church-tax')) {
    document.getElementById('result-cf-previous-church-tax').textContent = formatCurrency(previousChurchTax);
    document.getElementById('result-cf-new-church-tax').textContent = formatCurrency(newChurchTax);
    document.getElementById('result-cf-church-tax-savings').textContent = formatCurrency(previousChurchTax - newChurchTax);
  }
  
  document.getElementById('result-cf-tax-savings').textContent = formatCurrency(taxSavings);
  
  // Cashflow results
  document.getElementById('result-cf-after-tax').textContent = formatCurrency(cashflowAfterTax);
  document.getElementById('result-cf-monthly').textContent = formatCurrency(monthlyCashflow);
  document.getElementById('result-cf-roi').textContent = (cashflowAfterTax / initialInvestment * 100).toFixed(2) + ' %';
}

/**
 * Initialize the data for the first year
 * @param {Object} params - Various calculation parameters
 * @return {Object} First year data
 */
function initializeYearlyData(
  cashflowAfterTax,
  purchasePrice,
  financingType,
  remainingLoan,
  downPayment,
  ongoingData,
  yearlyInterest,
  yearlyPrincipal,
  yearlyFinancingCosts,
  annualBuildingDepreciation,
  annualFurnitureDepreciation,
  annualMaintenance,
  brokerConsultingCosts,
  totalDepreciation,
  cashflowBeforeTax,
  taxableIncome,
  previousIncome,
  previousTax,
  previousChurchTax,
  totalTaxableIncome,
  newTax,
  newChurchTax,
  taxSavings
) {
  return {
    year: 1,
    rent: ongoingData.effectiveRent,
    ongoingCosts: ongoingData.totalOngoing,
    interest: yearlyInterest,
    principal: yearlyPrincipal,
    payment: yearlyFinancingCosts,
    loanBalance: remainingLoan,
    buildingDepreciation: annualBuildingDepreciation,
    furnitureDepreciation: annualFurnitureDepreciation,
    maintenanceDeduction: annualMaintenance,
    totalDepreciation: totalDepreciation,
    taxableIncome: taxableIncome,
    firstYearDeductibleCosts: brokerConsultingCosts,
    previousIncome: previousIncome,
    previousTax: previousTax,
    previousChurchTax: previousChurchTax,
    newTotalIncome: totalTaxableIncome,
    newTax: newTax,
    newChurchTax: newChurchTax,
    taxSavings: taxSavings,
    cashflow: cashflowAfterTax,
    cashflowBeforeTax: cashflowBeforeTax,
    propertyValue: purchasePrice,
    equity: financingType === 'loan' ? purchasePrice - remainingLoan : purchasePrice,
    initialEquity: financingType === 'loan' ? downPayment : purchasePrice,
    // Additional detailed data
    vacancyRate: ongoingData.vacancyRate,
    propertyTax: ongoingData.propertyTax,
    managementFee: ongoingData.managementFee,
    maintenanceReserve: ongoingData.maintenanceCost,
    insurance: ongoingData.insurance,
    cashflowBeforeFinancing: ongoingData.effectiveRent - ongoingData.totalOngoing
  };
}

/**
 * Calculate data for future years
 * @param {Object} params - Various calculation parameters
 * @return {Array} Array of yearly data objects
 */
function calculateFutureYears(
  purchaseData,
  ongoingData,
  annualIncome,
  taxStatus,
  hasChurchTax,
  churchTaxRate,
  previousIncomeTax,
  calculationPeriod,
  rentIncreaseRate,
  appreciationRate,
  financingType,
  interestRate,
  repaymentRate,
  annuity,
  annualBuildingDepreciation,
  annualFurnitureDepreciation,
  remainingLoan,
  downPayment
) {
  const futureYears = [];
  
  let currentRent = ongoingData.effectiveRent;
  let currentOngoingCosts = ongoingData.totalOngoing;
  let currentPropertyTax = ongoingData.propertyTax;
  let currentManagementFee = ongoingData.managementFee;
  let currentMaintenanceReserve = ongoingData.maintenanceCost;
  let currentInsurance = ongoingData.insurance;
  let currentRemainingLoan = remainingLoan;
  
  for (let year = 2; year <= calculationPeriod; year++) {
    // Apply inflation to rent and costs
    currentRent *= (1 + rentIncreaseRate);
    currentPropertyTax *= (1 + rentIncreaseRate);
    currentManagementFee *= (1 + rentIncreaseRate);
    currentMaintenanceReserve *= (1 + rentIncreaseRate);
    currentInsurance *= (1 + rentIncreaseRate);
    
    // Total ongoing costs
    currentOngoingCosts = currentPropertyTax + currentManagementFee + currentMaintenanceReserve + currentInsurance;
    
    // Cashflow before financing
    const currentCashflowBeforeFinancing = currentRent - currentOngoingCosts;
    
    // Financing costs
    let yearlyInterest = 0;
    let yearlyPrincipal = 0;
    let yearlyFinancingCosts = 0;
    
    if (financingType === 'loan' && currentRemainingLoan > 0) {
      yearlyInterest = currentRemainingLoan * interestRate;
      yearlyPrincipal = Math.min(annuity - yearlyInterest, currentRemainingLoan);
      yearlyFinancingCosts = yearlyInterest + yearlyPrincipal;
      currentRemainingLoan -= yearlyPrincipal;
      if (currentRemainingLoan < 0) currentRemainingLoan = 0;
    }
    
    // Cashflow before tax
    const currentCashflowBeforeTax = currentCashflowBeforeFinancing - yearlyFinancingCosts;
    
    // Maintenance deduction only for the specified distribution period
    const yearlyMaintenance = year <= purchaseData.maintenanceDistribution ? purchaseData.annualMaintenance : 0;
    const yearlyTotalDepreciation = annualBuildingDepreciation + annualFurnitureDepreciation + yearlyMaintenance;
    
    // Tax calculations
    const yearlyTaxableIncome = currentCashflowBeforeTax + yearlyPrincipal - annualBuildingDepreciation - annualFurnitureDepreciation - yearlyMaintenance;
    const yearlyTotalTaxableIncome = Math.max(0, annualIncome + yearlyTaxableIncome);
    const yearlyNewIncomeTax = calculateGermanIncomeTax(yearlyTotalTaxableIncome, taxStatus);
    
    // Church tax
    const yearlyPreviousChurchTax = hasChurchTax ? calculateChurchTax(previousIncomeTax, hasChurchTax, churchTaxRate) : 0;
    const yearlyNewChurchTax = hasChurchTax ? calculateChurchTax(yearlyNewIncomeTax, hasChurchTax, churchTaxRate) : 0;
    
    // Tax savings
    const yearlyIncomeTaxSavings = previousIncomeTax - yearlyNewIncomeTax;
    const yearlyChurchTaxSavings = yearlyPreviousChurchTax - yearlyNewChurchTax;
    const yearlyTaxSavings = yearlyIncomeTaxSavings + yearlyChurchTaxSavings;
    
    // Cashflow after tax
    const yearlyCashflowAfterTax = currentCashflowBeforeTax + yearlyTaxSavings;
    
    // Property value with appreciation
    const yearlyPropertyValue = purchaseData.purchasePrice * Math.pow(1 + appreciationRate, year - 1);
    
    // Equity
    const yearlyEquity = yearlyPropertyValue - currentRemainingLoan;
    
    // Store yearly data
    futureYears.push({
      year: year,
      rent: currentRent,
      ongoingCosts: currentOngoingCosts,
      interest: yearlyInterest,
      principal: yearlyPrincipal,
      payment: yearlyFinancingCosts,
      loanBalance: currentRemainingLoan,
      buildingDepreciation: annualBuildingDepreciation,
      furnitureDepreciation: annualFurnitureDepreciation,
      maintenanceDeduction: yearlyMaintenance,
      totalDepreciation: yearlyTotalDepreciation,
      firstYearDeductibleCosts: 0, // Always 0 after year 1
      taxableIncome: yearlyTaxableIncome,
      previousIncome: annualIncome,
      previousTax: previousIncomeTax,
      newTotalIncome: yearlyTotalTaxableIncome,
      newTax: yearlyNewIncomeTax,
      previousChurchTax: yearlyPreviousChurchTax,
      newChurchTax: yearlyNewChurchTax,
      taxSavings: yearlyTaxSavings,
      cashflow: yearlyCashflowAfterTax,
      cashflowBeforeTax: currentCashflowBeforeTax,
      propertyValue: yearlyPropertyValue,
      equity: yearlyEquity,
      initialEquity: financingType === 'loan' ? downPayment : purchaseData.purchasePrice,
      // Additional detailed data
      vacancyRate: ongoingData.vacancyRate,
      propertyTax: currentPropertyTax,
      managementFee: currentManagementFee,
      maintenanceReserve: currentMaintenanceReserve,
      insurance: currentInsurance,
      cashflowBeforeFinancing: currentCashflowBeforeFinancing
    });
  }
  
  return futureYears;
}

/**
 * Prepare data for chart display
 * @param {Array} yearlyData - Array of yearly data objects
 * @param {number} calculationPeriod - Number of years to calculate
 * @return {Object} Chart data arrays
 */
function prepareChartData(yearlyData, calculationPeriod) {
  const years = Array.from({length: calculationPeriod}, (_, i) => i + 1);
  const cashflows = yearlyData.map(data => data.cashflow);
  const propertyValues = yearlyData.map(data => data.propertyValue);
  const equityValues = yearlyData.map(data => data.equity);
  const loanValues = yearlyData.map(data => data.loanBalance);
  
  return {
    years,
    cashflows,
    propertyValues,
    equityValues,
    loanValues
  };
}
