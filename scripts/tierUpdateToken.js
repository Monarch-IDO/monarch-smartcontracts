const hre = require("hardhat");

async function main() {
  const signer = await ethers.getSigner();
  const Contract = await hre.ethers.getContractFactory("TiersV1");
  const tokenAddress = "0x0985E7E1B67d7a370659e890169922b5EC9c0024";
  const tiersAddress = "0x16273aA7d1B71c35422f1420c0D925258F5A44D8";
  const contract = Contract.attach(tiersAddress);

  await contract.updateToken([tokenAddress],[1]);
  console.log("Monarch token added to tiers tokenset");
  // Use https://ropsten.etherscan.io/proxyContractChecker to finish verifying contract
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
