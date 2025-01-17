"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTelegramContext } from "../context/TelegramContext";
import { UrlObject } from "url";

interface NavbarItem {
  link: { href: string | UrlObject; className?: string | undefined };
  text: string;
  icon?: string | undefined;
}

const Navbar = () => {
  const pathname = usePathname();
  const { isAllowed, loading } = useTelegramContext();

  const navbarItems: NavbarItem[] = [
    {
      link: {
        href: "/",
        className: `${pathname === "/" ? "border-b-2 primary" : ""} ${
          !isAllowed || loading ? "disabled" : ""
        }`,
      },
      text: "Wallet",
      icon: "wallet",
    },
    {
      link: {
        href: "/invoice",
        className: `${pathname === "/invoice" ? "border-b-2 primary" : ""} ${
          !isAllowed || loading ? "disabled" : ""
        }`,
      },
      text: "Add Invoice",
      icon: "request_quote",
    },
    {
      link: {
        href: "/pay",
        className: `${pathname === "/pay" ? "border-b-2 primary" : ""} ${
          !isAllowed || loading ? "disabled" : ""
        }`,
      },
      text: "Pay",
      icon: "paid",
    },
    {
      link: {
        href: "/history",
        className: `${pathname === "/history" ? "border-b-2 primary" : ""} ${
          !isAllowed || loading ? "disabled" : ""
        }`,
      },
      text: "History",
      icon: "history",
    },
  ];

  return (
    <>
      <div className="btm-nav btm-nav-sm sec-bg text-color ">
        {navbarItems &&
          navbarItems.map((item, index) => (
            <Link key={index} {...item.link}>
              <span className="material-symbols-outlined nav-icons">
                {item.icon}
              </span>
              <span className="tg-text">{item.text}</span>
            </Link>
          ))}
      </div>
    </>
  );
};
export default Navbar;
