// summary-calculator.js - Summary calculations and results display

import { formatCurrency } from './ui-utils.js';
import { calculateCashflow } from './cashflow-calculator.js';

/**
 * Calculate and display summary information
 * @return {Object} Summary data
 */
export function calculateSummary() {
  if (!window.calculationState.calculationResults) {
    calculateCashflow();
    if (!window.calculationState.calculationResults) {
      console.error('Could not calculate results');
      return null;
    }
  }
  
  const results = window.calculationState.calculationResults;
  const calculationPeriod = parseFloat(document.getElementById('calculation-period').value);
  
  // Calculate total ROI
  const equityGrowth = results.finalEquity - results.initialEquity;
  const annualizedROI = Math.pow(results.finalEquity / results.initialEquity, 1 / calculationPeriod) - 1;
  
  // Update UI
  document.getElementById('summary-total-cost').textContent = formatCurrency(results.totalCost);
  document.getElementById('summary-equity').textContent = formatCurrency(results.initialEquity);
  document.getElementById('summary-loan').textContent = formatCurrency(results.loanAmount);
  document.getElementById('summary-monthly-payment').textContent = formatCurrency(results.monthlyPayment);
  document.getElementById('summary-monthly-cashflow').textContent = formatCurrency(results.monthlyCashflow);
  document.getElementById('summary-final-value').textContent = formatCurrency(results.finalPropertyValue);
  document.getElementById('summary-remaining-debt').textContent = formatCurrency(results.remainingLoan);
  document.getElementById('summary-equity-growth').textContent = formatCurrency(equityGrowth);
  document.getElementById('summary-total-roi').textContent = (annualizedROI * 100).toFixed(2) + ' %';
  
  // Return summary data
  return {
    ...results,
    equityGrowth,
    annualizedROI
  };
}
