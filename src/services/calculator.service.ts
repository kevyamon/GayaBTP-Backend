export interface BudgetCalculationInput {
  priceFCFA: number;
  includeACDInstruction?: boolean;
  includeSurveyBornage?: boolean;
}

export interface BudgetEstimationBreakdown {
  propertyPriceFCFA: number;
  notaryFees: {
    rateMinPercent: number;
    rateMaxPercent: number;
    amountMinFCFA: number;
    amountMaxFCFA: number;
  };
  dgiRegistrationFees: {
    ratePercent: number;
    amountFCFA: number;
  };
  surveyBornageFees: {
    amountMinFCFA: number;
    amountMaxFCFA: number;
  };
  acdAdministrativeFees: {
    amountMinFCFA: number;
    amountMaxFCFA: number;
  };
  totalEstimatedFees: {
    minFCFA: number;
    maxFCFA: number;
  };
  totalEstimatedBudget: {
    minFCFA: number;
    maxFCFA: number;
  };
  disclaimer: string;
}

class CalculatorService {
  calculateTransactionBudget(input: BudgetCalculationInput): BudgetEstimationBreakdown {
    const price = Math.max(0, input.priceFCFA);
    const includeACD = input.includeACDInstruction ?? true;
    const includeSurvey = input.includeSurveyBornage ?? true;

    // 1. Frais de notaire (4% a 7%)
    const notaryMin = Math.round(price * 0.04);
    const notaryMax = Math.round(price * 0.07);

    // 2. Droits d'enregistrement DGI (2%)
    const dgi = Math.round(price * 0.02);

    // 3. Bornage et geometre expert (100 000 a 300 000 FCFA si applicable)
    const surveyMin = includeSurvey ? 100000 : 0;
    const surveyMax = includeSurvey ? 300000 : 0;

    // 4. Frais d'instruction administrative ACD (50 000 a 150 000 FCFA si applicable)
    const acdMin = includeACD ? 50000 : 0;
    const acdMax = includeACD ? 150000 : 0;

    // Calcul des totaux
    const totalFeesMin = notaryMin + dgi + surveyMin + acdMin;
    const totalFeesMax = notaryMax + dgi + surveyMax + acdMax;

    return {
      propertyPriceFCFA: price,
      notaryFees: {
        rateMinPercent: 4,
        rateMaxPercent: 7,
        amountMinFCFA: notaryMin,
        amountMaxFCFA: notaryMax,
      },
      dgiRegistrationFees: {
        ratePercent: 2,
        amountFCFA: dgi,
      },
      surveyBornageFees: {
        amountMinFCFA: surveyMin,
        amountMaxFCFA: surveyMax,
      },
      acdAdministrativeFees: {
        amountMinFCFA: acdMin,
        amountMaxFCFA: acdMax,
      },
      totalEstimatedFees: {
        minFCFA: totalFeesMin,
        maxFCFA: totalFeesMax,
      },
      totalEstimatedBudget: {
        minFCFA: price + totalFeesMin,
        maxFCFA: price + totalFeesMax,
      },
      disclaimer:
        'Ces valeurs sont fournies a titre purement indicatif et estimatif selon les baremes en vigueur en Cote d Ivoire. Elles ne constituent en aucun cas une garantie tarifaire ou un engagement juridique.',
    };
  }
}

export const calculatorService = new CalculatorService();
