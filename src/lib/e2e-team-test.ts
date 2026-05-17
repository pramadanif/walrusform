import { getFormsForTeamMember, getFormsByIds } from './suiActions';
import { execSync } from 'child_process';
import { WORM_PACKAGE_ID } from './contracts';

async function runTest() {
    console.log("🚀 Starting Team E2E Test...");

    try {
        // 1. Generate a new wallet address
        console.log("\n1️⃣ Generating new address...");
        const res = execSync('sui client new-address ed25519 --json').toString();
        const data = JSON.parse(res);
        // Handle different CLI output formats (sometimes it returns an array, sometimes an object)
        const newAddress = data.address || (Array.isArray(data) ? data[0]?.address : null);
        
        if (!newAddress) {
            throw new Error("Failed to generate new address or parse output: " + res);
        }
        console.log("New Address:", newAddress);

        // 2. Create a form using CLI
        console.log("\n2️⃣ Creating Form on-chain...");
        const createRes = execSync(`sui client ptb --move-call ${WORM_PACKAGE_ID}::worm::create_form "'Team Test Form'" "'blob-team-123'" "''" --gas-budget 50000000 --json`).toString();
        const createData = JSON.parse(createRes);
        const formObj = createData.objectChanges.find((o: any) => o.type === 'created' && o.objectType.includes('::worm::Form'));
        
        if (!formObj) {
            throw new Error("Failed to find created Form object in transaction output.");
        }
        const formObjectId = formObj.objectId;
        console.log("Form Object ID:", formObjectId);

        // 3. Create a team and invite the new address
        console.log("\n3️⃣ Creating Team and inviting address...");
        const teamRes = execSync(`sui client call --package ${WORM_PACKAGE_ID} --module worm --function create_team --args ${formObjectId} "[\\"${newAddress}\\\"]" --gas-budget 50000000 --json`).toString();
        console.log("Team created successfully.");

        // 4. Verify discovery via events (using the function we added)
        console.log("\n4️⃣ Verifying discovery for team member...");
        console.log(`Querying forms for member: ${newAddress}`);
        
        // Wait a few seconds for events to be indexed
        console.log("Waiting for events to index...");
        await new Promise(resolve => setTimeout(resolve, 5000));

        const formIds = await getFormsForTeamMember(newAddress);
        console.log("Found Form IDs:", formIds);

        if (formIds.includes(formObjectId)) {
            console.log("✅ SUCCESS: Form discovery works for team member!");
        } else {
            console.log("❌ FAILURE: Form not found for team member.");
            console.log("All events might not be indexed yet or query failed.");
        }

    } catch (error: any) {
        console.error("❌ Test failed with error:", error.message);
        if (error.stdout) console.error("Stdout:", error.stdout.toString());
        if (error.stderr) console.error("Stderr:", error.stderr.toString());
    }
}

runTest();
