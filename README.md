[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![CosmWasm](https://img.shields.io/badge/CosmWasm-green)
![Xion](https://img.shields.io/badge/Xion-black)

# PayxPay Frontend

## Getting Started

To set up frontend locally, follow these steps:

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/0xMaxyz/payxpay/tree/frontend
   cd payxpay
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Set Up Environment Variables:**

   Create a .env file and add the following variables:
   <details>
   <summary>Click to expand</summary>
   <pre>
   # PAYXPAY ENV VARS
   ARBITER_PK=
   BOT_TOKEN=
   NEXT_PUBLIC_CHAIN_ID="xion-testnet-1"
   NEXT_PUBLIC_CONTRACT=
   NEXT_PUBLIC_ENV="development"
   NEXT_PUBLIC_PRICE_FEED="https://hermes.pyth.network"
   NEXT_PUBLIC_TREASURY=
   NEXT_PUBLIC_XION_REST="https://api.xion-testnet-1.burnt.com"
   NEXT_PUBLIC_XION_RPC="https://rpc.xion-testnet-1.burnt.com:443"
   # UPSTASH
   KV_REST_API_READ_ONLY_TOKEN=
   KV_REST_API_TOKEN=
   KV_REST_API_URL=
   KV_URL=
   # NEONDB DATABASE
   DATABASE_URL=
   DATABASE_URL_UNPOOLED=
   PGDATABASE=
   PGHOST=
   PGHOST_UNPOOLED=
   PGPASSWORD=
   PGUSER=
   POSTGRES_DATABASE=
   POSTGRES_HOST=
   POSTGRES_PASSWORD=
   POSTGRES_PRISMA_URL=
   POSTGRES_URL=
   POSTGRES_URL_NON_POOLING=
   POSTGRES_URL_NO_SSL=
   POSTGRES_USER=
   </pre>
   </details>
   <br>

4. **Run the Application:**

   ```bash
   npm run dev
   ```

5. **Access the App:**

   Open your browser and navigate to <http://localhost:3000>.
