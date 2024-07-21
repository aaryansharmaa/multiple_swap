async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const SwapMultipleTokens = await ethers.getContractFactory(
    "SwapMultipleTokens"
  );
  const swapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; // Uniswap V3 Router address on Polygon
  const wethAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"; // WETH address on Polygon
  const usdcAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC address on Polygon

  const swapMultipleTokens = await SwapMultipleTokens.deploy(
    swapRouterAddress,
    wethAddress,
    usdcAddress
  );
  await swapMultipleTokens.deployed();

  console.log("SwapMultipleTokens deployed to:", swapMultipleTokens.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
