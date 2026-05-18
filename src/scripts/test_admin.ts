import { execSync } from 'child_process';

// Use the newly deployed package and test objects
const PACKAGE_ID = "0xb7ba2b9b6cff70d11e3570fb73dafde2720e593d1b091a27b332938467b4a9bc";
const FORM_ID = "0xe4d18e328371c0a7ef04db085050dbffd5e5dc9a79a2a68f362b1783eaa81ee4";
const APPROVAL_ID = "0x9d0000393af3fde52f62ee89a8a8b3c62a2b253b5d773a0a702b9ef14c9c3da2";

function runCmd(cmd: string) {
  console.log(`\n🚀 Running: ${cmd}`);
  try {
    const output = execSync(cmd, { encoding: 'utf-8' });
    console.log("✅ Success!");
    // Print a truncated version of output to avoid spam
    console.log(output.substring(0, 1000) + "\n... (truncated)");
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    if (error.stdout) console.error(`stdout: ${error.stdout}`);
    if (error.stderr) console.error(`stderr: ${error.stderr}`);
  }
}

async function main() {
  console.log("=== STARTING INDEPENDENT TEST ===");
  
  // 1. Test Add Decryptor (as creator)
  // We add address 0x2 as a dummy decryptor
  console.log("\n--- Test 1: Add Decryptor ---");
  const dummyAddress = "0x0000000000000000000000000000000000000000000000000000000000000002";
  runCmd(`sui client call --package ${PACKAGE_ID} --module worm --function add_decryptor --args ${FORM_ID} ${APPROVAL_ID} ${dummyAddress} --gas-budget 10000000`);

  // 2. Test Update Submission Meta (with Rank!)
  console.log("\n--- Test 2: Update Submission Meta (Status, Note, Rank) ---");
  const submissionBlobId = "test_blob_id_123";
  const status = "In Review";
  const note = "This is a test note from the admin script.";
  const rank = "5"; // Priority rank
  
  runCmd(`sui client call --package ${PACKAGE_ID} --module worm --function update_submission_meta --args ${FORM_ID} ${APPROVAL_ID} "${submissionBlobId}" "${status}" "${note}" ${rank} --gas-budget 10000000`);

  console.log("\n=== TEST COMPLETED ===");
  console.log("If both commands succeeded, the contract functionality is verified!");
}

main();
