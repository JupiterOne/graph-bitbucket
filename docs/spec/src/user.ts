import { RelationshipClass, StepSpec } from '@jupiterone/integration-sdk-core';
import { IntegrationConfig } from '../../../src/config';

export const userSpec: StepSpec<IntegrationConfig>[] = [
  {
    id: 'fetch-users',
    name: 'Fetch Users',
    entities: [
      {
        resourceName: 'Bitbucket User',
        _type: 'bitbucket_user',
        _class: ['User'],
      },
    ],
    relationships: [
      {
        _type: 'bitbucket_workspace_has_user',
        sourceType: 'bitbucket_workspace',
        _class: RelationshipClass.HAS,
        targetType: 'bitbucket_user',
      },
    ],
    dependsOn: ['fetch-workspaces'],
    implemented: true,
  },
];
