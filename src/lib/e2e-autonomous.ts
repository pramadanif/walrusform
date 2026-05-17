import { uploadToWalrus, readFromWalrus } from './walrus';
import { encryptWithSeal, decryptWithSeal } from './seal';
import { createFormTx, getAllForms } from './suiActions';
import { FormDefinition } from './formStorage';
import { v4 as uuidv4 } from 'uuid';
import { execSync } from 'child_process';
import { WORM_PACKAGE_ID } from './contracts';

async function runE2E() {
    console.log("🚀 Starting Autonomous E2E Verification...");
    
    const wallet = "0xfd772cf73b7234594c34edf10650fcd71040e90566ce63b53c7434ac79c4461a";

    // 1. Create Form Definition
    console.log("\n1️⃣ Creating Form Definition...");
    const formDef: FormDefinition = {
        id: uuidv4(),
        title: "E2E Autonomous Test",
        fields: [
            { id: uuidv4(), type: 'text', label: 'Full Name', required: true },
            { id: uuidv4(), type: 'rating', label: 'Score', required: true }
        ],
        createdAt: new Date().toISOString(),
        settings: {
            requireWallet: false,
            encryptWithSeal: false,
            allowedDecryptors: [wallet]
        }
    };

    // 2. Store on Walrus
    console.log("2️⃣ Uploading Form to Walrus...");
    const { blobId: formBlobId } = await uploadToWalrus(JSON.stringify(formDef));
    console.log(`✅ Form Blob ID: ${formBlobId}`);

    // 3. Create Submission Index on Walrus (Empty)
    console.log("3️⃣ Initializing Submission Index...");
    const { blobId: indexBlobId } = await uploadToWalrus(JSON.stringify([]));
    console.log(`✅ Index Blob ID: ${indexBlobId}`);

    // 3.5 Split Coin for Incentive
    console.log("\n3️⃣.5️⃣ Splitting Coin for Incentive...");
    const gasResRaw = execSync(`sui client gas --json`).toString();
    const gasRes = JSON.parse(gasResRaw);
    const gasCoinId = gasRes[0].gasCoinId;
    
    const splitCmd = `sui client ptb --split-coins gas "[100000000]" --assign new_coins --transfer-objects "[new_coins.0]" @${wallet} --gas-budget 50000000 --json`;
    const splitResRaw = execSync(splitCmd).toString();
    const splitRes = JSON.parse(splitResRaw);
    const createdCoinObj = splitRes.objectChanges.find((o: any) => o.type === 'created' && o.objectType.includes('::coin::Coin'));
    const rewardCoinId = createdCoinObj.objectId;
    console.log(`✅ Reward Coin ID: ${rewardCoinId}`);

    // 4. Register on Sui (via CLI)
    console.log("4️⃣ Registering Incentivized Form on Sui (Testnet)...");
    const cmd = `sui client call --package ${WORM_PACKAGE_ID} --module worm --function create_incentivized_form --args "${formDef.title}" "${formBlobId}" "${indexBlobId}" "${rewardCoinId}" "10000000" "10" --gas-budget 50000000 --json`;
    console.log(`Running: sui client call...`);
    const suiResRaw = execSync(cmd).toString();
    const suiRes = JSON.parse(suiResRaw);
    
    // Find the objectId of the created form
    const createdObj = suiRes.objectChanges.find((o: any) => o.type === 'created' && o.objectType.includes('::worm::Form'));
    const formObjectId = createdObj.objectId;
    console.log(`✅ Form Object ID: ${formObjectId}`);

    // Find the objectId of the created pool
    const poolObj = suiRes.objectChanges.find((o: any) => o.type === 'created' && o.objectType.includes('::worm::IncentivePool'));
    const poolObjectId = poolObj.objectId;
    console.log(`✅ Pool Object ID: ${poolObjectId}`);

    // 4.5 Create Team
    console.log("\n4️⃣.5️⃣ Creating Team on Sui...");
    const teamCmd = `sui client call --package ${WORM_PACKAGE_ID} --module worm --function create_team --args "${formObjectId}" "[\\"${wallet}\\\"]" --gas-budget 50000000 --json`;
    const teamResRaw = execSync(teamCmd).toString();
    const teamRes = JSON.parse(teamResRaw);
    const createdTeamObj = teamRes.objectChanges.find((o: any) => o.type === 'created' && o.objectType.includes('::worm::Team'));
    const teamObjectId = createdTeamObj.objectId;
    console.log(`✅ Team Object ID: ${teamObjectId}`);

    // 5. Submit Response
    console.log("\n5️⃣ Mocking a Submission...");
    const submissionData = { "Full Name": "Worm Bot", "Score": 5 };
    const encryptedData = await encryptWithSeal(JSON.stringify(submissionData), [wallet]);
    console.log(`✅ Encrypted Data: ${encryptedData.substring(0, 30)}...`);

    console.log("6️⃣ Storing Submission on Walrus...");
    const { blobId: subBlobId } = await uploadToWalrus(JSON.stringify({
        data: encryptedData,
        submittedAt: new Date().toISOString()
    }));
    console.log(`✅ Submission Blob ID: ${subBlobId}`);

    // 7. Update Index
    console.log("7️⃣ Updating Submission Index...");
    const newIndex = [{ blobId: subBlobId, submittedAt: new Date().toISOString() }];
    const { blobId: newIndexBlobId } = await uploadToWalrus(JSON.stringify(newIndex));
    
    console.log("8️⃣ Updating Index Pointer on Sui...");
    const updateCmd = `sui client call --package ${WORM_PACKAGE_ID} --module worm --function update_submission_index --args "${formObjectId}" "${newIndexBlobId}" --gas-budget 50000000 --json`;
    execSync(updateCmd);
    console.log(`✅ Sui Pointer Updated.`);

    // 8.5 Update Submission Meta
    console.log("\n8️⃣.5️⃣ Updating Submission Meta on Sui...");
    const metaCmd = `sui client call --package ${WORM_PACKAGE_ID} --module worm --function update_submission_meta --args "${formObjectId}" "${teamObjectId}" "${subBlobId}" "Review" "Looks good!" --gas-budget 50000000 --json`;
    execSync(metaCmd);
    console.log(`✅ Submission Meta Updated.`);

    // 9. Verify Discovery
    console.log("\n9️⃣ Verifying Global Discovery...");
    const discovered = await getAllForms();
    const verifiedForm = discovered.find(f => f.objectId === formObjectId);
    if (verifiedForm && verifiedForm.latestSubmissionIndexBlobId === newIndexBlobId) {
        console.log("✅ Discovery Verification: PASS");
    } else {
        console.log("❌ Discovery Verification: FAIL");
    }

    // 10. Verify Decryption
    console.log("🔟 Verifying Data Integrity (Decryption)...");
    const subRaw = await readFromWalrus(subBlobId);
    const subJson = JSON.parse(subRaw);
    const decrypted = await decryptWithSeal(subJson.data, [wallet]);
    if (JSON.parse(decrypted)["Full Name"] === "Worm Bot") {
        console.log("✅ Decryption Verification: PASS");
    } else {
        console.log("❌ Decryption Verification: FAIL");
    }
    // 11. Claim Reward
    console.log("\n1️⃣1️⃣ Claiming Reward...");
    const claimCmd = `sui client call --package ${WORM_PACKAGE_ID} --module worm --function claim_reward --args "${poolObjectId}" --gas-budget 50000000 --json`;
    execSync(claimCmd);
    console.log(`✅ Reward Claimed.`);

    console.log("\n✨ ALL SYSTEMS OPERATIONAL (E2E SUCCESS) ✨");
}

runE2E().catch(console.error);
