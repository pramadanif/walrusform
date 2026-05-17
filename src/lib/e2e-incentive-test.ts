import { getPoolForForm } from './suiActions';
import { execSync } from 'child_process';
import { WORM_PACKAGE_ID } from './contracts';

async function runTest() {
    console.log("🚀 Starting Incentive E2E Test...");

    try {
        // 1. Create an incentivized form using PTB
        console.log("\n1️⃣ Creating Incentivized Form on-chain...");
        
        // Split 0.1 SUI (100,000,000 Mist) for the pool
        // Reward per response: 0.1 SUI, Max responses: 1
        const ptbCmd = `sui client ptb --split-coins gas "[10000000]" --assign reward_coin --move-call ${WORM_PACKAGE_ID}::worm::create_incentivized_form "'Incentive Test Form'" "'blob-inc-123'" "''" reward_coin.0 10000000 1 --gas-budget 50000000 --json`;
        
        console.log("Running PTB command...");
        const createRes = execSync(ptbCmd).toString();
        const createData = JSON.parse(createRes);
        
        const formObj = createData.objectChanges.find((o: any) => o.type === 'created' && o.objectType.includes('::worm::Form'));
        const poolObj = createData.objectChanges.find((o: any) => o.type === 'created' && o.objectType.includes('::worm::IncentivePool'));
        
        if (!formObj || !poolObj) {
            throw new Error("Failed to find created Form or Pool object in transaction output.");
        }
        
        const formObjectId = formObj.objectId;
        const poolObjectId = poolObj.objectId;
        
        console.log("Form Object ID:", formObjectId);
        console.log("Pool Object ID:", poolObjectId);

        // 2. Verify discovery via events
        console.log("\n2️⃣ Verifying discovery for pool...");
        
        // Wait a few seconds for events to be indexed
        console.log("Waiting for events to index...");
        await new Promise(resolve => setTimeout(resolve, 5000));

        const foundPoolId = await getPoolForForm(formObjectId);
        console.log("Found Pool ID via events:", foundPoolId);

        if (foundPoolId === poolObjectId) {
            console.log("✅ SUCCESS: Pool discovery works via events!");
        } else {
            console.log("❌ FAILURE: Pool ID mismatch or not found.");
            console.log("Expected:", poolObjectId, "Got:", foundPoolId);
        }

    } catch (error: any) {
        console.error("❌ Test failed with error:", error.message);
        if (error.stdout) console.error("Stdout:", error.stdout.toString());
        if (error.stderr) console.error("Stderr:", error.stderr.toString());
    }
}

runTest();
