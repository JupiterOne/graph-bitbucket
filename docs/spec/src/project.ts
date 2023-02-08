import { RelationshipClass, StepSpec } from '@jupiterone/integration-sdk-core';
import { IntegrationConfig } from '../../../src/config';

export const projectSpec: StepSpec<IntegrationConfig>[] = [
  {
    id: 'fetch-projects',
    name: 'Fetch Projects',
    entities: [
      {
        resourceName: 'Bitbucket Project',
        _type: 'bitbucket_project',
        _class: ['Project'],
      },
    ],
    relationships: [
      {
        _type: 'bitbucket_workspace_owns_project',
        sourceType: 'bitbucket_workspace',
        _class: RelationshipClass.OWNS,
        targetType: 'bitbucket_project',
      },
    ],
    dependsOn: ['fetch-workspaces'],
    implemented: true,
  },
];
