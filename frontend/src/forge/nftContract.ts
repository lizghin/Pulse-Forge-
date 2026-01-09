// NFT Contract Scaffold for Pulse Forge Skins
// Deploy to testnet (Sepolia, Base Goerli, etc.)
// 
// This is a reference implementation - deploy via Remix or Hardhat

export const NFT_CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "tokenURI", "type": "string" },
      { "name": "seed", "type": "string" }
    ],
    "name": "mint",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "name": "tokenURI",
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "seed", "type": "string" }],
    "name": "getSkinBySeed",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Solidity Contract (for reference - deploy separately)
export const NFT_CONTRACT_SOLIDITY = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PulseForgeSkins is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    
    // Map seed hash to token ID (prevent duplicates)
    mapping(bytes32 => uint256) public seedToTokenId;
    
    // Map token ID to seed for reverse lookup
    mapping(uint256 => string) public tokenIdToSeed;
    
    event SkinMinted(address indexed to, uint256 tokenId, string seed);
    
    constructor() ERC721("Pulse Forge Skins", "PFSKIN") Ownable(msg.sender) {}
    
    function mint(address to, string memory uri, string memory seed) public returns (uint256) {
        bytes32 seedHash = keccak256(abi.encodePacked(seed));
        require(seedToTokenId[seedHash] == 0, "Skin already minted");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        seedToTokenId[seedHash] = tokenId + 1; // +1 to differentiate from default 0
        tokenIdToSeed[tokenId] = seed;
        
        emit SkinMinted(to, tokenId, seed);
        return tokenId;
    }
    
    function getSkinBySeed(string memory seed) public view returns (uint256) {
        bytes32 seedHash = keccak256(abi.encodePacked(seed));
        require(seedToTokenId[seedHash] != 0, "Skin not minted");
        return seedToTokenId[seedHash] - 1;
    }
    
    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
`;

// Testnet deployment addresses (to be filled after deployment)
export const TESTNET_CONTRACTS = {
  sepolia: {
    address: '', // Fill after deployment
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_KEY',
  },
  baseGoerli: {
    address: '', // Fill after deployment
    chainId: 84531,
    rpcUrl: 'https://goerli.base.org',
  },
};

// Mint function placeholder (requires wallet integration)
export async function mintSkinNFT(
  recipe: any,
  walletAddress: string,
  chainId: number
): Promise<{ success: boolean; txHash?: string; tokenId?: string; error?: string }> {
  // This would integrate with ethers.js and wallet connect
  // For MVP, return a placeholder
  return {
    success: false,
    error: 'NFT minting requires wallet connection. Coming soon!',
  };
}
