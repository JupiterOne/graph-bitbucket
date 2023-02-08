import { StepSpec } from '@jupiterone/integration-sdk-core';
import { IntegrationConfig } from '../../../src/config';

export const workspaceSpec: StepSpec<IntegrationConfig>[] = [
  {
    id: 'fetch-workspaces',
    name: 'Fetch Workspaces',
    entities: [
      {
        resourceName: 'Bitbucket Workspace',
        _type: 'bitbucket_workspace',
        _class: ['Account'],
      },
    ],
    relationships: [],
    dependsOn: [],
    implemented: true,
  },
];
