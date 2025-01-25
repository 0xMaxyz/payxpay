import Script from "next/script";

const TelegramLoginButton = () => {
  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-widget.js?22"
        strategy="afterInteractive"
        onLoad={() => {
          window.TelegramLoginWidget = {
            onAuth: (user) => {
              console.log("Authenticated user:", user);

              fetch("/api/auth/telegram", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: user,
              })
                .then((response) => response.json())
                .then((data) => {
                  console.log("Authentication response:", data);
                  // Handle the response (e.g., redirect or store user data)
                })
                .catch((error) => {
                  console.error("Error during authentication:", error);
                });
            },
          };
        }}
      />
      <div
        className="telegram-login"
        data-telegram-login="payxpay_bot"
        data-size="large"
        data-radius="10"
        data-request-access="write"
        data-onauth="TelegramLoginWidget.onAuth(user)"
      ></div>
    </>
  );
};

export default TelegramLoginButton;
