// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// To make below import work the package must be installed via yarn
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";
import "hardhat/console.sol";


error FundMe__NotOwner(); // Naming convention: contractName__ErrorDescription

contract FundMe {
    using PriceConverter for uint256;

    // State variables aka storage variables
    // Storage is like a an array of variables kept on the blockchain
    // Indexes are called slots in the data structure called storage. I guess its not exactly an array
    // Data in storage is stored in 32 bytes hex form
    // An array of dict is stored a little different. The array length is recored in a slot. Each member 
    // of the array is hashed and stored in the cooresponding slot hash number
    // constant variables and immutable variables dont take up a slot in storage because they are included
    // in the contracts bytecode
    // Function variables do not take up space in storage. You do need to tell the blockchain where to process
    // the variable info however. strings, arrays, dictionaries
    // Reading and writing to storage is expensive Search evm opcodes for a list of what different 
    // opcodes cost. getBalance is expensive! Saving a word to storage is 20k gas! loading a word is 800
    // naming conventions s_VarNam for storage variables, i_name for immmutable, CAPS for const var

    // Further optimizations to declare variables as either internal or private and create getters
    // Furter optimizations to use reverts instead of strings and throw custom errors
    mapping(address => uint256) public s_addressToAmountFunded;
    address[] public s_funders; // To optimize set private use getter defined below, didnt feel like refactoring

    // Could we make this constant?  /* hint: no! We should make it immutable! */
    address public /* immutable */ i_owner; // To optimize set private use getter defined below, didnt feel like refactoring
    uint256 public constant MINIMUM_USD = 50 * 10 ** 18;

    uint256 public test = 5;

    AggregatorV3Interface public s_priceFeed;

    constructor(address s_priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(s_priceFeedAddress); // Address changes depending on which chain we are on
    }

    function fund() public payable {
        require(msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD, "You need to spend more ETH!");
        // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }
    
    function getVersion() public view returns (uint256){
        // Rinkeby ETH / USD Address
        // https://docs.chain.link/docs/ethereum-addresses/ For addresses of different blockchains
        
        return s_priceFeed.version();
    }

    function convertToUsd(uint256 val) public view returns(uint256) {
        return val.getConversionRate(s_priceFeed);
    }

    modifier onlyOwner {
        // require(msg.sender == owner);
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }
    
    // Expensive!
    function withdraw() payable onlyOwner public {
        for (uint256 funderIndex=0; funderIndex < s_funders.length; funderIndex++){
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        // // transfer
        // payable(msg.sender).transfer(address(this).balance);
        // // send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");
        // call
        (bool callSuccess, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders; // Gas Optimization (Save on read costs)

        for (uint256 i=0; i<funders.length;i++ ) {
            address funder = funders[i];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);
        // // transfer
        // payable(msg.sender).transfer(address(this).balance);
        // // send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");
        // call
        (bool callSuccess, ) = payable(i_owner).call{value: address(this).balance}("");
        require(callSuccess, "Call failed");

    }


    // Explainer from: https://solidity-by-example.org/fallback/
    // Ether is sent to contract
    //      is msg.data empty?
    //          /   \ 
    //         yes  no
    //         /     \
    //    receive()?  fallback() 
    //     /   \ 
    //   yes   no
    //  /        \
    //receive()  fallback()

    function getOwner() public view returns(address) {
        return i_owner;
    }

    function getFunders() public view returns(address[] memory) {
        return s_funders;
    }

    function getFundMap() public {
        console.log("FundMap"); // Doesnt print
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = 200;
        address[] memory funders = s_funders;
        // Doesnt print
        for (uint256 i=0; i<funders.length;i++) {
            console.log(funders[i], s_addressToAmountFunded[funders[i]]); // Doesnt seem to print anything
        }        
    }

    function setTest(uint256 newVal) public {
        test = newVal;
    }

    fallback() external payable {
        fund();
    }

    receive() external payable {
        fund();
    }

}

// Concepts we didn't cover yet (will cover in later sections)
// 1. Enum
// 2. Events
// 3. Try / Catch
// 4. Function Selector
// 5. abi.encode / decode
// 6. Hash with keccak256
// 7. Yul / Assembly



