export const blockExplorerUrl = (txHash: string) => {
  return `https://explorer.burnt.com/xion-testnet-1/tx/${txHash}`;
};
export const getTimestampInSeconds = (date: Date | null) => {
  if (!date) return 0;
  const d = new Date(date);
  return Math.floor(d.getTime() / 1000);
};
