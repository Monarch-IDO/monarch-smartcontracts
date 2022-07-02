const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  //const tokenAddress = "0x69fa0fee221ad11012bab0fdb45d444d3d2ce71c"; // mainnet
  const tokenAddress = "0xAEDaD96D39C8B24de359417e0de1140cADFAc517"; // ropsten
  const deployedAddress = "0x973c12E86C3a92402Bc9635A077d18F437Dd42fD"; // ropsten

  const signer = await hre.ethers.getSigner();
  const Staking = await hre.ethers.getContractFactory("Staking");

  const staking = Staking.attach(deployedAddress);


  // const args = [
  //   tokenAddress, // token
  //   await signer.getAddress(),
  //   ethers.utils.parseEther("2")
  // ];
  // const staking = await Staking.deploy(...args);

  // await staking.deployed();
  // console.log("Staking deployed to:", staking.address);

  // if (hre.network.name !== "hardhat") {
  //   await new Promise(resolve => setTimeout(resolve, 20000));
  //   await hre.run("verify:verify", {
  //     address: staking.address,
  //     constructorArguments: args
  //   });
  // }

  await staking.add(100, tokenAddress);
  console.log("Staking MONARCH pool added");

  const Token = await hre.ethers.getContractFactory("MONARCH");
  const token = Token.attach(tokenAddress);
  await token.approve(staking.address, ethers.utils.parseEther("1000000"));
  console.log("Staking approved for 1000000 tokens");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
