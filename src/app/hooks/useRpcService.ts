/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef } from "react";
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_XION_RPC!;

const UseRpcService = () => {
  const activeRequests = useRef(new Map()); // Holds active requests

  const sendRpcRequest = async (method: any, params: any) => {
    const requestId = Date.now(); // Generate a unique ID
    return new Promise((resolve, reject) => {
      activeRequests.current.set(requestId, { resolve, reject });

      // Send the RPC request
      fetch(RPC_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: requestId,
          method,
          params,
        }),
      }).catch((err) => {
        // Reject if the request fails immediately
        if (activeRequests.current.has(requestId)) {
          activeRequests.current.get(requestId).reject(err);
          activeRequests.current.delete(requestId);
        }
      });
    });
  };

  const handleRpcResponse = (response: any) => {
    const { id, result, error } = response;
    if (activeRequests.current.has(id)) {
      const { resolve, reject } = activeRequests.current.get(id);
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
      activeRequests.current.delete(id);
    }
  };

  return { sendRpcRequest, handleRpcResponse };
};

export default UseRpcService;
