"use client";

import Link from "next/link";
import Image from "next/image";

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
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost">
            Hey, User!
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 text-color"
          >
            <li>
              <Link className="text-color" href="/settings">
                Settings
              </Link>
            </li>
            <li>
              <button className="text-color">Logout</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
