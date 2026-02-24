/**
 * Deal stages
 */
export const DEAL_STAGES = {
  LEAD: 'lead',
  QUALIFIED: 'qualified',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  WON: 'won',
  LOST: 'lost'
} as const;

export type DealStage = typeof DEAL_STAGES[keyof typeof DEAL_STAGES];

/**
 * Deal stage display names
 */
export const DEAL_STAGE_DISPLAY: Record<DealStage, string> = {
  [DEAL_STAGES.LEAD]: 'Lead',
  [DEAL_STAGES.QUALIFIED]: 'Qualified',
  [DEAL_STAGES.PROPOSAL]: 'Proposal',
  [DEAL_STAGES.NEGOTIATION]: 'Negotiation',
  [DEAL_STAGES.WON]: 'Won',
  [DEAL_STAGES.LOST]: 'Lost'
};

/**
 * Deal stage colors
 */
export const DEAL_STAGE_COLORS: Record<DealStage, string> = {
  [DEAL_STAGES.LEAD]: '#3B82F6',
  [DEAL_STAGES.QUALIFIED]: '#8B5CF6',
  [DEAL_STAGES.PROPOSAL]: '#F59E0B',
  [DEAL_STAGES.NEGOTIATION]: '#EF4444',
  [DEAL_STAGES.WON]: '#10B981',
  [DEAL_STAGES.LOST]: '#6B7280'
};

/**
 * Deal stage order (for pipeline progression)
 */
export const DEAL_STAGE_ORDER: Record<DealStage, number> = {
  [DEAL_STAGES.LEAD]: 0,
  [DEAL_STAGES.QUALIFIED]: 1,
  [DEAL_STAGES.PROPOSAL]: 2,
  [DEAL_STAGES.NEGOTIATION]: 3,
  [DEAL_STAGES.WON]: 4,
  [DEAL_STAGES.LOST]: 5
};

/**
 * Deal stage probabilities (default %)
 */
export const DEAL_STAGE_PROBABILITIES: Record<DealStage, number> = {
  [DEAL_STAGES.LEAD]: 10,
  [DEAL_STAGES.QUALIFIED]: 30,
  [DEAL_STAGES.PROPOSAL]: 50,
  [DEAL_STAGES.NEGOTIATION]: 70,
  [DEAL_STAGES.WON]: 100,
  [DEAL_STAGES.LOST]: 0
};

/**
 * Check if stage is active (not won/lost)
 */
export const isActiveStage = (stage: DealStage): boolean => {
  return ![DEAL_STAGES.WON, DEAL_STAGES.LOST].includes(stage);
};

/**
 * Get next stage in pipeline
 */
export const getNextStage = (stage: DealStage): DealStage | null => {
  const order = DEAL_STAGE_ORDER[stage];
  const nextOrder = order + 1;
  
  const nextStage = Object.entries(DEAL_STAGE_ORDER).find(
    ([, value]) => value === nextOrder
  )?.[0];
  
  return nextStage as DealStage || null;
};

/**
 * Get previous stage in pipeline
 */
export const getPreviousStage = (stage: DealStage): DealStage | null => {
  const order = DEAL_STAGE_ORDER[stage];
  const prevOrder = order - 1;
  
  const prevStage = Object.entries(DEAL_STAGE_ORDER).find(
    ([, value]) => value === prevOrder
  )?.[0];
  
  return prevStage as DealStage || null;
};

/**
 * Get all active stages
 */
export const getActiveStages = (): DealStage[] => {
  return Object.values(DEAL_STAGES).filter(isActiveStage);
};

/**
 * Get stage icon name
 */
export const getStageIcon = (stage: DealStage): string => {
  const icons: Record<DealStage, string> = {
    [DEAL_STAGES.LEAD]: 'user-plus',
    [DEAL_STAGES.QUALIFIED]: 'check-circle',
    [DEAL_STAGES.PROPOSAL]: 'file-text',
    [DEAL_STAGES.NEGOTIATION]: 'handshake',
    [DEAL_STAGES.WON]: 'trophy',
    [DEAL_STAGES.LOST]: 'times-circle'
  };
  
  return icons[stage];
};