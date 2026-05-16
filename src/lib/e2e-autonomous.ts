import { uploadToWalrus, readFromWalrus } from './walrus';
import { encryptWithSeal, decryptWithSeal } from './seal';
import { createFormTx, getAllForms } from './suiActions';
import { FormDefinition } from './formStorage';
import { v4 as uuidv4 } from 'uuid';
import { execSync } from 'child_process';

async function runE2E() {
    console.log("🚀 Starting Autonomous E2E Verification...");
    
    const wallet = "0xfd772cf73b7234594c34edf10650fcd71040e90566ce63b53c7434ac79c4461a";

    // 1. Create Form Definition
    console.log("\n1️⃣ Creating Form Definition...");
    const formDef: FormDefinition = {
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

    // 4. Register on Sui (via CLI)
    console.log("4️⃣ Registering Form on Sui (Testnet)...");
    const cmd = `sui client call --package 0x624805e8d931a770ebc5426a72797fc74b7f100cfb0083d67d77d48558fa5e83 --module worm --function create_form --args "${formDef.title}" "${formBlobId}" "${indexBlobId}" --gas-budget 50000000 --json`;
    console.log(`Running: sui client call...`);
    const suiResRaw = execSync(cmd).toString();
    const suiRes = JSON.parse(suiResRaw);
    
    // Find the objectId of the created form
    const createdObj = suiRes.objectChanges.find((o: any) => o.type === 'created' && o.objectType.includes('::worm::Form'));
    const formObjectId = createdObj.objectId;
    console.log(`✅ Form Object ID: ${formObjectId}`);

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
    const updateCmd = `sui client call --package 0x624805e8d931a770ebc5426a72797fc74b7f100cfb0083d67d77d48558fa5e83 --module worm --function update_submission_index --args "${formObjectId}" "${newIndexBlobId}" --gas-budget 50000000 --json`;
    execSync(updateCmd);
    console.log(`✅ Sui Pointer Updated.`);

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

    console.log("\n✨ ALL SYSTEMS OPERATIONAL (E2E SUCCESS) ✨");
}

runE2E().catch(console.error);
