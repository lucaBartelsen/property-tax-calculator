// chart-utils.js - Chart creation and visualization utilities

import { formatCurrency } from './ui-utils.js';

// Global chart instance for safe chart updates
let cashflowChart = null;

/**
 * Create or update the cashflow chart
 * @param {Array} years - Array of years (1, 2, 3, ...)
 * @param {Array} cashflows - Array of cashflow values
 * @param {Array} propertyValues - Array of property values
 * @param {Array} equityValues - Array of equity values
 * @param {Array} loanValues - Array of loan balance values
 */
export function createCashflowChart(years, cashflows, propertyValues, equityValues, loanValues) {
  try {
    const chartCanvas = document.getElementById('cashflowChart');
    
    if (!chartCanvas) {
      console.error('Chart canvas element not found');
      return;
    }
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
      console.error('Chart.js library not loaded');
      return;
    }
    
    // Get canvas context
    let ctx;
    try {
      ctx = chartCanvas.getContext('2d');
    } catch (e) {
      console.error('Failed to get canvas context:', e);
      return;
    }
    
    // Safely destroy existing chart
    if (cashflowChart && typeof cashflowChart.destroy === 'function') {
      cashflowChart.destroy();
    } else if (cashflowChart) {
      cashflowChart = null;
    }
    
    // Create new chart
    cashflowChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          {
            label: 'Jährlicher Cashflow',
            data: cashflows,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 2,
            tension: 0.1
          },
          {
            label: 'Immobilienwert',
            data: propertyValues,
            borderColor: 'rgba(153, 102, 255, 1)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderWidth: 2,
            tension: 0.1,
            yAxisID: 'y1'
          },
          {
            label: 'Eigenkapital',
            data: equityValues,
            borderColor: 'rgba(255, 159, 64, 1)',
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderWidth: 2,
            tension: 0.1,
            yAxisID: 'y1'
          },
          {
            label: 'Restschuld',
            data: loanValues,
            borderColor: 'rgba(231, 76, 60, 1)',
            backgroundColor: 'rgba(231, 76, 60, 0.2)',
            borderWidth: 2,
            tension: 0.1,
            yAxisID: 'y1',
            borderDash: [5, 5] // Dashed line for better distinction
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Cashflow (€)'
            }
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            title: {
              display: true,
              text: 'Wert (€)'
            },
            grid: {
              drawOnChartArea: false
            }
          },
          x: {
            title: {
              display: true,
              text: 'Jahr'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + formatCurrency(context.raw);
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error creating chart:', error);
  }
}
