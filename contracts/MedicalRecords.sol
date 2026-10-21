// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Medical Records Registry (educational demo)
/// @notice Stores demo records on-chain. Never put real patient data on a public chain.
contract MedicalRecords {
    address public owner;
    uint256 public recordCount;

    struct MedicalRecord {
        uint256 id;
        string patientId;
        string patientName;
        string diagnosis;
        string treatment;
        string doctorName;
        uint256 timestamp;
        address addedBy;
        bool exists;
    }

    mapping(uint256 => MedicalRecord) private records;
    mapping(address => bool) public authorizedProvider;

    event ProviderAuthorizationChanged(address indexed provider, bool authorized);
    event MedicalRecordAdded(
        uint256 indexed id,
        string patientId,
        address indexed addedBy,
        uint256 timestamp
    );

    error NotOwner();
    error NotAuthorized();
    error RecordNotFound();
    error EmptyRequiredField();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAuthorized() {
        if (msg.sender != owner && !authorizedProvider[msg.sender]) revert NotAuthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedProvider[msg.sender] = true;
        emit ProviderAuthorizationChanged(msg.sender, true);
    }

    /// @notice Owner can authorize or revoke a provider wallet.
    function setProviderAuthorization(address provider, bool authorized) external onlyOwner {
        require(provider != address(0), "Invalid provider address");
        authorizedProvider[provider] = authorized;
        emit ProviderAuthorizationChanged(provider, authorized);
    }

    /// @notice Adds a demo record. Data is visible to blockchain participants.
    function addMedicalRecord(
        string calldata patientId,
        string calldata patientName,
        string calldata diagnosis,
        string calldata treatment,
        string calldata doctorName
    ) external onlyAuthorized returns (uint256) {
        if (
            bytes(patientId).length == 0 ||
            bytes(patientName).length == 0 ||
            bytes(diagnosis).length == 0 ||
            bytes(treatment).length == 0 ||
            bytes(doctorName).length == 0
        ) revert EmptyRequiredField();

        recordCount++;
        uint256 id = recordCount;

        records[id] = MedicalRecord({
            id: id,
            patientId: patientId,
            patientName: patientName,
            diagnosis: diagnosis,
            treatment: treatment,
            doctorName: doctorName,
            timestamp: block.timestamp,
            addedBy: msg.sender,
            exists: true
        });

        emit MedicalRecordAdded(id, patientId, msg.sender, block.timestamp);
        return id;
    }

    /// @notice Reads a record. This is public-chain demo data, not confidential storage.
    function getMedicalRecord(uint256 id) external view returns (MedicalRecord memory) {
        if (id == 0 || !records[id].exists) revert RecordNotFound();
        return records[id];
    }

    function getRecordCount() external view returns (uint256) {
        return recordCount;
    }
}
