/* eslint-disable @typescript-eslint/require-await */

import { Approval } from './parsePRActivity';
import { BitbucketCommit } from '../../types';
import { IntegrationLogger } from '@jupiterone/integration-sdk-core';
import CommitsCache from './CommitsCache';

function logRemovedCommits(approval: Approval, logger: IntegrationLogger) {
  const englishApprovals = approval.approverUUIDs.map(
    (approverUUID) => `${approverUUID} on PR #${approval.prId}`,
  );
  const joinedApprovals = englishApprovals.join(', ');
  logger.info(
    {
      approvals: joinedApprovals,
      sourceCommitHash: approval.sourceCommitHash,
      destinationCommitHash: approval.destinationCommitHash,
      repoOwnerUUID: approval.repoOwnerUUID,
      repoSlug: approval.repoSlug,
    },
    'Approvals were found for range, but one of the commits does not exist anymore',
  );
}

interface CommitWithApproval {
  commit: BitbucketCommit;
  approval: Approval;
}

function removeSelfApprovedCommits(commitsWithApprovals: CommitWithApproval[]) {
  const colleagueApprovedCommits: BitbucketCommit[] = [];
  for (const commitWithApproval of commitsWithApprovals) {
    const author = commitWithApproval.commit.author.user;
    const commitAuthorUUID = commitWithApproval.commit.author.user
      ? author.uuid
      : undefined;
    if (!commitAuthorUUID) {
      continue;
    }

    const approversWithoutAuthor =
      commitWithApproval.approval.approverUUIDs.filter(
        (approver) => approver !== commitAuthorUUID,
      );

    if (approversWithoutAuthor.length > 0) {
      colleagueApprovedCommits.push(commitWithApproval.commit);
    }
  }

  return colleagueApprovedCommits;
}

interface ApprovedCommitList {
  commits: BitbucketCommit[];
  approvedCommitsRemoved: boolean;
}

export async function expandApprovedRangesToCommitList(
  logger: IntegrationLogger,
  commitsCache: CommitsCache,
  approvalsList: Approval[],
): Promise<ApprovedCommitList> {
  let approvedCommitsRemoved = false;

  const commitsWithApprovals = approvalsList.reduce(
    (commitsWithApprovals: CommitWithApproval[], approval) => {
      const commitsResult = commitsCache.getCommitsUpToDestination(
        approval.sourceCommitHash,
        approval.destinationCommitHash,
      );

      if (commitsResult.commitsMissing) {
        /**
         * A force push to master will forever ruin any approval on PRs that were
         * created before that force push, as their updates will reference a
         * destination commit that no longer exists.
         *
         * A force push to the branch of the PR may or may not ruin approval for
         * that PR. If there are no approvals, you can force push as many times as
         * you want. You’re adding updates to the activity feed every time, but not
         * every update is used to calculate approval. However, once someone
         * approves changes, force pushes that overwrite approved changes will break
         * approval because the commits referenced in the approval no longer exist.
         */
        logRemovedCommits(approval, logger);
        approvedCommitsRemoved = true;
      }

      commitsResult.commits.forEach((commit) => {
        commitsWithApprovals.push({ commit, approval });
      }, []);

      return commitsWithApprovals;
    },
    [],
  );

  return {
    commits: removeSelfApprovedCommits(commitsWithApprovals),
    approvedCommitsRemoved,
  };
}
