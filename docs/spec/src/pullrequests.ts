import { RelationshipClass, StepSpec } from '@jupiterone/integration-sdk-core';
import { IntegrationConfig } from '../../../src/config';

export const prsSpec: StepSpec<IntegrationConfig>[] = [
  {
    id: 'fetch-prs',
    name: 'Fetch PRs',
    entities: [
      {
        resourceName: 'Bitbucket Pull Request',
        _type: 'bitbucket_pullrequest',
        _class: ['Review', 'PR'],
        partial: true,
      },
    ],
    relationships: [
      {
        _type: 'bitbucket_repo_has_pullrequest',
        sourceType: 'bitbucket_repo',
        _class: RelationshipClass.HAS,
        targetType: 'bitbucket_pullrequest',
        partial: true,
      },
      {
        _type: 'bitbucket_user_opened_pullrequest',
        sourceType: 'bitbucket_user',
        _class: RelationshipClass.OPENED,
        targetType: 'bitbucket_pullrequest',
        partial: true,
      },
      {
        _type: 'bitbucket_user_approved_pullrequest',
        sourceType: 'bitbucket_user',
        _class: RelationshipClass.APPROVED,
        targetType: 'bitbucket_pullrequest',
        partial: true,
      },
      {
        _type: 'bitbucket_user_reviewed_pullrequest',
        sourceType: 'bitbucket_user',
        _class: RelationshipClass.REVIEWED,
        targetType: 'bitbucket_pullrequest',
        partial: true,
      },
    ],
    dependsOn: ['fetch-repos', 'fetch-users'],
    implemented: true,
  },
];
