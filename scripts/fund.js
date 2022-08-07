const { ethers, getNamedAccounts } = require("hardhat")
const { printObj } = require("../utils/printObj")

async function main() {
    const { deployer } = await getNamedAccounts()
    // console.log("Print Obj")
    // printObj(deployer)
    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log(`Contract deployed at address ${fundMe.address}`)
    console.log("Funding Contract")
    const TransactionResponse = await fundMe.fund({
        value: ethers.utils.parseEther(".1"),
    })
    await TransactionResponse.wait(1)
    console.log("Funded")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
