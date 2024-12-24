import { shortenAddress } from "@/lib/tools";
import Image from "next/image";
import {
  useAbstraxionSigningClient,
  useAbstraxionAccount,
  useModal,
  Abstraxion,
} from "@burnt-labs/abstraxion";
import { useTelegramContext } from "../hooks/useTelegramContext";
import { useEffect, useState } from "react";

const Burnt = () => {
  const { logout } = useAbstraxionSigningClient();
  const { data: account } = useAbstraxionAccount();
  const { isAllowed, userData } = useTelegramContext();
  const [isModalOpen, setModalOpen] = useModal();
  const [isPlaceholder, setisPlaceholder] = useState(true);
  const changeModalState = () => setModalOpen(!isModalOpen);
  useEffect(() => {
    setisPlaceholder(!isAllowed);
  }, [isAllowed]);
  const handleConnectButtonClick: React.MouseEventHandler<
    HTMLButtonElement
  > = () => {
    if (account?.bech32Address) {
      // disconnect
      // @ts-expect-error the element has showmodal
      document?.getElementById("disconnect-confirmation-modal").showModal();
    } else {
      // connect
      console.log(isModalOpen);
      changeModalState();
    }
    return;
  };
  return (
    <>
      {isModalOpen && <Abstraxion onClose={changeModalState} />}
      {/* Confirmation Modal */}
      <dialog id="disconnect-confirmation-modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Disconnect your XION account</h3>
          <p className="py-2">
            This will disconnect your XION account from the current session.
          </p>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn me-4 btn-sm">Cancel</button>
              <button
                className="btn btn-error btn-sm"
                onClick={() => {
                  logout?.();
                }}
              >
                Disconnect
              </button>
            </form>
          </div>
        </div>
      </dialog>
      <div className="dropdown dropdown-bottom dropdown-end">
        <div tabIndex={0} role="button" className="m-1">
          <div className={`avatar burnt-logo rounded-full w-8 h-8`}>
            <div className="icon-container">
              <div className="w-8 h-8 rounded-full b-logo ">
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
                    className="rounded-full"
                    height="50"
                    width="50"
                    alt="user profile picture"
                    src={`${userData?.photo_url ?? "/assets/img/user.webp"}`}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <div
          tabIndex={0}
          className="dropdown-content card card-compact burnt-card z-[1] w-64 p-0 shadow-xl"
        >
          <div className="card-body" style={{ padding: "8px !important" }}>
            <div className="flex flex-row-reverse">
              <div className="w-8 h-8 rounded-full">
                {account?.bech32Address ? (
                  <>
                    <Image
                      height="50"
                      width="50"
                      alt="xion"
                      className="mask-logo rounded-full"
                      src="/assets/img/flame.jpg"
                    />
                    <svg width="0" height="0">
                      <defs>
                        <clipPath id="xlogo">
                          <path
                            transform="translate(9, 0) scale(0.4)"
                            d="M7.42 39.1c-3.83-4.47-5.46-8.45-5.46-12.39 0-2.33.25-3.79.57-5.13C.65 25.56.01 28.53.01 31.34c0 14.85 13.62 16.77 13.62 27.28 0 2.54-1.35 5.99-5.89 12.45 13.7-18.28 17.18-24.86 17.18-29.42 0-12.77-13.56-14.91-13.56-29.27 0-3.28 1.88-7.22 5.38-12.37 0 0-3.33 4.69-5.13 7.19-6.41 8.92-8.89 20.5-4.18 31.91l-.01-.01Z"
                          />
                        </clipPath>
                      </defs>
                    </svg>
                  </>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 75 75"
                    fill="currentColor"
                    className="icon z-0"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <path
                      x="0"
                      y="0"
                      transform="translate(22, 2)"
                      fill="black"
                      width="100%"
                      height="100%"
                      d="M7.42 39.1c-3.83-4.47-5.46-8.45-5.46-12.39 0-2.33.25-3.79.57-5.13C.65 25.56.01 28.53.01 31.34c0 14.85 13.62 16.77 13.62 27.28 0 2.54-1.35 5.99-5.89 12.45 13.7-18.28 17.18-24.86 17.18-29.42 0-12.77-13.56-14.91-13.56-29.27 0-3.28 1.88-7.22 5.38-12.37 0 0-3.33 4.69-5.13 7.19-6.41 8.92-8.89 20.5-4.18 31.91l-.01-.01Z"
                    />
                  </svg>
                )}
              </div>
              <p className="my-auto">
                Hey {isAllowed ? userData?.first_name ?? "there" : "there"}!
              </p>
            </div>
            {account?.bech32Address ? (
              <text>{shortenAddress(account.bech32Address)}</text>
            ) : (
              ""
            )}
            {isAllowed && (
              <button
                className="btn btn-xs btn-secondary"
                onClick={handleConnectButtonClick}
              >
                {account?.bech32Address ? "Disconnect" : "Connect"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
export default Burnt;
