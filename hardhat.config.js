require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@openzeppelin/hardhat-upgrades");

require("@nomiclabs/hardhat-solhint");
require("solidity-coverage");
require("dotenv/config");

if (process.env.GAS_REPORT === "true") {
  require("hardhat-gas-reporter");
}

const { chainConfig } = require("@nomiclabs/hardhat-etherscan/dist/src/ChainConfig");
chainConfig['pulse'] = {
  chainId: 941,
  urls: {
    apiURL: "https://scan.v2b.testnet.pulsechain.com/api",
    browserURL: "https://scan.v2b.testnet.pulsechain.com",
  },
}

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1
          }
        }
      }
    ]
  },
  networks: {
    ropsten: {
      url: "https://ropsten.infura.io/v3/" + process.env.INFURA_PROJECT_ID,
      accounts: [process.env.Monarch_TESTING_PRIVATE_KEY]
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/" + process.env.INFURA_PROJECT_ID,
      accounts: [process.env.Monarch_TESTING_PRIVATE_KEY]
    },
    mainnet: {
      url: "https://mainnet.infura.io/v3/" + process.env.INFURA_PROJECT_ID,
      accounts: [process.env.Monarch_DEPLOYER_PRIVATE_KEY]
    },
    arbitrum: {
      url: "https://arb1.arbitrum.io/rpc", // 42161
      accounts: [process.env.Monarch_DEPLOYER_PRIVATE_KEY]
    },
    fantom: {
      url: "https://rpc.fantom.network", // 250
      accounts: [process.env.Monarch_DEPLOYER_PRIVATE_KEY]
    },
    polygon: {
      url: "https://polygon-rpc.com", // 137
      accounts: [process.env.Monarch_DEPLOYER_PRIVATE_KEY]
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc", // 43114
      accounts: [process.env.Monarch_DEPLOYER_PRIVATE_KEY]
    },
    bsc: {
      url: "https://bsc-dataseed1.ninicoin.io", // 56
      accounts: [process.env.Monarch_DEPLOYER_PRIVATE_KEY]
    },
    pulse: {
      url: "https://rpc.v2b.testnet.pulsechain.com", //941
      accounts: [process.env.Monarch_DEPLOYER_PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
