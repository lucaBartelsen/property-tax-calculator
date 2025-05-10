// ui-utils.js - UI utilities and formatting functions

/**
 * Format a number as currency (Euro)
 * @param {number} value - The value to format
 * @return {string} Formatted currency string
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('de-DE', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(value);
}

/**
 * Format a number as percentage
 * @param {number} value - The value to format (e.g., 42 for 42%)
 * @return {string} Formatted percentage string
 */
export function formatPercentage(value) {
  return new Intl.NumberFormat('de-DE', { 
    style: 'percent', 
    minimumFractionDigits: 2 
  }).format(value / 100);
}

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
      const brokerAsConsultingCheckbox = document.getElementById('broker-as-consulting');
      if (brokerAsConsultingCheckbox) {
        const brokerConsultingRows = document.querySelectorAll('[data-broker-consulting="true"]');
        brokerConsultingRows.forEach(row => {
          row.style.display = brokerAsConsultingCheckbox.checked ? '' : 'none';
        });
      }
    });
  });
}

/**
 * Handle church tax toggle
 */
export function handleChurchTaxToggle() {
  const churchTaxRateContainer = document.getElementById('church-tax-rate-container');
  churchTaxRateContainer.style.display = this.value === 'yes' ? 'block' : 'none';
  
  // Update UI elements for church tax
  const churchTaxElements = [
    document.getElementById('church-tax-container'),
    document.getElementById('church-tax-new-container'),
    document.getElementById('church-tax-savings-container')
  ];
  
  const hasChurchTax = this.value === 'yes';
  churchTaxElements.forEach(el => {
    if (el) el.style.display = hasChurchTax ? 'flex' : 'none';
  });
  
  const churchTaxRows = document.querySelectorAll('.detail-row[data-category="tax"][data-church-tax="true"]');
  churchTaxRows.forEach(row => {
    row.style.display = hasChurchTax ? '' : 'none';
  });
}

/**
 * Handle broker as consulting toggle
 */
export function handleBrokerToggle() {
  const brokerConsultingRows = document.querySelectorAll('[data-broker-consulting="true"]');
  brokerConsultingRows.forEach(row => {
    row.style.display = this.checked ? '' : 'none';
  });
  
  // Trigger recalculations
  if (window.calculatePurchase) window.calculatePurchase();
  if (window.calculateCashflow) window.calculateCashflow();
  if (window.calculateYearTable) window.calculateYearTable();
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
