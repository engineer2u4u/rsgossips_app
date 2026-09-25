// The budget figure a creator sees for a campaign — shared by the list card
// and the campaign detail screen so the two can never disagree about it.
//
// Port of the web helper (rgossips_web/src/utils/campaignBudget.js); keep the
// two in step.
//
// A barter campaign has no cash budget, so list-campaigns reports its budget
// as "On request". That is accurate but it hides the one number a creator
// actually wants: what the product is worth. brand-campaigns stores that as
// product_value and list-campaigns already returns it as `productValue`.
//
// Every figure reads as a ceiling — "Up to ₹X" — because that is what both of
// them are: product_value is what the item is worth, and budget_per_influencer
// is the most the brand will pay, with the creator pitching a rate under it.
// The only text left unprefixed is a non-amount like "On request", which a
// barter campaign with no product value keeps rather than having a number
// invented for it.

/** What the figure means, so each surface labels it the same way.
 *  product — the item's worth, on a barter campaign
 *  cash    — a cash ceiling, on paid OR hybrid alike: the creator's own rate
 *            card settles the figure within it, hence "As per profile"
 *            rather than "Budget"
 *  none    — no amount at all ("On request") */
export type BudgetKind = 'product' | 'cash' | 'none';

export interface CampaignBudgetDisplay {
  text: string;
  isProductValue: boolean;
  kind: BudgetKind;
}

export function campaignBudgetDisplay(campaign: any): CampaignBudgetDisplay {
  const type = String(campaign?.campaignType || '').toLowerCase();
  const productValue = Number(campaign?.productValue) || 0;
  if (type === 'barter' && productValue > 0) {
    return {
      text: `Up to ₹${productValue.toLocaleString('en-IN')}`,
      isProductValue: true,
      kind: 'product',
    };
  }

  // Gated on the leading ₹ rather than on campaign type: list-campaigns emits
  // "On request" when no budget is set, and "Up to On request" is nonsense.
  // That also covers hybrid, whose cash leg is the same field with the same
  // ceiling meaning.
  const budget: string = campaign?.budget || '';
  if (budget.startsWith('₹')) {
    return {text: `Up to ${budget}`, isProductValue: false, kind: 'cash'};
  }
  return {text: budget, isProductValue: false, kind: 'none'};
}

/** i18n key for the label under the figure, matching web's wording. */
export function budgetLabelKey(kind: BudgetKind): string {
  return kind === 'product'
    ? 'ScreensInfluencerOfferDetail.productValueLabel'
    : kind === 'cash'
      ? 'ScreensInfluencerOfferDetail.asPerProfile'
      : 'ScreensInfluencerOfferDetail.budget';
}
