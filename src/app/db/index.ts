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
    SELECT invoice FROM invoices
    WHERE invoice_id = ${id};
    `;
    if (result.rows.length > 0) {
    }
    return result.rows.length > 0 ? (result.rows[0].invoice as string) : null;
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
  tx_hash: string,
  out_type?: "direct"
) => {
  try {
    const result = await sql`
    UPDATE invoices
    SET create_tx = ${tx_hash}, create_tx_at = NOW() ${
      out_type
        ? `, out_type = ${out_type}, out_tx = ${tx_hash}, out_tx_at = NOW()`
        : ""
    }
    WHERE invoice_id = ${id};
    `;
    return result.rowCount;
  } catch (error) {
    logger.error(`Db:: Can't update invoice, ${error}`);
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

export type { EscrowOut };

export {
  addInvoice,
  getInvoice,
  getInvoices,
  deleteInvoice,
  deleteInvoicesByIssuer,
  addEscrowTxToInvoice,
  addEscrowOutTxToInvoice,
};
