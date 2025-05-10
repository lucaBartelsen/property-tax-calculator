// property-calculator.js - Property cost calculations

import { formatCurrency } from './ui-utils.js';

/**
 * Calculate purchase-related costs
 * @return {Object} Purchase data
 */
export function calculatePurchase() {
  const purchasePrice = parseFloat(document.getElementById('purchase-price').value);
  const bundeslandSelect = document.getElementById('bundesland');
  const grunderwerbsteuerRate = parseFloat(bundeslandSelect.value);
  const notaryRate = parseFloat(document.getElementById('notary-costs').value);
  const brokerRate = parseFloat(document.getElementById('broker-fee').value);
  const brokerAsConsulting = document.getElementById('broker-as-consulting').checked;
  
  // Calculate purchase costs
  const grunderwerbsteuer = purchasePrice * (grunderwerbsteuerRate / 100);
  const notaryCosts = purchasePrice * (notaryRate / 100);
  const brokerFee = purchasePrice * (brokerRate / 100);
  const totalExtra = grunderwerbsteuer + notaryCosts + brokerFee;
  const totalCost = purchasePrice + totalExtra;
  
  // Purchase price allocation
  const landValue = parseFloat(document.getElementById('land-value').value);
  const buildingValue = parseFloat(document.getElementById('building-value').value);
  const maintenanceCost = parseFloat(document.getElementById('maintenance-cost').value);
  const furnitureValue = parseFloat(document.getElementById('furniture-value').value);
  const maintenanceDistribution = parseInt(document.getElementById('maintenance-distribution').value);
  
  // Calculate percentages
  const landValuePercentage = (landValue / purchasePrice) * 100;
  const buildingValuePercentage = (buildingValue / purchasePrice) * 100;
  
  // Allocate extra costs to land and building
  // If broker costs are counted as consulting, exclude them from acquisition costs
  const relevantExtra = brokerAsConsulting ? (grunderwerbsteuer + notaryCosts) : totalExtra;
  const landExtraCosts = relevantExtra * (landValue / purchasePrice);
  const buildingExtraCosts = relevantExtra * (buildingValue / purchasePrice);
  
  // Total values including extra costs
  const totalLandValue = landValue + landExtraCosts;
  const totalBuildingValue = buildingValue + buildingExtraCosts;
  
  // First year deductible costs
  const firstYearDeductibleCosts = brokerAsConsulting ? brokerFee : 0;
  
  // Annual maintenance cost
  const annualMaintenance = maintenanceCost / maintenanceDistribution;
  
  // Update UI with results
  document.getElementById('result-purchase-price').textContent = formatCurrency(purchasePrice);
  document.getElementById('result-grunderwerbsteuer').textContent = formatCurrency(grunderwerbsteuer);
  document.getElementById('result-notary').textContent = formatCurrency(notaryCosts);
  document.getElementById('result-broker').textContent = formatCurrency(brokerFee);
  document.getElementById('result-total-extra').textContent = formatCurrency(totalExtra);
  document.getElementById('result-total-cost').textContent = formatCurrency(totalCost);
  document.getElementById('result-land-value').textContent = formatCurrency(landValue);
  document.getElementById('result-building-value').textContent = formatCurrency(buildingValue);
  document.getElementById('result-maintenance-cost').textContent = formatCurrency(maintenanceCost);
  document.getElementById('result-furniture-value').textContent = formatCurrency(furnitureValue);
  document.getElementById('result-annual-maintenance').textContent = formatCurrency(annualMaintenance);
  
  // Store purchase data in global state
  window.calculationState.purchaseData = {
    purchasePrice,
    grunderwerbsteuer,
    notaryCosts,
    brokerFee,
    brokerAsConsulting,
    firstYearDeductibleCosts,
    totalExtra,
    totalCost,
    landValue,
    buildingValue,
    landExtraCosts,
    buildingExtraCosts,
    totalLandValue,
    totalBuildingValue,
    maintenanceCost,
    furnitureValue,
    annualMaintenance,
    maintenanceDistribution,
    landValuePercentage,
    buildingValuePercentage
  };
  
  return window.calculationState.purchaseData;
}

/**
 * Validate that purchase price allocation adds up to the total purchase price
 */
export function validatePurchaseAllocation() {
  const purchasePrice = parseFloat(document.getElementById('purchase-price').value);
  const landValue = parseFloat(document.getElementById('land-value').value);
  const buildingValue = parseFloat(document.getElementById('building-value').value);
  const furnitureValue = parseFloat(document.getElementById('furniture-value').value);
  
  const totalAllocation = landValue + buildingValue + furnitureValue;
  const warningElement = document.getElementById('price-validation-warning');
  
  // Allow 1€ tolerance for rounding errors
  if (Math.abs(totalAllocation - purchasePrice) > 1) {
    warningElement.style.display = 'block';
    warningElement.textContent = `Warnung: Die Summe der Kaufpreisaufteilung (${formatCurrency(totalAllocation)}) entspricht nicht dem Gesamtkaufpreis (${formatCurrency(purchasePrice)})!`;
  } else {
    warningElement.style.display = 'none';
  }
}

/**
 * Calculate ongoing costs
 * @return {Object} Ongoing costs data
 */
export function calculateOngoing() {
  const monthlyRent = parseFloat(document.getElementById('rental-income').value);
  const vacancyRate = parseFloat(document.getElementById('vacancy-rate').value);
  const propertyTax = parseFloat(document.getElementById('property-tax').value);
  const managementFee = parseFloat(document.getElementById('management-fee').value);
  const maintenanceReserve = parseFloat(document.getElementById('maintenance-reserve').value);
  const insurance = parseFloat(document.getElementById('insurance').value);
  
  // Calculate annual values
  const annualRent = monthlyRent * 12;
  const effectiveRent = annualRent * (1 - vacancyRate / 100);
  const totalOngoing = propertyTax + managementFee + maintenanceReserve + insurance;
  
  // Update UI
  document.getElementById('result-annual-rent').textContent = formatCurrency(annualRent);
  document.getElementById('result-effective-rent').textContent = formatCurrency(effectiveRent);
  document.getElementById('result-property-tax').textContent = formatCurrency(propertyTax);
  document.getElementById('result-management').textContent = formatCurrency(managementFee);
  document.getElementById('result-maintenance').textContent = formatCurrency(maintenanceReserve);
  document.getElementById('result-insurance').textContent = formatCurrency(insurance);
  document.getElementById('result-total-ongoing').textContent = formatCurrency(totalOngoing);
  
  // Store data in global state
  window.calculationState.ongoingData = {
    monthlyRent,
    annualRent,
    vacancyRate,
    effectiveRent,
    propertyTax,
    managementFee,
    maintenanceCost: maintenanceReserve,
    insurance,
    totalOngoing
  };
  
  return window.calculationState.ongoingData;
}
