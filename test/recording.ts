import {
  Recording,
  RecordingEntry,
  setupRecording,
  SetupRecordingInput,
  mutations,
} from '@jupiterone/integration-sdk-testing';
import { BitbucketWorkspaceMembership } from '../src/types';

export { Recording };

export function setupBitbucketRecording(
  input: Omit<SetupRecordingInput, 'mutateEntry'>,
): Recording {
  return setupRecording({
    ...input,
    mutateEntry: mutateRecordingEntry,
  });
}

function mutateRecordingEntry(entry: RecordingEntry): void {
  if (!entry.response.content.text) {
    return;
  }

  //let's unzip the entry so we can modify it
  mutations.unzipGzippedRecordingEntry(entry);

  const responseText = entry.response.content.text;
  const responseJson = parseJson(responseText);
  if (responseJson) {
    if (/oauth2/.exec(entry.request.url) && entry.request.postData) {
      if (responseJson.access_token) {
        entry.response.content.text = JSON.stringify(
          {
            ...responseJson,
            access_token: '[REDACTED]',
            refresh_token: '[REDACTED]',
          },
          null,
          0,
        );
      }
    }

    if (/\/members$/.exec(entry.request.url)) {
      entry.response.content.text = JSON.stringify(
        {
          ...responseJson,
          values: sanitizeMembers(responseJson.values),
        },
        null,
        0,
      );
    }

    if (/1.0\/groups\//.exec(entry.request.url)) {
      const redactedArray: any = [];
      for (const group of responseJson) {
        const redactedGroup = sanitizeGroupMembers(group);
        redactedArray.push(redactedGroup);
      }
      entry.response.content.text = JSON.stringify(redactedArray, null, 0);
    }
  }
}

function sanitizeGroupMembers(group) {
  const redactedMembers: any = [];
  for (const member of group.members) {
    const redactedMember = {
      ...member,
      //names have to be redacted, but don't have to match User #s to sanitizeMembers below
      //group.member entries are only used to make relationships, and those are matched on uuid
      display_name: 'User X',
      nickname: 'Nickname X',
    };
    redactedMembers.push(redactedMember);
  }
  return {
    ...group,
    members: redactedMembers,
  };
}

function sanitizeMembers(values: BitbucketWorkspaceMembership[]) {
  return values.slice(0, 3).map((membership, index) => {
    return {
      ...membership,
      user: {
        ...membership.user,
        display_name: `User ${index}`,
        nickname: `Nickname ${index}`,
      },
    };
  });
}

function parseJson(str: string): any {
  try {
    return JSON.parse(str);
  } catch (e) {
    return undefined;
  }
}
