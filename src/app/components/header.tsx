"use client";

import Image from "next/image";

import { useEffect, useState } from "react";
//import { useTelegram } from "../hooks/useTelegram";
import { useIsAllowed } from "../hooks/useIsAllowed";

export default function Header() {
  const [isPlaceholder, setisPlaceholder] = useState(true);
  //const { WebApp } = useTelegram();
  const { isAllowed } = useIsAllowed();
  useEffect(() => {
    setisPlaceholder(!isAllowed);
  }, [isAllowed]);

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
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar"
          >
            <div className="w-10 rounded-full">
              {isPlaceholder ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  focusable="false"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  role="img"
                >
                  <rect
                    fill="none"
                    height="24"
                    width="24"
                    strokeWidth="0.1"
                  ></rect>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="0.1"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88C7.55 15.8 9.68 15 12 15s4.45.8 6.14 2.12C16.43 19.18 14.03 20 12 20z"
                  ></path>
                </svg>
              ) : (
                <Image
                  height="50"
                  width="50"
                  alt="user profile picture"
                  src="/img"
                />
              )}
            </div>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
          >
            <li>
              <a className="justify-between">
                Profile
                <span className="badge">New</span>
              </a>
            </li>
            <li>
              <a>Settings</a>
            </li>
            <li>
              <a>Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
