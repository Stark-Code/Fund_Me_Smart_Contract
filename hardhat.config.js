require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()
require("@nomiclabs/hardhat-etherscan")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-deploy")

const RINKEBY_RPC_URL =
    process.env.RINKEBY_RPC_URL ||
    "https://eth-rinkeby.alchemyapi.io/v2/TuueotM_jfnPUTu25OLXnHaMm5RyIfKp"
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COIN_MARKET_CAP_KEY = process.env.COIN_MARKET_CAP_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        rinkeby: {
            url: RINKEBY_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 4, // These can be found online
            blockConfirmations: 6,
        },
    },
    localhost: {
        url: "http://127.0.0.1:8545/",
        //accounts: hardhat gives us the accounts array
        chainId: 31337, // This has the same chainId as the defaultNetwork: "hardhat"
    },
    // solidity: "0.8.9",
    solidity: {
        compilers: [{ version: "0.8.9" }, { version: "0.6.6" }],
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        // Wasnt able to get an account created on CoinMarketCap.com for an API Key
        enabled: false,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: COIN_MARKET_CAP_KEY,
        // token: "matic" //Optional if deploying to different networks than ethereum
    },
    namedAccounts: {
        // For deploy scripts use
        deployer: {
            default: 0, // This is pointing to
            4: 0, // ChainId : account Number. So on Rinkeby the default deploy account would be at pos 1
        },
        user: {
            default: 1,
        },
    },
}
