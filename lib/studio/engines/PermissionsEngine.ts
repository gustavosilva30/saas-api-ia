export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

export interface FeatureFlags {
  canExport4K: boolean;
  canRemoveBackground: boolean;
  canUsePremiumTemplates: boolean;
  maxProjects: number;
  maxCustomFonts: number;
}

export class PermissionsEngine {
  private currentPlan: SubscriptionPlan = 'free';
  
  // Aqui os flags são definidos com base no plano atual
  private flags: FeatureFlags = this.getDefaultFlagsForPlan('free');

  public setPlan(plan: SubscriptionPlan) {
    this.currentPlan = plan;
    this.flags = this.getDefaultFlagsForPlan(plan);
  }

  public getPlan(): SubscriptionPlan {
    return this.currentPlan;
  }

  public can(feature: keyof FeatureFlags): boolean | number {
    return this.flags[feature];
  }

  public assertCan(feature: keyof FeatureFlags) {
    if (!this.can(feature)) {
      throw new Error(`Permission Denied: Recurso '${feature}' não disponível no plano ${this.currentPlan.toUpperCase()}.`);
    }
  }

  private getDefaultFlagsForPlan(plan: SubscriptionPlan): FeatureFlags {
    switch (plan) {
      case 'enterprise':
        return {
          canExport4K: true,
          canRemoveBackground: true,
          canUsePremiumTemplates: true,
          maxProjects: Infinity,
          maxCustomFonts: Infinity
        };
      case 'pro':
        return {
          canExport4K: true,
          canRemoveBackground: true,
          canUsePremiumTemplates: true,
          maxProjects: 100,
          maxCustomFonts: 50
        };
      case 'free':
      default:
        return {
          canExport4K: false,
          canRemoveBackground: false,
          canUsePremiumTemplates: false,
          maxProjects: 3,
          maxCustomFonts: 0
        };
    }
  }
}

export const globalPermissionsEngine = new PermissionsEngine();
