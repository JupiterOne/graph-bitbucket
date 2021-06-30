import {
  IntegrationExecutionContext,
  IntegrationValidationError,
} from '@jupiterone/integration-sdk-core';

import BitbucketClient from './clients/BitbucketClient';
import { IntegrationConfig, sanitizeConfig } from './config';
import {
  BitbucketGroup,
  BitbucketPR,
  BitbucketProject,
  BitbucketRepo,
  BitbucketUser,
  BitbucketWorkspace,
} from './types/bitbucket';

export type ResourceIteratee<T> = (each: T) => Promise<void> | void;

/**
 * An APIClient maintains authentication state and provides an interface to
 * third party data APIs.
 *
 * It is recommended that integrations wrap provider data APIs to provide a
 * place to handle error responses and implement common patterns for iterating
 * resources.
 */
export class APIClient {
  bitbucket: BitbucketClient;
  constructor(
    readonly config: IntegrationConfig,
    context: IntegrationExecutionContext,
  ) {
    sanitizeConfig(config); //sets pull requests no matter what
    try {
      this.bitbucket = new BitbucketClient(context.logger, {
        oauthKey: config.oauthKey,
        oauthSecret: config.oauthSecret,
        workspace: config.workspace, //only used for error reporting
        ingestPullRequests: config.ingestPullRequests,
      });
    } catch (err) {
      throw new IntegrationValidationError(
        'Could not validate the config and get Bitbucket clients',
      );
    }
  }

  public async verifyAuthentication(): Promise<void> {
    await this.bitbucket.authenticate(); //failure errors provided by client
  }

  /**
   * Iterates each Bitbucket workspace.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateWorkspaces(
    iteratee: ResourceIteratee<BitbucketWorkspace>,
  ): Promise<void> {
    const names = this.config.workspace;
    const workspaces: BitbucketWorkspace[] = await Promise.all(
      names.map((name) => {
        return this.bitbucket.getWorkspace(name);
      }),
    );

    for (const workspace of workspaces) {
      await iteratee(workspace);
    }
  }

  /**
   * Iterates each Bitbucket user for a given workspace.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateUsers(
    workspaceSlug: string,
    iteratee: ResourceIteratee<BitbucketUser>,
  ): Promise<void> {
    const users: BitbucketUser[] = await this.bitbucket.getAllWorkspaceMembers(
      workspaceSlug,
    );

    for (const user of users) {
      await iteratee(user);
    }
  }

  /**
   * Iterates each Bitbucket group for a given workspace.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateGroups(
    workspaceSlug: string,
    iteratee: ResourceIteratee<BitbucketGroup>,
  ): Promise<void> {
    const groups: BitbucketGroup[] = await this.bitbucket.getAllWorkspaceGroups(
      workspaceSlug,
    );

    for (const group of groups) {
      await iteratee(group);
    }
  }

  /**
   * Iterates each Bitbucket project for a given workspace.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateProjects(
    workspaceSlug: string,
    iteratee: ResourceIteratee<BitbucketProject>,
  ): Promise<void> {
    const projects: BitbucketProject[] = await this.bitbucket.getAllProjects(
      workspaceSlug,
    );

    for (const project of projects) {
      await iteratee(project);
    }
  }

  /**
   * Iterates each Bitbucket repo for a given workspace.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateRepos(
    workspaceUuid: string,
    iteratee: ResourceIteratee<BitbucketRepo>,
  ): Promise<void> {
    const repos: BitbucketRepo[] = await this.bitbucket.getAllRepos(
      workspaceUuid,
    );

    for (const repo of repos) {
      await iteratee(repo);
    }
  }

  /**
   * Iterates each Bitbucket pull request for a given workspace and repo combination.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iteratePRs(
    workspaceUuid: string,
    repoUuid: string,
    requestFilter: string,
    iteratee: ResourceIteratee<BitbucketPR>,
  ): Promise<void> {
    const pullRequests: BitbucketPR[] = await this.bitbucket.getAllPRs(
      workspaceUuid,
      repoUuid,
      requestFilter,
    );

    //for performance reasons, getAllPRs does not provide all PR properties
    //to get all properties for a PR, you have to pull the PRs individually
    //but, that's potentially hitting the API a lot
    //properties that we know are missing in .getAllPRs are
    // `reviewers` and `participants`
    for (const pr of pullRequests) {
      if (this.config.enrichedPrs) {
        const enrichedPr: BitbucketPR = await this.bitbucket.getPR(
          workspaceUuid,
          repoUuid,
          pr.id,
        );
        await iteratee(enrichedPr);
      } else {
        await iteratee(pr);
      }
    }
  }
}

export function createAPIClient(
  config: IntegrationConfig,
  context: IntegrationExecutionContext,
): APIClient {
  return new APIClient(config, context);
}
