export enum PRIORITY {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
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
  variable?: string
  variableMasked?: string
  schedule?: string
  action?: string
}
