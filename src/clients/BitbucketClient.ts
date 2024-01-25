import {
  IntegrationProviderAuthenticationError,
  IntegrationConfigLoadError,
  IntegrationLogger,
  IntegrationValidationError,
  IntegrationProviderRetriesExceededError,
  IntegrationProviderAPIError,
  IntegrationWarnEventName,
} from '@jupiterone/integration-sdk-core';
import fetch from 'node-fetch';
import querystring from 'querystring';
import urlJoin from 'url-join';
import {
  BitbucketCommit,
  BitbucketCommitHash,
  BitbucketPR,
  BitbucketPRActivity,
  BitbucketProject,
  BitbucketRepo,
  BitbucketUser,
  BitbucketGroup,
  BitbucketWorkspace,
  BitbucketWorkspaceMembership,
  BitbucketGroupPermission,
  BitbucketUserPermission,
  BitbucketBranchRestriction,
} from '../types';

const BASE_API_URL = 'https://bitbucket.org/api/2.0/';
const OLD_BASE_API_URL = 'https://bitbucket.org/api/1.0/'; //required for groups

interface OAuthAccessTokenResponse {
  access_token: string;
  scopes: string;
}

interface BitbucketPage<T> {
  size: number;
  page: number;
  pagelen: number;
  next: string;
  previous: string;
  values: T[];
}

interface BitbucketClientOptions {
  oauthKey: string;
  oauthSecret: string;
  workspace?: string[];
  ingestPullRequests?: boolean;
}

interface BitbucketAPICalls {
  repositories: number;
  repository: number;
  pullRequests: number;
  pullRequest: number;
  pullRequestActivity: number;
  commits: number;
  diff: number;
  workspaceMembers: number;
  user: number;
  groups: number;
  projects: number;
  project: number;
  workspaces: number;
  workspace: number;
  repositoryGroupPermissions: number;
  repositoryUserPermissions: number;
  repositoryBranchRestrictions: number;
}

function base64(str: string) {
  return Buffer.from(str, 'utf8').toString('base64');
}

export default class BitbucketClient {
  public calls: BitbucketAPICalls;
  private accessTokens: string[];
  private currentAccessToken: number;

  constructor(
    readonly logger: IntegrationLogger,
    readonly config: BitbucketClientOptions,
  ) {
    this.calls = {
      repositories: 0,
      repository: 0,
      pullRequests: 0,
      pullRequest: 0,
      pullRequestActivity: 0,
      commits: 0,
      diff: 0,
      workspaceMembers: 0,
      user: 0,
      groups: 0,
      projects: 0,
      project: 0,
      workspaces: 0,
      workspace: 0,
      repositoryGroupPermissions: 0,
      repositoryUserPermissions: 0,
      repositoryBranchRestrictions: 0,
    };
  }

  //checks to see if all oauthKeys and oauthSecrets yield valid access tokens
  //also points the current access token to use as the first (index 0) token
  public async authenticate() {
    if (!this.config.oauthKey || !this.config.oauthSecret) {
      throw new Error('"oauthKey(s)" and "oauthSecret(s)" are required');
    }

    //the .replace just removes any white spaces in the string,
    //in case someone did 'key1, key2, key3', or with tabs, or whatever
    const oauthKeys = this.config.oauthKey.replace(/\s+/g, '').split(',');
    const oauthSecrets = this.config.oauthSecret.replace(/\s+/g, '').split(',');
    if (!(oauthKeys.length === oauthSecrets.length)) {
      throw new IntegrationValidationError(
        'Number of comma-delimited OAuth keys and secrets differ in the config',
      );
    }

    this.accessTokens = [];
    for (let i = 0; i < oauthKeys.length; i++) {
      const url = 'https://bitbucket.org/site/oauth2/access_token';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${base64(
            oauthKeys[i] + ':' + oauthSecrets[i],
          )}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: querystring.stringify({
          grant_type: 'client_credentials',
        }),
      });

      if (response.status < 200 || response.status >= 400) {
        throw new IntegrationProviderAuthenticationError({
          cause: undefined,
          endpoint: url,
          status: response.status,
          statusText: `Failure requesting '${url}' for OAuth Key ${oauthKeys[i]}. Response status: ${response.status}`,
        });
      }

      const data: OAuthAccessTokenResponse = await response.json();
      this.verifyScopes(data.scopes, oauthKeys[i]);
      this.accessTokens.push(data.access_token);
    }
    this.currentAccessToken = 0;
  }

  private verifyScopes(scopeString, keyNum) {
    const missingScopes: string[] = [];
    if (!/account/.test(scopeString)) {
      missingScopes.push('Account');
    }
    if (!/project/.test(scopeString)) {
      missingScopes.push('Projects');
    }
    if (this.config.ingestPullRequests && !/pullrequest/.test(scopeString)) {
      missingScopes.push('Pull requests');
    }
    if (missingScopes.length > 0) {
      let statusText = `Required scope(s) "${missingScopes}" not set for OAuth Key ${keyNum}. Check permissions for the OAuth consumer under Workspace settings.`;
      if (this.config.workspace) {
        statusText = `Required scope(s) "${missingScopes}" not set for OAuth Key ${keyNum}. Check permissions for the OAuth consumer under Workspace settings at https://bitbucket.org/${this.config.workspace[0]}/workspace/settings/api`;
      }
      throw new IntegrationProviderAuthenticationError({
        cause: undefined,
        endpoint: `https://bitbucket.org/site/oauth2/access_token`,
        status: 'Insufficient scope for token',
        statusText: statusText,
      });
    }
  }

  //the actual moment that we hit the API
  //including logic for handling rate-limiting (status 429) errors by going to the next access token
  //Bitbucket limits calls to repos, PRs, and details of PRs to 1000 per hour for each OAuth key/secret
  //therefore, some clients get around this limit by configuring multiple OAuth key/secrets for the account
  //these are provided in the config file by delimiting them with commas
  async makeGetRequest<T>(
    url: string,
    options?: {
      ignoreNotFound?: boolean;
      useOldApi?: boolean;
    },
  ) {
    if (!this.accessTokens) {
      await this.authenticate();
    }
    try {
      if (!url.startsWith('https://')) {
        if (options?.useOldApi) {
          url = urlJoin(OLD_BASE_API_URL, url);
        } else {
          url = urlJoin(BASE_API_URL, url);
        }
      }
      this.logger.info(`Requesting ${url}...`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessTokens[this.currentAccessToken]}`,
        },
        timeout: 10000,
      });

      this.logger.info(`Got response for ${url} (status=${response.status})`);

      if (response.status === 404 && options?.ignoreNotFound) {
        return {
          data: undefined,
          status: response.status,
        };
      }

      //if we get a rate-limiting 429 message, go to the next access token, if there is one
      //
      //currently, this code does not go back to earlier tokens, because it only takes 5 to 7 minutes
      //to exhaust the 1000 API call limit, so the earlier token will only have refreshed a little.
      //They refresh 1000/hour, which is 16.67/min, so after 5 min, the credentials that got limited
      //the first time would only have recovered 80 to 100 calls.
      //
      //theoretically, if a client had many credentials loaded, it could be worth rotating back
      //to earlier credentials. But, our code can easily hit the API multiple times per second, and
      //the refresh on rate-limiting works out to 3.6 seconds per call. So, if we got to a state where
      //we were continuously rotating between completely exhausted credentials, we might get 429
      //responses 8 to 10 times for each 1 time that a little bit of data slips through.
      //Timers would be better, if such a feature is desired, where we take say a 5 minute break
      //before restarting the use of a previously rate-limited set of credentials.
      if (response.status === 429) {
        if (this.currentAccessToken + 1 < this.accessTokens.length) {
          this.logger.warn(
            `Rate limiting encountered on token ${
              this.currentAccessToken
            }. Going to access token ${this.currentAccessToken + 1}.`,
          );
          this.currentAccessToken++;
          await this.makeGetRequest<T>(url, options);
        } else {
          throw new IntegrationProviderRetriesExceededError({
            endpoint: url,
            status: response.status,
            statusText: `Failure requesting '${url}' due to rate-limiting. Please add another set of key/secret credentials to this account.`,
          });
        }
      }

      //some error that is not rate-limiting
      if (response.status < 200 || response.status >= 400) {
        throw new IntegrationProviderAPIError({
          endpoint: url,
          status: response.status,
          statusText: `Failure requesting '${url}'. Response status: ${response.status}. See Errors & Validation under https://docs.atlassian.com/bitbucket-server/rest/7.13.0/bitbucket-branch-rest.html`,
        });
      }

      return {
        data: await response.json(),
        status: response.status,
      };
    } catch (err) {
      if (err instanceof IntegrationProviderAPIError) {
        throw err;
      }
      this.logger.publishWarnEvent({
        name: IntegrationWarnEventName.IncompleteData,
        description: JSON.stringify(err),
      });
      throw new IntegrationProviderAPIError({
        endpoint: url,
        status: err.response?.statusCode || err.statusCode || err.status,
        statusText:
          err.response?.statusMessage || err.statusText || err.message,
      });
    }
  }

  //generic pagination function, within which the actual API call happens
  async forEachPage<T>(
    options: {
      firstUri: string;
      ignoreNotFound?: boolean;
      useOldApi?: boolean;
    },
    eachFn: (page: BitbucketPage<T>) => void,
  ) {
    let nextPageUrl: string | null = options.firstUri;

    while (nextPageUrl) {
      const response = await this.makeGetRequest<BitbucketPage<T>>(
        nextPageUrl,
        options,
      );

      let page: any = response.data;

      if (page) {
        if (options.useOldApi) {
          //api 1.0
          //we need to wrap the response to make things work
          page = {
            size: page.length,
            page: 1,
            values: page,
          };
        }
        eachFn(page);
      }

      if (page?.next) {
        if (
          !page.next.startsWith(BASE_API_URL) &&
          !page.next.startsWith(OLD_BASE_API_URL)
        ) {
          throw new Error(
            `The next page URL, ${page.next}, does not start with the expected base API URL ${BASE_API_URL}`,
          );
        } else {
          nextPageUrl = page.next.substring(BASE_API_URL.length);
        }
      } else {
        nextPageUrl = null;
      }
    }
  }

  async collectAllPages<T>(
    firstUri: string,
    options?: {
      ignoreNotFound?: boolean;
      useOldApi?: boolean;
    },
  ): Promise<{ results: T[]; calls: number }> {
    const results: T[] = [];
    let calls = 0;

    await this.forEachPage<T>(
      {
        ...options,
        firstUri,
      },
      (page: BitbucketPage<T>) => {
        calls++;
        for (const item of page.values) {
          results.push(item);
        }
      },
    );

    return { results, calls };
  }

  async getWorkspace(workspace: string): Promise<BitbucketWorkspace> {
    const result = await this.makeGetRequest<BitbucketWorkspace>(
      `workspaces/${workspace}`,
      {
        ignoreNotFound: true,
      },
    );
    this.calls.workspace++;

    if (result.status === 404) {
      throw new IntegrationConfigLoadError(
        `Workspace '${workspace}' not found, please verify the integration configuration`,
      );
    }

    return result.data;
  }

  async getAllWorkspaces(): Promise<BitbucketWorkspace[]> {
    const { results, calls } =
      await this.collectAllPages<BitbucketWorkspace>(`workspaces`);
    this.calls.workspaces += calls;
    return results;
  }

  async getRepo(workspace: string, repository: string): Promise<BitbucketRepo> {
    const result = await this.makeGetRequest<BitbucketRepo>(
      `repositories/${workspace}/${repository}`,
    );
    this.calls.repository++;
    return result.data;
  }

  async getAllRepos(workspace: string): Promise<BitbucketRepo[]> {
    const { results, calls } = await this.collectAllPages<BitbucketRepo>(
      `repositories/${workspace}`,
    );
    this.calls.repositories += calls;
    return results;
  }

  async getAllReposGroupPermissions(
    workspace: string,
    repo: string,
  ): Promise<BitbucketGroupPermission[]> {
    const { results, calls } =
      await this.collectAllPages<BitbucketGroupPermission>(
        `repositories/${workspace}/${repo}/permissions-config/groups`,
      );
    this.calls.repositoryGroupPermissions += calls;
    return results;
  }

  async getAllReposUserPermissions(
    workspace: string,
    repo: string,
  ): Promise<BitbucketUserPermission[]> {
    const { results, calls } =
      await this.collectAllPages<BitbucketUserPermission>(
        `repositories/${workspace}/${repo}/permissions-config/users`,
      );
    this.calls.repositoryUserPermissions += calls;
    return results;
  }

  async getAllRepoBranchRestrictions(
    workspace: string,
    repo: string,
  ): Promise<any[]> {
    const { results, calls } =
      await this.collectAllPages<BitbucketBranchRestriction>(
        `repositories/${workspace}/${repo}/branch-restrictions`,
      );
    this.calls.repositoryBranchRestrictions += calls;
    return results;
  }

  async getPR(
    workspace: string,
    repository: string,
    id: string,
  ): Promise<BitbucketPR> {
    const result = await this.makeGetRequest<BitbucketPR>(
      `repositories/${workspace}/${repository}/pullrequests/${id}`,
    );
    this.calls.pullRequest++;
    return result.data;
  }

  async getAllPRs(
    workspace: string,
    repository: string,
    filter: string,
  ): Promise<BitbucketPR[]> {
    const { results, calls } = await this.collectAllPages<BitbucketPR>(
      `repositories/${workspace}/${repository}/pullrequests?q=${encodeURI(
        filter,
      )}`,
      {
        ignoreNotFound: true,
      },
    );
    this.calls.pullRequests += calls;
    return results;
  }

  async getPRActivity(
    workspace: string,
    repository: string,
    prId: string,
  ): Promise<BitbucketPRActivity[]> {
    const { results, calls } = await this.collectAllPages<BitbucketPRActivity>(
      `repositories/${workspace}/${repository}/pullrequests/${prId}/activity`,
    );
    this.calls.pullRequestActivity += calls;
    return results;
  }

  /**
   * Get commits from a source to a destination, excluding destination. This
   * endpoint is rate limited to 1000 requests per hour, so use wisely!
   */
  async getCommits(
    workspace: string,
    repository: string,
    sourceRevision: string,
    destinationRevision: string,
  ): Promise<BitbucketCommit[]> {
    const { results, calls } = await this.collectAllPages<BitbucketCommit>(
      `repositories/${workspace}/${repository}/commits/${sourceRevision}?exclude=${destinationRevision}`,
    );
    this.calls.commits += calls;
    return results;
  }

  async getUser(uuid: string): Promise<BitbucketUser> {
    const response = await this.makeGetRequest<BitbucketUser>(`users/${uuid}`);
    this.calls.user++;
    return response.data;
  }

  async getAllWorkspaceGroups(workspace: string): Promise<BitbucketGroup[]> {
    const { results, calls } = await this.collectAllPages<BitbucketGroup>(
      `groups/${workspace}`,
      { useOldApi: true },
    );
    this.calls.groups += calls;
    return results;
  }

  async getAllWorkspaceMembers(workspace: string): Promise<BitbucketUser[]> {
    const { results, calls } =
      await this.collectAllPages<BitbucketWorkspaceMembership>(
        `workspaces/${workspace}/members`,
      );
    this.calls.workspaceMembers += calls;
    return results.map((member) => member.user);
  }

  async getProject(
    workspace: string,
    projectKey: string,
  ): Promise<BitbucketProject> {
    const result = await this.makeGetRequest<BitbucketProject>(
      `workspaces/${workspace}/projects/${projectKey}`,
    );
    this.calls.project++;
    return result.data;
  }

  async getAllProjects(workspace: string): Promise<BitbucketProject[]> {
    const { results, calls } = await this.collectAllPages<BitbucketProject>(
      `workspaces/${workspace}/projects/`,
    );
    this.calls.projects += calls;
    return results;
  }

  async diff(
    workspace: string,
    repoName: string,
    source: BitbucketCommitHash,
    destination: BitbucketCommitHash,
  ): Promise<any> {
    const encodedWorkspace = encodeURIComponent(workspace);
    const encodedRepo = encodeURIComponent(repoName);
    const encodedRange = encodeURIComponent(`${source}..${destination}`);

    const response = await this.makeGetRequest(
      `repositories/${encodedWorkspace}/${encodedRepo}/diff/${encodedRange}`,
    );

    this.calls.diff += 1;
    return response.data;
  }

  async isEmptyMergeCommit(
    workspace: string,
    repoName: string,
    commit: BitbucketCommit,
  ): Promise<boolean> {
    if (commit.parents.length !== 2) {
      return false;
    }

    // Check to see if this is a simple merge where there were no parallel changes
    // in master since the branch being merged was created
    const diffToMergedChanges = await this.diff(
      workspace,
      repoName,
      commit.hash,
      commit.parents[1].hash,
    );
    if (diffToMergedChanges.trim() === '') {
      return true;
    }

    // Try to detect empty merges in the case of concurrent changes in master and
    // the branch. If the changes between the branch and the latest master commit
    // are the same as between the merge commit and the latest in master, then the
    // merge commit did not try to sneak in any extra changes.
    const diffMergeToMaster = await this.diff(
      workspace,
      repoName,
      commit.hash,
      commit.parents[0].hash,
    );
    const diffBranchToMaster = await this.diff(
      workspace,
      repoName,
      commit.parents[1].hash,
      commit.parents[0].hash,
    );
    if (diffMergeToMaster === diffBranchToMaster) {
      return true;
    }

    return false;
  }
}
