// ============================================================
// Final Dashboard Data
// Vintage 제거 후 최종 XGBoost 기준
// ============================================================


// ============================================================
// 1. 최종 모델 핵심 지표
// Validation 기준
// ============================================================

export const metrics = [
  {
    label: "F1 Score",
    value: "0.4602",
    description: "Precision과 Recall의 조화평균",
  },
  {
    label: "ROC-AUC",
    value: "0.8587",
    description: "전체 클래스 판별 능력",
  },
  {
    label: "Recall",
    value: "76.84%",
    description: "실제 관심 고객 탐지율",
  },
  {
    label: "AP",
    value: "0.3721",
    description: "Precision-Recall 종합 성능",
  },
];


// ============================================================
// 2. Target 분포
// ============================================================

export const targetDistribution = [
  {
    label: "Response 0",
    value: 87.74,
  },
  {
    label: "Response 1",
    value: 12.26,
  },
];


// ============================================================
// 3. 초기 모델 비교 결과
//
// 초기 전체 Feature(Vintage 포함) 기준
// OOF Threshold 최적화 결과
//
// 이후 EDA에서 Vintage 제거 후
// XGBoost만 최종 9개 Feature로 재학습
// ============================================================

export const modelComparison = [
  {
    model: "XGBoost",
    f1: 0.4592,
    rocAuc: 0.8582,
    ap: 0.3717,
  },
  {
    model: "LightGBM",
    f1: 0.4592,
    rocAuc: 0.8580,
    ap: 0.3715,
  },
  {
    model: "Gradient Boosting",
    f1: 0.4590,
    rocAuc: 0.8577,
    ap: 0.3703,
  },
  {
    model: "Logistic Regression",
    f1: 0.4534,
    rocAuc: 0.8492,
    ap: 0.3375,
  },
  {
    model: "Random Forest",
    f1: 0.4260,
    rocAuc: 0.8366,
    ap: 0.3067,
  },
  {
    model: "Decision Tree",
    f1: 0.3022,
    rocAuc: 0.8315,
    ap: 0.2981,
  },
];


// ============================================================
// 4. Soft Voting 추가 실험
//
// 초기 전체 Feature(Vintage 포함) 기준
// 상위 3개 모델 결합
// ============================================================

export const ensembleResult = {
  model: "Soft Voting",
  threshold: 0.3778295,

  precision: 0.331210,
  recall: 0.751338,

  f1: 0.459750,
  rocAuc: 0.858817,
  ap: 0.372469,
};


// ============================================================
// 5. 최종 XGBoost Confusion Matrix
//
// Vintage 제거 후 9개 Feature
// Threshold = 0.222612
// ============================================================

export const confusionMatrix = {
  tn: 52207,
  fp: 14673,
  fn: 2164,
  tp: 7178,
};


// ============================================================
// 6. 최종 XGBoost Validation 결과
// ============================================================

export const finalResult = {
  model: "XGBoost",

  threshold: 0.222612,

  precision: 0.328498,
  recall: 0.768358,

  f1: 0.460231,
  rocAuc: 0.858701,
  ap: 0.372132,

  predictedPositive: 21851,
};


// ============================================================
// 7. 운영 Threshold 비교
//
// 같은 XGBoost 모델에서 Threshold만 변경
// ============================================================

export const operatingPointComparison = [
  {
    label: "F1 Optimal",

    threshold: 0.222612,

    precision: 0.328498,
    recall: 0.768358,
    f1: 0.460231,

    predictedPositive: 21851,

    tp: 7178,
    fn: 2164,
    fp: 14673,
    tn: 52207,
  },

  {
    label: "Recall 95%",

    threshold: 0.099649,

    precision: 0.2747,
    recall: 0.9499,
    f1: 0.4262,

    predictedPositive: 32300,

    tp: 8874,
    fn: 468,
    fp: 23426,
    tn: 43454,
  },
];


// ============================================================
// 8. XGBoost Feature Importance
//
// Vintage 제거 후 최종 9개 Feature
// Total Gain 기준
//
// One-Hot Encoding된 Feature는
// 원래 변수 단위로 다시 합산
// ============================================================

export const featureImportance = [
  {
    feature: "Vehicle_Damage",
    value: 0.4060,
  },
  {
    feature: "Previously_Insured",
    value: 0.3485,
  },
  {
    feature: "Age",
    value: 0.1110,
  },
  {
    feature: "Policy_Sales_Channel",
    value: 0.0695,
  },
  {
    feature: "Vehicle_Age",
    value: 0.0250,
  },
  {
    feature: "Region_Code",
    value: 0.0229,
  },
  {
    feature: "Annual_Premium",
    value: 0.0138,
  },
  {
    feature: "Gender",
    value: 0.0025,
  },
  {
    feature: "Driving_License",
    value: 0.0007,
  },
];


// ============================================================
// 9. Grouped SHAP Importance
//
// One-Hot Encoding된 SHAP 값을
// 원래 9개 Feature 단위로 통합
// ============================================================

export const groupedShapImportance = [
  {
    feature: "Previously_Insured",
    value: 0.641451,
  },
  {
    feature: "Vehicle_Damage",
    value: 0.132021,
  },
  {
    feature: "Policy_Sales_Channel",
    value: 0.082708,
  },
  {
    feature: "Region_Code",
    value: 0.074946,
  },
  {
    feature: "Age",
    value: 0.028480,
  },
  {
    feature: "Annual_Premium",
    value: 0.021172,
  },
  {
    feature: "Vehicle_Age",
    value: 0.016072,
  },
  {
    feature: "Gender",
    value: 0.003031,
  },
  {
    feature: "Driving_License",
    value: 0.000120,
  },
];


// ============================================================
// 10. Vintage 제거 근거
// ============================================================

export const vintageRemoval = {
  phiK: 0.0045,
  pointBiserialR: -0.001050,
  pValue: 0.516704,

  reason:
    "Response와의 연관성과 통계적 유의성이 확인되지 않아 최종 입력 변수에서 제외",
};