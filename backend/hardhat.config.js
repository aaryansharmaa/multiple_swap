require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: "0.8.0",
  networks: {
    mainnet: {
      url: process.env.ALCHEMY_API_KEY,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
  },
};
