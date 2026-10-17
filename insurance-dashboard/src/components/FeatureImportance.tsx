import { featureImportance } from "@/data/dashboard";


export default function FeatureImportance() {

  const maxValue = Math.max(
    ...featureImportance.map(
      (item) => item.value
    )
  );


  return (
    <div className="dashboard-panel">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="section-heading">

        <div>

          <span className="eyebrow">
            MODEL INTERPRETABILITY
          </span>


          <h2>
            Feature Importance
          </h2>


          <p className="model-description">
            최종 9개 Feature XGBoost의 Total Gain을
            원래 변수 단위로 합산한 중요도입니다.
          </p>

        </div>


        <span className="section-note">
          9 Final Features · Total Gain
        </span>

      </div>



      {/* ========================================
          FEATURE IMPORTANCE LIST
      ======================================== */}

      <div className="importance-list">

        {featureImportance.map(
          (item, index) => (

            <div
              className="importance-row"
              key={item.feature}
            >

              {/* 변수명 */}

              <div className="importance-name">

                <span className="importance-rank">
                  {String(index + 1).padStart(2, "0")}
                </span>


                <strong>
                  {item.feature}
                </strong>

              </div>



              {/* BAR */}

              <div className="importance-track">

                <div
                  className="importance-bar"
                  style={{
                    width:
                      `${(item.value / maxValue) * 100}%`,
                  }}
                />

              </div>



              {/* VALUE */}

              <strong className="importance-value">

                {(item.value * 100).toFixed(2)}%

              </strong>

            </div>

          )
        )}

      </div>

    </div>
  );
}