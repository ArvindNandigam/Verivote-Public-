import { ethers } from "hardhat"; // NOT hre.ethers

async function main() {
    const [deployer] = await ethers.getSigners(); // use ethers directly
    console.log("Deploying contracts with account:", deployer.address);

    const VoteStorage = await ethers.getContractFactory("VoteStorage");
    const voteStorage = await VoteStorage.deploy();

    await voteStorage.deployed();

    console.log("VoteStorage deployed to:", voteStorage.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
