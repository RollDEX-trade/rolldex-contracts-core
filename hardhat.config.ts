import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";
import type { HardhatUserConfig } from "hardhat/config";
import type { NetworkUserConfig } from "hardhat/types";
import { resolve } from "path";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });

// Ensure that we have all the environment variables we need.
const mnemonic: string | undefined = process.env.MNEMONIC;
if (!mnemonic) {
  throw new Error("Please set your MNEMONIC in a .env file");
}

const infuraApiKey: string | undefined = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
  throw new Error("Please set your INFURA_API_KEY in a .env file");
}

const chainIds = {
  hardhat: 31337,
  sepolia: 11155111,
  rinkeby: 4,
  scrollAlpha: 534353,
};

function getChainConfig(chain: keyof typeof chainIds, jsonRpcUrl?: string): NetworkUserConfig {
  let defaultJsonRpcUrl: string = "https://" + chain + ".infura.io/v3/" + infuraApiKey;
  return {
    accounts: {
      count: 10,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    chainId: chainIds[chain],
    url: jsonRpcUrl || defaultJsonRpcUrl,
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      rinkeby: process.env.ETHERSCAN_API_KEY || "",
      scrollAlpha: "dummy",
    },
    customChains: [
      {
        network: 'scrollAlpha',
        chainId: 534353,
        urls: {
          apiURL: 'https://blockscout.scroll.io/api',
          browserURL: 'https://blockscout.scroll.io/',
        },
      },
    ],
  },
  gasReporter: {
    currency: "USD",
    enabled: !!process.env.REPORT_GAS,
    excludeContracts: [],
    src: "./contracts",
  },
  networks: {
    hardhat: {
      accounts: {
        accountsBalance: "1000000000000000000000000", // 1_000_000
      },
      chainId: chainIds.hardhat,
    },
    sepolia: getChainConfig("sepolia"),
    rinkeby: getChainConfig("rinkeby"),
    scrollAlpha: getChainConfig("scrollAlpha", "https://alpha-rpc.scroll.io/l2")
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    compilers: [
      {
        version: "0.7.6",
      },
      {
        version: "0.8.7",
        settings: {
          metadata: {
            // Not including the metadata hash
            bytecodeHash: "none",
          },
          // Disable the optimizer when debugging
          // https://hardhat.org/hardhat-network/#solidity-optimizer-support
          optimizer: {
            enabled: true,
            runs: 800,
          },
        },
      },
    ],
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
  mocha: {
    timeout: 600000,
  },
};

export default config;
