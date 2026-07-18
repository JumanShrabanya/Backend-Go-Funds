/**
 * All enums used by the Planner / Recommendation Engine.
 * These represent user questionnaire inputs and derived internal states.
 */

export enum InvestmentGoal {
  WEALTH_CREATION = 'wealth_creation',
  RETIREMENT = 'retirement',
  HOUSE_PURCHASE = 'house_purchase',
  CHILD_EDUCATION = 'child_education',
  EMERGENCY_FUND = 'emergency_fund',
  TAX_SAVING = 'tax_saving',
}

export enum InvestmentHorizon {
  LESS_THAN_3_YEARS = 'less_than_3_years',   // < 3 years
  THREE_TO_FIVE_YEARS = '3_to_5_years',       // 3–5 years
  FIVE_TO_TEN_YEARS = '5_to_10_years',        // 5–10 years
  MORE_THAN_10_YEARS = 'more_than_10_years',  // 10+ years
}

export enum MarketFallReaction {
  SELL = 'sell',          // 0 pts — panics and exits
  WAIT = 'wait',          // 15 pts — holds steady
  BUY_MORE = 'buy_more',  // 30 pts — sees opportunity
}

export enum InvestmentMode {
  SIP = 'sip',
  LUMP_SUM = 'lump_sum',
  BOTH = 'both',
}

export enum InvestmentExperience {
  NONE = 'none',             // 2 pts
  LESS_THAN_2_YEARS = 'less_than_2_years',  // 5 pts
  MORE_THAN_2_YEARS = 'more_than_2_years',  // 10 pts
}

export enum EmergencyFundStatus {
  NO_FUND = 'no_fund',             // 0 pts
  THREE_TO_SIX_MONTHS = '3_to_6_months',  // 5 pts
  MORE_THAN_6_MONTHS = 'more_than_6_months',  // 10 pts
}


export enum RiskProfile {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive',
}
