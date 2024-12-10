"use client";

import Image from "next/image";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="navbar bg-base-100 shadow-md">
      <div className="flex-1">
        <Image
          width="100"
          height="50"
          src="/assets/img/logo.png"
          alt="PayxPay logo"
        />
      </div>
      <div className="flex-none">
        <div className="dropdown dropdown-end">
          <label
            tabIndex={0}
            className="btn btn-ghost btn-circle avatar"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="w-10 rounded-full">Hey Max!</div>
          </label>
          {menuOpen && (
            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <a onClick={() => alert("Settings")}>Settings</a>
              </li>
              <li>
                <a onClick={() => alert("Logout")}>Logout</a>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
