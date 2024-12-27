import logger from "@/lib/logger";
import { sql } from "@vercel/postgres";
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
        SELECT * FROM invoices WHERE invoice_id = ${id};
      `;
    return result.rows[0];
  } catch (error) {
    logger.error(`Db:: Can't get an invoice, ${error}`);
    return null;
  }
};
const getInvoices = async (issuer_id: string) => {
  try {
    const result = await sql`
        SELECT * FROM invoices WHERE issuer_tg_id = ${issuer_id};
      `;
    return result.rows;
  } catch (error) {
    logger.error(`Db:: Can't get invoices, ${error}`);
    return null;
  }
};
const deleteInvoice = async (id: string) => {
  try {
    const result = await sql`
        DELETE FROM invoices WHERE invoice_id = ${id};
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
                DELETE FROM invoices WHERE issuer_tg_id = ${issuer_id};
            `;
    return result.rowCount;
  } catch (error) {
    logger.error(`Db:: Can't delete invoices for issuer, ${error}`);
    return null;
  }
};
export {
  addInvoice,
  getInvoice,
  getInvoices,
  deleteInvoice,
  deleteInvoicesByIssuer,
};
