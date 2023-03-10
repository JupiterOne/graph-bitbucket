import { RelationshipClass, StepSpec } from '@jupiterone/integration-sdk-core';
import { IntegrationConfig } from '../../../src/config';

export const groupSpec: StepSpec<IntegrationConfig>[] = [
  {
    id: 'fetch-groups',
    name: 'Fetch Groups',
    entities: [
      {
        resourceName: 'Bitbucket Group',
        _type: 'bitbucket_group',
        _class: 'UserGroup',
      },
    ],
    relationships: [
      {
        _type: 'bitbucket_workspace_has_group',
        sourceType: 'bitbucket_workspace',
        _class: RelationshipClass.HAS,
        targetType: 'bitbucket_group',
      },
      {
        _type: 'bitbucket_group_has_user',
        sourceType: 'bitbucket_group',
        _class: RelationshipClass.HAS,
        targetType: 'bitbucket_user',
      },
      {
        _type: 'bitbucket_user_owns_group',
        sourceType: 'bitbucket_user',
        _class: RelationshipClass.OWNS,
        targetType: 'bitbucket_group',
      },
    ],
    dependsOn: ['fetch-users', 'fetch-workspaces'],
    implemented: true,
  },
];
