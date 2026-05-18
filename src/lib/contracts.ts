export const IS_MAINNET = process.env.NEXT_PUBLIC_MODE === 'mainnet';

export const SUI_NETWORK = IS_MAINNET ? 'mainnet' : 'testnet';
export const SUI_RPC_URL = IS_MAINNET ? 'https://fullnode.mainnet.sui.io:443' : 'https://fullnode.testnet.sui.io:443';

export const WALRUS_PUBLISHER = process.env.NEXT_PUBLIC_WALRUS_PUBLISHER || 
  (IS_MAINNET ? 'https://publisher.walrus.space' : 'https://publisher.walrus-testnet.walrus.space');

export const WALRUS_AGGREGATOR = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR || 
  (IS_MAINNET ? 'https://aggregator.walrus.space' : 'https://aggregator.walrus-testnet.walrus.space');

export const WALRUS_EXPLORER_BASE = IS_MAINNET
  ? 'https://walruscan.com/mainnet/blob'
  : 'https://walruscan.com/testnet/blob';

export const WORM_PACKAGE_ID = IS_MAINNET
  ? process.env.NEXT_PUBLIC_MAINNET_PACKAGE_ID || "0x49b039b07d3738244258afac14c90364f89d3f68c1ded39a267fdf9c65819156"
  : "0x9752e3c1a621d17526b1bbe75ee0098151b3f392ce71035f39c0b835fc7a665b";

export const WORM_MODULE = "worm";

export const WORM_FUNCTIONS = {
  CREATE_FORM: "create_form",
  UPDATE_SUBMISSION_INDEX: "update_submission_index",
  SEAL_APPROVE: "seal_approve",
  ADD_DECRYPTOR: "add_decryptor",
};

export const WORM_OBJECT_TYPES = {
  FORM: `${WORM_PACKAGE_ID}::${WORM_MODULE}::Form`,
};
