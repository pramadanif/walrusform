import { Transaction } from '@mysten/sui/transactions';
import { WORM_PACKAGE_ID, WORM_MODULE, WORM_FUNCTIONS, WORM_OBJECT_TYPES, SUI_RPC_URL, SUI_NETWORK } from './contracts';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

export const client = new SuiJsonRpcClient({ 
  url: SUI_RPC_URL,
  network: SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet' | 'localnet'
});

/**
 * Creates a transaction block to register a form on-chain.
 */
export function createFormTx(
  title: string,
  formBlobId: string,
  submissionIndexBlobId: string
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${WORM_PACKAGE_ID}::${WORM_MODULE}::${WORM_FUNCTIONS.CREATE_FORM}`,
    arguments: [
      tx.pure.string(title),
      tx.pure.string(formBlobId),
      tx.pure.string(submissionIndexBlobId),
    ],
  });
  return tx;
}

/**
 * Creates a transaction that calls seal_approve on-chain.
 * This registers the authorized decryptors for a form in a Sui shared object.
 * The Seal SDK reads this object to enforce access control for threshold decryption.
 *
 * NOTE: formObjectId is the address of the on-chain Form shared object (not the blobId).
 */
export function sealApproveTx(
  formObjectId: string,
  authorizedDecryptors: string[]
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${WORM_PACKAGE_ID}::${WORM_MODULE}::${WORM_FUNCTIONS.SEAL_APPROVE}`,
    arguments: [
      tx.pure.address(formObjectId),
      tx.pure.vector('address', authorizedDecryptors),
    ],
  });
  return tx;
}

export function createTeamTx(
  formObjectId: string,
  members: string[]
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${WORM_PACKAGE_ID}::${WORM_MODULE}::create_team`,
    arguments: [
      tx.pure.address(formObjectId),
      tx.pure.vector('address', members),
    ],
  });
  return tx;
}

export function setupTeamAndSealTx(
  formObjectId: string,
  decryptors: string[]
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${WORM_PACKAGE_ID}::${WORM_MODULE}::seal_approve`,
    arguments: [
      tx.pure.address(formObjectId),
      tx.pure.vector('address', decryptors),
    ],
  });
  return tx;
}

/**
 * Creates a transaction block to add a decryptor to an existing form.
 */
export function addDecryptorTx(
  formObjectId: string,
  approvalObjectId: string,
  newDecryptor: string
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${WORM_PACKAGE_ID}::${WORM_MODULE}::${WORM_FUNCTIONS.ADD_DECRYPTOR}`,
    arguments: [
      tx.object(formObjectId),
      tx.object(approvalObjectId),
      tx.pure.address(newDecryptor),
    ],
  });
  return tx;
}

export function addTeamMemberTx(formObjectId: string, memberAddress: string) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${WORM_PACKAGE_ID}::${WORM_MODULE}::add_team_member`,
    arguments: [
      tx.object(formObjectId),
      tx.pure.address(memberAddress),
    ],
  });
  return tx;
}

/**
 * Creates a transaction block to update the submission index blob ID on-chain.
 */
export function updateSubmissionIndexTx(
  formObjectId: string,
  newIndexBlobId: string
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${WORM_PACKAGE_ID}::${WORM_MODULE}::${WORM_FUNCTIONS.UPDATE_SUBMISSION_INDEX}`,
    arguments: [
      tx.object(formObjectId),
      tx.pure.string(newIndexBlobId),
      tx.object('0x6'), // Clock object
    ],
  });
  return tx;
}

/**
 * Creates a transaction block to update the submission meta (notes & status) on-chain.
 */
export function updateSubmissionMetaTx(
  formObjectId: string,
  submissionBlobId: string,
  status: string,
  note: string,
  rank: number
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${WORM_PACKAGE_ID}::${WORM_MODULE}::update_submission_meta`,
    arguments: [
      tx.object(formObjectId),
      tx.pure.string(submissionBlobId),
      tx.pure.string(status),
      tx.pure.string(note),
      tx.pure.u8(rank),
    ],
  });
  return tx;
}

/**
 * Queries the blockchain for Form objects owned by a specific address.
 */
export async function getOwnedForms(address: string) {
  const events = await client.queryEvents({
    query: {
      MoveEventType: `${WORM_PACKAGE_ID}::worm::FormCreated`,
    },
  });

  const formIds = events.data
    .filter((e: any) => e.parsedJson?.creator === address)
    .map((e: any) => e.parsedJson?.form_id);

  if (formIds.length === 0) return [];

  const objects = await client.multiGetObjects({
    ids: formIds,
    options: { showContent: true },
  });

  return objects.map((obj: any) => {
    const content = obj.data?.content as any;
    return {
      objectId: obj.data?.objectId,
      title: content?.fields?.title,
      formBlobId: content?.fields?.form_blob_id,
      latestSubmissionIndexBlobId: content?.fields?.latest_submission_index_blob_id,
    };
  });
}

/**
 * Fetches Form objects by their IDs.
 */
export async function getFormsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const uniqueIds = Array.from(new Set(ids));
  const objects = await client.multiGetObjects({
    ids: uniqueIds,
    options: { showContent: true },
  });

  return objects.map((obj: any) => {
    const content = obj.data?.content as any;
    return {
      objectId: obj.data?.objectId,
      title: content?.fields?.title,
      formBlobId: content?.fields?.form_blob_id,
      latestSubmissionIndexBlobId: content?.fields?.latest_submission_index_blob_id,
      teamMembers: content?.fields?.team_members || [],
    };
  });
}

/**
 * Queries the blockchain for the IncentivePool object ID for a specific Form.
 */
export async function getPoolForForm(formObjectId: string): Promise<string | null> {
  const response = await client.queryEvents({
    query: {
      MoveEventType: `${WORM_PACKAGE_ID}::${WORM_MODULE}::PoolCreated`,
    },
  });
  
  const event = response.data.find((e: any) => (e.parsedJson as any)?.form_id === formObjectId);
  return event ? (event.parsedJson as any)?.pool_id : null;
}

/**
 * Queries the blockchain for the Team object ID for a specific Form.
 */
export async function getTeamForForm(formObjectId: string): Promise<string | null> {
  const response = await client.queryEvents({
    query: {
      MoveEventType: `${WORM_PACKAGE_ID}::${WORM_MODULE}::TeamCreated`,
    },
  });
  
  const event = response.data.find((e: any) => (e.parsedJson as any)?.form_id === formObjectId);
  return event ? (event.parsedJson as any)?.team_id : null;
}

/**
 * Queries the blockchain for Form IDs where the given address is a team member.
 */
export async function getFormsForTeamMember(address: string): Promise<string[]> {
  const response = await client.queryEvents({
    query: {
      MoveEventType: `${WORM_PACKAGE_ID}::${WORM_MODULE}::TeamCreated`,
    },
  });
  
  const formIds: string[] = [];
  response.data.forEach((e: any) => {
    const parsed = e.parsedJson as any;
    if (parsed.members && parsed.members.some((m: string) => m.toLowerCase() === address.toLowerCase())) {
      formIds.push(parsed.form_id);
    }
  });
  return formIds;
}

/**
 * Queries the blockchain for a specific Form object by its Walrus blob ID.
 */
export async function getFormByBlobId(blobId: string) {
    // Since queryObjects is not available on this client, we use our event discovery logic
    const all = await getAllForms();
    return all.find((f: any) => f.formBlobId === blobId);
}

/**
 * Fetches all registered Form objects globally by querying FormCreated events.
 * This acts as a decentralized "client-side indexer".
 */
export async function getAllForms() {
    try {
        const events = await client.queryEvents({
            query: {
                MoveEventType: `${WORM_PACKAGE_ID}::${WORM_MODULE}::FormCreated`
            },
            order: 'descending'
        });

        const formObjectIds = events.data.map((ev: any) => ev.parsedJson?.form_id).filter(Boolean);
        if (formObjectIds.length === 0) return [];

        const objects = await client.multiGetObjects({
            ids: formObjectIds,
            options: { showContent: true }
        });

        return objects.map((obj: any) => {
            const content = obj.data?.content as any;
            return {
                objectId: obj.data?.objectId,
                title: content?.fields?.title,
                formBlobId: content?.fields?.form_blob_id,
                latestSubmissionIndexBlobId: content?.fields?.latest_submission_index_blob_id,
                creator: content?.fields?.creator,
            };
        });
    } catch (e) {
        console.warn('[SuiActions] Failed to query global forms:', e);
        return [];
    }
}

/**
 * Creates a form with an attached SUI reward pool.
 * rewardPerResponse: amount in MIST (1 SUI = 1_000_000_000 MIST)
 * maxRewardedResponses: cap on how many respondents get paid
 */
export function createIncentivizedFormTx(
  title: string,
  formBlobId: string,
  submissionIndexBlobId: string,
  rewardPerResponseMist: bigint,
  maxRewardedResponses: number
) {
  const tx = new Transaction();
  // Split coin from gas for the reward pool
  const totalPool = rewardPerResponseMist * BigInt(maxRewardedResponses);
  const [rewardCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(totalPool)]);

  tx.moveCall({
    target: `${WORM_PACKAGE_ID}::${WORM_MODULE}::create_incentivized_form`,
    arguments: [
      tx.pure.string(title),
      tx.pure.string(formBlobId),
      tx.pure.string(submissionIndexBlobId),
      rewardCoin,
      tx.pure.u64(rewardPerResponseMist),
      tx.pure.u64(BigInt(maxRewardedResponses)),
    ],
  });
  return tx;
}

/**
 * Respondent claims their SUI reward after submitting feedback.
 * formObjectId: the IncentivizedForm shared object ID.
 * submissionBlobId: proof of submission on Walrus.
 */
export function claimRewardTx(poolObjectId: string) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${WORM_PACKAGE_ID}::${WORM_MODULE}::claim_reward`,
    arguments: [
      tx.object(poolObjectId),
    ],
  });
  return tx;
}

export async function getDecryptorsMapping(): Promise<Record<string, string[]>> {
  const formCreatedEvents = await client.queryEvents({
    query: { MoveEventType: `${WORM_PACKAGE_ID}::${WORM_MODULE}::FormCreated` },
  });
  const teamCreatedEvents = await client.queryEvents({
    query: { MoveEventType: `${WORM_PACKAGE_ID}::${WORM_MODULE}::TeamCreated` },
  });

  const objectIdToBlobId: Record<string, string> = {};
  formCreatedEvents.data.forEach((e: any) => {
    const parsed = e.parsedJson as any;
    if (parsed && parsed.form_id && parsed.form_blob_id) {
      objectIdToBlobId[parsed.form_id] = parsed.form_blob_id;
    }
  });

  const blobIdToMembers: Record<string, string[]> = {};
  teamCreatedEvents.data.forEach((e: any) => {
    const parsed = e.parsedJson as any;
    if (parsed && parsed.form_id && parsed.members) {
      const blobId = objectIdToBlobId[parsed.form_id];
      if (blobId) {
        blobIdToMembers[blobId] = parsed.members;
      }
    }
  });

  return blobIdToMembers;
}

/**
 * Creates a transaction block to set form expiration.
 */
export function setFormExpirationTx(
  formObjectId: string,
  expiresAt: number
) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${WORM_PACKAGE_ID}::${WORM_MODULE}::set_form_expiration`,
    arguments: [
      tx.object(formObjectId),
      tx.pure.u64(expiresAt),
    ],
  });
  return tx;
}

