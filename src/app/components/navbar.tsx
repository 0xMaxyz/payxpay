"use client";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const pathname = usePathname();
  return (
    <>
      <div className="btm-nav btm-nav-sm sec-bg text-color ">
        <a
          href="/create-invoice"
          className={`${
            pathname === "/create-invoice" ? "border-b-2 primary" : ""
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="0.1"
              className="bottom-nav-fill"
              d="M19.5,3.5L18,2l-1.5,1.5L15,2l-1.5,1.5L12,2l-1.5,1.5L9,2L7.5,3.5L6,2v14H3v3c0,1.66,1.34,3,3,3h12c1.66,0,3-1.34,3-3V2 L19.5,3.5z M19,19c0,0.55-0.45,1-1,1s-1-0.45-1-1v-3H8V5h11V19z"
            />
            <rect
              height="2"
              width="6"
              x="9"
              y="7"
              strokeWidth="0.1"
              className="bottom-nav-fill"
            ></rect>
            <rect
              height="2"
              width="2"
              x="16"
              y="7"
              strokeWidth="0.1"
              className="bottom-nav-fill"
            ></rect>
            <rect
              height="2"
              width="6"
              x="9"
              y="10"
              strokeWidth="0.1"
              className="bottom-nav-fill"
            ></rect>
            <rect
              height="2"
              width="2"
              x="16"
              y="10"
              strokeWidth="0.1"
              className="bottom-nav-fill"
            ></rect>
          </svg>
          <span className="btm-nav-label bottom-nav-colors">
            Create Invoice
          </span>
        </a>
        <a
          href="/pay"
          className={`${pathname === "/pay" ? "border-b-2 primary" : ""}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="0.1"
              className="bottom-nav-fill"
            ></path>
          </svg>
          <span className="btm-nav-label bottom-nav-colors">Pay</span>
        </a>
        <a
          href="/history"
          className={`${pathname === "/history" ? "border-b-2 primary" : ""}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="0.1"
              className="bottom-nav-fill"
              d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
            />
          </svg>
          <span className="btm-nav-label bottom-nav-colors">History</span>
        </a>
      </div>
    </>
  );
};
export default Navbar;
