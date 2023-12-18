import { IntegrationLogger } from '@jupiterone/integration-sdk-core';
import BitbucketClient from '../../clients/BitbucketClient';
import { BitbucketCommit, BitbucketPR } from '../../types';
import { getPRActivityWithLog } from '../helpers';
import { commitsCacheFromUpdates } from './CommitsCache';
import { expandApprovedRangesToCommitList } from './expandApprovedRangesToCommitList';
import { Approval } from './parsePRActivity';

export interface PRApprovalData {
  allCommits: BitbucketCommit[];
  commitsByUnknownAuthor: BitbucketCommit[];
  approvedCommits: BitbucketCommit[];
  approvedCommitsRemoved: boolean;
  approvals: Approval[];
}

export default async function collectCommitsForPR(
  bitbucket: BitbucketClient,
  logger: IntegrationLogger,
  accountUUID: string,
  workspaceMembers: string[],
  pr: BitbucketPR,
): Promise<PRApprovalData> {
  const { approvals, updates } = await getPRActivityWithLog(
    bitbucket,
    logger,
    accountUUID,
    pr,
  );
  const commitsCache = await commitsCacheFromUpdates(
    bitbucket,
    logger,
    accountUUID,
    pr,
    updates,
  );
  const { commits: approvedCommits, approvedCommitsRemoved } =
    await expandApprovedRangesToCommitList(logger, commitsCache, approvals);

  return commitsCache.commits.reduce(
    (commitsForPR: PRApprovalData, commit) => {
      commitsForPR.allCommits = [...commitsForPR.allCommits, commit];

      const author = commit.author;

      if (
        !(
          author.user &&
          (accountUUID === author.user.uuid ||
            workspaceMembers.includes(author.user.uuid))
        )
      ) {
        commitsForPR.commitsByUnknownAuthor.push(commit);
      }

      return commitsForPR;
    },
    {
      allCommits: [],
      commitsByUnknownAuthor: [],
      approvedCommits,
      approvedCommitsRemoved,
      approvals,
    },
  );
}
