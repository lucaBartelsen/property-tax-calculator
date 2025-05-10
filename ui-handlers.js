// ui-handlers.js - UI event handlers and interactions

import { calculatePurchase } from './property-calculator.js';
import { calculateCashflow } from './cashflow-calculator.js';
import { calculateYearTable } from './table-generator.js';

/**
 * Initialize tab functionality
 */
export function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      
      // Remove active class from all tabs and contents
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to current tab and content
      tab.classList.add('active');
      document.getElementById(tabId).classList.add('active');
      
      // Update broker consulting rows visibility if needed
      updateBrokerConsultingRowsVisibility();
    });
  });
}

/**
 * Handle church tax toggle
 */
export function handleChurchTaxToggle() {
  const churchTaxRateContainer = document.getElementById('church-tax-rate-container');
  churchTaxRateContainer.style.display = this.value === 'yes' ? 'block' : 'none';
  
  // Update church tax elements in result views
  updateChurchTaxUIVisibility(this.value === 'yes');
  
  // Recalculate if needed
  if (window.calculationState.calculationResults) {
    calculateCashflow();
    calculateYearTable();
  }
}

/**
 * Update church tax UI elements visibility
 * @param {boolean} visible - Whether church tax elements should be visible
 */
export function updateChurchTaxUIVisibility(visible) {
  // Update UI elements for church tax
  const churchTaxElements = [
    document.getElementById('church-tax-container'),
    document.getElementById('church-tax-new-container'),
    document.getElementById('church-tax-savings-container')
  ];
  
  churchTaxElements.forEach(el => {
    if (el) el.style.display = visible ? 'flex' : 'none';
  });
  
  const churchTaxRows = document.querySelectorAll('.detail-row[data-category="tax"][data-church-tax="true"]');
  churchTaxRows.forEach(row => {
    row.style.display = visible ? '' : 'none';
  });
}

/**
 * Handle broker as consulting toggle
 */
export function handleBrokerToggle() {
  updateBrokerConsultingRowsVisibility();
  
  // Trigger recalculations
  calculatePurchase();
  calculateCashflow();
  calculateYearTable();
}

/**
 * Update broker consulting rows visibility
 */
export function updateBrokerConsultingRowsVisibility() {
  const brokerAsConsultingCheckbox = document.getElementById('broker-as-consulting');
  if (!brokerAsConsultingCheckbox) return;
  
  const brokerConsultingRows = document.querySelectorAll('[data-broker-consulting="true"]');
  brokerConsultingRows.forEach(row => {
    row.style.display = brokerAsConsultingCheckbox.checked ? '' : 'none';
  });
}

/**
 * Toggle details rows in the year table
 * @param {HTMLElement} row - The row to toggle
 */
export function toggleDetails(row) {
  const category = row.getAttribute('data-category');
  const isExpanded = row.classList.contains('expanded');
  const detailRows = document.querySelectorAll(`.detail-row[data-category="${category}"]`);
  
  if (isExpanded) {
    row.classList.remove('expanded');
    detailRows.forEach(row => row.classList.remove('visible'));
  } else {
    row.classList.add('expanded');
    detailRows.forEach(row => row.classList.add('visible'));
  }
}
