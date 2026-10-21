const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MedicalRecords", function () {
  async function deploy() {
    const [owner, doctor, outsider] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("MedicalRecords");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    return { contract, owner, doctor, outsider };
  }

  it("sets the deployer as owner and authorized provider", async function () {
    const { contract, owner } = await deploy();
    expect(await contract.owner()).to.equal(owner.address);
    expect(await contract.authorizedProvider(owner.address)).to.equal(true);
  });

  it("blocks unauthorized users from adding records", async function () {
    const { contract, outsider } = await deploy();
    await expect(
      contract.connect(outsider).addMedicalRecord("P001", "Demo Patient", "Fever", "Rest", "Dr Demo")
    ).to.be.revertedWithCustomError(contract, "NotAuthorized");
  });

  it("allows the owner to authorize a doctor and add a record", async function () {
    const { contract, owner, doctor } = await deploy();
    await contract.connect(owner).setProviderAuthorization(doctor.address, true);
    await contract.connect(doctor).addMedicalRecord("P001", "Demo Patient", "Fever", "Rest", "Dr Demo");
    expect(await contract.getRecordCount()).to.equal(1n);
    const record = await contract.getMedicalRecord(1);
    expect(record.patientId).to.equal("P001");
    expect(record.addedBy).to.equal(doctor.address);
  });

  it("rejects empty required fields", async function () {
    const { contract } = await deploy();
    await expect(
      contract.addMedicalRecord("", "Demo Patient", "Fever", "Rest", "Dr Demo")
    ).to.be.revertedWithCustomError(contract, "EmptyRequiredField");
  });

  it("rejects an unknown record ID", async function () {
    const { contract } = await deploy();
    await expect(contract.getMedicalRecord(1))
      .to.be.revertedWithCustomError(contract, "RecordNotFound");
  });
});
