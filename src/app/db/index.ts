import logger from "@/utils/logger";
import { QueryResult, QueryResultRow, sql } from "@vercel/postgres";

// Types
type EscrowOut = "direct" | "approve" | "refund";

export type InvoiceDataFromDb = {
  invoice: string;
  create_tx: string;
  out_tx: string;
  is_confirmed: boolean | null;
  payment_type: "direct" | "escrow" | "approve" | "refund";
  payer_tg_id: number;
  payer_address: string;
};

export interface InvoiceDto {
  id: number;
  invoice: string;
  invoice_id: string;
  issuer_tg_id: number;
  create_tx: string;
  out_tx: string;
  out_type: string;
  create_tx_at: string;
  out_tx_at: string;
  payer_tg_id: number;
  payer_address: string;
  payment_confirmed: boolean;
  rejection_reason: string;
  created_at: string;
  issuer_address: string;
  deleted: boolean;
  amount: string;
  currency: string;
  description: string;
  invoice_validity: number;
  issuer_tg_handle: string;
  total_items: number;
}
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
    SELECT invoice,create_tx,out_tx,payment_confirmed,out_type,payer_tg_id,payer_address FROM invoices
    WHERE invoice_id = ${id} AND deleted = false;
    `;
    return result.rows.length > 0
      ? ({
          invoice: result.rows[0].invoice as string,
          create_tx: result.rows[0].create_tx as string,
          out_tx: result.rows[0].out_tx as string,
          is_confirmed: result.rows[0].payment_confirmed ?? false,
          payment_type: result.rows[0].out_type as
            | "direct"
            | "escrow"
            | "approve"
            | "refund"
            | null,
          payer_tg_id: result.rows[0].payer_tg_id as number,
          payer_address: result.rows[0].payer_address as string,
        } as InvoiceDataFromDb)
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
    WHERE issuer_tg_id = ${issuer_id} AND deleted = false;
    `;
    return result.rows.length > 0
      ? result.rows.map((row) => row.invoice as string)
      : [];
  } catch (error) {
    logger.error(`Db:: Can't get invoices, ${error}`);
    return null;
  }
};
const hardDeleteInvoice = async (id: string) => {
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
const deleteInvoice = async (id: string) => {
  try {
    const result = await sql`
    UPDATE invoices
    SET deleted = true
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
    UPDATE invoices
    SET deleted = true
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
      WHERE invoice_id = ${id} AND deleted = false;
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
    // if the out_type is approve, then removed the reject reason too
    let result: QueryResult<QueryResultRow> | null = null;

    if (out_type === "approve") {
      result = await sql`
    UPDATE invoices
    SET out_tx = ${tx_hash}, out_tx_at = NOW(), out_type = ${out_type}, rejection_reason = NULL
    WHERE invoice_id = ${id}  AND deleted = false;
    `;
    } else {
      result = await sql`
    UPDATE invoices
    SET out_tx = ${tx_hash}, out_tx_at = NOW(), out_type = ${out_type}
    WHERE invoice_id = ${id}  AND deleted = false;
    `;
    }

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
  invoice_id = ${invoice_id} AND deleted = false;
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
    WHERE invoice_id = ${invoice_id}  AND deleted = false;
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
    SET rejection_reason = ${reason}, out_type='reject'
    WHERE invoice_id = ${invoice_id}  AND deleted = false;
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
    WHERE issuer_tg_id = ${userTgId} AND deleted = false
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

export const getAllInvoicesForAUser = async (
  userTgId: number,
  page: number,
  limit: number,
  filter: "All" | "Invoices" | "Payments"
) => {
  const offset = (page - 1) * limit;
  try {
    let res: QueryResult<QueryResultRow> | null = null;
    if (filter === "All") {
      res = await sql`
    WITH filtered_invoices AS (
    SELECT *
    FROM invoices
    WHERE  deleted = false AND issuer_tg_id = ${userTgId} OR payer_tg_id = ${userTgId}
    )
    SELECT 
    *,
    (SELECT COUNT(*) FROM filtered_invoices) AS total_items
    FROM filtered_invoices
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset};
    `;
    } else if (filter === "Payments") {
      res = await sql`
      WITH filtered_invoices AS (
      SELECT *
      FROM invoices
      WHERE  deleted = false AND payer_tg_id = ${userTgId}
      )
      SELECT 
      *,
      (SELECT COUNT(*) FROM filtered_invoices) AS total_items
      FROM filtered_invoices
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset};
      `;
    } else if (filter === "Invoices") {
      res = await sql`
      WITH filtered_invoices AS (
      SELECT *
      FROM invoices
      WHERE  deleted = false AND issuer_tg_id = ${userTgId}
      )
      SELECT 
      *,
      (SELECT COUNT(*) FROM filtered_invoices) AS total_items
      FROM filtered_invoices
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset};
      `;
    }
    console.log(res);

    if (res && res.rowCount && res.rowCount > 0) {
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
    WHERE payer_tg_id = ${userTgId} AND deleted = false
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
  hardDeleteInvoice,
  deleteInvoicesByIssuer,
  addEscrowTxToInvoice,
  addEscrowOutTxToInvoice,
  confirmTheInvoicePayment,
  rejectEscrow,
  getInvoicesCreatedByUser,
  getInvoicesPaidByUser,
};
