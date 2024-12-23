"use client";

import Image from "next/image";
import Burnt from "./burnt";

export default function Header() {
  return (
    <div className="navbar sec-bg">
      <div className="navbar-start">
        <Image
          className="logo-color"
          width="100"
          height="50"
          src="/assets/img/logo.png"
          alt="PayxPay logo"
        />
      </div>

      <div className="navbar-end">
        <Burnt />
      </div>
    </div>
  );
}
