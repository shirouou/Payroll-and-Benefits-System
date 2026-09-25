const {
  calculateSSSContribution,
  calculatePhilHealthContribution,
  calculatePagIbigContribution,
  calculateWithholdingTax,
  calculateNetPay,
} = require('../utils/helpers');

describe('Payroll calculation helpers', () => {
  it('applies realistic 2025 employee contribution caps for SSS, PhilHealth and Pag-IBIG', () => {
    const salary = 50000;

    expect(calculateSSSContribution(salary)).toBeLessThanOrEqual(1350);
    expect(calculatePhilHealthContribution(salary)).toBeLessThanOrEqual(2500);
    expect(calculatePagIbigContribution(salary)).toBeLessThanOrEqual(200);
  });

  it('uses progressive withholding tax bands rather than a flat rate', () => {
    expect(calculateWithholdingTax(25000)).toBe(0);
    expect(calculateWithholdingTax(50000)).toBeGreaterThan(0);
    expect(calculateWithholdingTax(50000)).toBeLessThan(50000);
  });

  it('deducts all statutory contributions and tax from gross pay', () => {
    const grossSalary = 50000;
    const deductions = [
      { name: 'SSS', amount: calculateSSSContribution(grossSalary) },
      { name: 'PhilHealth', amount: calculatePhilHealthContribution(grossSalary) },
      { name: 'Pag-IBIG', amount: calculatePagIbigContribution(grossSalary) },
      { name: 'Withholding Tax', amount: calculateWithholdingTax(grossSalary) },
    ];

    expect(calculateNetPay(grossSalary, deductions)).toBeLessThan(grossSalary);
    expect(calculateNetPay(grossSalary, deductions)).toBeGreaterThanOrEqual(0);
  });
});
