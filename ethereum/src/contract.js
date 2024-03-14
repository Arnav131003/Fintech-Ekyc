import web3 from "./web3";

//contract address and ABI/Interface to connect to it
const contractAddress = "0x0523A4Da9E7f1eBcbcb5BeBa44440D4Ac4Ef0F5A";
const contractABI = [
  {
    constant: false,
    inputs: [{ name: "confirmed", type: "bool" }],
    name: "answer",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "getHashes",
    outputs: [{ name: "", type: "bytes32[]" }],
    payable: false,
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      { name: "kycKey", type: "string" },
      { name: "platformAddress", type: "address" }
    ],
    name: "verify",
    outputs: [],
    payable: true,
    stateMutability: "payable",
    type: "function"
  },
  {
    constant: false,
    inputs: [{ name: "newHash", type: "bytes32" }],
    name: "storeHash",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [],
    name: "payKYC",
    outputs: [],
    payable: true,
    stateMutability: "payable",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "kycKey", type: "string" },
      { indexed: false, name: "platformAddress", type: "address" },
      { indexed: false, name: "sender", type: "address" }
    ],
    name: "KycListen",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: "confirmed", type: "bool" }],
    name: "PlatformListen",
    type: "event"
  }
];

export default new web3.eth.Contract(contractABI, contractAddress);
