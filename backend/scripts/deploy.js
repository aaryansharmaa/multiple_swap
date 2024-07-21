async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const SwapMultipleTokens = await ethers.getContractFactory(
    "SwapMultipleTokens"
  );

  const swapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
  const wmaticAddress = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
  const wethAddress = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
  const usdcAddress = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";

  const swapMultipleTokens = await SwapMultipleTokens.deploy(
    swapRouterAddress,
    wmaticAddress,
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
