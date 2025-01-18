[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![CosmWasm](https://img.shields.io/badge/CosmWasm-green)
![Xion](https://img.shields.io/badge/Xion-black)

# PayxPay Contract

## Compiling and testing

### Requirements

This project is bootstrapped from CosmWasm Starter Pack ([minimal code repo](https://github.com/CosmWasm/cw-template?tab=readme-ov-file#creating-a-new-repo-from-template)), you need rust to build and test the contract, instructions for installing rust, could be found [here](https://www.rust-lang.org/tools/install). Additionally, you need the Wasm rust compiler to build Wasm binaries:

```sh
$ rustup target add wasm32-unknown-unknown
```

If you want to use scripts and run them like `yarn script`, you could install the `cargo-run-script` crate, we use this crate and [docker](https://docs.docker.com/engine/install/) to run the wasm binary optimizer, besides that you could use the minimal deploy script as well:

```sh
$ cargo install cargo-run-script
```

### Test locally

Run the following command to execute the contract's tests:

```sh
$ cargo test
```

Build the Wasm binaries using

```sh
$ cargo wasm
```

To generate optimized binaries (requires Docker):

```sh
$ cargo optimize
```

This creates optimized Wasm binaries suitable for deployment to local or Xion testnets. You can find them in the `artifacts` folder.

## Deployed contract in Xion Testnet

The contract is deployed to Xion testnet at (Code id: 1769)
`xion1x6nzmspd9rprrh8xzql58gqa2yf4n8qpf2h3z8vsr229c0mgzzxsh90cz2`.
