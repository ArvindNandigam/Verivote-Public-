const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    const VoteStorage = await hre.ethers.getContractFactory("VoteStorage");
    const voteStorage = await VoteStorage.deploy();
    await voteStorage.deployed();

    console.log("VoteStorage deployed to:", voteStorage.address);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
