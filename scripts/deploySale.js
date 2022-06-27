const hre = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { bn, ADDRESS_ZERO } = require("../test/utilities");
const ethers = hre.ethers;

const allocations = `0xC61Adc553F01fad7f302C65806693034a91166B8,0,0,10,,,
0xc3DE43e835Cf52514a21074DE870C056707d4427,0,0,1000,,,
`;

const parseUnits = ethers.utils.parseUnits;

async function main() {
  // const signer = await ethers.getSigner();
  const usersMap = {};
  for (let allocation of allocations.trim().split("\n")) {
    const parts = allocation.split(",");
    if (!parseFloat(parts[3])) continue;
    if (!usersMap[parts[0]]) {
      usersMap[parts[0]] = { address: parts[0], amount: bn("0") };
    }
    usersMap[parts[0]].amount = usersMap[parts[0]].amount.add(bn(parts[3], 6));
  }
  const users = Object.values(usersMap);
  const elements = users.map((x) =>
    ethers.utils.solidityKeccak256(
      ["address", "uint256"],
      [x.address, x.amount]
    )
  );
  const merkleTree = new MerkleTree(elements, keccak256, { sort: true });
  const root = merkleTree.getHexRoot();
  console.log("merkle tree root", root);
  require("fs").writeFileSync(
    "allocations.json",
    JSON.stringify(
      users.map((u, i) => {
        u.proof = merkleTree.getHexProof(elements[i]);
        u.amount = ethers.utils.formatUnits(u.amount, 6);
        return u;
      }),
      null,
      2
    )
  );
  // return;

  const Contract = await hre.ethers.getContractFactory("SaleTiers");
  const now = (Date.now() / 1000) | 0;
  const args = [
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // payment token  USDC
    "0x095EE7e82206EAA02741fdDdC07f5bb2Cb3C248c", // offering token DOM
    root, // merkle tree root
    1657875600, // start time  2022, 7, 15, 9, 0, 0
    1659193200, // end time    2022, 7, 30, 15, 0, 0
    parseUnits("25000000"), // offerring amount
    parseUnits("300000", 6), // raising amount       -----price 0.012USDC
    1659258000, // vesting start   2022, 7, 31, 9, 0, 0
    parseUnits("0.1", 12), // vesting initial
    parseUnits("7776000", 0), // vesting duration    ----90 days
  ];
  const contract = await Contract.deploy(...args, {
    // gasLimit: 2500000,
    // gasPrice: parseUnits("9000", "gwei")
  });
  await contract.deployed();
  // const contract = { address: "0x798d0d1716ed93306d7576D595A16658f1Fba31e" };
  console.log(contract.address, args);
  if (hre.network.name !== "hardhat") {
    //await new Promise((resolve) => setTimeout(resolve, 30000));
    await hre.run("verify:verify", {
      address: contract.address,
      constructorArguments: args,
    });
  }
  console.log("Contract deployed to:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
