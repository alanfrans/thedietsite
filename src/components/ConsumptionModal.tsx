import React from 'react';

interface ConsumptionModalProps {
  itemName: string;
  onConfirm: (finished: boolean, quantityConsumed: number) => void;
  onCancel: () => void;
}

export const ConsumptionModal: React.FC<ConsumptionModalProps> = ({
  itemName,
  onConfirm,
  onCancel
}) => {
  const [quantity, setQuantity] = React.useState(1);
  const [isFinished, setIsFinished] = React.useState<boolean | null>(null);

  const handleSubmit = () => {
    if (isFinished === null) {
      alert('Please select whether you finished the item');
      return;
    }
    onConfirm(isFinished, quantity);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>🍽️ Logging Consumption</h2>
        <p className="modal-item-name">{itemName}</p>

        <div className="consumption-options">
          <div className="form-group">
            <label>How much did you eat?</label>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(Math.max(0.1, parseFloat(e.target.value) || 1))}
              min="0.1"
              step="0.5"
            />
            <span className="helper-text">servings/portions</span>
          </div>

          <div className="form-group">
            <label>Did you finish this item?</label>
            <div className="button-group">
              <button
                className={`btn ${isFinished === true ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setIsFinished(true)}
              >
                ✅ Yes, all gone
              </button>
              <button
                className={`btn ${isFinished === false ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setIsFinished(false)}
              >
                📦 Still have some left
              </button>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={handleSubmit}>
            Log Consumption
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
