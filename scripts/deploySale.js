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
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // payment token  USDC
    "0x368921F71d98B152705C2DA4292E415E2dedf5b0", // offering token DOM
    root, // merkle tree root
    "1656838800", // start time  datetime.timestamp( datetime(2022, 7, 3, 9, 0, 0))
    "1657011600", // end time    datetime.timestamp( datetime(2022, 7, 5, 9, 0, 0))
    parseUnits("25000000").toString(), // offerring amount
    parseUnits("300000", 6).toString(), // raising amount       -----price 0.012USDC
    "1657098000", // vesting start   datetime.timestamp( datetime(2022, 7, 6, 9, 0, 0))
    parseUnits("0.2", 12).toString(), // vesting initial
    "259200", // vesting duration    ----3 days
  ];
  deployedAddress = "0x503AB6600E60533328f47c949C2132e0DFdbacE9";
  const contract = Contract.attach(deployedAddress);
  // let contract = await Contract.deploy(...args, {
    // gasLimit: 2500000,
    // gasPrice: parseUnits("9000", "gwei")
  // });
  // await contract.deployed();

  console.log(contract.address, args);
  if (hre.network.name !== "pulse") {
    await new Promise((resolve) => setTimeout(resolve, 20000));
    await hre.run("verify:verify", {
      address: contract.address,
      constructorArguments: args,
    });
  }else{
    await new Promise((resolve) => setTimeout(resolve, 20000));
    await hre.run("verify", {
      address: contract.address,
      constructorArgsParams: args,
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
