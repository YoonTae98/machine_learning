export const metrics = [
  {
    label: "F1 Score",
    value: "0.4605",
    description: "Precision과 Recall의 조화평균",
  },
  {
    label: "ROC-AUC",
    value: "0.8587",
    description: "전체 클래스 판별 능력",
  },
  {
    label: "Recall",
    value: "75.68%",
    description: "실제 관심 고객 탐지율",
  },
  {
    label: "AP",
    value: "0.3717",
    description: "Precision-Recall 종합 성능",
  },
];


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


export const modelComparison = [
  {
    model: "XGBoost",
    f1: 0.4605,
    rocAuc: 0.8587,
    ap: 0.3717,
  },
  {
    model: "Gradient Boosting",
    f1: 0.4604,
    rocAuc: 0.8583,
    ap: 0.3712,
  },
  {
    model: "LightGBM",
    f1: 0.4583,
    rocAuc: 0.8584,
    ap: 0.3710,
  },
  {
    model: "Soft Voting",
    f1: 0.4597,
    rocAuc: 0.8588,
    ap: 0.3725,
  },
];


export const confusionMatrix = {
  tn: 52589,
  fp: 14291,
  fn: 2272,
  tp: 7070,
};


export const finalResult = {
  model: "XGBoost",
  threshold: 0.2285,

  precision: 0.3310,
  recall: 0.7568,

  f1: 0.4605,
  rocAuc: 0.8587,
  ap: 0.3717,
};


/*
  XGBoost Total Gain 기준
  원래 변수 단위 Feature Importance

  One-Hot Encoding된 변수는
  원래 변수 기준으로 다시 합산한 값
*/

export const featureImportance = [
  {
    feature: "Vehicle_Damage",
    value: 0.386052,
  },
  {
    feature: "Previously_Insured",
    value: 0.359617,
  },
  {
    feature: "Age",
    value: 0.100189,
  },
  {
    feature: "Policy_Sales_Channel",
    value: 0.091054,
  },
  {
    feature: "Region_Code",
    value: 0.022601,
  },
  {
    feature: "Vehicle_Age",
    value: 0.018464,
  },
  {
    feature: "Annual_Premium",
    value: 0.011494,
  },
  {
    feature: "Vintage",
    value: 0.007353,
  },
  {
    feature: "Gender",
    value: 0.002416,
  },
  {
    feature: "Driving_License",
    value: 0.000760,
  },
];