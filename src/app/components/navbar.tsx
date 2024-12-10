"use client";

import Link from "next/link";

export default function NavigationBar() {
  return (
    <div className="tabs tabs-boxed bg-base-200">
      <Link href="/create-invoice" className="tab tab-active">
        Create Invoice
      </Link>
      <Link href="/receive-payment" className="tab">
        Receive Payment
      </Link>
      <Link href="/history" className="tab">
        History
      </Link>
    </div>
  );
}
