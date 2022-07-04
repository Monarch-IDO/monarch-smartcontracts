const hre = require("hardhat");

const parseUnits = ethers.utils.parseUnits;

async function main() {
  const signer = await ethers.getSigner();
  const Contract = await hre.ethers.getContractFactory("Voters");
  /*
  const args = [
    signer.address, // owner
    "0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c", // token mainnet
    "0x95cfa1f48fad82232772d3b1415ad4393517f3b5", // SLP
  ];
  */
  var args;
  if (hre.network.name == "ropsten"){
    args = [
      signer.address, // owner
      "0xAEDaD96D39C8B24de359417e0de1140cADFAc517", // token ropsten
      "0x79Bd5fa6dD9E6932E78C49912a753dd9c9957df5" // SLP
    ];
  }

  if (hre.network.name == "pulse"){
    args = [
      signer.address, // owner
      "0x0985E7E1B67d7a370659e890169922b5EC9c0024", // token Pulse
      "0xB8a3626Fcb9337eC779F369D02531b714305d51b" // PLP
    ];
  }
  
  const contract = await Contract.deploy(...args, {
    //gasLimit: 3500000,
    //gasPrice: ethers.utils.parseUnits("150", "gwei")
  });
  await contract.deployed();
  console.log(args);
  if (hre.network.name !== "pulse") {
    await new Promise(resolve => setTimeout(resolve, 20000));
    await hre.run("verify:verify", {
      address: contract.address,
      constructorArguments: args
    });
  }
  if (hre.network.name == "pulse") {
    try {
      await new Promise(resolve => setTimeout(resolve, 20000));
      await hre.run('verify', {
        address: contract.address,
        constructorArgsParams: args
      })
    } catch (error) {
      console.log(`Smart contract at address ${contract.address} is already verified`)
    }
  }

  console.log("Contract deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
