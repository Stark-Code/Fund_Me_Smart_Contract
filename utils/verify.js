const { run } = require("hardhat") // Allows us to run any hardhat task

async function verify(contractAddress, args) {
    // This is to auto verify on etherscan
    console.log("Verifying Contract...")
    try {
        console.log("Verifying Try")
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (error) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("Contract already verified on Etherscan")
        } else {
            console.log(error)
        }
    }
}

module.exports = { verify }
