import { Transaction } from '@mysten/sui/transactions';
import { WORM_PACKAGE_ID, WORM_MODULE, WORM_FUNCTIONS, WORM_OBJECT_TYPES } from './contracts';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

const client = new SuiJsonRpcClient({ 
  url: 'https://fullnode.testnet.sui.io:443',
  network: 'testnet'
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
    ],
  });
  return tx;
}

/**
 * Queries the blockchain for Form objects owned by a specific address.
 */
export async function getOwnedForms(address: string) {
  const response = await client.getOwnedObjects({
    owner: address,
    filter: {
      StructType: WORM_OBJECT_TYPES.FORM,
    },
    options: {
      showContent: true,
    },
  });

  return response.data.map((obj: any) => {
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
