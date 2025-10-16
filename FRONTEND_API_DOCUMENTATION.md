# BitRocketVault Smart Contract API Documentation

**Version:** 1.0.0
**Last Updated:** 2025-10-13

---

## 📋 Table of Contents

- [Overview](#overview)
- [Contract Deployments](#contract-deployments)
- [Quick Start](#quick-start)
- [Contract ABI](#contract-abi)
- [Public Functions](#public-functions)
  - [User Functions](#user-functions)
  - [View Functions](#view-functions)
  - [Developer Functions](#developer-functions)
  - [Admin Functions](#admin-functions)
- [Events](#events)
- [Integration Examples](#integration-examples)
  - [Web3.js Examples](#web3js-examples)
  - [Ethers.js Examples](#ethersjs-examples)
- [Common Use Cases](#common-use-cases)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)

---

## Overview

**BitRocketVault** is a secure USDT vault smart contract for the BitRocket platform on Binance Smart Chain (BSC). It provides:

- ✅ User deposits with event tracking
- ✅ Secure withdrawals (developer-controlled)
- ✅ Role-based access control (Developer, Admin, Blacklist)
- ✅ Emergency pause mechanism
- ✅ Admin liquidity management

### Key Features

- **Security**: Built with OpenZeppelin's battle-tested contracts
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Pausable**: Emergency circuit breaker
- **AccessControl**: Role-based permissions
- **SafeERC20**: Secure token transfers

---

## Contract Deployments

### BSC Mainnet (Production)

| Parameter | Value |
|-----------|-------|
| **Network** | Binance Smart Chain Mainnet |
| **Chain ID** | 56 |
| **Contract Address** | `0xE58Ed8D624890619f067C28E5459C0Ef12Cb9914` |
| **USDT Address** | `0x55d398326f99059fF775485246999027B3197955` |
| **BSCScan** | [View on BSCScan](https://bscscan.com/address/0xE58Ed8D624890619f067C28E5459C0Ef12Cb9914) |
| **RPC URL** | `https://bsc-dataseed1.binance.org/` |

### BSC Testnet (Development)

| Parameter | Value |
|-----------|-------|
| **Network** | Binance Smart Chain Testnet |
| **Chain ID** | 97 |
| **Contract Address** | `0xE58Ed8D624890619f067C28E5459C0Ef12Cb9914` |
| **USDT Address** | `0x337610d27c682E347C9cD60BD4b3b107C9d34dDd` |
| **BSCScan** | [View on Testnet BSCScan](https://testnet.bscscan.com/address/0xE58Ed8D624890619f067C28E5459C0Ef12Cb9914) |
| **RPC URL** | `https://data-seed-prebsc-1-s1.binance.org:8545/` |

---

## Quick Start

### Installation

```bash
# Using npm
npm install web3 ethers

# Using yarn
yarn add web3 ethers
```

### Basic Setup (Web3.js)

```javascript
import Web3 from 'web3';
import contractABI from './BitRocketVault.json'; // ABI file

const web3 = new Web3(window.ethereum);
const contractAddress = '0xE58Ed8D624890619f067C28E5459C0Ef12Cb9914';
const contract = new web3.eth.Contract(contractABI, contractAddress);
```

### Basic Setup (Ethers.js)

```javascript
import { ethers } from 'ethers';
import contractABI from './BitRocketVault.json'; // ABI file

const provider = new ethers.BrowserProvider(window.ethereum);
const contractAddress = '0xE58Ed8D624890619f067C28E5459C0Ef12Cb9914';
const contract = new ethers.Contract(contractAddress, contractABI, provider);
```

---

## Contract ABI

The complete ABI is available in the artifacts directory:
```
/artifacts/contracts/BitRocketVault.sol/BitRocketVault.json
```

You can also download it from [this repository](../artifacts/contracts/BitRocketVault.sol/BitRocketVault.json).

---

## Public Functions

### User Functions

#### 1. `deposit(uint256 amount)`

Deposit USDT into the vault.

**Parameters:**
- `amount` (uint256): Amount of USDT to deposit (in wei, 18 decimals for USDT)

**Requirements:**
- User must approve contract to spend USDT first
- Amount must be greater than 0
- User must not be blacklisted
- Contract must not be paused

**Events Emitted:**
- `Deposit(address indexed user, uint256 amount, uint256 timestamp)`

**Example:**
```javascript
// Web3.js
const usdtContract = new web3.eth.Contract(usdtABI, usdtAddress);
const amount = web3.utils.toWei('100', 'ether'); // 100 USDT

// Step 1: Approve vault to spend USDT
await usdtContract.methods.approve(vaultAddress, amount).send({ from: userAddress });

// Step 2: Deposit
await contract.methods.deposit(amount).send({ from: userAddress });

// Ethers.js
const usdtContract = new ethers.Contract(usdtAddress, usdtABI, signer);
const amount = ethers.parseUnits('100', 18); // 100 USDT

// Step 1: Approve
const approveTx = await usdtContract.approve(vaultAddress, amount);
await approveTx.wait();

// Step 2: Deposit
const depositTx = await contract.deposit(amount);
await depositTx.wait();
```

---

### View Functions

#### 2. `getContractBalance()`

Get current USDT balance of the contract.

**Returns:**
- `uint256`: Current USDT balance in wei

**Example:**
```javascript
// Web3.js
const balance = await contract.methods.getContractBalance().call();
console.log('Contract Balance:', web3.utils.fromWei(balance, 'ether'), 'USDT');

// Ethers.js
const balance = await contract.getContractBalance();
console.log('Contract Balance:', ethers.formatUnits(balance, 18), 'USDT');
```

---

#### 3. `getUserStats(address user)`

Get user's deposit and withdrawal statistics.

**Parameters:**
- `user` (address): User address to query

**Returns:**
- `deposits` (uint256): Total deposits by user
- `withdrawals` (uint256): Total withdrawals to user

**Example:**
```javascript
// Web3.js
const stats = await contract.methods.getUserStats(userAddress).call();
console.log('User Deposits:', web3.utils.fromWei(stats.deposits, 'ether'), 'USDT');
console.log('User Withdrawals:', web3.utils.fromWei(stats.withdrawals, 'ether'), 'USDT');

// Ethers.js
const [deposits, withdrawals] = await contract.getUserStats(userAddress);
console.log('User Deposits:', ethers.formatUnits(deposits, 18), 'USDT');
console.log('User Withdrawals:', ethers.formatUnits(withdrawals, 18), 'USDT');
```

---

#### 4. `getContractStats()`

Get overall contract statistics.

**Returns:**
- `_totalDeposits` (uint256): Total deposits received
- `_totalWithdrawals` (uint256): Total withdrawals processed
- `contractBalance` (uint256): Current USDT balance

**Example:**
```javascript
// Web3.js
const stats = await contract.methods.getContractStats().call();
console.log('Total Deposits:', web3.utils.fromWei(stats._totalDeposits, 'ether'), 'USDT');
console.log('Total Withdrawals:', web3.utils.fromWei(stats._totalWithdrawals, 'ether'), 'USDT');
console.log('Contract Balance:', web3.utils.fromWei(stats.contractBalance, 'ether'), 'USDT');

// Ethers.js
const [totalDeposits, totalWithdrawals, contractBalance] = await contract.getContractStats();
console.log('Total Deposits:', ethers.formatUnits(totalDeposits, 18), 'USDT');
console.log('Total Withdrawals:', ethers.formatUnits(totalWithdrawals, 18), 'USDT');
console.log('Contract Balance:', ethers.formatUnits(contractBalance, 18), 'USDT');
```

---

#### 5. `isBlacklisted(address user)`

Check if an address is blacklisted.

**Parameters:**
- `user` (address): Address to check

**Returns:**
- `bool`: `true` if blacklisted, `false` otherwise

**Example:**
```javascript
// Web3.js
const isBlacklisted = await contract.methods.isBlacklisted(userAddress).call();

// Ethers.js
const isBlacklisted = await contract.isBlacklisted(userAddress);
```

---

#### 6. `isAdmin(address admin)`

Check if an address has admin role.

**Parameters:**
- `admin` (address): Address to check

**Returns:**
- `bool`: `true` if admin, `false` otherwise

**Example:**
```javascript
// Web3.js
const isAdmin = await contract.methods.isAdmin(adminAddress).call();

// Ethers.js
const isAdmin = await contract.isAdmin(adminAddress);
```

---

#### 7. `isDeveloper(address developer)`

Check if an address has developer role.

**Parameters:**
- `developer` (address): Address to check

**Returns:**
- `bool`: `true` if developer, `false` otherwise

**Example:**
```javascript
// Web3.js
const isDeveloper = await contract.methods.isDeveloper(devAddress).call();

// Ethers.js
const isDeveloper = await contract.isDeveloper(devAddress);
```

---

#### 8. `paused()`

Check if contract is paused.

**Returns:**
- `bool`: `true` if paused, `false` otherwise

**Example:**
```javascript
// Web3.js
const isPaused = await contract.methods.paused().call();

// Ethers.js
const isPaused = await contract.paused();
```

---

#### 9. `totalDeposits()`

Get total deposits received by the contract.

**Returns:**
- `uint256`: Total deposits in wei

**Example:**
```javascript
// Web3.js
const totalDeposits = await contract.methods.totalDeposits().call();

// Ethers.js
const totalDeposits = await contract.totalDeposits();
```

---

#### 10. `totalWithdrawals()`

Get total withdrawals processed by the contract.

**Returns:**
- `uint256`: Total withdrawals in wei

**Example:**
```javascript
// Web3.js
const totalWithdrawals = await contract.methods.totalWithdrawals().call();

// Ethers.js
const totalWithdrawals = await contract.totalWithdrawals();
```

---

#### 11. `userDeposits(address user)`

Get total deposits for a specific user.

**Parameters:**
- `user` (address): User address

**Returns:**
- `uint256`: Total deposits by user in wei

**Example:**
```javascript
// Web3.js
const userDeposits = await contract.methods.userDeposits(userAddress).call();

// Ethers.js
const userDeposits = await contract.userDeposits(userAddress);
```

---

#### 12. `userWithdrawals(address user)`

Get total withdrawals for a specific user.

**Parameters:**
- `user` (address): User address

**Returns:**
- `uint256`: Total withdrawals to user in wei

**Example:**
```javascript
// Web3.js
const userWithdrawals = await contract.methods.userWithdrawals(userAddress).call();

// Ethers.js
const userWithdrawals = await contract.userWithdrawals(userAddress);
```

---

#### 13. `getBNBBalance()`

Get current BNB balance of the contract.

**Returns:**
- `uint256`: Current BNB balance in wei

**Example:**
```javascript
// Web3.js
const bnbBalance = await contract.methods.getBNBBalance().call();

// Ethers.js
const bnbBalance = await contract.getBNBBalance();
```

---

### Developer Functions

**⚠️ Note:** These functions can only be called by addresses with the DEVELOPER_ROLE.

#### 14. `withdrawToUser(address user, uint256 amount)`

Withdraw USDT to a user (developer only).

**Parameters:**
- `user` (address): Recipient address
- `amount` (uint256): Amount of USDT to withdraw in wei

**Requirements:**
- Caller must have DEVELOPER_ROLE
- User must not be blacklisted
- Contract must have sufficient balance

**Events Emitted:**
- `Withdrawal(address indexed user, uint256 amount, uint256 timestamp)`

---

#### 15. `blacklistUser(address user)`

Blacklist a user (developer only).

**Parameters:**
- `user` (address): Address to blacklist

**Events Emitted:**
- `UserBlacklisted(address indexed user, address indexed by)`

---

#### 16. `unblacklistUser(address user)`

Remove user from blacklist (developer only).

**Parameters:**
- `user` (address): Address to unblacklist

**Events Emitted:**
- `UserUnblacklisted(address indexed user, address indexed by)`

---

#### 17. `addAdmin(address admin)`

Add an admin (developer only).

**Parameters:**
- `admin` (address): Address to grant admin role

**Events Emitted:**
- `AdminAdded(address indexed admin, address indexed by)`

---

#### 18. `removeAdmin(address admin)`

Remove an admin (developer only).

**Parameters:**
- `admin` (address): Address to revoke admin role

**Events Emitted:**
- `AdminRemoved(address indexed admin, address indexed by)`

---

#### 19. `pause()`

Pause the contract (developer only). Stops all deposits.

**Events Emitted:**
- `Paused(address account)`

---

#### 20. `unpause()`

Unpause the contract (developer only).

**Events Emitted:**
- `Unpaused(address account)`

---

#### 21. `emergencyWithdrawToken(address token, uint256 amount)`

Emergency withdrawal of any ERC20 token (developer only).

**Parameters:**
- `token` (address): Token contract address
- `amount` (uint256): Amount to withdraw

**Events Emitted:**
- `EmergencyWithdrawal(address indexed developer, address indexed token, uint256 amount)`

---

#### 22. `emergencyWithdrawBNB()`

Emergency withdrawal of BNB (developer only).

**Events Emitted:**
- `EmergencyWithdrawal(address indexed developer, address indexed token, uint256 amount)`

---

### Admin Functions

**⚠️ Note:** These functions can only be called by addresses with the ADMIN_ROLE.

#### 23. `adminWithdraw(address to, uint256 amount)`

Admin withdrawal for liquidity management (admin only).

**Parameters:**
- `to` (address): Recipient address
- `amount` (uint256): Amount of USDT to withdraw

**Requirements:**
- Caller must have ADMIN_ROLE
- Contract must have sufficient balance

**Events Emitted:**
- `AdminWithdrawal(address indexed admin, address indexed to, uint256 amount)`

---

## Events

### Deposit
```solidity
event Deposit(address indexed user, uint256 amount, uint256 timestamp)
```
Emitted when a user deposits USDT.

### Withdrawal
```solidity
event Withdrawal(address indexed user, uint256 amount, uint256 timestamp)
```
Emitted when USDT is withdrawn to a user.

### AdminWithdrawal
```solidity
event AdminWithdrawal(address indexed admin, address indexed to, uint256 amount)
```
Emitted when an admin withdraws USDT.

### EmergencyWithdrawal
```solidity
event EmergencyWithdrawal(address indexed developer, address indexed token, uint256 amount)
```
Emitted during emergency withdrawal. Token address is `0x0` for BNB.

### UserBlacklisted
```solidity
event UserBlacklisted(address indexed user, address indexed by)
```
Emitted when a user is blacklisted.

### UserUnblacklisted
```solidity
event UserUnblacklisted(address indexed user, address indexed by)
```
Emitted when a user is removed from blacklist.

### AdminAdded
```solidity
event AdminAdded(address indexed admin, address indexed by)
```
Emitted when an admin is added.

### AdminRemoved
```solidity
event AdminRemoved(address indexed admin, address indexed by)
```
Emitted when an admin is removed.

### Paused
```solidity
event Paused(address account)
```
Emitted when the contract is paused.

### Unpaused
```solidity
event Unpaused(address account)
```
Emitted when the contract is unpaused.

---

## Integration Examples

### Web3.js Examples

#### Complete Deposit Flow

```javascript
import Web3 from 'web3';

// Initialize
const web3 = new Web3(window.ethereum);
const vaultAddress = '0xE58Ed8D624890619f067C28E5459C0Ef12Cb9914';
const usdtAddress = '0x55d398326f99059fF775485246999027B3197955'; // Mainnet

// Request account access
await window.ethereum.request({ method: 'eth_requestAccounts' });
const accounts = await web3.eth.getAccounts();
const userAddress = accounts[0];

// Create contract instances
const vaultContract = new web3.eth.Contract(vaultABI, vaultAddress);
const usdtContract = new web3.eth.Contract(usdtABI, usdtAddress);

// Amount to deposit (100 USDT)
const amount = web3.utils.toWei('100', 'ether');

// Step 1: Check if user is blacklisted
const isBlacklisted = await vaultContract.methods.isBlacklisted(userAddress).call();
if (isBlacklisted) {
  throw new Error('User is blacklisted');
}

// Step 2: Check if contract is paused
const isPaused = await vaultContract.methods.paused().call();
if (isPaused) {
  throw new Error('Contract is paused');
}

// Step 3: Check user USDT balance
const userBalance = await usdtContract.methods.balanceOf(userAddress).call();
if (BigInt(userBalance) < BigInt(amount)) {
  throw new Error('Insufficient USDT balance');
}

// Step 4: Check current allowance
const currentAllowance = await usdtContract.methods.allowance(userAddress, vaultAddress).call();

// Step 5: Approve if needed
if (BigInt(currentAllowance) < BigInt(amount)) {
  console.log('Approving USDT...');
  const approveTx = await usdtContract.methods.approve(vaultAddress, amount).send({
    from: userAddress
  });
  console.log('Approval transaction:', approveTx.transactionHash);
}

// Step 6: Deposit
console.log('Depositing USDT...');
const depositTx = await vaultContract.methods.deposit(amount).send({
  from: userAddress
});
console.log('Deposit transaction:', depositTx.transactionHash);

// Step 7: Get receipt and parse events
const receipt = await web3.eth.getTransactionReceipt(depositTx.transactionHash);
const depositEvent = receipt.logs.find(log =>
  log.topics[0] === web3.utils.sha3('Deposit(address,uint256,uint256)')
);

if (depositEvent) {
  console.log('Deposit successful!');
  console.log('User:', depositEvent.topics[1]);
  console.log('Amount:', web3.utils.fromWei(depositEvent.data.slice(0, 66), 'ether'), 'USDT');
}
```

#### Listen for Deposit Events

```javascript
// Listen for deposit events from all users
vaultContract.events.Deposit({
  fromBlock: 'latest'
})
.on('data', (event) => {
  console.log('New Deposit!');
  console.log('User:', event.returnValues.user);
  console.log('Amount:', web3.utils.fromWei(event.returnValues.amount, 'ether'), 'USDT');
  console.log('Timestamp:', new Date(event.returnValues.timestamp * 1000));
})
.on('error', console.error);

// Listen for deposits from a specific user
vaultContract.events.Deposit({
  filter: { user: userAddress },
  fromBlock: 'latest'
})
.on('data', (event) => {
  console.log('Your deposit confirmed!');
  console.log('Amount:', web3.utils.fromWei(event.returnValues.amount, 'ether'), 'USDT');
});
```

#### Get Historical Deposits

```javascript
// Get all deposits in the last 1000 blocks
const currentBlock = await web3.eth.getBlockNumber();
const fromBlock = currentBlock - 1000;

const deposits = await vaultContract.getPastEvents('Deposit', {
  fromBlock: fromBlock,
  toBlock: 'latest'
});

console.log(`Found ${deposits.length} deposits`);
deposits.forEach(event => {
  console.log('User:', event.returnValues.user);
  console.log('Amount:', web3.utils.fromWei(event.returnValues.amount, 'ether'), 'USDT');
  console.log('Block:', event.blockNumber);
});

// Get deposits for a specific user
const userDeposits = await vaultContract.getPastEvents('Deposit', {
  filter: { user: userAddress },
  fromBlock: fromBlock,
  toBlock: 'latest'
});
```

---

### Ethers.js Examples

#### Complete Deposit Flow

```javascript
import { ethers } from 'ethers';

// Initialize
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const userAddress = await signer.getAddress();

const vaultAddress = '0xE58Ed8D624890619f067C28E5459C0Ef12Cb9914';
const usdtAddress = '0x55d398326f99059fF775485246999027B3197955'; // Mainnet

// Create contract instances
const vaultContract = new ethers.Contract(vaultAddress, vaultABI, signer);
const usdtContract = new ethers.Contract(usdtAddress, usdtABI, signer);

// Amount to deposit (100 USDT)
const amount = ethers.parseUnits('100', 18);

// Step 1: Check if user is blacklisted
const isBlacklisted = await vaultContract.isBlacklisted(userAddress);
if (isBlacklisted) {
  throw new Error('User is blacklisted');
}

// Step 2: Check if contract is paused
const isPaused = await vaultContract.paused();
if (isPaused) {
  throw new Error('Contract is paused');
}

// Step 3: Check user USDT balance
const userBalance = await usdtContract.balanceOf(userAddress);
if (userBalance < amount) {
  throw new Error('Insufficient USDT balance');
}

// Step 4: Check current allowance
const currentAllowance = await usdtContract.allowance(userAddress, vaultAddress);

// Step 5: Approve if needed
if (currentAllowance < amount) {
  console.log('Approving USDT...');
  const approveTx = await usdtContract.approve(vaultAddress, amount);
  console.log('Approval transaction:', approveTx.hash);
  await approveTx.wait();
  console.log('Approval confirmed');
}

// Step 6: Deposit
console.log('Depositing USDT...');
const depositTx = await vaultContract.deposit(amount);
console.log('Deposit transaction:', depositTx.hash);

// Step 7: Wait for confirmation
const receipt = await depositTx.wait();
console.log('Deposit confirmed in block:', receipt.blockNumber);

// Step 8: Parse events
const depositEvent = receipt.logs
  .map(log => {
    try {
      return vaultContract.interface.parseLog(log);
    } catch (e) {
      return null;
    }
  })
  .find(event => event && event.name === 'Deposit');

if (depositEvent) {
  console.log('Deposit successful!');
  console.log('User:', depositEvent.args.user);
  console.log('Amount:', ethers.formatUnits(depositEvent.args.amount, 18), 'USDT');
  console.log('Timestamp:', new Date(Number(depositEvent.args.timestamp) * 1000));
}
```

#### Listen for Deposit Events

```javascript
// Listen for all deposits
vaultContract.on('Deposit', (user, amount, timestamp, event) => {
  console.log('New Deposit!');
  console.log('User:', user);
  console.log('Amount:', ethers.formatUnits(amount, 18), 'USDT');
  console.log('Timestamp:', new Date(Number(timestamp) * 1000));
  console.log('Transaction:', event.log.transactionHash);
});

// Listen for deposits from a specific user
const filter = vaultContract.filters.Deposit(userAddress);
vaultContract.on(filter, (user, amount, timestamp, event) => {
  console.log('Your deposit confirmed!');
  console.log('Amount:', ethers.formatUnits(amount, 18), 'USDT');
});

// Remove listeners when done
// vaultContract.removeAllListeners('Deposit');
```

#### Get Historical Deposits

```javascript
// Get all deposits in the last 1000 blocks
const currentBlock = await provider.getBlockNumber();
const fromBlock = currentBlock - 1000;

const filter = vaultContract.filters.Deposit();
const deposits = await vaultContract.queryFilter(filter, fromBlock, 'latest');

console.log(`Found ${deposits.length} deposits`);
deposits.forEach(event => {
  console.log('User:', event.args.user);
  console.log('Amount:', ethers.formatUnits(event.args.amount, 18), 'USDT');
  console.log('Block:', event.blockNumber);
  console.log('Transaction:', event.transactionHash);
});

// Get deposits for a specific user
const userFilter = vaultContract.filters.Deposit(userAddress);
const userDeposits = await vaultContract.queryFilter(userFilter, fromBlock, 'latest');
```

---

## Common Use Cases

### 1. Display User Balance and Stats

```javascript
// Ethers.js example
async function displayUserInfo(userAddress) {
  // Get user stats from contract
  const [deposits, withdrawals] = await vaultContract.getUserStats(userAddress);

  // Get user's USDT balance
  const usdtBalance = await usdtContract.balanceOf(userAddress);

  // Calculate net position
  const netDeposits = deposits - withdrawals;

  return {
    usdtBalance: ethers.formatUnits(usdtBalance, 18),
    totalDeposits: ethers.formatUnits(deposits, 18),
    totalWithdrawals: ethers.formatUnits(withdrawals, 18),
    netDeposits: ethers.formatUnits(netDeposits, 18)
  };
}

// Usage
const userInfo = await displayUserInfo(userAddress);
console.log('USDT Balance:', userInfo.usdtBalance);
console.log('Total Deposits:', userInfo.totalDeposits);
console.log('Total Withdrawals:', userInfo.totalWithdrawals);
console.log('Net Deposits:', userInfo.netDeposits);
```

### 2. Check Contract Status

```javascript
async function getContractStatus() {
  const isPaused = await vaultContract.paused();
  const [totalDeposits, totalWithdrawals, balance] = await vaultContract.getContractStats();

  return {
    isPaused,
    totalDeposits: ethers.formatUnits(totalDeposits, 18),
    totalWithdrawals: ethers.formatUnits(totalWithdrawals, 18),
    currentBalance: ethers.formatUnits(balance, 18)
  };
}
```

### 3. Validate Before Deposit

```javascript
async function validateDeposit(userAddress, amount) {
  // Check if user is blacklisted
  const isBlacklisted = await vaultContract.isBlacklisted(userAddress);
  if (isBlacklisted) {
    return { valid: false, reason: 'User is blacklisted' };
  }

  // Check if contract is paused
  const isPaused = await vaultContract.paused();
  if (isPaused) {
    return { valid: false, reason: 'Contract is paused' };
  }

  // Check user balance
  const balance = await usdtContract.balanceOf(userAddress);
  if (balance < amount) {
    return {
      valid: false,
      reason: `Insufficient balance. Have: ${ethers.formatUnits(balance, 18)} USDT, Need: ${ethers.formatUnits(amount, 18)} USDT`
    };
  }

  return { valid: true };
}

// Usage
const amount = ethers.parseUnits('100', 18);
const validation = await validateDeposit(userAddress, amount);

if (!validation.valid) {
  console.error('Cannot deposit:', validation.reason);
} else {
  // Proceed with deposit
}
```

### 4. Transaction Status Tracker

```javascript
async function trackTransaction(txHash, callback) {
  console.log('Tracking transaction:', txHash);

  // Wait for transaction
  const receipt = await provider.waitForTransaction(txHash);

  if (receipt.status === 1) {
    callback({ success: true, receipt });
  } else {
    callback({ success: false, receipt });
  }
}

// Usage
const depositTx = await vaultContract.deposit(amount);
trackTransaction(depositTx.hash, (result) => {
  if (result.success) {
    console.log('✅ Deposit confirmed!');
  } else {
    console.log('❌ Deposit failed!');
  }
});
```

### 5. Real-time Balance Updates

```javascript
// Subscribe to relevant events and update UI
function subscribeToBalanceUpdates(userAddress, onUpdate) {
  // Listen for deposits
  const depositFilter = vaultContract.filters.Deposit(userAddress);
  vaultContract.on(depositFilter, async () => {
    const stats = await displayUserInfo(userAddress);
    onUpdate(stats);
  });

  // Listen for withdrawals
  const withdrawalFilter = vaultContract.filters.Withdrawal(userAddress);
  vaultContract.on(withdrawalFilter, async () => {
    const stats = await displayUserInfo(userAddress);
    onUpdate(stats);
  });

  // Return cleanup function
  return () => {
    vaultContract.removeAllListeners(depositFilter);
    vaultContract.removeAllListeners(withdrawalFilter);
  };
}

// Usage
const unsubscribe = subscribeToBalanceUpdates(userAddress, (stats) => {
  console.log('Balance updated:', stats);
  // Update UI here
});

// When component unmounts
// unsubscribe();
```

---

## Error Handling

### Common Errors

#### 1. User Rejected Transaction
```javascript
try {
  await vaultContract.deposit(amount);
} catch (error) {
  if (error.code === 4001) {
    // User rejected transaction
    console.error('Transaction cancelled by user');
  }
}
```

#### 2. Insufficient Allowance
```javascript
try {
  await vaultContract.deposit(amount);
} catch (error) {
  if (error.message.includes('insufficient allowance')) {
    console.error('Please approve USDT first');
    // Prompt user to approve
  }
}
```

#### 3. Contract Paused
```javascript
try {
  await vaultContract.deposit(amount);
} catch (error) {
  if (error.message.includes('EnforcedPause')) {
    console.error('Contract is currently paused. Please try again later.');
  }
}
```

#### 4. User Blacklisted
```javascript
try {
  await vaultContract.deposit(amount);
} catch (error) {
  if (error.message.includes('User is blacklisted')) {
    console.error('Your address has been restricted from using this contract.');
  }
}
```

### Generic Error Handler

```javascript
async function handleContractError(error) {
  // User rejection
  if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
    return 'Transaction was cancelled by user';
  }

  // Insufficient gas
  if (error.message.includes('gas')) {
    return 'Insufficient gas. Please increase gas limit.';
  }

  // Network error
  if (error.code === 'NETWORK_ERROR') {
    return 'Network error. Please check your connection.';
  }

  // Contract-specific errors
  if (error.message.includes('User is blacklisted')) {
    return 'Your address is blacklisted';
  }

  if (error.message.includes('EnforcedPause')) {
    return 'Contract is paused';
  }

  if (error.message.includes('Amount must be greater than 0')) {
    return 'Amount must be greater than 0';
  }

  if (error.message.includes('Insufficient contract balance')) {
    return 'Insufficient contract balance for withdrawal';
  }

  // Generic error
  return error.message || 'Transaction failed';
}

// Usage
try {
  await vaultContract.deposit(amount);
} catch (error) {
  const errorMessage = await handleContractError(error);
  alert(errorMessage);
}
```

---

## Security Considerations

### 1. Always Validate User Input

```javascript
function validateAmount(amountString) {
  const amount = parseFloat(amountString);

  // Check if valid number
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Invalid amount');
  }

  // Check reasonable limits
  if (amount > 1000000) {
    throw new Error('Amount exceeds maximum limit');
  }

  return ethers.parseUnits(amountString, 18);
}
```

### 2. Check Network Before Transactions

```javascript
async function ensureCorrectNetwork() {
  const network = await provider.getNetwork();
  const expectedChainId = 56; // BSC Mainnet

  if (network.chainId !== BigInt(expectedChainId)) {
    // Request network switch
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${expectedChainId.toString(16)}` }],
      });
    } catch (error) {
      if (error.code === 4902) {
        // Network not added, add it
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${expectedChainId.toString(16)}`,
            chainName: 'Binance Smart Chain',
            nativeCurrency: {
              name: 'BNB',
              symbol: 'BNB',
              decimals: 18
            },
            rpcUrls: ['https://bsc-dataseed1.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com/']
          }]
        });
      }
    }
  }
}
```

### 3. Use Read-Only Providers for Queries

```javascript
// For read-only operations, use a provider without signer
const readOnlyProvider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
const readOnlyContract = new ethers.Contract(vaultAddress, vaultABI, readOnlyProvider);

// This is cheaper and doesn't require wallet connection
const balance = await readOnlyContract.getContractBalance();
```

### 4. Implement Transaction Confirmation UI

```javascript
async function depositWithConfirmation(amount) {
  // Show confirmation dialog
  const confirmed = confirm(`Deposit ${ethers.formatUnits(amount, 18)} USDT?`);
  if (!confirmed) return;

  // Show loading state
  showLoading();

  try {
    // Execute transaction
    const tx = await vaultContract.deposit(amount);

    // Show pending state
    showPending(tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();

    // Show success
    showSuccess(receipt);
  } catch (error) {
    // Show error
    showError(error);
  } finally {
    hideLoading();
  }
}
```

### 5. Rate Limiting

```javascript
// Simple rate limiter for RPC calls
class RateLimiter {
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }

  async throttle() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);

    if (this.requests.length >= this.maxRequests) {
      const waitTime = this.timeWindow - (now - this.requests[0]);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.throttle();
    }

    this.requests.push(now);
  }
}

const limiter = new RateLimiter(10, 1000); // 10 requests per second

async function rateLimitedCall(fn) {
  await limiter.throttle();
  return fn();
}
```

---

## Best Practices

### 1. Gas Optimization

```javascript
// Batch read operations
async function getBatchedData(userAddress) {
  // Instead of multiple calls, combine them
  const [
    isBlacklisted,
    isPaused,
    userStats,
    contractStats
  ] = await Promise.all([
    vaultContract.isBlacklisted(userAddress),
    vaultContract.paused(),
    vaultContract.getUserStats(userAddress),
    vaultContract.getContractStats()
  ]);

  return { isBlacklisted, isPaused, userStats, contractStats };
}
```

### 2. Event Indexing

```javascript
// Use indexed parameters for efficient filtering
// Events are already properly indexed in the contract:
// event Deposit(address indexed user, uint256 amount, uint256 timestamp)

// This allows efficient queries like:
const userDeposits = await vaultContract.queryFilter(
  vaultContract.filters.Deposit(userAddress),
  fromBlock,
  toBlock
);
```

### 3. Connection Management

```javascript
class ContractManager {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
  }

  async connect() {
    if (this.contract) return this.contract;

    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    this.contract = new ethers.Contract(vaultAddress, vaultABI, this.signer);

    return this.contract;
  }

  async disconnect() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
  }

  getContract() {
    if (!this.contract) {
      throw new Error('Not connected. Call connect() first.');
    }
    return this.contract;
  }
}

// Usage
const manager = new ContractManager();
await manager.connect();
const contract = manager.getContract();
```

---

## Support and Resources

- **Contract Source Code**: [GitHub Repository](#)
- **BSCScan (Mainnet)**: https://bscscan.com/address/0xE58Ed8D624890619f067C28E5459C0Ef12Cb9914
- **BSCScan (Testnet)**: https://testnet.bscscan.com/address/0xE58Ed8D624890619f067C28E5459C0Ef12Cb9914
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts/
- **Web3.js Documentation**: https://web3js.readthedocs.io/
- **Ethers.js Documentation**: https://docs.ethers.org/

---

## Changelog

### Version 1.0.0 (2025-10-13)
- Initial release
- Deployed to BSC Mainnet and Testnet
- Full documentation for frontend integration

---

**⚠️ Important Notes:**

1. **USDT Decimals**: USDT on BSC uses 18 decimals (unlike Ethereum where it's 6 decimals)
2. **Gas Fees**: All transactions require BNB for gas fees
3. **Approval Required**: Users must approve the vault contract to spend USDT before depositing
4. **Event Listening**: Always listen for events to confirm transaction success
5. **Error Handling**: Implement proper error handling for better UX
6. **Network Validation**: Always validate the user is on the correct network (BSC Mainnet, Chain ID 56)

---

**Last Updated:** 2025-10-13
**Document Version:** 1.0.0
**Contract Version:** 1.0.0
