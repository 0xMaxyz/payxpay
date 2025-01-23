import { useState, useEffect } from "react";
import { Decimal } from "decimal.js";
import { usePxpContract } from "../context/PxpContractContext";
import { useNotification } from "../context/NotificationContext";
import { NamedCoin } from "@/types/payment";

export const useBalanceCheck = (token: NamedCoin, amount: Decimal) => {
  const { queryBankBalance, myAddress } = usePxpContract();
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<Decimal | null>(null);
  const [isBalanceSufficient, setIsBalanceSufficient] = useState(false);

  useEffect(() => {
    const queryBalance = async (token: NamedCoin) => {
      try {
        const balance = await queryBankBalance(myAddress, token.denom);
        return balance;
      } catch (error) {
        addNotification({ color: "error", message: "Can't query balance." });
        console.error("Can't query balance.", error);
      }
    };

    const checkBalance = async () => {
      try {
        const fetchedBalance = await queryBalance(token);
        if (fetchedBalance) {
          const balance = new Decimal(fetchedBalance.amount);
          setBalance(balance);
          setIsBalanceSufficient(balance.minus(amount).greaterThanOrEqualTo(0));
        } else {
          throw new Error("Can't query the token balance");
        }
      } catch (error) {
        addNotification({
          color: "error",
          message: "Failed to fetch balance.",
        });
        console.error("Failed to fetch balance.", error);
      } finally {
        setLoading(false);
      }
    };

    checkBalance();
  }, [token, amount, addNotification, queryBankBalance, myAddress]);

  return { loading, balance, isBalanceSufficient };
};
