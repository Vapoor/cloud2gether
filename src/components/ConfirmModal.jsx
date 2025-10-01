import "../styles/ComfirmModal.css";

export default function ConfirmModal({ open, title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h4 className="modal-title">{title}</h4>
        <p className="modal-msg">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-muted" onClick={onCancel}>{cancelText}</button>
          <button className="btn btn-danger" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}