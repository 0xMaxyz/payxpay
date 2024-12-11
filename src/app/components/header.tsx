"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const navItems = [
    { name: "Create Invoice", path: "/create-invoice" },
    { name: "Pay", path: "/pay" },
    { name: "History", path: "/history" },
  ];
  return (
    <div className="navbar base-200">
      <div className="navbar-start">
        <Image
          className="logo-color"
          width="100"
          height="50"
          src="/assets/img/logo.png"
          alt="PayxPay logo"
        />
      </div>
      {/* <div className="navbar-center">
        <div className="flex space-x-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`tab ${
                pathname === item.path
                  ? "active-bg text-white rounded-box"
                  : "text-color"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div> */}
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
              <Link href="/settings">Settings</Link>
            </li>
            <li>
              <button>Logout</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
