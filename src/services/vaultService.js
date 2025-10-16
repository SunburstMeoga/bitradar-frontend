import Web3 from 'web3';
import vaultAbi from '../contracts/BitRocketVault.abi.json';
import erc20Abi from '../contracts/ERC20.abi.json';
import { isMetaMaskInstalled, switchNetwork, isCorrectNetwork } from '../utils/web3';

// 环境变量中的合约地址（根据FRONTEND_API_DOCUMENTATION.md）
const VAULT_ADDRESS = import.meta.env.VITE_VAULT_CONTRACT_ADDRESS;
const USDT_ADDRESS = import.meta.env.VITE_USDT_CONTRACT_ADDRESS;

if (!VAULT_ADDRESS || !USDT_ADDRESS) {
  // 在开发期间快速定位缺失的环境变量
  console.warn('缺少合约地址环境变量：请在 .env 中设置 VITE_VAULT_CONTRACT_ADDRESS 与 VITE_USDT_CONTRACT_ADDRESS');
}

let _web3 = null;
let _vault = null;
let _usdt = null;

const ensureWeb3 = async () => {
  if (!isMetaMaskInstalled()) throw new Error('请安装或使用支持 EVM 的钱包');
  // 初始化并校验网络
  _web3 = _web3 || new Web3(window.ethereum);
  const chainId = await _web3.eth.getChainId();
  if (!isCorrectNetwork(chainId.toString())) {
    await switchNetwork();
  }
  return _web3;
};

const getAccounts = async () => {
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) throw new Error('未找到钱包账户');
  return accounts;
};

const getContracts = async () => {
  const web3 = await ensureWeb3();
  _vault = _vault || new web3.eth.Contract(vaultAbi, VAULT_ADDRESS);
  _usdt = _usdt || new web3.eth.Contract(erc20Abi, USDT_ADDRESS);
  return { web3, vault: _vault, usdt: _usdt };
};

// 读取USDT的decimals
const getUSDTDecimals = async () => {
  const { usdt } = await getContracts();
  try {
    const d = await usdt.methods.decimals().call();
    return Number(d) || 18;
  } catch (_) {
    return 18; // BSC上的USDT为18位
  }
};

// 将用户输入的金额转换为wei（根据token decimals）
const toWeiAmount = async (amountFloat) => {
  const { web3 } = await getContracts();
  const decimals = await getUSDTDecimals();
  // 文档明确：BSC USDT 为18位，直接使用 toWei 即可
  if (decimals === 18) {
    return web3.utils.toWei(amountFloat.toString(), 'ether');
  }
  // 其他情况按 decimals 计算
  const ten = BigInt(10);
  const scale = ten ** BigInt(decimals);
  const value = BigInt(Math.round(Number(amountFloat) * 1e6));
  const scaled = (value * (scale / (ten ** BigInt(6))));
  return scaled.toString();
};

// 查询链上USDT余额
export const getWalletUSDTBalance = async (address) => {
  const { web3, usdt } = await getContracts();
  const decimals = await getUSDTDecimals();
  const raw = await usdt.methods.balanceOf(address).call();
  if (decimals === 18) {
    return Number(web3.utils.fromWei(raw, 'ether'));
  }
  const ten = BigInt(10);
  const scale = ten ** BigInt(decimals);
  const bn = BigInt(raw);
  const whole = Number(bn) / Number(scale);
  return Number(whole);
};

// 检查并批准USDT额度
const approveUSDTIfNeeded = async (owner, requiredWei) => {
  const { usdt } = await getContracts();
  const allowance = await usdt.methods.allowance(owner, VAULT_ADDRESS).call();
  if (BigInt(allowance) >= BigInt(requiredWei)) return null; // 足够，无需批准
  return usdt.methods.approve(VAULT_ADDRESS, requiredWei).send({ from: owner });
};

// 用户存入（链上USDT -> 平台USDT）
export const depositUSDT = async (amount) => {
  const { vault } = await getContracts();
  const accounts = await getAccounts();
  const from = accounts[0];
  const wei = await toWeiAmount(amount);

  // 先批准
  await approveUSDTIfNeeded(from, wei);
  // 再存入
  return vault.methods.deposit(wei).send({ from });
};

// 检查是否为开发者角色（仅开发者可提取）
export const isDeveloper = async (address) => {
  const { vault } = await getContracts();
  try {
    return await vault.methods.isDeveloper(address).call();
  } catch (_) {
    return false;
  }
};

// 开发者提取（平台USDT -> 链上USDT）
export const withdrawToUser = async (amount) => {
  const { vault } = await getContracts();
  const accounts = await getAccounts();
  const caller = accounts[0];
  const wei = await toWeiAmount(amount);
  const dev = await isDeveloper(caller);
  if (!dev) throw new Error('当前账户无提取权限');
  return vault.methods.withdrawToUser(caller, wei).send({ from: caller });
};

// 读取合约统计与用户统计
export const getContractStats = async () => {
  const { vault } = await getContracts();
  return vault.methods.getContractStats().call();
};

export const getUserStats = async (address) => {
  const { vault } = await getContracts();
  return vault.methods.getUserStats(address).call();
};

export const getVaultAddress = () => VAULT_ADDRESS;
export const getUSDTAddress = () => USDT_ADDRESS;