use std::fmt::{self};

use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Coin, Env, Order, StdResult, Storage, Timestamp};

use cw20::{Balance, Cw20Coin, Cw20CoinVerified};
use cw_storage_plus::{Index, IndexList, IndexedMap, Item, MultiIndex};

use crate::msg::BlindTransfersResponse;

#[cw_serde]
#[derive(Default)]
pub struct GenericBalance {
    pub native: Vec<Coin>,
    pub cw20: Vec<Cw20CoinVerified>,
}

impl GenericBalance {
    pub fn add_tokens(&mut self, add: Balance) {
        match add {
            Balance::Native(balance) => {
                for token in balance.0 {
                    let index = self.native.iter().enumerate().find_map(|(i, exist)| {
                        if exist.denom == token.denom {
                            Some(i)
                        } else {
                            None
                        }
                    });
                    match index {
                        Some(idx) => self.native[idx].amount += token.amount,
                        None => self.native.push(token),
                    }
                }
            }
            Balance::Cw20(token) => {
                let index = self.cw20.iter().enumerate().find_map(|(i, exist)| {
                    if exist.address == token.address {
                        Some(i)
                    } else {
                        None
                    }
                });
                match index {
                    Some(idx) => self.cw20[idx].amount += token.amount,
                    None => self.cw20.push(token),
                }
            }
        };
    }
}

#[cw_serde]
pub enum TransferType {
    Email,
    Telegram,
}

impl fmt::Display for TransferType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let str = match self {
            TransferType::Email => "Email",
            TransferType::Telegram => "Telegram",
        };
        write!(f, "{}", str)
    }
}
#[cw_serde]
pub struct InvoiceAmount {
    pub amount: String,
    pub currency: String,
}

#[cw_serde]
pub enum EscrowType {
    Invoice { amount: InvoiceAmount },
    BlindTransfer { transfer: TransferType },
}

#[cw_serde]
pub struct Escrow {
    /// Invoice for invoice escrows and BlindTransfer for escrowing tokens that are claimable with either email or telegram
    pub escrow_type: EscrowType,
    /// arbiter can decide to approve or refund the escrow
    pub arbiter: Addr,
    /// if approved, funds go to the recipient, cannot approve if recipient is none
    pub recipient: Option<Addr>,
    /// email address of the recepient
    pub recepient_email: Option<String>,
    /// Telegram ID of the recipient
    pub recepient_telegram_id: Option<String>,
    /// if refunded, funds go to the source
    pub source: Addr,
    /// Telegram ID of the source
    pub source_telegram_id: Option<String>,
    /// Title of the escrow, for example for a bug bounty "Fix issue in contract.rs"
    pub title: String,
    /// Description of the escrow, a more in depth description of how to meet the escrow condition
    pub description: String,
    /// When end height set and block height exceeds this value, the escrow is expired.
    /// Once an escrow is expired, it can be returned to the original funder (via "refund").
    pub end_height: Option<u64>,
    /// When end time (in seconds since epoch 00:00:00 UTC on 1 January 1970) is set and
    /// block time exceeds this value, the escrow is expired.
    /// Once an escrow is expired, it can be returned to the original funder (via "refund").
    pub end_time: Option<u64>,
    /// Balance in Native and Cw20 tokens
    pub balance: GenericBalance,
    /// All possible contracts that we accept tokens from
    pub cw20_whitelist: Vec<Addr>,
}

impl Escrow {
    pub fn is_expired(&self, env: &Env) -> bool {
        if let Some(end_height) = self.end_height {
            if env.block.height > end_height {
                return true;
            }
        }

        if let Some(end_time) = self.end_time {
            if env.block.time > Timestamp::from_seconds(end_time) {
                return true;
            }
        }

        false
    }

    pub fn human_whitelist(&self) -> Vec<String> {
        self.cw20_whitelist.iter().map(|a| a.to_string()).collect()
    }
}

// pub const ESCROWS: Map<&str, Escrow> = Map::new("escrow");
pub struct EscrowIndices {
    // Secondary index for escrow type
    pub escrow_type: MultiIndex<'static, String, Escrow, &'static str>,
    // Secondary index for recipient email
    pub email_index: MultiIndex<'static, String, Escrow, &'static str>,
    // Secondary index for recipient Telegram ID
    pub telegram_index: MultiIndex<'static, String, Escrow, &'static str>,
}

impl IndexList<Escrow> for EscrowIndices {
    fn get_indexes(&self) -> Box<dyn Iterator<Item = &dyn Index<Escrow>> + '_> {
        Box::new(
            std::iter::once(&self.escrow_type as &dyn Index<Escrow>)
                .chain(std::iter::once(&self.email_index as &dyn Index<Escrow>))
                .chain(std::iter::once(&self.telegram_index as &dyn Index<Escrow>)),
        )
    }
}

pub fn escrows() -> IndexedMap<&'static str, Escrow, EscrowIndices> {
    let indices = EscrowIndices {
        // escrow type index: this could be Invoice, Email or Telegram
        escrow_type: MultiIndex::new(
            |_, escrow| {
                let escrow_type = match &escrow.escrow_type {
                    EscrowType::BlindTransfer { transfer } => transfer.to_string(), // either telegram or email
                    EscrowType::Invoice { .. } => "Invoice".to_string(),
                };
                escrow_type
            },
            "escrow",
            "escrow__type",
        ),
        // recipient email index
        email_index: MultiIndex::new(
            |_, escrow| {
                if let EscrowType::BlindTransfer { transfer } = &escrow.escrow_type {
                    if transfer == &TransferType::Email {
                        return normalize_string(
                            &escrow.recepient_email.clone().unwrap_or_default(),
                        );
                    }
                }
                String::new()
            },
            "escrow",
            "escrow__email_index",
        ),
        // recipient Telegram ID index
        telegram_index: MultiIndex::new(
            |_, escrow| {
                if let EscrowType::BlindTransfer { transfer } = &escrow.escrow_type {
                    if transfer == &TransferType::Telegram {
                        return normalize_string(
                            &escrow.recepient_telegram_id.clone().unwrap_or_default(),
                        );
                    }
                }
                String::new()
            },
            "escrow",
            "escrow__telegram_index",
        ),
    };
    IndexedMap::new("escrow", indices)
}

pub const ARBITER: Item<String> = Item::new("arbiter");

/// This returns the list of ids for all registered escrows
pub fn query_all_escrow_ids(storage: &dyn Storage) -> StdResult<Vec<String>> {
    escrows()
        .keys(storage, None, None, Order::Ascending)
        .collect()
}

pub fn query_by_recepient_email(storage: &dyn Storage, email: &str) -> StdResult<Vec<Escrow>> {
    escrows()
        .idx
        .email_index
        .prefix(normalize_string(email))
        .range(storage, None, None, Order::Ascending)
        .map(|item| item.map(|(_, escrow)| escrow))
        .collect()
}

pub fn query_by_recepient_email_balance(
    storage: &dyn Storage,
    email: &str,
) -> StdResult<Vec<BlindTransfersResponse>> {
    escrows()
        .idx
        .email_index
        .prefix(normalize_string(email))
        .range(storage, None, None, Order::Ascending)
        .map(|item| {
            item.map(|(_, escrow)| BlindTransfersResponse {
                native_balance: escrow.balance.native.clone(),
                cw20_balance: escrow
                    .balance
                    .cw20
                    .iter()
                    .map(|cw20| Cw20Coin {
                        address: cw20.address.clone().into_string(),
                        amount: cw20.amount,
                    })
                    .collect(),
            })
        })
        .collect()
}

pub fn query_by_telegram_id(storage: &dyn Storage, tg_id: &str) -> StdResult<Vec<Escrow>> {
    escrows()
        .idx
        .telegram_index
        .prefix(normalize_string(tg_id))
        .range(storage, None, None, Order::Ascending)
        .map(|item| item.map(|(_, escrow)| escrow))
        .collect()
}

pub fn query_by_telegram_id_balance(
    storage: &dyn Storage,
    tg_id: &str,
) -> StdResult<Vec<BlindTransfersResponse>> {
    escrows()
        .idx
        .telegram_index
        .prefix(normalize_string(tg_id))
        .range(storage, None, None, Order::Ascending)
        .map(|item| {
            item.map(|(_, escrow)| BlindTransfersResponse {
                native_balance: escrow.balance.native.clone(),
                cw20_balance: escrow
                    .balance
                    .cw20
                    .iter()
                    .map(|cw20| Cw20Coin {
                        amount: cw20.amount,
                        address: cw20.address.clone().into_string(),
                    })
                    .collect(),
            })
        })
        .collect()
}

pub fn normalize_string(str: &str) -> String {
    str.trim().to_lowercase()
}

#[cfg(test)]
mod tests {
    use super::*;

    use cosmwasm_std::{testing::MockStorage, Addr};

    #[test]
    fn no_escrow_ids() {
        let storage = MockStorage::new();
        let ids = query_all_escrow_ids(&storage).unwrap();
        assert_eq!(0, ids.len());
    }

    fn dummy_escrow() -> Escrow {
        Escrow {
            escrow_type: EscrowType::Invoice {
                amount: {
                    InvoiceAmount {
                        amount: "123".to_string(),
                        currency: "USD".to_string(),
                    }
                },
            },
            arbiter: Addr::unchecked("arb"),
            recipient: Some(Addr::unchecked("recip")),
            recepient_telegram_id: Some("receiver_id".to_string()),
            recepient_email: None,
            source: Addr::unchecked("source"),
            title: "some_escrow".to_string(),
            description: "some escrow desc".to_string(),
            end_height: None,
            end_time: None,
            balance: Default::default(),
            cw20_whitelist: vec![],
            source_telegram_id: Some("issuer_id".to_string()),
        }
    }

    #[test]
    fn all_escrow_ids_in_order() {
        let mut storage = MockStorage::new();
        escrows()
            .save(&mut storage, "lazy", &dummy_escrow())
            .unwrap();
        escrows()
            .save(&mut storage, "assign", &dummy_escrow())
            .unwrap();
        escrows()
            .save(&mut storage, "zen", &dummy_escrow())
            .unwrap();

        let ids = query_all_escrow_ids(&storage).unwrap();
        assert_eq!(3, ids.len());
        assert_eq!(
            vec!["assign".to_string(), "lazy".to_string(), "zen".to_string()],
            ids
        )
    }
}
