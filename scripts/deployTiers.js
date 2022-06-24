const hre = require("hardhat");

async function main() {
  const signer = await ethers.getSigner();
  const Contract = await hre.ethers.getContractFactory("TiersV1");
  const args = [
    signer.address, // owner
    "0xc3DE43e835Cf52514a21074DE870C056707d4427", // dao
    "0xAEDaD96D39C8B24de359417e0de1140cADFAc517", // reward/monarch token
    "0x4908603B5d66bcEbd3f0bd784AD765599F9316c1", // voters token
  ];

  const contract = await upgrades.deployProxy(Contract, args);
  await contract.deployed();

  let contractAddress = await ethers.provider.getStorageAt(contract.address, '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc');
  contractAddress = '0x' + contractAddress.slice(26);
  if (hre.network.name !== "hardhat") {
    await new Promise(resolve => setTimeout(resolve, 20000));
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
  }
  console.log("Contract deployed to:", contract.address, contractAddress);
  // Use https://ropsten.etherscan.io/proxyContractChecker to finish verifying contract
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
