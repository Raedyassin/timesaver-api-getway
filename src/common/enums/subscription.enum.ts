export enum SubScriptionStatus {
  ACTIVE = 'active', // the current active subscription
  CANCELLED = 'cancelled', // when user is cancelled his subscription
  EXPIRED = 'expired', // when subscription is expired (not cancelled) is be an old subscription (be expired when the stripe send renewal webhook)
}
export enum SubscriptionType {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  ONETIME = 'one-time', // for extra credits
}
