// table-generator.js - Yearly table generation and export

import { formatCurrency } from './ui-utils.js';
import { calculateCashflow } from './cashflow-calculator.js';

/**
 * Generate the yearly overview table
 * @return {boolean} Success indicator
 */
export function calculateYearTable() {
  // Check if yearly data exists
  if (!window.calculationState.yearlyData) {
    calculateCashflow();
    if (!window.calculationState.yearlyData) {
      console.error('No yearly data available');
      return false;
    }
  }
  
  const yearlyData = window.calculationState.yearlyData;
  const table = document.getElementById('year-details-table');
  const thead = table.getElementsByTagName('thead')[0];
  const tbody = table.getElementsByTagName('tbody')[0];
  
  // Create header with years
  const headerRow = thead.getElementsByTagName('tr')[0];
  
  // Remove existing year columns (keep category column)
  while (headerRow.children.length > 1) {
    headerRow.removeChild(headerRow.lastChild);
  }
  
  // Add year columns
  yearlyData.forEach((yearData) => {
    const th = document.createElement('th');
    th.textContent = 'Jahr ' + yearData.year;
    headerRow.appendChild(th);
  });
  
  // Clear existing data cells (keep category cells)
  const rows = tbody.getElementsByTagName('tr');
  for (let i = 0; i < rows.length; i++) {
    while (rows[i].children.length > 1) {
      rows[i].removeChild(rows[i].lastChild);
    }
  }
  
  // Fill table with data
  fillTableData(yearlyData);
  
  return true;
}

/**
 * Fill the table with yearly data
 * @param {Array} yearlyData - Array of yearly data objects
 */
function fillTableData(yearlyData) {
  // 1. Rent income
  fillCategoryRow('income', (yearData) => yearData.rent);
  fillDetailRow('income', 0, (yearData) => yearData.rent * 100/(100-yearData.vacancyRate));
  fillDetailRow('income', 1, (yearData) => -(yearData.rent * 100/(100-yearData.vacancyRate) - yearData.rent), true);
  fillDetailRow('income', 2, (yearData) => yearData.rent);
  
  // 2. Operating costs
  fillCategoryRow('costs', (yearData) => yearData.ongoingCosts, true);
  fillDetailRow('costs', 0, (yearData) => yearData.propertyTax, true);
  fillDetailRow('costs', 1, (yearData) => yearData.managementFee, true);
  fillDetailRow('costs', 2, (yearData) => yearData.maintenanceReserve, true);
  fillDetailRow('costs', 3, (yearData) => yearData.insurance, true);
  fillDetailRow('costs', 4, (yearData) => yearData.ongoingCosts, true);
  
  // 3. Cashflow before financing
  fillCategoryRow('cf-before-financing', (yearData) => yearData.cashflowBeforeFinancing);
  
  // 4. Financing
  fillCategoryRow('financing', (yearData) => yearData.payment, true);
  fillDetailRow('financing', 0, (yearData) => yearData.interest, true);
  fillDetailRow('financing', 1, (yearData) => yearData.principal, true);
  fillDetailRow('financing', 2, (yearData) => yearData.payment, true);
  
  // 5. Cashflow before tax
  fillCategoryRow('cf-before-tax', (yearData) => yearData.cashflowBeforeTax);
  
  // 6. Depreciation & tax
  fillCategoryRow('tax', (yearData) => yearData.totalDepreciation, true);
  fillDetailRow('tax', 0, (yearData) => yearData.buildingDepreciation, true);
  fillDetailRow('tax', 1, (yearData) => yearData.furnitureDepreciation, true);
  fillDetailRow('tax', 2, (yearData) => yearData.maintenanceDeduction, true);
  
  // Check if broker costs are treated as consulting
  const brokerAsConsulting = document.getElementById('broker-as-consulting').checked;
  if (brokerAsConsulting) {
    fillDetailRow('tax', 3, (yearData) => yearData.firstYearDeductibleCosts, true, 'Maklerkosten als Beratungsleistung');
    fillDetailRow('tax', 4, (yearData) => yearData.taxableIncome, false, 'Ergebnis vor Steuern');
    fillDetailRow('tax', 5, (yearData) => yearData.previousIncome);
    fillDetailRow('tax', 6, (yearData) => yearData.newTotalIncome, false, 'Neues zu versteuerndes Gesamteinkommen');
    fillDetailRow('tax', 7, (yearData) => yearData.previousTax, true);
    fillDetailRow('tax', 8, (yearData) => yearData.newTax, true, 'Einkommensteuer (nachher)');
    fillDetailRow('tax', 9, (yearData) => yearData.previousChurchTax, true, 'Kirchensteuer (vorher)');
    fillDetailRow('tax', 10, (yearData) => yearData.newChurchTax, true, 'Kirchensteuer (nachher)');
  } else {
    fillDetailRow('tax', 3, (yearData) => yearData.taxableIncome, false, 'Ergebnis vor Steuern');
    fillDetailRow('tax', 4, (yearData) => yearData.previousIncome);
    fillDetailRow('tax', 5, (yearData) => yearData.newTotalIncome, false, 'Neues zu versteuerndes Gesamteinkommen');
    fillDetailRow('tax', 6, (yearData) => yearData.previousTax, true);
    fillDetailRow('tax', 7, (yearData) => yearData.newTax, true, 'Einkommensteuer (nachher)');
    fillDetailRow('tax', 8, (yearData) => yearData.previousChurchTax, true, 'Kirchensteuer (vorher)');
    fillDetailRow('tax', 9, (yearData) => yearData.newChurchTax, true, 'Kirchensteuer (nachher)');
  }
  
  // 7. Tax savings
  fillCategoryRow('tax-savings', (yearData) => yearData.taxSavings);
  
  // 8. Cashflow after tax
  fillCategoryRow('cf-after-tax', (yearData) => yearData.cashflow);
  
  // 9. Assets
  fillCategoryRow('assets', (yearData) => yearData.equity);
  fillDetailRow('assets', 0, (yearData) => yearData.propertyValue);
  fillDetailRow('assets', 1, (yearData) => yearData.loanBalance, true);
  fillDetailRow('assets', 2, (yearData) => yearData.equity);
  fillDetailRow('assets', 3, (yearData) => (yearData.cashflow / yearData.initialEquity * 100).toFixed(2) + ' %');
}

/**
 * Fill a category row with yearly values
 * @param {string} category - Category identifier
 * @param {Function} valueFunction - Function to extract value from yearly data
 * @param {boolean} isExpense - Whether the value represents an expense
 */
function fillCategoryRow(category, valueFunction, isExpense = false) {
  const row = document.querySelector(`.main-row[data-category="${category}"]`);
  
  window.calculationState.yearlyData.forEach((yearData) => {
    const td = document.createElement('td');
    const value = valueFunction(yearData);
    td.textContent = formatCurrency(value);
    
    // Apply color coding: positive values green, negative red (reversed for expenses)
    if ((isExpense && value < 0) || (!isExpense && value > 0)) {
      td.className = 'positive-value';
    } else if ((isExpense && value > 0) || (!isExpense && value < 0)) {
      td.className = 'negative-value';
    }
    
    row.appendChild(td);
  });
}

/**
 * Fill a detail row with yearly values
 * @param {string} category - Category identifier
 * @param {number} rowIndex - Index of the detail row within category
 * @param {Function} valueFunction - Function to extract value from yearly data
 * @param {boolean} isExpense - Whether the value represents an expense
 * @param {string} customLabel - Optional custom label for the row
 */
function fillDetailRow(category, rowIndex, valueFunction, isExpense = false, customLabel = null) {
  const rows = document.querySelectorAll(`.detail-row[data-category="${category}"]`);
  const row = rows[rowIndex];
  
  // Set custom label if provided
  if (customLabel && row.querySelector('.detail-label')) {
    row.querySelector('.detail-label').textContent = customLabel;
  }
  
  window.calculationState.yearlyData.forEach((yearData) => {
    const td = document.createElement('td');
    const value = valueFunction(yearData);
    
    // Handle percentage values
    if (typeof value === 'string' && value.includes('%')) {
      td.textContent = value;
    } else {
      td.textContent = formatCurrency(value);
    }
    
    // Apply color coding: positive values green, negative red (reversed for expenses)
    if ((isExpense && value < 0) || (!isExpense && value > 0)) {
      td.className = 'positive-value';
    } else if ((isExpense && value > 0) || (!isExpense && value < 0)) {
      td.className = 'negative-value';
    }
    
    row.appendChild(td);
  });
}

/**
 * Export the yearly table to CSV
 */
export function exportTableToCSV() {
  // Create CSV content
  let csvContent = 'Kategorie';
  
  // Years as column headers
  for (let i = 0; i < window.calculationState.yearlyData.length; i++) {
    csvContent += ';Jahr ' + (i + 1);
  }
  csvContent += '\n';
  
  // Add data rows
  
  // 1. Rent income
  addCsvRow('Mieteinnahmen', (yearData) => yearData.rent);
  addCsvRow('  Mieteinnahmen (brutto)', (yearData) => yearData.rent * 100/(100-yearData.vacancyRate));
  addCsvRow('  Leerstand', (yearData) => -(yearData.rent * 100/(100-yearData.vacancyRate) - yearData.rent));
  addCsvRow('  Effektive Mieteinnahmen', (yearData) => yearData.rent);
  
  // 2. Operating costs
  addCsvRow('Bewirtschaftungskosten', (yearData) => yearData.ongoingCosts);
  addCsvRow('  Grundsteuer', (yearData) => yearData.propertyTax);
  addCsvRow('  Hausverwaltung', (yearData) => yearData.managementFee);
  addCsvRow('  Instandhaltungsrücklage', (yearData) => yearData.maintenanceReserve);
  addCsvRow('  Versicherungen', (yearData) => yearData.insurance);
  
  // 3. Cashflow before financing
  addCsvRow('Cashflow vor Finanzierung', (yearData) => yearData.cashflowBeforeFinancing);
  
  // 4. Financing
  addCsvRow('Finanzierung', (yearData) => yearData.payment);
  addCsvRow('  Zinsanteil', (yearData) => yearData.interest);
  addCsvRow('  Tilgungsanteil', (yearData) => yearData.principal);
  
  // 5. Cashflow before tax
  addCsvRow('Cashflow vor Steuern', (yearData) => yearData.cashflowBeforeTax);
  
  // 6. Depreciation & tax
  addCsvRow('Abschreibungen & Steuern', (yearData) => yearData.totalDepreciation);
  addCsvRow('  AfA Gebäude', (yearData) => yearData.buildingDepreciation);
  addCsvRow('  AfA Möbel', (yearData) => yearData.furnitureDepreciation);
  addCsvRow('  Erhaltungsaufwand', (yearData) => yearData.maintenanceDeduction);
  addCsvRow('  Ergebnis vor Steuern', (yearData) => yearData.taxableIncome);
  addCsvRow('  Zu versteuerndes Einkommen (vorher)', (yearData) => yearData.previousIncome);
  addCsvRow('  Neues zu versteuerndes Gesamteinkommen', (yearData) => yearData.newTotalIncome);
  addCsvRow('  Einkommensteuer (vorher)', (yearData) => yearData.previousTax);
  addCsvRow('  Einkommensteuer (nachher)', (yearData) => yearData.newTax);
  addCsvRow('  Kirchensteuer (vorher)', (yearData) => yearData.previousChurchTax);
  addCsvRow('  Kirchensteuer (nachher)', (yearData) => yearData.newChurchTax);
  
  // 7. Tax savings
  addCsvRow('Steuerersparnis', (yearData) => yearData.taxSavings);
  
  // 8. Cashflow after tax
  addCsvRow('Cashflow nach Steuern', (yearData) => yearData.cashflow);
  
  // 9. Assets
  addCsvRow('Vermögenswerte', (yearData) => yearData.equity);
  addCsvRow('  Immobilienwert', (yearData) => yearData.propertyValue);
  addCsvRow('  Restschuld', (yearData) => yearData.loanBalance);
  addCsvRow('  Eigenkapital', (yearData) => yearData.equity);
  addCsvRow('  Eigenkapitalrendite (%)', (yearData) => (yearData.cashflow / yearData.initialEquity * 100).toFixed(2), true);
  
  // Create and download CSV file
  downloadCSV(csvContent, 'immobilien-jahresübersicht.csv');
}

/**
 * Add a row to the CSV content
 * @param {string} label - Row label
 * @param {Function} valueFunction - Function to extract value from yearly data
 * @param {boolean} isPercentage - Whether the value is a percentage
 */
function addCsvRow(label, valueFunction, isPercentage = false) {
  let rowContent = label;
  
  window.calculationState.yearlyData.forEach((yearData) => {
    const value = valueFunction(yearData);
    
    if (isPercentage) {
      rowContent += ';' + value.replace('.', ',');
    } else {
      rowContent += ';' + value.toFixed(2).replace('.', ',');
    }
  });
  
  return rowContent + '\n';
}

/**
 * Create and download a CSV file
 * @param {string} content - CSV content
 * @param {string} filename - File name
 */
function downloadCSV(content, filename) {
  const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + content);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
