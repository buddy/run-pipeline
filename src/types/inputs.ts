export interface PipelineInputs {
  workspace: string;
  project: string;
  identifier: string;
  comment?: string;
  wait?: string;
  branch?: string;
  tag?: string;
  revision?: string;
}
