const { deployments, network, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai") // chai is actually being overwritten by waffle
const { developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe("FundMe", async () => {
          let fundMe, deployer
          let mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async function () {
              // const accounts = await ethers.getSigners() // accounts = get accounts listed in hardhart config for relevalt network
              // const accountZero = accounts[0] // hardhat network gives us a list of accounts
              ;({ deployer } = await getNamedAccounts()) // Wierd syntax
              // deployer = (await getNamedAccount()).deployer
              await deployments.fixture() // Runs all deploy tags // Cant get it to work with tags?

              // Whenever we call a function of fundMe below it will connected to/from? deployer account
              fundMe = await ethers.getContract("FundMe", deployer) // Get most recent deployment of FundMe
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("getFundMap", async () => {
              it("Should run the getFundMap function", async () => {
                  await fundMe.getFundMap()
              })
          })

          describe("constructor", async () => {
              it("Constructor sets the aggregator contract correctly", async () => {
                  const response = await fundMe.s_priceFeed()

                  console.log("Response:")
                  console.log(response)
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("FundMe: fund", async () => {
              it("fundMe() fails if if you dont send enough eth", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              // yarn hardhat test --grep amountFunded
              it("Updates the amountFunded data", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.s_addressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })

              it("Adds s_funders array with sender address", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.s_funders(0)
                  // console.log(response, deployer)
                  assert.equal(response, deployer)
              })
          })

          describe("withdraw", function () {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })
              it("withdraws ETH from a single funder", async () => {
                  // Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()

                  // console.log(
                  //     `Transaction Response: ${JSON.stringify(
                  //         transactionResponse,
                  //         null,
                  //         4
                  //     )}`
                  // )
                  const transactionReceipt = await transactionResponse.wait(1)
                  // console.log(
                  //     `Transaction Receipt: ${JSON.stringify(
                  //         transactionReceipt,
                  //         null,
                  //         4
                  //     )}`
                  // )
                  // Debug: Set breakpoint. Start JS Debug Session. Run script in new debug terminal.
                  // Open debug console to type in variables
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // console.log(
                  //     `fundMe.provider =  ${JSON.stringify(fundMe.provider, null, 4)}`
                  // )
                  // const test = await ethers.provider.getBalance(fundMe.address)
                  // console.log(`Balance ${test}`)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Assert
                  // Maybe clean up to understand the testing
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })
              // this test is overloaded. Ideally we'd split it into multiple tests
              // but for simplicity we left it as one
              it("is allows us to withdraw with multiple s_funders", async () => {
                  // Arrange
                  // A Signer in Ethers.js is an object that represents an Ethereum account.
                  // It's used to send transactions to contracts and other accounts.
                  //If you need to send a transaction from an account other than the default one,
                  // you can use the connect() method provided by Ethers.js.
                  // The first step to do so is to get the Signers object from ethers
                  const accounts = await ethers.getSigners()
                  // Finally, to execute a contract's method from another account,
                  // all you need to do is connect the Contract with the method being executed:
                  for (i = 1; i < 6; i++) {
                      // fundMe contract is connected to deployer. This code creates a new instance of fundMe
                      // which is connected to accounts listed in the accounts array
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }

                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // Act
                  const transactionResponse = await fundMe.cheaperWithdraw()
                  // Let's comapre gas costs :)
                  // const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait()
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const withdrawGasCost = gasUsed.mul(effectiveGasPrice)
                  console.log(`GasCost: ${withdrawGasCost}`)
                  console.log(`GasUsed: ${gasUsed}`)
                  console.log(`GasPrice: ${effectiveGasPrice}`)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  // Assert
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(withdrawGasCost).toString()
                  )
                  // Make a getter for storage variables
                  // Verify the addresses in mapping at 0 index have been reset to zero
                  await expect(fundMe.s_funders(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      // Verify the addresses in mapping have been reset to zero
                      assert.equal(
                          await fundMe.s_addressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("Only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1]
                  )
                  await expect(
                      fundMeConnectedContract.cheaperWithdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner") // Custom errors defined in smart contract
              })
          })
      })
    : describe.skip
