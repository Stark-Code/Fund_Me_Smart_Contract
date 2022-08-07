const { ethers, getNamedAccounts } = require("hardhat")
const { printObj } = require("../utils/printObj")

async function main() {
    const { deployer } = await getNamedAccounts()
    console.log(`Deployer: ${deployer}`)

    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log("Deploying Contract.")

    console.log(`fundMe.address = ${fundMe.address}`)
    const fundMeBalance = await ethers.provider.getBalance(fundMe.address)
    console.log(`fundMeBalance = ${fundMeBalance}`)

    const transactionsSent = await ethers.provider.getTransactionCount(deployer)
    console.log(`transactionsSent: ${transactionsSent}`)

    console.log("Printing fundMap")
    await fundMe.getFundMap()
    // console.log(`testResponse: ${testResponse}`)

    const testValue = await fundMe.test()
    console.log(`Original test = ${testValue}`)

    let transactionResponse = await fundMe.setTest(10)
    let transactionReceipt = await transactionResponse.wait(1)
    // console.log(transactionReceipt)
    console.log(`Gas used to set test${transactionReceipt.gasUsed.toString()}`)

    // const weiToEth = ethers.utils.parseEther(
    //     (transactionReceipt.gasUsed / 10 ** 18).toString()
    // )

    // const gasInUsd = await fundMe.convertToUsd(1)
    // const gasInUsd = await fundMe.convertToUsd(weiToEth)
    const gasInUsd = await fundMe.convertToUsd(transactionReceipt.gasUsed)
    console.log(`Gas Cost $ ${gasInUsd}`)

    const newTestValue = await fundMe.test()
    console.log(`New test = ${newTestValue}`)

    const i_Owner_Funds = await ethers.provider.getBalance(deployer)
    console.log(`i_Owner_Funds: ${i_Owner_Funds}`)

    console.log("Making withdraw...")
    transactionResponse = await fundMe.cheaperWithdraw()
    transactionResponse.wait(1)
    console.log("Funds Withdrawn!")

    const i_Owner_Funds_After = await ethers.provider.getBalance(deployer)
    console.log(`i_Owner_Funds: ${i_Owner_Funds_After}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
