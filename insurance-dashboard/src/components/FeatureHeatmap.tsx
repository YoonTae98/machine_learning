import {
  Fragment,
  useEffect,
  useState,
} from "react";


type RelationshipData = {
  baseline: number;

  vehicleDamage: unknown[];
  previouslyInsured: unknown[];
  age: unknown[];
  vehicleAge: unknown[];

  heatmap: {
    columns: string[];
    values: number[][];
  };
};


const labelMap: Record<string, string> = {
  Gender: "Gender",
  Age: "Age",
  Driving_License: "License",
  Region_Code: "Region",
  Previously_Insured: "Prev. Insured",
  Vehicle_Age: "Vehicle Age",
  Vehicle_Damage: "Vehicle Damage",
  Annual_Premium: "Premium",
  Policy_Sales_Channel: "Sales Channel",
  Vintage: "Vintage",
  Response: "Response",
};


function heatmapStyle(value: number) {
  const alpha =
    0.05 +
    value * 0.78;

  return {
    background:
      `rgba(98, 116, 232, ${alpha})`,

    color:
      value > 0.55
        ? "#ffffff"
        : "#43506a",
  };
}


export default function FeatureHeatmap() {

  const [data, setData] =
    useState<RelationshipData | null>(
      null
    );


  const [selected, setSelected] =
    useState<{
      row: string;
      column: string;
      value: number;
    } | null>(null);


  useEffect(() => {

    fetch(
      "/feature_relationships.json"
    )

      .then((response) => {

        if (!response.ok) {
          throw new Error(
            "Heatmap data load failed"
          );
        }

        return response.json();

      })

      .then((json) => {

        setData(json);

      })

      .catch((error) => {

        console.error(
          error
        );

      });

  }, []);


  if (!data) {

    return (
      <div className="dashboard-panel heatmap-panel">

        <span className="eyebrow">
          FEATURE ASSOCIATION
        </span>

        <h2>
          전체 Feature Association Heatmap
        </h2>

        <p className="model-description">
          Heatmap 데이터를 불러오는 중입니다.
        </p>

      </div>
    );

  }


  const {
    columns,
    values,
  } = data.heatmap;


  return (
    <div className="dashboard-panel heatmap-panel">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="section-heading">

        <div>

          <span className="eyebrow">
            FEATURE ASSOCIATION
          </span>


          <h2>
            전체 Feature Association Heatmap
          </h2>


          <p className="model-description">
            연속형과 범주형 변수를 함께 비교하기 위해
            Phi_K 연관계수를 사용했습니다.
            값이 클수록 두 변수 사이의 연관성이 강합니다.
          </p>

        </div>


        <span className="heatmap-method">
          Phi_K · 0 → 1
        </span>

      </div>



      {/* ========================================
          RESPONSE SUMMARY
      ======================================== */}

      <div className="heatmap-response-strip">

        <span>
          Response와 높은 연관
        </span>


        <div>

          <strong>
            Vehicle Damage
          </strong>

          <b>
            0.528
          </b>

        </div>


        <div>

          <strong>
            Previously Insured
          </strong>

          <b>
            0.511
          </b>

        </div>


        <div>

          <strong>
            Sales Channel
          </strong>

          <b>
            0.325
          </b>

        </div>


        <div>

          <strong>
            Age
          </strong>

          <b>
            0.299
          </b>

        </div>

      </div>



      {/* ========================================
          HEATMAP MATRIX
      ======================================== */}

      <div className="heatmap-scroll">

        <div
          className="heatmap-matrix"
          style={{
            gridTemplateColumns:
              `125px repeat(${columns.length}, minmax(0, 1fr))`,
          }}
        >

          {/* 좌측 상단 */}

          <div className="heatmap-corner">
            Phi_K
          </div>



          {/* COLUMN LABELS */}

          {columns.map((column) => (

            <div
              className={`heatmap-column-label ${
                column === "Response"
                  ? "heatmap-response-label"
                  : ""
              }`}
              key={`header-${column}`}
            >

              <span>
                {labelMap[column] ?? column}
              </span>

            </div>

          ))}



          {/* MATRIX ROWS */}

          {columns.map(
            (row, rowIndex) => (

              <Fragment key={`row-${row}`}>

                {/* ROW LABEL */}

                <div
                  className={`heatmap-row-label ${
                    row === "Response"
                      ? "heatmap-response-label"
                      : ""
                  }`}
                >

                  {labelMap[row] ?? row}

                </div>



                {/* CELLS */}

                {values[rowIndex].map(
                  (
                    value,
                    columnIndex
                  ) => {

                    const column =
                      columns[columnIndex];


                    const isResponse =
                      row === "Response" ||
                      column === "Response";


                    return (
                      <button
                        type="button"
                        className={`heatmap-cell ${
                          isResponse
                            ? "heatmap-response-cell"
                            : ""
                        }`}
                        style={
                          heatmapStyle(value)
                        }
                        key={`${row}-${column}`}
                        onMouseEnter={() =>
                          setSelected({
                            row,
                            column,
                            value,
                          })
                        }
                        onFocus={() =>
                          setSelected({
                            row,
                            column,
                            value,
                          })
                        }
                        onMouseLeave={() =>
                          setSelected(null)
                        }
                      >

                        {value.toFixed(2)}

                      </button>
                    );

                  }
                )}

              </Fragment>

            )
          )}

        </div>

      </div>



      {/* ========================================
          SELECTED RELATION
      ======================================== */}

      <div className="heatmap-footer">

        {selected ? (

          <>

            <span>
              선택한 관계
            </span>


            <strong>
              {labelMap[selected.row] ??
                selected.row}
            </strong>


            <b>
              ↔
            </b>


            <strong>
              {labelMap[selected.column] ??
                selected.column}
            </strong>


            <em>
              Phi_K{" "}
              {selected.value.toFixed(3)}
            </em>

          </>

        ) : (

          <span>
            셀에 마우스를 올리면 변수 간 Phi_K 값을 확인할 수 있습니다.
          </span>

        )}

      </div>

    </div>
  );
}