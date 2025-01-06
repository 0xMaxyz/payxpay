use cosmwasm_schema::{cw_serde, QueryResponses};

use cosmwasm_std::{Addr, Api, Coin, StdResult};

use cw20::{Cw20Coin, Cw20ReceiveMsg};

use crate::state::EscrowType;

#[cw_serde]
pub struct InstantiateMsg {}

#[cw_serde]
pub enum ExecuteMsg {
    Create(CreateMsg),
    /// Adds all sent native tokens to the contract (only for blindTransfer escrow type)
    TopUp {
        id: String,
    },
    /// Set the recipient of the given escrow
    /// Only the arbiter can do this
    SetRecipient {
        id: String,
        recipient: String,
        email: Option<String>,
        telegram_id: Option<String>,
    },
    /// Approve sends all tokens to the recipient.
    /// Only the arbiter can do this
    Approve {
        /// id is a human-readable name for the escrow from create
        id: String,
    },
    /// Refund returns all remaining tokens to the original sender,
    /// The arbiter can do this any time, or anyone can do this after a timeout
    Refund {
        /// id is a human-readable name for the escrow from create
        id: String,
    },
    /// This accepts a properly-encoded ReceiveMsg from a cw20 contract
    Receive(Cw20ReceiveMsg),
}

#[cw_serde]
pub enum ReceiveMsg {
    Create(CreateMsg),
    /// Adds all sent native tokens to the contract
    TopUp {
        id: String,
    },
}

#[cw_serde]
pub struct CreateMsg {
    /// invoice id
    pub id: String,
    /// escrow type
    pub escrow_type: EscrowType,
    /// if approved, funds go to the recipient
    pub recipient: Option<String>,
    /// email address of the recepient
    pub recepient_email: Option<String>,
    /// Telegram ID of the invoice receiver
    pub recepient_telegram_id: Option<String>,
    /// Telegram ID of the invoice issuer
    pub source_telegram_id: Option<String>,
    /// Title of the escrow
    pub title: String,
    /// Longer description of the escrow, e.g. what conditions should be met
    pub description: String,
    /// When end height set and block height exceeds this value, the escrow is expired.
    /// Once an escrow is expired, it can be returned to the original funder (via "refund").
    pub end_height: Option<u64>,
    /// When end time (in seconds since epoch 00:00:00 UTC on 1 January 1970) is set and
    /// block time exceeds this value, the escrow is expired.
    /// Once an escrow is expired, it can be returned to the original funder (via "refund").
    pub end_time: Option<u64>,
    /// Besides any possible tokens sent with the CreateMsg, this is a list of all cw20 token addresses
    /// that are accepted by the escrow during a top-up. This is required to avoid a DoS attack by topping-up
    /// with an invalid cw20 contract. See https://github.com/CosmWasm/cosmwasm-plus/issues/19
    pub cw20_whitelist: Option<Vec<String>>,
}

impl CreateMsg {
    pub fn addr_whitelist(&self, api: &dyn Api) -> StdResult<Vec<Addr>> {
        match self.cw20_whitelist.as_ref() {
            Some(v) => v.iter().map(|h| api.addr_validate(h)).collect(),
            None => Ok(vec![]),
        }
    }
}
/// Accept uuid as valid names
pub fn is_valid_name(name: &str) -> bool {
    let bytes = name.as_bytes();
    if bytes.len() != 36 {
        return false;
    }
    true
}

#[cw_serde]
#[derive(QueryResponses)]
pub enum QueryMsg {
    /// Show all open escrows. Return type is ListResponse.
    #[returns(ListResponse)]
    ListAll {},

    #[returns(DetailsResponse)]
    Details { id: String },

    #[returns(BlindTransfersResponse)]
    BlindTransfers { transfer_type: TransferTypeDetails },
}

#[cw_serde]
pub enum TransferTypeDetails {
    Email { email: String },
    Telegram { id: String },
}

#[cw_serde]
pub struct BlindTransfersResponse {
    /// Balance in native tokens
    pub native_balance: Vec<Coin>,
    /// Balance in cw20 tokens
    pub cw20_balance: Vec<Cw20Coin>,
}

#[cw_serde]
pub struct ListResponse {
    /// list all registered ids
    pub escrows: Vec<String>,
}

#[cw_serde]
pub struct DetailsResponse {
    /// Invoice for invoice escrows and BlindTransfer for escrowing tokens that are claimable with either email or telegram
    pub escrow_type: EscrowType,
    /// id of this escrow
    pub id: String,
    /// if approved, funds go to the recipient
    pub recipient: Option<String>,
    /// email address of the recepient
    pub recepient_email: Option<String>,
    /// Telegram ID of the recipient
    pub recepient_telegram_id: Option<String>,
    /// if refunded, funds go to the source
    pub source: String,
    /// Telegram ID of the source
    pub source_telegram_id: Option<String>,
    /// Title of the escrow
    pub title: String,
    /// Longer description of the escrow, e.g. what conditions should be met
    pub description: String,
    /// When end height set and block height exceeds this value, the escrow is expired.
    /// Once an escrow is expired, it can be returned to the original funder (via "refund").
    pub end_height: Option<u64>,
    /// When end time (in seconds since epoch 00:00:00 UTC on 1 January 1970) is set and
    /// block time exceeds this value, the escrow is expired.
    /// Once an escrow is expired, it can be returned to the original funder (via "refund").
    pub end_time: Option<u64>,
    /// Balance in native tokens
    pub native_balance: Vec<Coin>,
    /// Balance in cw20 tokens
    pub cw20_balance: Vec<Cw20Coin>,
    /// Whitelisted cw20 tokens
    pub cw20_whitelist: Vec<String>,
}
