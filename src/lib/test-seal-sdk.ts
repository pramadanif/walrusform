import { SealClient } from '@mysten/seal';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';

async function testSeal() {
    console.log("--- Testing @mysten/seal SDK ---");
    
    // Testnet key server object ID (Mysten managed)
    const keyServerObjectId = "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75";
    
    const client = new SuiJsonRpcClient({ 
        url: 'https://fullnode.testnet.sui.io:443',
        network: 'testnet'
    });

    try {
        const seal = new SealClient({
            suiClient: client as any, // Cast as any because of modular SDK type mismatches
            serverConfigs: [
                {
                    objectId: keyServerObjectId,
                    weight: 1,
                }
            ],
        });

        console.log("Seal client initialized successfully.");
    } catch (e) {
        console.error("Seal Initialization failed:", e);
    }
}

testSeal();
