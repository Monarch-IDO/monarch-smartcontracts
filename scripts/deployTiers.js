const hre = require("hardhat");

async function main() {
  const signer = await ethers.getSigner();
  const Contract = await hre.ethers.getContractFactory("TiersV1");
  let args = [
    signer.address, // owner
    "0xc3DE43e835Cf52514a21074DE870C056707d4427", // dao
    "0xAEDaD96D39C8B24de359417e0de1140cADFAc517", // reward/monarch token
    "0x4908603B5d66bcEbd3f0bd784AD765599F9316c1", // voters token
  ];

  if (hre.network.name == "pulse"){
    args = [
      signer.address, // owner
      "0xc3DE43e835Cf52514a21074DE870C056707d4427", // dao
      "0x0985E7E1B67d7a370659e890169922b5EC9c0024", // reward/monarch token
      "0xA9aE16ad9CEd2B704397afd78d2415CB741d1634", // voters token
    ];
  }

  let contract;
  let contractAddress;
  if (hre.network.name !== "hardhat"){
    contract = await upgrades.deployProxy(Contract, args, {initializer: 'initialize'});
    await contract.deployed();

    contractAddress = await ethers.provider.getStorageAt(contract.address, '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc');
    contractAddress = '0x' + contractAddress.slice(26);
    console.log("Contract address: ", contract.address, contractAddress);
  }else{
    contract = await Contract.deploy(...args, {
      //gasLimit: 3500000,
      //gasPrice: ethers.utils.parseUnits("150", "gwei")
    });
    await contract.deployed();
    console.log(args);

    contractAddress = contract.address;
  }

  if (hre.network.name !== "pulse") {
    await new Promise(resolve => setTimeout(resolve, 20000));
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
  }
  else{
    try {
      await new Promise(resolve => setTimeout(resolve, 20000));
      await hre.run('verify', {
        address: contractAddress
        // constructorArgsParams: []
      })
    } catch (error) {
      console.log(`Smart contract at address ${contract.address} is already verified`)
    }
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
