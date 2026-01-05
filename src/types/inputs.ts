export enum PRIORITY {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
}

export enum REGION {
  EU = 'EU',
  US = 'US',
  AP = 'AP',
}

export interface IInputs {
  workspace: string
  project: string
  identifier: string
  comment?: string
  wait?: string
  branch?: string
  tag?: string
  revision?: string
  pullRequest?: string
  refresh?: boolean
  clearCache?: boolean
  priority?: string
  region?: string
  variable?: string
  variableMasked?: string
  schedule?: string
  action?: string
  api?: string
}
