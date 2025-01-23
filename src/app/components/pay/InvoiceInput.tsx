export const InvoiceInput = ({
  onScan,
  onPaste,
  platform,
}: {
  onScan: () => void;
  onPaste: () => void;
  platform: string | null;
}) => {
  return (
    <div className="form-control mb-6">
      <label className="label">
        <span className="label-text">Invoice ID</span>
      </label>
      <input
        type="text"
        placeholder="Scan the QR code or paste the invoice"
        className="input input-bordered w-full tg-input pointer-events-none"
      />
      <div className="flex gap-4 mt-4">
        {(platform === "android" || platform === "ios") && (
          <button onClick={onScan} className="btn btn-primary flex-1">
            Scan QR Code
          </button>
        )}
        <button onClick={onPaste} className="btn btn-secondary flex-1">
          Paste from Clipboard
        </button>
      </div>
    </div>
  );
};
