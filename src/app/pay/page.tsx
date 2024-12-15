"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const PayPage = () => {
  const searchParams = useSearchParams();
  // const [invoice, setInvoice] = useState<Invoice | null>(null);
  // const [loading, setLoading] = useState(false);
  // const [error, seterror] = useState<string | null>(null);

  useEffect(() => {
    const encodedInvoice = searchParams.get("invoice");
    if (encodedInvoice) {
      // validate signature
    }
  }, [searchParams]);

  return <div className="p-4"></div>;
};

export default PayPage;
