import { confusionMatrix } from "@/data/dashboard";

const cells = [
  {
    label: "TN",
    value: confusionMatrix.tn,
    text: "비관심 고객 정확 예측",
    className: "cm-good",
  },
  {
    label: "FP",
    value: confusionMatrix.fp,
    text: "비관심 → 관심으로 예측",
    className: "cm-warning",
  },
  {
    label: "FN",
    value: confusionMatrix.fn,
    text: "관심 고객을 놓침",
    className: "cm-warning",
  },
  {
    label: "TP",
    value: confusionMatrix.tp,
    text: "관심 고객 정확 탐지",
    className: "cm-good",
  },
];

export default function ConfusionMatrix() {
  return (
    <div className="dashboard-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            CLASSIFICATION RESULT
          </span>

          <h2>Confusion Matrix</h2>
        </div>
      </div>

      <div className="confusion-axis-title">
        Predicted
      </div>

      <div className="confusion-layout">
        <div className="actual-label">
          Actual
        </div>

        <div className="confusion-grid">
          {cells.map((cell) => (
            <div
              key={cell.label}
              className={`confusion-cell ${cell.className}`}
            >
              <span className="confusion-label">
                {cell.label}
              </span>

              <strong>
                {cell.value.toLocaleString()}
              </strong>

              <small>
                {cell.text}
              </small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}