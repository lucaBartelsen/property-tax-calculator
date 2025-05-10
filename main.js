// main.js - Main entry point for the Immobilien-Steuerrechner application
// Initializes the application and connects event handlers

import { formatCurrency, formatPercentage } from './ui-utils.js';
import { initTabs, handleChurchTaxToggle, handleBrokerToggle, toggleDetails } from './ui-handlers.js';
import { calculateTaxInfo } from './tax-calculator.js';
import { calculatePurchase, validatePurchaseAllocation } from './property-calculator.js';
import { calculateOngoing } from './property-calculator.js';
import { calculateCashflow } from './cashflow-calculator.js';
import { createCashflowChart } from './chart-utils.js';
import { calculateYearTable, exportTableToCSV } from './table-generator.js';
import { calculateSummary } from './summary-calculator.js';

// Global state to store calculation results
window.calculationState = {
  taxInfo: null,
  purchaseData: null,
  ongoingData: null,
  calculationResults: null,
  yearlyData: null
};

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
  // Initialize UI components
  initTabs();
  initInputValidation();
  initEventListeners();
  
  // Initial calculations
  calculatePurchase();
  calculateOngoing();
});

function initInputValidation() {
  // Add validation for purchase price allocation
  document.getElementById('purchase-price').addEventListener('input', validatePurchaseAllocation);
  document.getElementById('land-value').addEventListener('input', validatePurchaseAllocation);
  document.getElementById('building-value').addEventListener('input', validatePurchaseAllocation);
  document.getElementById('furniture-value').addEventListener('input', validatePurchaseAllocation);
}

function initEventListeners() {
  // Financing type change
  document.getElementById('financing-type').addEventListener('change', function() {
    const loanDetails = document.getElementById('loan-details');
    loanDetails.style.display = this.value === 'loan' ? 'block' : 'none';
  });

  // Kirchensteuer toggle
  document.getElementById('church-tax').addEventListener('change', handleChurchTaxToggle);
  
  // Bundesland change - update church tax rate
  document.getElementById('bundesland').addEventListener('change', function() {
    const bundesland = this.options[this.selectedIndex].text;
    const churchTaxRateSelect = document.getElementById('church-tax-rate');
    
    // In Bayern und Baden-Württemberg ist der Kirchensteuersatz 8%
    churchTaxRateSelect.value = bundesland.includes('Bayern') || bundesland.includes('Baden-Württemberg') ? '8' : '9';
  });
  
  // Broker as consulting toggle
  document.getElementById('broker-as-consulting').addEventListener('change', handleBrokerToggle);
  
  // Main calculation button
  document.getElementById('calculate-all').addEventListener('click', function() {
    calculatePurchase();
    calculateOngoing();
    calculateCashflow();
    calculateYearTable();
    calculateSummary();
    
    // Navigate to overview tab
    document.querySelector('.tab[data-tab="overview"]').click();
  });
  
  // Tax calculation button
  document.getElementById('calculate-tax').addEventListener('click', function() {
    window.calculationState.taxInfo = calculateTaxInfo();
    calculateCashflow();
    calculateYearTable();
  });
  
  // Year table row toggling
  document.addEventListener('click', function(e) {
    if (e.target && e.target.closest('.main-row')) {
      const row = e.target.closest('.main-row');
      if (row.querySelector('.expand-indicator')) {
        toggleDetails(row);
      }
    }
  });
  
  // Table expand/collapse buttons
  document.getElementById('expand-all').addEventListener('click', expandAllRows);
  document.getElementById('collapse-all').addEventListener('click', collapseAllRows);
  
  // Export table button
  document.getElementById('export-table').addEventListener('click', function() {
    if (!window.calculationState.yearlyData) {
      alert('Bitte berechnen Sie zuerst die Tabelle!');
      return;
    }
    exportTableToCSV();
  });
}

function expandAllRows() {
  document.querySelectorAll('.main-row').forEach(row => {
    if (row.querySelector('.expand-indicator')) {
      const category = row.getAttribute('data-category');
      const detailRows = document.querySelectorAll(`.detail-row[data-category="${category}"]`);
      
      row.classList.add('expanded');
      detailRows.forEach(detailRow => detailRow.classList.add('visible'));
    }
  });
}

function collapseAllRows() {
  document.querySelectorAll('.main-row').forEach(row => {
    if (row.querySelector('.expand-indicator')) {
      const category = row.getAttribute('data-category');
      const detailRows = document.querySelectorAll(`.detail-row[data-category="${category}"]`);
      
      row.classList.remove('expanded');
      detailRows.forEach(detailRow => detailRow.classList.remove('visible'));
    }
  });
}

// Export global utilities for legacy code compatibility
window.formatCurrency = formatCurrency;
window.formatPercentage = formatPercentage;
