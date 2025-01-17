import logger from "@/utils/logger";
import { sql } from "@vercel/postgres";

// Types
type EscrowOut = "direct" | "approve" | "refund";
// Functions
const addInvoice = async (id: string, issuer_id: number, invoice: string) => {
  try {
    const result = await sql`
    INSERT INTO invoices (invoice, invoice_id, issuer_tg_id)
    VALUES (
    ${invoice},
    ${id},
    ${issuer_id}
    )
    RETURNING id;
    `;
    logger.info(`Db:: New Invoice added, id: ${result.rows[0].id}`);
    return result.rows[0].id as number;
  } catch (error) {
    logger.error(`Db:: Can't add an invoice, ${error}`);
    return null;
  }
};
const getInvoice = async (id: string) => {
  try {
    const result = await sql`
    SELECT invoice,create_tx,out_tx,payment_confirmed,out_type,payer_tg_id FROM invoices
    WHERE invoice_id = ${id};
    `;
    if (result.rows.length > 0) {
    }
    return result.rows.length > 0
      ? {
          invoice: result.rows[0].invoice as string,
          create_tx: result.rows[0].create_tx as string,
          out_tx: result.rows[0].out_tx as string,
          is_confirmed: result.rows[0].payment_confirmed ?? false,
          payment_type: result.rows[0].out_type as
            | "direct"
            | "escrow"
            | "approve"
            | "refund",
          payer_tg_id: result.rows[0].payer_tg_id,
        }
      : null;
  } catch (error) {
    logger.error(`Db:: Can't get an invoice, ${error}`);
    return null;
  }
};
const getInvoices = async (issuer_id: string) => {
  try {
    const result = await sql`
    SELECT invoice FROM invoices
    WHERE issuer_tg_id = ${issuer_id};
    `;
    return result.rows.length > 0
      ? result.rows.map((row) => row.invoice as string)
      : [];
  } catch (error) {
    logger.error(`Db:: Can't get invoices, ${error}`);
    return null;
  }
};
const deleteInvoice = async (id: string) => {
  try {
    const result = await sql`
    DELETE FROM invoices
    WHERE invoice_id = ${id};
    `;
    return result.rowCount;
  } catch (error) {
    logger.error(`Db:: Can't delete an invoice, ${error}`);
    return null;
  }
};
const deleteInvoicesByIssuer = async (issuer_id: string) => {
  try {
    const result = await sql`
    DELETE FROM invoices
    WHERE issuer_tg_id = ${issuer_id};
    `;
    return result.rowCount;
  } catch (error) {
    logger.error(`Db:: Can't delete invoices for issuer, ${error}`);
    return null;
  }
};

const addEscrowTxToInvoice = async (
  id: string,
  txHash: string,
  payerTgId: number | undefined,
  payerAddress: string,
  outType?: "direct" | "escrow"
) => {
  try {
    // Base SQL query
    const result = await sql`
      UPDATE invoices
      SET 
        payer_address = ${payerAddress},
        payer_tg_id = ${payerTgId},
        create_tx = ${txHash},
        create_tx_at = NOW(),
        out_type = ${outType},
        out_tx = CASE WHEN ${outType} = 'direct' THEN ${txHash} ELSE out_tx END,
        out_tx_at = CASE WHEN ${outType} = 'direct' THEN NOW() ELSE out_tx_at END
      WHERE invoice_id = ${id};
    `;

    return result.rowCount;
  } catch (error) {
    logger.error(`Db:: Failed to update invoice (ID: ${id}), Error: ${error}`);
    return null;
  }
};

const addEscrowOutTxToInvoice = async (
  id: string,
  tx_hash: string,
  out_type: EscrowOut
) => {
  try {
    const result = await sql`
    UPDATE invoices
    SET out_tx = ${tx_hash}, out_tx_at = NOW(), out_type = ${out_type}
    WHERE invoice_id = ${id};
    `;
    return result.rowCount;
  } catch (error) {
    logger.error(`Db:: Can't update invoice, ${error}`);
    return null;
  }
};

export const queryIsPaid = async (invoice_id: string) => {
  try {
    const res = await sql`
  SELECT create_tx,out_tx FROM invoices
  WHERE
  invoice_id = ${invoice_id};
  `;
    if (res.rowCount && res.rowCount > 0) {
      // then either this is paid or finalized
      if (res.rows[0].create_tx && res.rows[0].out_tx) {
        return "finalized";
      }
      if (res.rows[0].create_tx) {
        return "paid";
      }
      return null; // not paid or no inquiry
    } else {
      return "not-paid";
    }
  } catch (error) {
    logger.error(`Db:: Can't query payment status,\n error: ${error}`);
    throw new Error("Can't query db at the moment.");
  }
};

const confirmTheInvoicePayment = async (invoice_id: string) => {
  try {
    const res = await sql`
    UPDATE invoices
    SET payment_confirmed = true
    WHERE invoice_id = ${invoice_id};
    `;
    if (res.rowCount && res.rowCount > 0) {
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Db:: Can't confirm the payment,\n error: ${error}`);
    throw new Error("Can't confirm the payment.");
  }
};

const rejectEscrow = async (invoice_id: string, reason: string) => {
  try {
    const res = await sql`
    UPDATE invoices
    SET rejection_reason = ${reason}
    WHERE invoice_id = ${invoice_id};
    `;
    if (res.rowCount && res.rowCount > 0) {
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Db:: Can't reject the escrow,\n error: ${error}`);
    throw new Error("Can't reject the escrow");
  }
};

const getInvoicesCreatedByUser = async (
  userTgId: number,
  page: number,
  limit: number = 10
) => {
  const offset = (page - 1) * limit;
  try {
    const res = await sql`
    SELECT * FROM invoices
    WHERE issuer_tg_id = ${userTgId}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset};
    `;
    if (res.rowCount && res.rowCount > 0) {
      return res.rows;
    }
    return null;
  } catch (error) {
    logger.error(`Db:: Can't reject the escrow,\n error: ${error}`);
    return null;
  }
};

const getInvoicesPaidByUser = async (
  userTgId: number,
  page: number,
  limit: number = 10
) => {
  const offset = (page - 1) * limit;
  try {
    const res = await sql`
    SELECT * FROM invoices
    WHERE payer_tg_id = ${userTgId}
    ORDER BY create_tx_at DESC
    LIMIT ${limit} OFFSET ${offset};
    `;
    if (res.rowCount && res.rowCount > 0) {
      return res.rows;
    }
    return null;
  } catch (error) {
    logger.error(`Db:: Can't reject the escrow,\n error: ${error}`);
    return null;
  }
};

export type { EscrowOut };
export {
  addInvoice,
  getInvoice,
  getInvoices,
  deleteInvoice,
  deleteInvoicesByIssuer,
  addEscrowTxToInvoice,
  addEscrowOutTxToInvoice,
  confirmTheInvoicePayment,
  rejectEscrow,
  getInvoicesCreatedByUser,
  getInvoicesPaidByUser,
};
