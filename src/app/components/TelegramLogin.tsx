import Script from "next/script";

const TelegramLoginButton = () => {
  return (
    <>
      <Script
        async
        src="https://telegram.org/js/telegram-widget.js?22"
        strategy="afterInteractive"
        data-telegram-login="payxpay_bot"
        data-size="large"
        data-onauth="TelegramLoginWidget.onAuth(user)"
        data-request-access="write"
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
    </>
  );
};

export default TelegramLoginButton;
