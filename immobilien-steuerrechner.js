// Aktualisierte Funktion zur Berechnung der Einkommensteuer nach deutschem Recht
function calculateGermanIncomeTax(income) {
    // Einkommensteuer für 2024 mit den aktuellen Formeln
    
    // Variablen für die Steuerformel
    let tax = 0;
    
    // 2024 Werte
    const grundfreibetrag = 12096; // in Euro für 2024
    
    // Steuerzonen Grenzen
    const zone1EndIncome = 17443;  // bis 17.443 € (erste Progressionszone)
    const zone2EndIncome = 68480;  // bis 68.480 € (zweite Progressionszone)
    const zone3EndIncome = 277825; // bis 277.825 € (dritte Zone - 42%)
    // > 277.825 € (vierte Zone - 45%)
    
    // Einkommensteuertarif 2024
    if (income <= grundfreibetrag) {
        // a) bis 12.096 Euro: ESt = 0
        tax = 0;
    } 
    else if (income <= zone1EndIncome) {
        // b) von 12.097 Euro bis 17.443 Euro: ESt = (932,3 * y + 1.400) * y
        // mit y = (zvE - 12.096) / 10.000
        const y = (income - grundfreibetrag) / 10000;
        tax = (932.3 * y + 1400) * y;
    } 
    else if (income <= zone2EndIncome) {
        // c) von 17.444 Euro bis 68.480 Euro: ESt = (176,64 * z + 2.397) * z + 1.015,13
        // mit z = (zvE - 17.443) / 10.000
        const z = (income - 17443) / 10000;
        tax = (176.64 * z + 2397) * z + 1015.13;
    } 
    else if (income <= zone3EndIncome) {
        // d) von 68.481 Euro bis 277.825 Euro: ESt = 0,42 * zvE - 10.911,92
        tax = 0.42 * income - 10911.92;
    } 
    else {
        // e) ab 277.826 Euro: ESt = 0,45 * zvE - 19.246,67
        tax = 0.45 * income - 19246.67;
    }
    
    // Runden auf volle Euro-Beträge (wie beim Finanzamt)
    return Math.round(tax);
}

// Function to format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
}

// Function to format percentage
function formatPercentage(value) {
    return new Intl.NumberFormat('de-DE', { style: 'percent', minimumFractionDigits: 2 }).format(value / 100);
}

// Chart.js spezifische Umgebungsvariable
let cashflowChart = null;

// Document ready function
document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to current tab and content
            tab.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Update Grunderwerbsteuer based on Bundesland selection
    document.getElementById('bundesland').addEventListener('change', function() {
        document.getElementById('grunderwerbsteuer').value = this.value;
    });

    // Initial set of Grunderwerbsteuer
    document.getElementById('grunderwerbsteuer').value = document.getElementById('bundesland').value;

    // Handle financing type change
    document.getElementById('financing-type').addEventListener('change', function() {
        const loanDetails = document.getElementById('loan-details');
        if (this.value === 'loan') {
            loanDetails.style.display = 'block';
        } else {
            loanDetails.style.display = 'none';
        }
    });

    document.getElementById('purchase-price').addEventListener('input', validatePurchaseAllocation);
    document.getElementById('land-value').addEventListener('input', validatePurchaseAllocation);
    document.getElementById('building-value').addEventListener('input', validatePurchaseAllocation);
    document.getElementById('furniture-value').addEventListener('input', validatePurchaseAllocation);

    // Funktion zur Validierung der Kaufpreisaufteilung
    function validatePurchaseAllocation() {
        const purchasePrice = parseFloat(document.getElementById('purchase-price').value);
        const landValue = parseFloat(document.getElementById('land-value').value);
        const buildingValue = parseFloat(document.getElementById('building-value').value);
        const furnitureValue = parseFloat(document.getElementById('furniture-value').value);
        
        const totalAllocation = landValue + buildingValue + furnitureValue;
        const warningElement = document.getElementById('price-validation-warning');
        
        if (Math.abs(totalAllocation - purchasePrice) > 1) { // Toleranz von 1€ für Rundungsfehler
            warningElement.style.display = 'block';
            warningElement.textContent = `Warnung: Die Summe der Kaufpreisaufteilung (${formatCurrency(totalAllocation)}) entspricht nicht dem Gesamtkaufpreis (${formatCurrency(purchasePrice)})!`;
        } else {
            warningElement.style.display = 'none';
        }
    }

    // Hauptberechnungsfunktion - alle Berechnungen in einem
    document.getElementById('calculate-all').addEventListener('click', function() {
        calculatePurchase();
        calculateOngoing();
        calculateCashflow();
        calculateYearTable();
        calculateSummary();
        
        // Nach Berechnungen automatisch zur Übersicht wechseln
        document.querySelector('.tab[data-tab="overview"]').click();
    });

    // Jahr-Tabelle aufklappbare Zeilen
    document.addEventListener('click', function(e) {
        if (e.target && e.target.closest('.main-row')) {
            const row = e.target.closest('.main-row');
            if (row.querySelector('.expand-indicator')) {
                toggleDetails(row);
            }
        }
    });

    // Funktionen für "Alle aufklappen" und "Alle zuklappen" Buttons
    document.getElementById('expand-all').addEventListener('click', function() {
        document.querySelectorAll('.main-row').forEach(row => {
            // Nur Zeilen mit expand-indicator sind aufklappbar
            if (row.querySelector('.expand-indicator')) {
                const category = row.getAttribute('data-category');
                const detailRows = document.querySelectorAll(`.detail-row[data-category="${category}"]`);
                
                row.classList.add('expanded');
                detailRows.forEach(detailRow => detailRow.classList.add('visible'));
            }
        });
    });

    document.getElementById('collapse-all').addEventListener('click', function() {
        document.querySelectorAll('.main-row').forEach(row => {
            // Nur Zeilen mit expand-indicator sind aufklappbar
            if (row.querySelector('.expand-indicator')) {
                const category = row.getAttribute('data-category');
                const detailRows = document.querySelectorAll(`.detail-row[data-category="${category}"]`);
                
                row.classList.remove('expanded');
                detailRows.forEach(detailRow => detailRow.classList.remove('visible'));
            }
        });
    });

    // Export der Tabelle als CSV
    document.getElementById('export-table').addEventListener('click', function() {
        if (!window.yearlyData) {
            alert('Bitte berechnen Sie zuerst die Tabelle!');
            return;
        }
        
        exportTableToCSV();
    });
    
    // Beim Laden der Seite automatisch die ersten Berechnungen durchführen
    calculatePurchase();
    calculateOngoing();
});

// 2. Laufende Kosten berechnen
function calculateOngoing() {
    const monthlyRent = parseFloat(document.getElementById('rental-income').value);
    const vacancyRate = parseFloat(document.getElementById('vacancy-rate').value);
    const propertyTax = parseFloat(document.getElementById('property-tax').value);
    const managementFee = parseFloat(document.getElementById('management-fee').value);
    const maintenanceRate = parseFloat(document.getElementById('maintenance-reserve').value);
    const propertySize = parseFloat(document.getElementById('property-size').value);
    const insurance = parseFloat(document.getElementById('insurance').value);
    
    const annualRent = monthlyRent * 12;
    const effectiveRent = annualRent * (1 - vacancyRate / 100);
    const maintenanceCost = maintenanceRate * propertySize;
    const totalOngoing = propertyTax + managementFee + maintenanceCost + insurance;
    
    document.getElementById('result-annual-rent').textContent = formatCurrency(annualRent);
    document.getElementById('result-effective-rent').textContent = formatCurrency(effectiveRent);
    document.getElementById('result-property-tax').textContent = formatCurrency(propertyTax);
    document.getElementById('result-management').textContent = formatCurrency(managementFee);
    document.getElementById('result-maintenance').textContent = formatCurrency(maintenanceCost);
    document.getElementById('result-insurance').textContent = formatCurrency(insurance);
    document.getElementById('result-total-ongoing').textContent = formatCurrency(totalOngoing);
    
    return {
        monthlyRent,
        annualRent,
        vacancyRate,
        effectiveRent,
        propertyTax,
        managementFee,
        maintenanceCost,
        insurance,
        totalOngoing,
        propertySize
    };
}

// 3. Cashflow berechnen
function calculateCashflow() {
    // Daten aus den vorherigen Berechnungen holen
    const purchaseData = calculatePurchase();
    const ongoingData = calculateOngoing();
    
    // Zusätzliche Daten für die Cashflow-Berechnung
    const financingType = document.getElementById('financing-type').value;
    const downPayment = parseFloat(document.getElementById('down-payment').value);
    const interestRate = parseFloat(document.getElementById('interest-rate').value) / 100;
    const repaymentRate = parseFloat(document.getElementById('repayment-rate').value) / 100;
    
    // Steuer- und Abschreibungsdaten
    const annualIncome = parseFloat(document.getElementById('annual-income').value);
    const depreciationRate = parseFloat(document.getElementById('depreciation-rate').value) / 100;
    const buildingValue = parseFloat(document.getElementById('building-value').value);
    const furnitureValue = parseFloat(document.getElementById('furniture-value').value);
    const furnitureDepreciationRate = parseFloat(document.getElementById('furniture-depreciation-rate').value) / 100;
    const appreciationRate = parseFloat(document.getElementById('expected-appreciation').value) / 100;
    const rentIncreaseRate = parseFloat(document.getElementById('expected-rent-increase').value) / 100;
    const calculationPeriod = parseFloat(document.getElementById('calculation-period').value);
    
    // Finanzierungskosten berechnen
    let loanAmount = 0;
    let annuity = 0;
    
    if (financingType === 'loan') {
        loanAmount = purchaseData.totalCost - downPayment;
        
        // Berechnung der Annuität (jährliche Rate bestehend aus Zins und Tilgung)
        annuity = loanAmount * (interestRate + repaymentRate);
    }
    
    // Berechnung der jährlichen Abschreibungen
    const annualBuildingDepreciation = buildingValue * depreciationRate;
    const annualFurnitureDepreciation = furnitureValue * furnitureDepreciationRate;
    
    // Initialisierung für erste Jahresberechnung
    let yearlyInterest = loanAmount * interestRate;
    let yearlyPrincipal = Math.min(annuity - yearlyInterest, loanAmount);
    let yearlyFinancingCosts = yearlyInterest + yearlyPrincipal;
    let remainingLoan = loanAmount - yearlyPrincipal;
    
    // Cashflow vor Steuern berechnen
    const cashflowBeforeTax = ongoingData.effectiveRent - ongoingData.totalOngoing - yearlyFinancingCosts;
    
    // Neues "Ergebnis vor Steuern" berechnen (vormals "Zu versteuerndes Einkommen")
    const taxableIncome = cashflowBeforeTax + yearlyPrincipal - annualBuildingDepreciation - annualFurnitureDepreciation - purchaseData.annualMaintenance;
    
    // Steuerberechnung mit progressivem Steuersatz
    const previousIncomeTax = calculateGermanIncomeTax(annualIncome);
    const totalTaxableIncome = Math.max(0, annualIncome + taxableIncome);
    const newIncomeTax = calculateGermanIncomeTax(totalTaxableIncome);
    const taxSavings = previousIncomeTax - newIncomeTax;
    
    // Cashflow nach Steuern berechnen
    const cashflowAfterTax = cashflowBeforeTax + taxSavings;
    const monthlyCashflow = cashflowAfterTax / 12;
    
    // Ergebnisse anzeigen im Cashflow-Tab
    document.getElementById('result-cf-annual-rent').textContent = formatCurrency(ongoingData.effectiveRent);
    document.getElementById('result-cf-ongoing-costs').textContent = formatCurrency(ongoingData.totalOngoing);
    document.getElementById('result-cf-financing').textContent = formatCurrency(yearlyFinancingCosts);
    
    // Abschreibungsinformationen
    document.getElementById('result-cf-building-depreciation').textContent = formatCurrency(annualBuildingDepreciation);
    document.getElementById('result-cf-furniture-depreciation').textContent = formatCurrency(annualFurnitureDepreciation);
    document.getElementById('result-cf-maintenance-deduction').textContent = formatCurrency(purchaseData.annualMaintenance);
    document.getElementById('result-cf-total-depreciation').textContent = formatCurrency(annualBuildingDepreciation + annualFurnitureDepreciation + purchaseData.annualMaintenance);
    
    // Steuerinformationen
    document.getElementById('result-cf-taxable-income').textContent = formatCurrency(taxableIncome);
    document.getElementById('result-cf-previous-income').textContent = formatCurrency(annualIncome);
    document.getElementById('result-cf-total-income').textContent = formatCurrency(totalTaxableIncome);
    document.getElementById('result-cf-previous-tax').textContent = formatCurrency(previousIncomeTax);
    document.getElementById('result-cf-income-tax').textContent = formatCurrency(newIncomeTax);
    document.getElementById('result-cf-tax-savings').textContent = formatCurrency(taxSavings);
    
    // Cashflow-Ergebnisse
    document.getElementById('result-cf-after-tax').textContent = formatCurrency(cashflowAfterTax);
    document.getElementById('result-cf-monthly').textContent = formatCurrency(monthlyCashflow);
    document.getElementById('result-cf-roi').textContent = (cashflowAfterTax / (financingType === 'loan' ? downPayment : purchaseData.totalCost) * 100).toFixed(2) + ' %';
    
    // Prepare data for chart and detailed table
    const years = Array.from({length: calculationPeriod}, (_, i) => i + 1);
    const cashflows = [cashflowAfterTax];
    const propertyValues = [purchaseData.purchasePrice];
    const equityValues = [financingType === 'loan' ? purchaseData.purchasePrice - remainingLoan : purchaseData.purchasePrice];
    const loanValues = [remainingLoan];
    
    // Array für jährliche Daten initialisieren
    window.yearlyData = [{
        year: 1,
        rent: ongoingData.effectiveRent,
        ongoingCosts: ongoingData.totalOngoing,
        interest: yearlyInterest,
        principal: yearlyPrincipal,
        payment: yearlyFinancingCosts,
        loanBalance: remainingLoan,
        buildingDepreciation: annualBuildingDepreciation,
        furnitureDepreciation: annualFurnitureDepreciation,
        maintenanceDeduction: purchaseData.annualMaintenance,
        totalDepreciation: annualBuildingDepreciation + annualFurnitureDepreciation + purchaseData.annualMaintenance,
        taxableIncome: taxableIncome, // Neues "Ergebnis vor Steuern"
        previousIncome: annualIncome,
        previousTax: previousIncomeTax,
        newTotalIncome: totalTaxableIncome, // Neues Gesamteinkommen
        newTax: newIncomeTax, // Neue Gesamtsteuer
        taxSavings: taxSavings,
        cashflow: cashflowAfterTax,
        cashflowBeforeTax: cashflowBeforeTax, // Explizit den Cashflow vor Steuern speichern
        propertyValue: purchaseData.purchasePrice,
        equity: financingType === 'loan' ? purchaseData.purchasePrice - remainingLoan : purchaseData.purchasePrice,
        initialEquity: financingType === 'loan' ? downPayment : purchaseData.purchasePrice,
        // Zusätzliche detaillierte Daten
        vacancyRate: ongoingData.vacancyRate,
        propertyTax: ongoingData.propertyTax,
        managementFee: ongoingData.managementFee,
        maintenanceReserve: ongoingData.maintenanceCost,
        insurance: ongoingData.insurance,
        cashflowBeforeFinancing: ongoingData.effectiveRent - ongoingData.totalOngoing
    }];
    
    // Berechnung für die kommenden Jahre
    let currentRent = ongoingData.effectiveRent;
    let currentOngoingCosts = ongoingData.totalOngoing;
    let currentPropertyTax = ongoingData.propertyTax;
    let currentManagementFee = ongoingData.managementFee;
    let currentMaintenanceReserve = ongoingData.maintenanceCost;
    let currentInsurance = ongoingData.insurance;
    
    for (let year = 2; year <= calculationPeriod; year++) {
        // Miet- und Kostensteigerung mit Inflationsrate
        currentRent = currentRent * (1 + rentIncreaseRate);
        currentPropertyTax = currentPropertyTax * (1 + rentIncreaseRate);
        currentManagementFee = currentManagementFee * (1 + rentIncreaseRate);
        currentMaintenanceReserve = currentMaintenanceReserve * (1 + rentIncreaseRate);
        currentInsurance = currentInsurance * (1 + rentIncreaseRate);
        
        // Gesamte laufende Kosten
        currentOngoingCosts = currentPropertyTax + currentManagementFee + currentMaintenanceReserve + currentInsurance;
        
        // Cashflow vor Finanzierung
        const currentCashflowBeforeFinancing = currentRent - currentOngoingCosts;
        
        // Finanzierungskosten (bei Annuitätendarlehen)
        if (financingType === 'loan' && remainingLoan > 0) {
            yearlyInterest = remainingLoan * interestRate;
            yearlyPrincipal = Math.min(annuity - yearlyInterest, remainingLoan);
            yearlyFinancingCosts = yearlyInterest + yearlyPrincipal;
            remainingLoan -= yearlyPrincipal;
            if (remainingLoan < 0) remainingLoan = 0;
        } else {
            yearlyInterest = 0;
            yearlyPrincipal = 0;
            yearlyFinancingCosts = 0;
            remainingLoan = 0;
        }
        
        // Cashflow vor Steuern
        const currentCashflowBeforeTax = currentCashflowBeforeFinancing - yearlyFinancingCosts;
        
        // Erhaltungsaufwand nur für die ausgewählten Jahre berücksichtigen
        const yearlyMaintenance = year <= purchaseData.maintenanceDistribution ? purchaseData.annualMaintenance : 0;
        const yearlyTotalDepreciation = annualBuildingDepreciation + annualFurnitureDepreciation + yearlyMaintenance;
        
        // Neues "Ergebnis vor Steuern" berechnen
        const yearlyTaxableIncome = currentCashflowBeforeTax + yearlyPrincipal - annualBuildingDepreciation - annualFurnitureDepreciation - yearlyMaintenance;
        
        // Steuerberechnung mit progressivem Steuersatz
        const yearlyTotalTaxableIncome = Math.max(0, annualIncome + yearlyTaxableIncome);
        const yearlyNewIncomeTax = calculateGermanIncomeTax(yearlyTotalTaxableIncome);
        const yearlyTaxSavings = previousIncomeTax - yearlyNewIncomeTax;
        
        // Cashflow nach Steuern
        const yearlyCashflowAfterTax = currentCashflowBeforeTax + yearlyTaxSavings;
        
        // Immobilienwert berechnen
        const yearlyPropertyValue = purchaseData.purchasePrice * Math.pow(1 + appreciationRate, year - 1);
        
        // Eigenkapital berechnen
        const yearlyEquity = yearlyPropertyValue - remainingLoan;
        
        // Werte für Chart speichern
        cashflows.push(yearlyCashflowAfterTax);
        propertyValues.push(yearlyPropertyValue);
        equityValues.push(yearlyEquity);
        loanValues.push(remainingLoan);
        
        // Jahreswerte für Tabelle speichern
        window.yearlyData.push({
            year: year,
            rent: currentRent,
            ongoingCosts: currentOngoingCosts,
            interest: yearlyInterest,
            principal: yearlyPrincipal,
            payment: yearlyFinancingCosts,
            loanBalance: remainingLoan,
            buildingDepreciation: annualBuildingDepreciation,
            furnitureDepreciation: annualFurnitureDepreciation,
            maintenanceDeduction: yearlyMaintenance,
            totalDepreciation: yearlyTotalDepreciation,
            taxableIncome: yearlyTaxableIncome, // Neues "Ergebnis vor Steuern"
            previousIncome: annualIncome,
            previousTax: previousIncomeTax,
            newTotalIncome: yearlyTotalTaxableIncome, // Neues Gesamteinkommen
            newTax: yearlyNewIncomeTax, // Neue Gesamtsteuer
            taxSavings: yearlyTaxSavings,
            cashflow: yearlyCashflowAfterTax,
            cashflowBeforeTax: currentCashflowBeforeTax, // Explizit den Cashflow vor Steuern speichern
            propertyValue: yearlyPropertyValue,
            equity: yearlyEquity,
            initialEquity: financingType === 'loan' ? downPayment : purchaseData.purchasePrice,
            // Zusätzliche detaillierte Daten
            vacancyRate: ongoingData.vacancyRate,
            propertyTax: currentPropertyTax,
            managementFee: currentManagementFee,
            maintenanceReserve: currentMaintenanceReserve,
            insurance: currentInsurance,
            cashflowBeforeFinancing: currentCashflowBeforeFinancing
        });
    }
    
    // Chart erstellen
    createCashflowChart(years, cashflows, propertyValues, equityValues, loanValues);
    
    // Store values for summary
    window.calculationResults = {
        totalCost: purchaseData.totalCost,
        downPayment,
        loanAmount,
        annuity,
        monthlyPayment: annuity / 12,
        monthlyCashflow,
        finalPropertyValue: propertyValues[calculationPeriod - 1],
        remainingLoan: loanValues[calculationPeriod - 1],
        finalEquity: equityValues[calculationPeriod - 1],
        initialEquity: financingType === 'loan' ? downPayment : purchaseData.totalCost
    };
    
    return window.calculationResults;
}

// 4. Jahrestabelle berechnen
function calculateYearTable() {
    // Prüfen, ob die Cashflow-Berechnungen bereits durchgeführt wurden
    if (!window.yearlyData) {
        calculateCashflow();
        if (!window.yearlyData) {
            alert('Es konnten keine Jahreswerte berechnet werden.');
            return;
        }
    }
    
    const table = document.getElementById('year-details-table');
    const thead = table.getElementsByTagName('thead')[0];
    const tbody = table.getElementsByTagName('tbody')[0];
    
    // Header mit Jahren erstellen
    const headerRow = thead.getElementsByTagName('tr')[0];
    
    // Bestehenden Header löschen (außer erste Spalte mit "Kategorie")
    while (headerRow.children.length > 1) {
        headerRow.removeChild(headerRow.lastChild);
    }
    
    // Jahre als Spalten hinzufügen
    window.yearlyData.forEach((yearData, index) => {
        const th = document.createElement('th');
        th.textContent = 'Jahr ' + (index + 1);
        headerRow.appendChild(th);
    });
    
    // Alle Datenzellen in der Tabelle löschen (außer erste Spalte mit Kategorien)
    const rows = tbody.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        while (rows[i].children.length > 1) {
            rows[i].removeChild(rows[i].lastChild);
        }
    }
    
    // Daten für jede Kategorie einfügen
    
    // 1. Mieteinnahmen
    fillCategoryRow('income', (yearData) => yearData.rent);
    fillDetailRow('income', 0, (yearData) => yearData.rent * 100/(100-yearData.vacancyRate));
    fillDetailRow('income', 1, (yearData) => -(yearData.rent * 100/(100-yearData.vacancyRate) - yearData.rent), true);
    fillDetailRow('income', 2, (yearData) => yearData.rent);
    
    // 2. Bewirtschaftungskosten
    fillCategoryRow('costs', (yearData) => yearData.ongoingCosts, true);
    fillDetailRow('costs', 0, (yearData) => yearData.propertyTax, true);
    fillDetailRow('costs', 1, (yearData) => yearData.managementFee, true);
    fillDetailRow('costs', 2, (yearData) => yearData.maintenanceReserve, true);
    fillDetailRow('costs', 3, (yearData) => yearData.insurance, true);
    fillDetailRow('costs', 4, (yearData) => yearData.ongoingCosts, true);
    
    // 3. Cashflow vor Finanzierung
    fillCategoryRow('cf-before-financing', (yearData) => yearData.cashflowBeforeFinancing);
    
    // 4. Finanzierung
    fillCategoryRow('financing', (yearData) => yearData.payment, true);
    fillDetailRow('financing', 0, (yearData) => yearData.interest, true);
    fillDetailRow('financing', 1, (yearData) => yearData.principal, true);
    fillDetailRow('financing', 2, (yearData) => yearData.payment, true);
    
    // 5. Cashflow vor Steuern
    fillCategoryRow('cf-before-tax', (yearData) => yearData.cashflowBeforeTax);
    
    // 6. Abschreibungen & Steuern
    fillCategoryRow('tax', (yearData) => yearData.totalDepreciation, true);
    fillDetailRow('tax', 0, (yearData) => yearData.buildingDepreciation, true);
    fillDetailRow('tax', 1, (yearData) => yearData.furnitureDepreciation, true);
    fillDetailRow('tax', 2, (yearData) => yearData.maintenanceDeduction, true);
    fillDetailRow('tax', 3, (yearData) => yearData.taxableIncome, false, 'Ergebnis vor Steuern');
    fillDetailRow('tax', 4, (yearData) => yearData.previousIncome);
    fillDetailRow('tax', 5, (yearData) => yearData.newTotalIncome, false, 'Neues zu versteuerndes Gesamteinkommen');
    fillDetailRow('tax', 6, (yearData) => yearData.previousTax, true);
    fillDetailRow('tax', 7, (yearData) => yearData.newTax, true, 'Einkommensteuer (nachher)');
    
    // 7. Steuerersparnis
    fillCategoryRow('tax-savings', (yearData) => yearData.taxSavings);
    
    // 8. Cashflow nach Steuern
    fillCategoryRow('cf-after-tax', (yearData) => yearData.cashflow);
    
    // 9. Vermögenswerte
    fillCategoryRow('assets', (yearData) => yearData.equity);
    fillDetailRow('assets', 0, (yearData) => yearData.propertyValue);
    fillDetailRow('assets', 1, (yearData) => yearData.loanBalance, true);
    fillDetailRow('assets', 2, (yearData) => yearData.equity);
    fillDetailRow('assets', 3, (yearData) => (yearData.cashflow / yearData.initialEquity * 100).toFixed(2) + ' %');
    
    // Helfer-Funktion zum Befüllen einer Kategoriezeile mit Werten
    function fillCategoryRow(category, valueFunction, isExpense = false) {
        const row = document.querySelector(`.main-row[data-category="${category}"]`);
        
        window.yearlyData.forEach((yearData) => {
            const td = document.createElement('td');
            const value = valueFunction(yearData);
            td.textContent = formatCurrency(value);
            
            // Positive Werte grün, negative rot (für Ausgaben umgekehrt)
            if ((isExpense && value < 0) || (!isExpense && value > 0)) {
                td.className = 'positive-value';
            } else if ((isExpense && value > 0) || (!isExpense && value < 0)) {
                td.className = 'negative-value';
            }
            
            row.appendChild(td);
        });
    }
    
    // Helfer-Funktion zum Befüllen einer Detailzeile mit Werten
    function fillDetailRow(category, rowIndex, valueFunction, isExpense = false, customLabel = null) {
        const rows = document.querySelectorAll(`.detail-row[data-category="${category}"]`);
        const row = rows[rowIndex];
        
        // Optional: Wenn ein benutzerdefiniertes Label angegeben wurde, setze es
        if (customLabel) {
            const labelCell = row.querySelector('.detail-label');
            if (labelCell) {
                labelCell.textContent = customLabel;
            }
        }
        
        window.yearlyData.forEach((yearData) => {
            const td = document.createElement('td');
            const value = valueFunction(yearData);
            
            // Wenn es sich um einen Prozentsatz handelt, nicht formatCurrency verwenden
            if (typeof value === 'string' && value.includes('%')) {
                td.textContent = value;
            } else {
                td.textContent = formatCurrency(value);
            }
            
            // Positive Werte grün, negative rot (für Ausgaben umgekehrt)
            if ((isExpense && value < 0) || (!isExpense && value > 0)) {
                td.className = 'positive-value';
            } else if ((isExpense && value > 0) || (!isExpense && value < 0)) {
                td.className = 'negative-value';
            }
            
            row.appendChild(td);
        });
    }
}

// 5. Zusammenfassung berechnen
function calculateSummary() {
    if (!window.calculationResults) {
        calculateCashflow();
        if (!window.calculationResults) {
            alert('Es konnten keine Ergebnisse berechnet werden.');
            return;
        }
    }
    
    const results = window.calculationResults;
    const calculationPeriod = parseFloat(document.getElementById('calculation-period').value);
    
    // Calculate total ROI
    const equityGrowth = results.finalEquity - results.initialEquity;
    const annualizedROI = Math.pow(results.finalEquity / results.initialEquity, 1 / calculationPeriod) - 1;
    
    document.getElementById('summary-total-cost').textContent = formatCurrency(results.totalCost);
    document.getElementById('summary-equity').textContent = formatCurrency(results.initialEquity);
    document.getElementById('summary-loan').textContent = formatCurrency(results.loanAmount);
    document.getElementById('summary-monthly-payment').textContent = formatCurrency(results.monthlyPayment);
    document.getElementById('summary-monthly-cashflow').textContent = formatCurrency(results.monthlyCashflow);
    document.getElementById('summary-final-value').textContent = formatCurrency(results.finalPropertyValue);
    document.getElementById('summary-remaining-debt').textContent = formatCurrency(results.remainingLoan);
    document.getElementById('summary-equity-growth').textContent = formatCurrency(equityGrowth);
    document.getElementById('summary-total-roi').textContent = (annualizedROI * 100).toFixed(2) + ' %';
}

// Funktion zum Erstellen des Cashflow-Charts
function createCashflowChart(years, cashflows, propertyValues, equityValues, loanValues) {
    try {
        const chartCanvas = document.getElementById('cashflowChart');
        
        if (!chartCanvas) {
            console.error('Chart canvas element not found');
            return;
        }
        
        // Prüfen, ob Chart.js geladen ist
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library not loaded');
            return;
        }
        
        // Versuche, den Kontext zu erhalten
        let ctx;
        try {
            ctx = chartCanvas.getContext('2d');
        } catch (e) {
            console.error('Failed to get canvas context:', e);
            return;
        }
        
        // Sicheres Löschen des alten Charts
        if (cashflowChart && typeof cashflowChart.destroy === 'function') {
            cashflowChart.destroy();
        } else if (cashflowChart) {
            // Fallback, wenn destroy nicht funktioniert
            cashflowChart = null;
        }
        
        // Neuen Chart erstellen
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
                        borderDash: [5, 5] // gestrichelte Linie für bessere Unterscheidung
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

// Funktion zum Exportieren der Jahrestabelle als CSV
function exportTableToCSV() {
    // CSV-Inhalt erstellen
    let csvContent = 'Kategorie';
    
    // Jahre als Spaltenüberschriften
    for (let i = 0; i < window.yearlyData.length; i++) {
        csvContent += ';Jahr ' + (i + 1);
    }
    csvContent += '\n';
    
    // Daten für jede Kategorie und Details
    
    // 1. Mieteinnahmen
    addCsvRow('Mieteinnahmen', (yearData) => yearData.rent);
    addCsvRow('  Mieteinnahmen (brutto)', (yearData) => yearData.rent * 100/(100-yearData.vacancyRate));
    addCsvRow('  Leerstand', (yearData) => -(yearData.rent * 100/(100-yearData.vacancyRate) - yearData.rent));
    addCsvRow('  Effektive Mieteinnahmen', (yearData) => yearData.rent);
    
    // 2. Bewirtschaftungskosten
    addCsvRow('Bewirtschaftungskosten', (yearData) => yearData.ongoingCosts);
    addCsvRow('  Grundsteuer', (yearData) => yearData.propertyTax);
    addCsvRow('  Hausverwaltung', (yearData) => yearData.managementFee);
    addCsvRow('  Instandhaltungsrücklage', (yearData) => yearData.maintenanceReserve);
    addCsvRow('  Versicherungen', (yearData) => yearData.insurance);
    
    // 3. Cashflow vor Finanzierung
    addCsvRow('Cashflow vor Finanzierung', (yearData) => yearData.cashflowBeforeFinancing);
    
    // 4. Finanzierung
    addCsvRow('Finanzierung', (yearData) => yearData.payment);
    addCsvRow('  Zinsanteil', (yearData) => yearData.interest);
    addCsvRow('  Tilgungsanteil', (yearData) => yearData.principal);
    
    // 5. Cashflow vor Steuern
    addCsvRow('Cashflow vor Steuern', (yearData) => yearData.cashflowBeforeTax);
    
    // 6. Abschreibungen & Steuern
    addCsvRow('Abschreibungen & Steuern', (yearData) => yearData.totalDepreciation);
    addCsvRow('  AfA Gebäude', (yearData) => yearData.buildingDepreciation);
    addCsvRow('  AfA Möbel', (yearData) => yearData.furnitureDepreciation);
    addCsvRow('  Erhaltungsaufwand', (yearData) => yearData.maintenanceDeduction);
    addCsvRow('  Ergebnis vor Steuern', (yearData) => yearData.taxableIncome);
    addCsvRow('  Zu versteuerndes Einkommen (vorher)', (yearData) => yearData.previousIncome);
    addCsvRow('  Neues zu versteuerndes Gesamteinkommen', (yearData) => yearData.newTotalIncome);
    addCsvRow('  Einkommensteuer (vorher)', (yearData) => yearData.previousTax);
    addCsvRow('  Einkommensteuer (nachher)', (yearData) => yearData.newTax);
    
    // 7. Steuerersparnis
    addCsvRow('Steuerersparnis', (yearData) => yearData.taxSavings);
    
    // 8. Cashflow nach Steuern
    addCsvRow('Cashflow nach Steuern', (yearData) => yearData.cashflow);
    
    // 9. Vermögenswerte
    addCsvRow('Vermögenswerte', (yearData) => yearData.equity);
    addCsvRow('  Immobilienwert', (yearData) => yearData.propertyValue);
    addCsvRow('  Restschuld', (yearData) => yearData.loanBalance);
    addCsvRow('  Eigenkapital', (yearData) => yearData.equity);
    addCsvRow('  Eigenkapitalrendite (%)', (yearData) => (yearData.cashflow / yearData.initialEquity * 100).toFixed(2), true);
    
    // Helfer-Funktion zum Hinzufügen einer Zeile zur CSV
    function addCsvRow(label, valueFunction, isPercentage = false) {
        csvContent += label;
        
        window.yearlyData.forEach((yearData) => {
            const value = valueFunction(yearData);
            
            if (isPercentage) {
                csvContent += ';' + value.replace('.', ',');
            } else {
                csvContent += ';' + value.toFixed(2).replace('.', ',');
            }
        });
        
        csvContent += '\n';
    }
    
    // CSV-Datei erstellen und herunterladen
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'immobilien-jahresübersicht.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Detailfunktion zum Umschalten der aufklappbaren Zeilen
function toggleDetails(row) {
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

// 1. Kaufkosten berechnen
function calculatePurchase() {
    const purchasePrice = parseFloat(document.getElementById('purchase-price').value);
    const grunderwerbsteuerRate = parseFloat(document.getElementById('grunderwerbsteuer').value);
    const notaryRate = parseFloat(document.getElementById('notary-costs').value);
    const brokerRate = parseFloat(document.getElementById('broker-fee').value);
    
    const grunderwerbsteuer = purchasePrice * (grunderwerbsteuerRate / 100);
    const notaryCosts = purchasePrice * (notaryRate / 100);
    const brokerFee = purchasePrice * (brokerRate / 100);
    const totalExtra = grunderwerbsteuer + notaryCosts + brokerFee;
    const totalCost = purchasePrice + totalExtra;
    
    // Kaufpreisaufteilung direkt als Werte einlesen
    const landValue = parseFloat(document.getElementById('land-value').value);
    const buildingValue = parseFloat(document.getElementById('building-value').value);
    const maintenanceCost = parseFloat(document.getElementById('maintenance-cost').value);
    const furnitureValue = parseFloat(document.getElementById('furniture-value').value);
    const maintenanceDistribution = parseInt(document.getElementById('maintenance-distribution').value);
    
    const annualMaintenance = maintenanceCost / maintenanceDistribution;
    
    // Summe der Kaufpreisaufteilung prüfen und Warnung anzeigen, wenn nötig
    const totalAllocation = landValue + buildingValue + furnitureValue;
    const warningElement = document.getElementById('price-validation-warning');
    
    if (Math.abs(totalAllocation - purchasePrice) > 1) { // Toleranz von 1€ für Rundungsfehler
        warningElement.style.display = 'block';
        warningElement.textContent = `Warnung: Die Summe der Kaufpreisaufteilung (${formatCurrency(totalAllocation)}) entspricht nicht dem Gesamtkaufpreis (${formatCurrency(purchasePrice)})!`;
    } else {
        warningElement.style.display = 'none';
    }
    
    // Prozentuale Anteile berechnen (für mögliche Verwendung im Code)
    const landValuePercentage = (landValue / purchasePrice) * 100;
    const buildingValuePercentage = (buildingValue / purchasePrice) * 100;
    
    // Kaufpreisaufteilung anzeigen
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
    
    // Gebäudewert wird nicht mehr separat gesetzt, da er direkt aus der Kaufpreisaufteilung kommt
    
    return {
        purchasePrice,
        grunderwerbsteuer,
        notaryCosts,
        brokerFee,
        totalExtra,
        totalCost,
        landValue,
        buildingValue,
        maintenanceCost,
        furnitureValue,
        annualMaintenance,
        maintenanceDistribution,
        landValuePercentage,
        buildingValuePercentage
    };
}