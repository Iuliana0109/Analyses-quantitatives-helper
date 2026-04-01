import { useMemo, useState } from "react";
import "./App.css";

type Tab = "home" | "pre" | "apa" | "explain";
type PreMode = "f" | "sce";
type ApaMode = "twoGroups" | "continuous" | "multiple" | "factorial";
type MultipleMode = "mixed" | "twoContinuous";
type FactorialMode = "mainOnly" | "withInteraction";

function parseValue(value: string): number {
  return Number(value.trim().replace(/\s/g, "").replace(/,/g, "."));
}

function hasNumber(value: string): boolean {
  return value.trim() !== "" && !Number.isNaN(parseValue(value));
}

function formatValue(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "";
  const fixed = value.toFixed(digits);
  if (Math.abs(value) < 1) return fixed.replace(/^(-?)0\./, "$1.");
  return fixed;
}

function formatP(p: number): string {
  if (!Number.isFinite(p)) return "";
  if (p < 0.001) return "p < .001";
  return `p = ${formatValue(p, 3)}`;
}

function formatPre(pre: number): string {
  if (!Number.isFinite(pre)) return "";
  return formatValue(pre, 3);
}

function normalizePText(value: string): string {
  const raw = value.trim().replace(/,/g, ".");
  if (!raw) return "";

  const compact = raw.replace(/\s+/g, "");
  const withoutP = compact.replace(/^p/i, "");

  if (withoutP.startsWith("<")) {
    const n = parseValue(withoutP.slice(1));
    return Number.isFinite(n) ? `p < ${formatValue(n, 3)}` : `p < ${withoutP.slice(1)}`;
  }

  if (withoutP.startsWith("=")) {
    const n = parseValue(withoutP.slice(1));
    return Number.isFinite(n) ? `p = ${formatValue(n, 3)}` : `p = ${withoutP.slice(1)}`;
  }

  const n = parseValue(withoutP);
  if (Number.isFinite(n)) {
    return n < 0.001 ? "p < .001" : `p = ${formatValue(n, 3)}`;
  }

  return raw.startsWith("p") || raw.startsWith("P") ? raw : `p ${raw}`;
}

function isSignificantP(value: string): boolean | null {
  const raw = value.trim().replace(/,/g, ".");
  if (!raw) return null;

  const compact = raw.replace(/\s+/g, "");
  const withoutP = compact.replace(/^p/i, "");

  if (withoutP.startsWith("<")) {
    const n = parseValue(withoutP.slice(1));
    return Number.isFinite(n) ? n <= 0.05 : null;
  }

  if (withoutP.startsWith("=")) {
    const n = parseValue(withoutP.slice(1));
    return Number.isFinite(n) ? n < 0.05 : null;
  }

  const n = parseValue(withoutP);
  return Number.isFinite(n) ? n < 0.05 : null;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    console.log("Copy failed");
  }
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helper?: string;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        className="field-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {helper ? <span className="field-helper">{helper}</span> : null}
    </label>
  );
}

function ResultCard({
  title,
  text,
  secondary,
}: {
  title: string;
  text: string;
  secondary?: string;
}) {
  return (
    <div className="result-card">
      <p className="result-eyebrow">{title}</p>
      <p className="result-text">
        {text || "Remplis les champs pour voir le résultat."}
      </p>
      {secondary ? <p className="result-secondary">{secondary}</p> : null}
    </div>
  );
}

function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [preMode, setPreMode] = useState<PreMode>("f");
  const [apaMode, setApaMode] = useState<ApaMode>("twoGroups");
  const [multipleMode, setMultipleMode] = useState<MultipleMode>("mixed");
const [factorialMode, setFactorialMode] = useState<FactorialMode>("mainOnly");
  const [openExplain, setOpenExplain] = useState<string>("b");

  const [continuous, setContinuous] = useState({
  predictor: "X",
  outcome: "Y",
  b: "",
  t: "",
  df: "",
  p: "",
  pre: "",
  intercept: "",
});

const [multiple, setMultiple] = useState({
  outcome: "la performance",
  categoricalPredictor: "le sexe",
  continuousPredictor: "la taille",
  group1: "Femmes",
  m1: "",
  sd1: "",
  group2: "Hommes",
  m2: "",
  sd2: "",
  catT: "",
  catDf: "",
  catP: "",
  catPre: "",
  b: "",
  contT: "",
  contDf: "",
  contP: "",
  contPre: "",
});

const [twoContinuousMultiple, setTwoContinuousMultiple] = useState({
  outcome: "la performance",
  predictor1: "X1",
  predictor2: "X2",
  b1: "",
  t1: "",
  df1: "",
  p1: "",
  pre1: "",
  b2: "",
  t2: "",
  df2: "",
  p2: "",
  pre2: "",
});

const [factorial, setFactorial] = useState({
  outcome: "la variable dépendante",
  factorA: "Facteur A",
  levelA1: "A1",
  meanA1: "",
  sdA1: "",
  levelA2: "A2",
  meanA2: "",
  sdA2: "",
  fA: "",
  df1A: "",
  df2A: "",
  pA: "",
  preA: "",
  factorB: "Facteur B",
  levelB1: "B1",
  meanB1: "",
  sdB1: "",
  levelB2: "B2",
  meanB2: "",
  sdB2: "",
  fB: "",
  df1B: "",
  df2B: "",
  pB: "",
  preB: "",
  fInt: "",
  df1Int: "",
  df2Int: "",
  pInt: "",
  preInt: "",
});

  const [preFromF, setPreFromF] = useState({
    f: "",
    n: "",
    pa: "",
    pc: "",
  });

  const [preFromSce, setPreFromSce] = useState({
    scec: "",
    scea: "",
  });

  const [twoGroups, setTwoGroups] = useState({
    iv: "la condition",
    dv: "la variable dépendante",
    group1: "Groupe 1",
    group2: "Groupe 2",
    m1: "",
    sd1: "",
    m2: "",
    sd2: "",
    t: "",
    df: "",
    p: "",
    pre: "",
  });

  // const [interaction, setInteraction] = useState({
  //   predictor1: "X",
  //   predictor2: "Z",
  //   outcome: "Y",
  //   statType: "F" as InteractionStat,
  //   stat: "",
  //   df1: "",
  //   df2: "",
  //   df: "",
  //   p: "",
  //   pre: "",
  // });

  const preOutput = useMemo(() => {
    if (preMode === "f") {
      if (
        !hasNumber(preFromF.f) ||
        !hasNumber(preFromF.n) ||
        !hasNumber(preFromF.pa) ||
        !hasNumber(preFromF.pc)
      ) {
        return {
          value: "",
          explanation: "",
        };
      }

      const F = parseValue(preFromF.f);
      const N = parseValue(preFromF.n);
      const PA = parseValue(preFromF.pa);
      const PC = parseValue(preFromF.pc);

      const dfEffect = PA - PC;
      const dfError = N - PA;

      if (dfEffect <= 0 || dfError <= 0) {
        return {
          value: "Vérifie PA, PC et N.",
          explanation: "Il faut PA > PC et N > PA.",
        };
      }

      const pre = (dfEffect * F) / (dfEffect * F + dfError);

      return {
        value: `PRE = ${formatPre(pre)}`,
        explanation: `Formule utilisée : PRE = ((PA - PC) × F) / [((PA - PC) × F) + (N - PA)] ; ddl effet = ${formatValue(
          dfEffect,
          0,
        )}, ddl erreur = ${formatValue(dfError, 0)}.`,
      };
    }

    if (!hasNumber(preFromSce.scec) || !hasNumber(preFromSce.scea)) {
      return {
        value: "",
        explanation: "",
      };
    }

    const SCEc = parseValue(preFromSce.scec);
    const SCEa = parseValue(preFromSce.scea);

    if (SCEc <= 0 || SCEa < 0 || SCEa > SCEc) {
      return {
        value: "Vérifie SCEc et SCEa.",
        explanation: "En général, SCEa doit être plus petit que SCEc.",
      };
    }

    const pre = (SCEc - SCEa) / SCEc;

    return {
      value: `PRE = ${formatPre(pre)}`,
      explanation: "Formule utilisée : PRE = (SCEc - SCEa) / SCEc.",
    };
  }, [preFromF, preFromSce, preMode]);

  // const explainItems = [
 const twoGroupsApa = useMemo(() => {
  const numericReady = [twoGroups.m1, twoGroups.sd1, twoGroups.m2, twoGroups.sd2, twoGroups.t, twoGroups.df, twoGroups.pre].every(hasNumber);
  if (!numericReady || !twoGroups.p.trim()) return "";

  const m1 = parseValue(twoGroups.m1);
  const sd1 = parseValue(twoGroups.sd1);
  const m2 = parseValue(twoGroups.m2);
  const sd2 = parseValue(twoGroups.sd2);
  const t = parseValue(twoGroups.t);
  const df = parseValue(twoGroups.df);
  const pre = parseValue(twoGroups.pre);
  const sig = isSignificantP(twoGroups.p);
  const pText = normalizePText(twoGroups.p);

  if (sig === null) return "";

  const descriptive =
    m1 > m2
      ? `${twoGroups.group1} (M = ${formatValue(m1, 2)}, ET = ${formatValue(sd1, 2)}) présente un score plus élevé que ${twoGroups.group2} (M = ${formatValue(m2, 2)}, ET = ${formatValue(sd2, 2)}).`
      : `${twoGroups.group2} (M = ${formatValue(m2, 2)}, ET = ${formatValue(sd2, 2)}) présente un score plus élevé que ${twoGroups.group1} (M = ${formatValue(m1, 2)}, ET = ${formatValue(sd1, 2)}).`;

  if (sig) {
    return `On observe un effet significatif de ${twoGroups.iv} sur ${twoGroups.dv}, t(${formatValue(df, 0)}) = ${formatValue(
      t,
      2
    )}, ${pText}, PRE = ${formatPre(pre)}. ${descriptive}`;
  }

  return `L’effet de ${twoGroups.iv} sur ${twoGroups.dv} n’est pas significatif, t(${formatValue(
    df,
    0
  )}) = ${formatValue(t, 2)}, ${pText}, PRE = ${formatPre(pre)}. Au niveau descriptif, ${descriptive.toLowerCase()}`;
}, [twoGroups]);

const continuousApa = useMemo(() => {
  const numericReady = [continuous.b, continuous.t, continuous.df, continuous.pre].every(hasNumber);
  if (!numericReady || !continuous.p.trim()) return "";

  const b = parseValue(continuous.b);
  const t = parseValue(continuous.t);
  const df = parseValue(continuous.df);
  const pre = parseValue(continuous.pre);
  const sig = isSignificantP(continuous.p);
  const pText = normalizePText(continuous.p);

  if (sig === null) return "";

  const direction = b > 0 ? "positivement" : b < 0 ? "négativement" : "";

  if (sig) {
    return `${continuous.predictor} prédit ${direction} ${continuous.outcome}, et cette relation est significative, b = ${formatValue(
      b,
      3
    )}, t(${formatValue(df, 0)}) = ${formatValue(t, 2)}, ${pText}, PRE = ${formatPre(pre)}.`;
  }

  return `${continuous.predictor} prédit ${direction} ${continuous.outcome}, mais cette relation est non-significative, b = ${formatValue(
    b,
    3
  )}, t(${formatValue(df, 0)}) = ${formatValue(t, 2)}, ${pText}, PRE = ${formatPre(pre)}.`;
}, [continuous]);

const continuousExplain = useMemo(() => {
  if (!hasNumber(continuous.b)) return "";

  const b = parseValue(continuous.b);
  const direction =
    b > 0
      ? `Quand ${continuous.predictor} augmente d’une unité, la valeur prédite de ${continuous.outcome} augmente de ${formatValue(
          b,
          3
        )} unité(s).`
      : `Quand ${continuous.predictor} augmente d’une unité, la valeur prédite de ${continuous.outcome} diminue de ${formatValue(
          Math.abs(b),
          3
        )} unité(s).`;

  if (hasNumber(continuous.intercept)) {
    const intercept = parseValue(continuous.intercept);
    return `${direction} L’ordonnée à l’origine estimée est ${formatValue(intercept, 3)}.`;
  }

  return direction;
}, [continuous]);

const multipleMixedApa = useMemo(() => {
  const numericReady = [
    multiple.m1,
    multiple.sd1,
    multiple.m2,
    multiple.sd2,
    multiple.catT,
    multiple.catDf,
    multiple.catPre,
    multiple.b,
    multiple.contT,
    multiple.contDf,
    multiple.contPre,
  ].every(hasNumber);

  if (!numericReady || !multiple.catP.trim() || !multiple.contP.trim()) return "";

  const m1 = parseValue(multiple.m1);
  const sd1 = parseValue(multiple.sd1);
  const m2 = parseValue(multiple.m2);
  const sd2 = parseValue(multiple.sd2);

  const catT = parseValue(multiple.catT);
  const catDf = parseValue(multiple.catDf);
  const catPre = parseValue(multiple.catPre);

  const b = parseValue(multiple.b);
  const contT = parseValue(multiple.contT);
  const contDf = parseValue(multiple.contDf);
  const contPre = parseValue(multiple.contPre);

  const catSig = isSignificantP(multiple.catP);
  const contSig = isSignificantP(multiple.contP);
  if (catSig === null || contSig === null) return "";

  const catPText = normalizePText(multiple.catP);
  const contPText = normalizePText(multiple.contP);

  const group1Higher = m1 > m2;
  const higherGroup = group1Higher ? multiple.group1 : multiple.group2;
  const lowerGroup = group1Higher ? multiple.group2 : multiple.group1;
  const higherMean = group1Higher ? m1 : m2;
  const lowerMean = group1Higher ? m2 : m1;
  const higherSd = group1Higher ? sd1 : sd2;
  const lowerSd = group1Higher ? sd2 : sd1;

  const categoricalSentence = catSig
    ? `Indépendamment de ${multiple.continuousPredictor}, les ${higherGroup} (M = ${formatValue(
        higherMean,
        3
      )}, ET = ${formatValue(higherSd, 3)}) présentent un score plus élevé sur ${multiple.outcome} que les ${lowerGroup} (M = ${formatValue(
        lowerMean,
        3
      )}, ET = ${formatValue(lowerSd, 3)}). Cette différence est significative, t(${formatValue(
        catDf,
        0
      )}) = ${formatValue(catT, 3)}, ${catPText}, PRE = ${formatPre(catPre)}.`
    : `Indépendamment de ${multiple.continuousPredictor}, les ${higherGroup} (M = ${formatValue(
        higherMean,
        3
      )}, ET = ${formatValue(higherSd, 3)}) présentent un score plus élevé sur ${multiple.outcome} que les ${lowerGroup} (M = ${formatValue(
        lowerMean,
        3
      )}, ET = ${formatValue(lowerSd, 3)}), mais cette différence est non-significative, t(${formatValue(
        catDf,
        0
      )}) = ${formatValue(catT, 3)}, ${catPText}, PRE = ${formatPre(catPre)}.`;

  const direction = b > 0 ? "positivement" : b < 0 ? "négativement" : "";
  const continuousSentence = contSig
    ? `Indépendamment de ${multiple.categoricalPredictor}, ${multiple.continuousPredictor} prédit ${direction} ${multiple.outcome}, et cette relation est significative, b = ${formatValue(
        b,
        3
      )}, t(${formatValue(contDf, 0)}) = ${formatValue(contT, 3)}, ${contPText}, PRE = ${formatPre(contPre)}.`
    : `Indépendamment de ${multiple.categoricalPredictor}, ${multiple.continuousPredictor} prédit ${direction} ${multiple.outcome}, mais cette relation est non-significative, b = ${formatValue(
        b,
        3
      )}, t(${formatValue(contDf, 0)}) = ${formatValue(contT, 3)}, ${contPText}, PRE = ${formatPre(contPre)}.`;

  return `${categoricalSentence} ${continuousSentence}`;
}, [multiple]);

const multipleMixedExplain = useMemo(() => {
  const numericReady = [multiple.m1, multiple.m2, multiple.b].every(hasNumber);
  if (!numericReady || !multiple.catP.trim() || !multiple.contP.trim()) return "";

  const m1 = parseValue(multiple.m1);
  const m2 = parseValue(multiple.m2);
  const b = parseValue(multiple.b);
  const catSig = isSignificantP(multiple.catP);
  const contSig = isSignificantP(multiple.contP);

  if (catSig === null || contSig === null) return "";

  const higherGroup = m1 > m2 ? multiple.group1 : multiple.group2;

  const simpleCat = catSig
    ? `À ${multiple.continuousPredictor} égal, les ${higherGroup} ont le score le plus élevé sur ${multiple.outcome}.`
    : `À ${multiple.continuousPredictor} égal, la différence liée à ${multiple.categoricalPredictor} n’est pas significative.`;

  const simpleCont = contSig
    ? b >= 0
      ? `À ${multiple.categoricalPredictor} égal, plus ${multiple.continuousPredictor} augmente, plus ${multiple.outcome} augmente.`
      : `À ${multiple.categoricalPredictor} égal, plus ${multiple.continuousPredictor} augmente, plus ${multiple.outcome} diminue.`
    : b >= 0
    ? `À ${multiple.categoricalPredictor} égal, ${multiple.continuousPredictor} est positivement associé à ${multiple.outcome}, mais pas de manière significative.`
    : `À ${multiple.categoricalPredictor} égal, ${multiple.continuousPredictor} est négativement associé à ${multiple.outcome}, mais pas de manière significative.`;

  return `${simpleCat} ${simpleCont}`;
}, [multiple]);

const twoContinuousApa = useMemo(() => {
  const numericReady = [
    twoContinuousMultiple.b1,
    twoContinuousMultiple.t1,
    twoContinuousMultiple.df1,
    twoContinuousMultiple.pre1,
    twoContinuousMultiple.b2,
    twoContinuousMultiple.t2,
    twoContinuousMultiple.df2,
    twoContinuousMultiple.pre2,
  ].every(hasNumber);

  if (!numericReady || !twoContinuousMultiple.p1.trim() || !twoContinuousMultiple.p2.trim()) return "";

  const b1 = parseValue(twoContinuousMultiple.b1);
  const t1 = parseValue(twoContinuousMultiple.t1);
  const df1 = parseValue(twoContinuousMultiple.df1);
  const pre1 = parseValue(twoContinuousMultiple.pre1);

  const b2 = parseValue(twoContinuousMultiple.b2);
  const t2 = parseValue(twoContinuousMultiple.t2);
  const df2 = parseValue(twoContinuousMultiple.df2);
  const pre2 = parseValue(twoContinuousMultiple.pre2);

  const sig1 = isSignificantP(twoContinuousMultiple.p1);
  const sig2 = isSignificantP(twoContinuousMultiple.p2);
  if (sig1 === null || sig2 === null) return "";

  const pText1 = normalizePText(twoContinuousMultiple.p1);
  const pText2 = normalizePText(twoContinuousMultiple.p2);

  const dir1 = b1 > 0 ? "positivement" : b1 < 0 ? "négativement" : "";
  const dir2 = b2 > 0 ? "positivement" : b2 < 0 ? "négativement" : "";

  const sentence1 = sig1
    ? `Indépendamment de ${twoContinuousMultiple.predictor2}, ${twoContinuousMultiple.predictor1} prédit ${dir1} ${twoContinuousMultiple.outcome}, et cette relation est significative, b = ${formatValue(
        b1,
        3
      )}, t(${formatValue(df1, 0)}) = ${formatValue(t1, 3)}, ${pText1}, PRE = ${formatPre(pre1)}.`
    : `Indépendamment de ${twoContinuousMultiple.predictor2}, ${twoContinuousMultiple.predictor1} prédit ${dir1} ${twoContinuousMultiple.outcome}, mais cette relation est non-significative, b = ${formatValue(
        b1,
        3
      )}, t(${formatValue(df1, 0)}) = ${formatValue(t1, 3)}, ${pText1}, PRE = ${formatPre(pre1)}.`;

  const sentence2 = sig2
    ? `Indépendamment de ${twoContinuousMultiple.predictor1}, ${twoContinuousMultiple.predictor2} prédit ${dir2} ${twoContinuousMultiple.outcome}, et cette relation est significative, b = ${formatValue(
        b2,
        3
      )}, t(${formatValue(df2, 0)}) = ${formatValue(t2, 3)}, ${pText2}, PRE = ${formatPre(pre2)}.`
    : `Indépendamment de ${twoContinuousMultiple.predictor1}, ${twoContinuousMultiple.predictor2} prédit ${dir2} ${twoContinuousMultiple.outcome}, mais cette relation est non-significative, b = ${formatValue(
        b2,
        3
      )}, t(${formatValue(df2, 0)}) = ${formatValue(t2, 3)}, ${pText2}, PRE = ${formatPre(pre2)}.`;

  return `${sentence1} ${sentence2}`;
}, [twoContinuousMultiple]);

const twoContinuousExplain = useMemo(() => {
  const numericReady = [twoContinuousMultiple.b1, twoContinuousMultiple.b2].every(hasNumber);
  if (!numericReady || !twoContinuousMultiple.p1.trim() || !twoContinuousMultiple.p2.trim()) return "";

  const b1 = parseValue(twoContinuousMultiple.b1);
  const b2 = parseValue(twoContinuousMultiple.b2);
  const sig1 = isSignificantP(twoContinuousMultiple.p1);
  const sig2 = isSignificantP(twoContinuousMultiple.p2);

  if (sig1 === null || sig2 === null) return "";

  const text1 = sig1
    ? b1 >= 0
      ? `À ${twoContinuousMultiple.predictor2} égal, plus ${twoContinuousMultiple.predictor1} augmente, plus ${twoContinuousMultiple.outcome} augmente.`
      : `À ${twoContinuousMultiple.predictor2} égal, plus ${twoContinuousMultiple.predictor1} augmente, plus ${twoContinuousMultiple.outcome} diminue.`
    : `À ${twoContinuousMultiple.predictor2} égal, l’effet de ${twoContinuousMultiple.predictor1} n’est pas significatif.`;

  const text2 = sig2
    ? b2 >= 0
      ? `À ${twoContinuousMultiple.predictor1} égal, plus ${twoContinuousMultiple.predictor2} augmente, plus ${twoContinuousMultiple.outcome} augmente.`
      : `À ${twoContinuousMultiple.predictor1} égal, plus ${twoContinuousMultiple.predictor2} augmente, plus ${twoContinuousMultiple.outcome} diminue.`
    : `À ${twoContinuousMultiple.predictor1} égal, l’effet de ${twoContinuousMultiple.predictor2} n’est pas significatif.`;

  return `${text1} ${text2}`;
}, [twoContinuousMultiple]);

const factorialApa = useMemo(() => {
  const mainAReady = [
    factorial.meanA1,
    factorial.sdA1,
    factorial.meanA2,
    factorial.sdA2,
    factorial.fA,
    factorial.df1A,
    factorial.df2A,
    factorial.preA,
    factorial.meanB1,
    factorial.sdB1,
    factorial.meanB2,
    factorial.sdB2,
    factorial.fB,
    factorial.df1B,
    factorial.df2B,
    factorial.preB,
  ].every(hasNumber);

  if (!mainAReady || !factorial.pA.trim() || !factorial.pB.trim()) return "";

  const meanA1 = parseValue(factorial.meanA1);
  const sdA1 = parseValue(factorial.sdA1);
  const meanA2 = parseValue(factorial.meanA2);
  const sdA2 = parseValue(factorial.sdA2);
  const fA = parseValue(factorial.fA);
  const df1A = parseValue(factorial.df1A);
  const df2A = parseValue(factorial.df2A);
  const preA = parseValue(factorial.preA);

  const meanB1 = parseValue(factorial.meanB1);
  const sdB1 = parseValue(factorial.sdB1);
  const meanB2 = parseValue(factorial.meanB2);
  const sdB2 = parseValue(factorial.sdB2);
  const fB = parseValue(factorial.fB);
  const df1B = parseValue(factorial.df1B);
  const df2B = parseValue(factorial.df2B);
  const preB = parseValue(factorial.preB);

  const sigA = isSignificantP(factorial.pA);
  const sigB = isSignificantP(factorial.pB);
  if (sigA === null || sigB === null) return "";

  const pAText = normalizePText(factorial.pA);
  const pBText = normalizePText(factorial.pB);

  const higherA = meanA1 > meanA2 ? factorial.levelA1 : factorial.levelA2;
  const lowerA = meanA1 > meanA2 ? factorial.levelA2 : factorial.levelA1;
  const higherMeanA = meanA1 > meanA2 ? meanA1 : meanA2;
  const lowerMeanA = meanA1 > meanA2 ? meanA2 : meanA1;
  const higherSdA = meanA1 > meanA2 ? sdA1 : sdA2;
  const lowerSdA = meanA1 > meanA2 ? sdA2 : sdA1;

  const higherB = meanB1 > meanB2 ? factorial.levelB1 : factorial.levelB2;
  const lowerB = meanB1 > meanB2 ? factorial.levelB2 : factorial.levelB1;
  const higherMeanB = meanB1 > meanB2 ? meanB1 : meanB2;
  const lowerMeanB = meanB1 > meanB2 ? meanB2 : meanB1;
  const higherSdB = meanB1 > meanB2 ? sdB1 : sdB2;
  const lowerSdB = meanB1 > meanB2 ? sdB2 : sdB1;

  const sentenceA = sigA
    ? `L’effet principal de ${factorial.factorA} est significatif, F(${formatValue(df1A, 0)}, ${formatValue(
        df2A,
        0
      )}) = ${formatValue(fA, 3)}, ${pAText}, PRE = ${formatPre(preA)}. Indépendamment de ${factorial.factorB}, les ${higherA} (M = ${formatValue(
        higherMeanA,
        3
      )}, ET = ${formatValue(higherSdA, 3)}) présentent un score plus élevé sur ${factorial.outcome} que les ${lowerA} (M = ${formatValue(
        lowerMeanA,
        3
      )}, ET = ${formatValue(lowerSdA, 3)}).`
    : `L’effet principal de ${factorial.factorA} n’est pas significatif, F(${formatValue(df1A, 0)}, ${formatValue(
        df2A,
        0
      )}) = ${formatValue(fA, 3)}, ${pAText}, PRE = ${formatPre(preA)}. Au niveau descriptif, les ${higherA} (M = ${formatValue(
        higherMeanA,
        3
      )}, ET = ${formatValue(higherSdA, 3)}) présentent un score plus élevé que les ${lowerA} (M = ${formatValue(
        lowerMeanA,
        3
      )}, ET = ${formatValue(lowerSdA, 3)}).`;

  const sentenceB = sigB
    ? `L’effet principal de ${factorial.factorB} est significatif, F(${formatValue(df1B, 0)}, ${formatValue(
        df2B,
        0
      )}) = ${formatValue(fB, 3)}, ${pBText}, PRE = ${formatPre(preB)}. Indépendamment de ${factorial.factorA}, les ${higherB} (M = ${formatValue(
        higherMeanB,
        3
      )}, ET = ${formatValue(higherSdB, 3)}) présentent un score plus élevé sur ${factorial.outcome} que les ${lowerB} (M = ${formatValue(
        lowerMeanB,
        3
      )}, ET = ${formatValue(lowerSdB, 3)}).`
    : `L’effet principal de ${factorial.factorB} n’est pas significatif, F(${formatValue(df1B, 0)}, ${formatValue(
        df2B,
        0
      )}) = ${formatValue(fB, 3)}, ${pBText}, PRE = ${formatPre(preB)}. Au niveau descriptif, les ${higherB} (M = ${formatValue(
        higherMeanB,
        3
      )}, ET = ${formatValue(higherSdB, 3)}) présentent un score plus élevé que les ${lowerB} (M = ${formatValue(
        lowerMeanB,
        3
      )}, ET = ${formatValue(lowerSdB, 3)}).`;

  if (factorialMode === "mainOnly") {
    return `${sentenceA} ${sentenceB}`;
  }

  const intReady = [factorial.fInt, factorial.df1Int, factorial.df2Int, factorial.preInt].every(hasNumber);
  if (!intReady || !factorial.pInt.trim()) return "";

  const fInt = parseValue(factorial.fInt);
  const df1Int = parseValue(factorial.df1Int);
  const df2Int = parseValue(factorial.df2Int);
  const preInt = parseValue(factorial.preInt);
  const sigInt = isSignificantP(factorial.pInt);
  if (sigInt === null) return "";

  const pIntText = normalizePText(factorial.pInt);

  const sentenceInt = sigInt
    ? `L’interaction entre ${factorial.factorA} et ${factorial.factorB} est significative, F(${formatValue(
        df1Int,
        0
      )}, ${formatValue(df2Int, 0)}) = ${formatValue(fInt, 3)}, ${pIntText}, PRE = ${formatPre(
        preInt
      )}. L’examen du graphique ou des effets simples permet ensuite de préciser le motif de l’interaction.`
    : `L’interaction entre ${factorial.factorA} et ${factorial.factorB} n’est pas significative, F(${formatValue(
        df1Int,
        0
      )}, ${formatValue(df2Int, 0)}) = ${formatValue(fInt, 3)}, ${pIntText}, PRE = ${formatPre(preInt)}.`;

  return `${sentenceA} ${sentenceB} ${sentenceInt}`;
}, [factorial, factorialMode]);

const factorialExplain = useMemo(() => {
  if (factorialMode === "withInteraction") {
    return "Si l’interaction est significative, ajoute ensuite l’interprétation du motif observé à partir du graphique ou des effets simples.";
  }

  return "Ici, tu reportes seulement les deux effets principaux.";
}, [factorialMode]);


  const explainItems = [
    {
      id: "b",
      title: "Que veut dire b ?",
      content:
        "Pour une VI continue, b indique de combien la valeur prédite de la VD change quand la VI augmente d’une unité. Pour une VI catégorielle à 2 groupes, b peut correspondre à une différence de moyennes selon le codage utilisé.",
    },
    {
      id: "intercept",
      title: "Que veut dire l’ordonnée à l’origine ?",
      content:
        "Avec un dummy coding 0/1, l’intercept correspond en général à la moyenne du groupe codé 0. Avec des codes de contraste centrés autour de 0, l’intercept correspond à la moyenne générale. Avec une VI continue centrée, l’intercept devient la valeur prédite quand la VI centrée vaut 0, donc à la moyenne de cette VI.",
    },
    {
      id: "centring",
      title: "Que change le centrage ?",
      content:
        "Le centrage change l’ordonnée à l’origine, pas la pente du prédicteur continu. Il sert surtout à rendre l’intercept plus interprétable et à faciliter certains modèles avec interaction.",
    },
    {
      id: "coding",
      title: "Que change le codage ?",
      content:
        "Le codage peut changer la valeur de l’intercept et parfois l’échelle de la pente, mais pas forcément la significativité du test principal. C’est pour cela qu’il faut toujours savoir comment la variable catégorielle a été codée avant d’interpréter b0 et b1.",
    },
    {
      id: "jamovi",
      title: "Quels nombres copier depuis Jamovi ?",
      content:
        "Pour 2 groupes : M, ET, t, ddl, p, PRE. Pour une régression simple : b, t, ddl, p, PRE. Pour un effet ajusté : la ligne du prédicteur testé dans le tableau des coefficients. Pour une interaction : l’effet d’interaction, mais aussi les effets principaux et idéalement le graphique pour l’interprétation.",
    },
    {
      id: "interaction",
      title: "Comment interpréter une interaction ?",
      content:
        "Tu rapportes d’abord les effets principaux, puis l’interaction. Si l’interaction est significative, tu dois expliquer le motif observé à l’aide du graphique et/ou des effets simples. Une interaction signifie que l’effet d’une variable dépend du niveau de l’autre.",
    },
  ];

  return (
    <div className="app-shell">
      {/* <header className="hero">
        <div className="hero-copy">
          <span className="badge">Analyse quantitatives helper</span>
          <h1>PRE, APA et interprétation pour tes sorties Jamovi</h1>
          <p>
            Jamovi te donne les chiffres. Ce site t’aide à calculer le PRE, rédiger des résultats propres
            en français et comprendre ce que tes coefficients veulent dire.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => setTab("pre")}>
              Calculer PRE
            </button>
            <button className="secondary-button" onClick={() => setTab("apa")}>
              Écrire un résultat APA
            </button>
          </div>
        </div>

        <div className="hero-panel">
          <p className="mini-title">Pensé pour V1</p>
          <ul>
            <li>PRE à partir de F ou des SCE</li>
            <li>APA pour 2 groupes, VI continue, effet ajusté, interaction</li>
            <li>Explications claires sur b, l’intercept, le codage et le centrage</li>
          </ul>
        </div>
      </header> */}

      <nav className="top-nav">
        {/* <button className={tab === "home" ? "nav-button active" : "nav-button"} onClick={() => setTab("home")}>
          Accueil
        </button> */}
        <button
          className={tab === "pre" ? "nav-button active" : "nav-button"}
          onClick={() => setTab("pre")}
        >
          PRE
        </button>
        <button
          className={tab === "apa" ? "nav-button active" : "nav-button"}
          onClick={() => setTab("apa")}
        >
          APA
        </button>
        <button
          className={tab === "explain" ? "nav-button active" : "nav-button"}
          onClick={() => setTab("explain")}
        >
          Explain
        </button>
      </nav>

      <main className="main-content">
        {tab === "home" && (
          <section className="page-grid">
            <div className="panel large">
              <h2>Choisis ce dont tu as besoin</h2>
              <div className="feature-grid">
                <button className="feature-card" onClick={() => setTab("pre")}>
                  <h3>Calculer PRE</h3>
                  <p>À partir de F, N, PA, PC ou à partir de SCEc et SCEa.</p>
                </button>

                <button className="feature-card" onClick={() => setTab("apa")}>
                  <h3>Rédiger APA</h3>
                  <p>
                    Obtiens une phrase propre en français à partir des valeurs
                    Jamovi.
                  </p>
                </button>

                <button
                  className="feature-card"
                  onClick={() => setTab("explain")}
                >
                  <h3>Comprendre les résultats</h3>
                  <p>
                    Intercept, pente, codage, centrage, interaction et quoi
                    copier depuis Jamovi.
                  </p>
                </button>
              </div>
            </div>

            <div className="panel">
              <h2>Petit rappel</h2>
              <p className="soft-text">
                Tu peux entrer des nombres avec une virgule ou un point. Le site
                accepte les deux.
              </p>
              <div className="mini-stack">
                <div className="mini-note">
                  <strong>Exemple :</strong> 0,031 ou 0.031
                </div>
                <div className="mini-note">
                  <strong>Conseil :</strong> commence par PRE ou APA, puis ouvre
                  Explain si tu bloques sur l’interprétation.
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === "pre" && (
          <section className="page-grid">
            <div className="panel large">
              <div className="section-head">
                <div>
                  <h2>Calculer PRE</h2>
                  <p className="soft-text">
                    Choisis la formule qui correspond à ce que tu as sous les
                    yeux dans ton exercice.
                  </p>
                </div>
                <div className="mode-switch">
                  <button
                    className={
                      preMode === "f" ? "mode-button active" : "mode-button"
                    }
                    onClick={() => setPreMode("f")}
                  >
                    Depuis F
                  </button>
                  <button
                    className={
                      preMode === "sce" ? "mode-button active" : "mode-button"
                    }
                    onClick={() => setPreMode("sce")}
                  >
                    Depuis SCE
                  </button>
                </div>
              </div>

              {preMode === "f" && (
                <div className="form-grid">
                  <TextField
                    label="F"
                    value={preFromF.f}
                    onChange={(value) => setPreFromF({ ...preFromF, f: value })}
                    placeholder="ex. 6,45"
                  />
                  <TextField
                    label="N"
                    value={preFromF.n}
                    onChange={(value) => setPreFromF({ ...preFromF, n: value })}
                    placeholder="ex. 30"
                  />
                  <TextField
                    label="PA"
                    value={preFromF.pa}
                    onChange={(value) =>
                      setPreFromF({ ...preFromF, pa: value })
                    }
                    placeholder="ex. 4"
                    helper="Nombre de paramètres du modèle augmenté"
                  />
                  <TextField
                    label="PC"
                    value={preFromF.pc}
                    onChange={(value) =>
                      setPreFromF({ ...preFromF, pc: value })
                    }
                    placeholder="ex. 3"
                    helper="Nombre de paramètres du modèle contraint"
                  />
                </div>
              )}

              {preMode === "sce" && (
                <div className="form-grid two-columns">
                  <TextField
                    label="SCE du modèle contraint (SCEc)"
                    value={preFromSce.scec}
                    onChange={(value) =>
                      setPreFromSce({ ...preFromSce, scec: value })
                    }
                    placeholder="ex. 1624,80"
                  />
                  <TextField
                    label="SCE du modèle augmenté (SCEa)"
                    value={preFromSce.scea}
                    onChange={(value) =>
                      setPreFromSce({ ...preFromSce, scea: value })
                    }
                    placeholder="ex. 963,48"
                  />
                </div>
              )}

              <div className="note-box">
                <strong>Quand utiliser quoi ?</strong>
                <p>
                  Utilise <strong>Depuis F</strong> quand ton exercice ou ton
                  corrigé raisonne en comparaison de modèles avec{" "}
                  <strong>F, N, PA et PC</strong>. Utilise{" "}
                  <strong>Depuis SCE</strong> quand tu as directement les
                  erreurs du modèle contraint et du modèle augmenté.
                </p>
              </div>
            </div>

            <div className="panel sticky">
              <ResultCard
                title="Résultat"
                text={preOutput.value}
                secondary={preOutput.explanation}
              />
              <button
                className="copy-button"
                onClick={() =>
                  copyText(`${preOutput.value}\n${preOutput.explanation}`)
                }
                disabled={!preOutput.value}
              >
                Copier
              </button>
            </div>
          </section>
        )}

     {tab === "apa" && (
  <section className="page-grid">
    <div className="panel large">
      <div className="section-head">
        <div>
          <h2>Rédiger un résultat APA</h2>
          <p className="soft-text">Choisis le type de résultat que tu veux reporter.</p>
        </div>
      </div>

      <div className="feature-grid compact">
        <button
          className={apaMode === "twoGroups" ? "feature-card active-card" : "feature-card"}
          onClick={() => setApaMode("twoGroups")}
        >
          <h3>2 groupes</h3>
          <p>VI catégorielle à 2 modalités</p>
        </button>

        <button
          className={apaMode === "continuous" ? "feature-card active-card" : "feature-card"}
          onClick={() => setApaMode("continuous")}
        >
          <h3>VI continue</h3>
          <p>Régression simple</p>
        </button>

        <button
          className={apaMode === "multiple" ? "feature-card active-card" : "feature-card"}
          onClick={() => setApaMode("multiple")}
        >
          <h3>Régression multiple</h3>
          <p>2 continus ou 1 catégoriel + 1 continu</p>
        </button>

        <button
          className={apaMode === "factorial" ? "feature-card active-card" : "feature-card"}
          onClick={() => setApaMode("factorial")}
        >
          <h3>Plan factoriel</h3>
          <p>2 variables catégorielles</p>
        </button>
      </div>

      {apaMode === "twoGroups" && (
        <div className="stack">
          <div className="form-grid">
            <TextField
              label="Nom de la VI"
              value={twoGroups.iv}
              onChange={(value) => setTwoGroups({ ...twoGroups, iv: value })}
            />
            <TextField
              label="Nom de la VD"
              value={twoGroups.dv}
              onChange={(value) => setTwoGroups({ ...twoGroups, dv: value })}
            />
            <TextField
              label="Nom groupe 1"
              value={twoGroups.group1}
              onChange={(value) => setTwoGroups({ ...twoGroups, group1: value })}
            />
            <TextField
              label="Nom groupe 2"
              value={twoGroups.group2}
              onChange={(value) => setTwoGroups({ ...twoGroups, group2: value })}
            />
            <TextField
              label="M groupe 1"
              value={twoGroups.m1}
              onChange={(value) => setTwoGroups({ ...twoGroups, m1: value })}
            />
            <TextField
              label="ET groupe 1"
              value={twoGroups.sd1}
              onChange={(value) => setTwoGroups({ ...twoGroups, sd1: value })}
            />
            <TextField
              label="M groupe 2"
              value={twoGroups.m2}
              onChange={(value) => setTwoGroups({ ...twoGroups, m2: value })}
            />
            <TextField
              label="ET groupe 2"
              value={twoGroups.sd2}
              onChange={(value) => setTwoGroups({ ...twoGroups, sd2: value })}
            />
            <TextField
              label="t"
              value={twoGroups.t}
              onChange={(value) => setTwoGroups({ ...twoGroups, t: value })}
            />
            <TextField
              label="ddl (residuals)"
              value={twoGroups.df}
              onChange={(value) => setTwoGroups({ ...twoGroups, df: value })}
            />
            <TextField
              label="p (texte)"
              value={twoGroups.p}
              onChange={(value) => setTwoGroups({ ...twoGroups, p: value })}
              placeholder="ex. < .001 ou .031"
            />
            <TextField
              label="PRE"
              value={twoGroups.pre}
              onChange={(value) => setTwoGroups({ ...twoGroups, pre: value })}
            />
          </div>
          <div className="note-box">
            <strong>À copier depuis Jamovi</strong>
            <p>M, ET, t, ddl (residuals), p, PRE.</p>
          </div>
        </div>
      )}

      {apaMode === "continuous" && (
        <div className="stack">
          <div className="form-grid">
            <TextField
              label="Prédicteur"
              value={continuous.predictor}
              onChange={(value) => setContinuous({ ...continuous, predictor: value })}
            />
            <TextField
              label="Variable dépendante"
              value={continuous.outcome}
              onChange={(value) => setContinuous({ ...continuous, outcome: value })}
            />
            <TextField
              label="b"
              value={continuous.b}
              onChange={(value) => setContinuous({ ...continuous, b: value })}
            />
            <TextField
              label="t"
              value={continuous.t}
              onChange={(value) => setContinuous({ ...continuous, t: value })}
            />
            <TextField
              label="ddl (residuals)"
              value={continuous.df}
              onChange={(value) => setContinuous({ ...continuous, df: value })}
            />
            <TextField
              label="p (texte)"
              value={continuous.p}
              onChange={(value) => setContinuous({ ...continuous, p: value })}
              placeholder="ex. .687 ou < .001"
            />
            <TextField
              label="PRE"
              value={continuous.pre}
              onChange={(value) => setContinuous({ ...continuous, pre: value })}
            />
            <TextField
              label="Intercept (optionnel)"
              value={continuous.intercept}
              onChange={(value) => setContinuous({ ...continuous, intercept: value })}
            />
          </div>
          <div className="note-box">
            <strong>À copier depuis Jamovi</strong>
            <p>b, t, ddl (residuals), p, PRE. L’intercept est utile pour l’interprétation, pas toujours pour la phrase finale.</p>
          </div>
        </div>
      )}

      {apaMode === "multiple" && (
        <div className="stack">
          <div className="mode-switch left">
            <button
              className={multipleMode === "mixed" ? "mode-button active" : "mode-button"}
              onClick={() => setMultipleMode("mixed")}
            >
              1 catégoriel + 1 continu
            </button>
            <button
              className={multipleMode === "twoContinuous" ? "mode-button active" : "mode-button"}
              onClick={() => setMultipleMode("twoContinuous")}
            >
              2 continus
            </button>
          </div>

          {multipleMode === "mixed" && (
            <>
              <div className="form-grid">
                <TextField
                  label="Variable dépendante"
                  value={multiple.outcome}
                  onChange={(value) => setMultiple({ ...multiple, outcome: value })}
                />
                <TextField
                  label="Prédicteur catégoriel"
                  value={multiple.categoricalPredictor}
                  onChange={(value) => setMultiple({ ...multiple, categoricalPredictor: value })}
                />
                <TextField
                  label="Prédicteur continu"
                  value={multiple.continuousPredictor}
                  onChange={(value) => setMultiple({ ...multiple, continuousPredictor: value })}
                />
              </div>

              <div className="note-box">
                <strong>Effet du prédicteur catégoriel</strong>
                <div className="form-grid">
                  <TextField
                    label="Nom groupe 1"
                    value={multiple.group1}
                    onChange={(value) => setMultiple({ ...multiple, group1: value })}
                  />
                  <TextField
                    label="Nom groupe 2"
                    value={multiple.group2}
                    onChange={(value) => setMultiple({ ...multiple, group2: value })}
                  />
                  <TextField
                    label="M groupe 1"
                    value={multiple.m1}
                    onChange={(value) => setMultiple({ ...multiple, m1: value })}
                  />
                  <TextField
                    label="ET groupe 1"
                    value={multiple.sd1}
                    onChange={(value) => setMultiple({ ...multiple, sd1: value })}
                  />
                  <TextField
                    label="M groupe 2"
                    value={multiple.m2}
                    onChange={(value) => setMultiple({ ...multiple, m2: value })}
                  />
                  <TextField
                    label="ET groupe 2"
                    value={multiple.sd2}
                    onChange={(value) => setMultiple({ ...multiple, sd2: value })}
                  />
                  <TextField
                    label="t"
                    value={multiple.catT}
                    onChange={(value) => setMultiple({ ...multiple, catT: value })}
                  />
                  <TextField
                    label="ddl"
                    value={multiple.catDf}
                    onChange={(value) => setMultiple({ ...multiple, catDf: value })}
                  />
                  <TextField
                    label="p (texte)"
                    value={multiple.catP}
                    onChange={(value) => setMultiple({ ...multiple, catP: value })}
                    placeholder="ex. < .001"
                  />
                  <TextField
                    label="PRE"
                    value={multiple.catPre}
                    onChange={(value) => setMultiple({ ...multiple, catPre: value })}
                  />
                </div>
              </div>

              <div className="note-box">
                <strong>Effet du prédicteur continu</strong>
                <div className="form-grid">
                  <TextField
                    label="b"
                    value={multiple.b}
                    onChange={(value) => setMultiple({ ...multiple, b: value })}
                  />
                  <TextField
                    label="t"
                    value={multiple.contT}
                    onChange={(value) => setMultiple({ ...multiple, contT: value })}
                  />
                  <TextField
                    label="ddl"
                    value={multiple.contDf}
                    onChange={(value) => setMultiple({ ...multiple, contDf: value })}
                  />
                  <TextField
                    label="p (texte)"
                    value={multiple.contP}
                    onChange={(value) => setMultiple({ ...multiple, contP: value })}
                    placeholder="ex. .687"
                  />
                  <TextField
                    label="PRE"
                    value={multiple.contPre}
                    onChange={(value) => setMultiple({ ...multiple, contPre: value })}
                  />
                </div>
              </div>
            </>
          )}

          {multipleMode === "twoContinuous" && (
            <>
              <div className="form-grid">
                <TextField
                  label="Variable dépendante"
                  value={twoContinuousMultiple.outcome}
                  onChange={(value) => setTwoContinuousMultiple({ ...twoContinuousMultiple, outcome: value })}
                />
                <TextField
                  label="Prédicteur 1"
                  value={twoContinuousMultiple.predictor1}
                  onChange={(value) => setTwoContinuousMultiple({ ...twoContinuousMultiple, predictor1: value })}
                />
                <TextField
                  label="Prédicteur 2"
                  value={twoContinuousMultiple.predictor2}
                  onChange={(value) => setTwoContinuousMultiple({ ...twoContinuousMultiple, predictor2: value })}
                />
              </div>

              <div className="note-box">
                <strong>Effet du prédicteur 1</strong>
                <div className="form-grid">
                  <TextField
                    label="b1"
                    value={twoContinuousMultiple.b1}
                    onChange={(value) => setTwoContinuousMultiple({ ...twoContinuousMultiple, b1: value })}
                  />
                  <TextField
                    label="t1"
                    value={twoContinuousMultiple.t1}
                    onChange={(value) => setTwoContinuousMultiple({ ...twoContinuousMultiple, t1: value })}
                  />
                  <TextField
                    label="ddl 1"
                    value={twoContinuousMultiple.df1}
                    onChange={(value) => setTwoContinuousMultiple({ ...twoContinuousMultiple, df1: value })}
                  />
                  <TextField
                    label="p1 (texte)"
                    value={twoContinuousMultiple.p1}
                    onChange={(value) => setTwoContinuousMultiple({ ...twoContinuousMultiple, p1: value })}
                  />
                  <TextField
                    label="PRE1"
                    value={twoContinuousMultiple.pre1}
                    onChange={(value) => setTwoContinuousMultiple({ ...twoContinuousMultiple, pre1: value })}
                  />
                </div>
              </div>

              <div className="note-box">
                <strong>Effet du prédicteur 2</strong>
                <div className="form-grid">
                  <TextField
                    label="b2"
                    value={twoContinuousMultiple.b2}
                    onChange={(value) => setTwoContinuousMultiple({ ...twoContinuousMultiple, b2: value })}
                  />
                  <TextField
                    label="t2"
                    value={twoContinuousMultiple.t2}
                    onChange={(value) => setTwoContinuousMultiple({ ...twoContinuousMultiple, t2: value })}
                  />
                  <TextField
                    label="ddl 2"
                    value={twoContinuousMultiple.df2}
                    onChange={(value) => setTwoContinuousMultiple({ ...twoContinuousMultiple, df2: value })}
                  />
                  <TextField
                    label="p2 (texte)"
                    value={twoContinuousMultiple.p2}
                    onChange={(value) => setTwoContinuousMultiple({ ...twoContinuousMultiple, p2: value })}
                  />
                  <TextField
                    label="PRE2"
                    value={twoContinuousMultiple.pre2}
                    onChange={(value) => setTwoContinuousMultiple({ ...twoContinuousMultiple, pre2: value })}
                  />
                </div>
              </div>
            </>
          )}

          <div className="note-box">
            <strong>À copier depuis Jamovi</strong>
            <p>
              Si tu as un prédicteur continu : b, t, ddl, p, PRE. Si tu as un prédicteur catégoriel : M, ET, t, ddl, p, PRE.
            </p>
          </div>
        </div>
      )}

      {apaMode === "factorial" && (
        <div className="stack">
          <div className="mode-switch left">
            <button
              className={factorialMode === "mainOnly" ? "mode-button active" : "mode-button"}
              onClick={() => setFactorialMode("mainOnly")}
            >
              Sans interaction
            </button>
            <button
              className={factorialMode === "withInteraction" ? "mode-button active" : "mode-button"}
              onClick={() => setFactorialMode("withInteraction")}
            >
              Avec interaction
            </button>
          </div>

          <div className="form-grid">
            <TextField
              label="Variable dépendante"
              value={factorial.outcome}
              onChange={(value) => setFactorial({ ...factorial, outcome: value })}
            />
            <TextField
              label="Facteur A"
              value={factorial.factorA}
              onChange={(value) => setFactorial({ ...factorial, factorA: value })}
            />
            <TextField
              label="Facteur B"
              value={factorial.factorB}
              onChange={(value) => setFactorial({ ...factorial, factorB: value })}
            />
          </div>

          <div className="note-box">
            <strong>Effet principal du facteur A</strong>
            <div className="form-grid">
              <TextField
                label="Niveau A1"
                value={factorial.levelA1}
                onChange={(value) => setFactorial({ ...factorial, levelA1: value })}
              />
              <TextField
                label="Niveau A2"
                value={factorial.levelA2}
                onChange={(value) => setFactorial({ ...factorial, levelA2: value })}
              />
              <TextField
                label="M A1"
                value={factorial.meanA1}
                onChange={(value) => setFactorial({ ...factorial, meanA1: value })}
              />
              <TextField
                label="ET A1"
                value={factorial.sdA1}
                onChange={(value) => setFactorial({ ...factorial, sdA1: value })}
              />
              <TextField
                label="M A2"
                value={factorial.meanA2}
                onChange={(value) => setFactorial({ ...factorial, meanA2: value })}
              />
              <TextField
                label="ET A2"
                value={factorial.sdA2}
                onChange={(value) => setFactorial({ ...factorial, sdA2: value })}
              />
              <TextField
                label="F A"
                value={factorial.fA}
                onChange={(value) => setFactorial({ ...factorial, fA: value })}
              />
              <TextField
                label="ddl1 A"
                value={factorial.df1A}
                onChange={(value) => setFactorial({ ...factorial, df1A: value })}
              />
              <TextField
                label="ddl2 A"
                value={factorial.df2A}
                onChange={(value) => setFactorial({ ...factorial, df2A: value })}
              />
              <TextField
                label="p A (texte)"
                value={factorial.pA}
                onChange={(value) => setFactorial({ ...factorial, pA: value })}
              />
              <TextField
                label="PRE A"
                value={factorial.preA}
                onChange={(value) => setFactorial({ ...factorial, preA: value })}
              />
            </div>
          </div>

          <div className="note-box">
            <strong>Effet principal du facteur B</strong>
            <div className="form-grid">
              <TextField
                label="Niveau B1"
                value={factorial.levelB1}
                onChange={(value) => setFactorial({ ...factorial, levelB1: value })}
              />
              <TextField
                label="Niveau B2"
                value={factorial.levelB2}
                onChange={(value) => setFactorial({ ...factorial, levelB2: value })}
              />
              <TextField
                label="M B1"
                value={factorial.meanB1}
                onChange={(value) => setFactorial({ ...factorial, meanB1: value })}
              />
              <TextField
                label="ET B1"
                value={factorial.sdB1}
                onChange={(value) => setFactorial({ ...factorial, sdB1: value })}
              />
              <TextField
                label="M B2"
                value={factorial.meanB2}
                onChange={(value) => setFactorial({ ...factorial, meanB2: value })}
              />
              <TextField
                label="ET B2"
                value={factorial.sdB2}
                onChange={(value) => setFactorial({ ...factorial, sdB2: value })}
              />
              <TextField
                label="F B"
                value={factorial.fB}
                onChange={(value) => setFactorial({ ...factorial, fB: value })}
              />
              <TextField
                label="ddl1 B"
                value={factorial.df1B}
                onChange={(value) => setFactorial({ ...factorial, df1B: value })}
              />
              <TextField
                label="ddl2 B"
                value={factorial.df2B}
                onChange={(value) => setFactorial({ ...factorial, df2B: value })}
              />
              <TextField
                label="p B (texte)"
                value={factorial.pB}
                onChange={(value) => setFactorial({ ...factorial, pB: value })}
              />
              <TextField
                label="PRE B"
                value={factorial.preB}
                onChange={(value) => setFactorial({ ...factorial, preB: value })}
              />
            </div>
          </div>

          {factorialMode === "withInteraction" && (
            <div className="note-box">
              <strong>Interaction</strong>
              <div className="form-grid">
                <TextField
                  label="F interaction"
                  value={factorial.fInt}
                  onChange={(value) => setFactorial({ ...factorial, fInt: value })}
                />
                <TextField
                  label="ddl1 interaction"
                  value={factorial.df1Int}
                  onChange={(value) => setFactorial({ ...factorial, df1Int: value })}
                />
                <TextField
                  label="ddl2 interaction"
                  value={factorial.df2Int}
                  onChange={(value) => setFactorial({ ...factorial, df2Int: value })}
                />
                <TextField
                  label="p interaction (texte)"
                  value={factorial.pInt}
                  onChange={(value) => setFactorial({ ...factorial, pInt: value })}
                />
                <TextField
                  label="PRE interaction"
                  value={factorial.preInt}
                  onChange={(value) => setFactorial({ ...factorial, preInt: value })}
                />
              </div>
            </div>
          )}

          <div className="note-box">
            <strong>À copier depuis Jamovi</strong>
            <p>
              Pour un plan factoriel : F, ddl1, ddl2, p, PRE, plus les descriptives (M, ET) pour chaque facteur.
            </p>
          </div>
        </div>
      )}
    </div>

    <div className="panel sticky">
      <ResultCard
        title="Phrase prête à copier"
        text={
          apaMode === "twoGroups"
            ? twoGroupsApa
            : apaMode === "continuous"
            ? continuousApa
            : apaMode === "multiple"
            ? multipleMode === "mixed"
              ? multipleMixedApa
              : twoContinuousApa
            : factorialApa
        }
        secondary={
          apaMode === "continuous"
            ? continuousExplain
            : apaMode === "multiple"
            ? multipleMode === "mixed"
              ? multipleMixedExplain
              : twoContinuousExplain
            : apaMode === "factorial"
            ? factorialExplain
            : "Relis la phrase et adapte légèrement le vocabulaire si ton enseignant a une préférence de style."
        }
      />
      <button
        className="copy-button"
        onClick={() =>
          copyText(
            apaMode === "twoGroups"
              ? twoGroupsApa
              : apaMode === "continuous"
              ? `${continuousApa}\n${continuousExplain}`
              : apaMode === "multiple"
              ? multipleMode === "mixed"
                ? `${multipleMixedApa}\n${multipleMixedExplain}`
                : `${twoContinuousApa}\n${twoContinuousExplain}`
              : `${factorialApa}\n${factorialExplain}`
          )
        }
        disabled={
          !(
            (apaMode === "twoGroups" && twoGroupsApa) ||
            (apaMode === "continuous" && continuousApa) ||
            (apaMode === "multiple" && ((multipleMode === "mixed" && multipleMixedApa) || (multipleMode === "twoContinuous" && twoContinuousApa))) ||
            (apaMode === "factorial" && factorialApa)
          )
        }
      >
        Copier
      </button>
    </div>
  </section>
)}

        {tab === "explain" && (
          <section className="page-grid single">
            <div className="panel large">
              <div className="section-head">
                <div>
                  <h2>Comprendre tes résultats</h2>
                  <p className="soft-text">Ouvre la question qui te bloque.</p>
                </div>
              </div>

              <div className="accordion">
                {explainItems.map((item) => (
                  <div className="accordion-item" key={item.id}>
                    <button
                      className={
                        openExplain === item.id
                          ? "accordion-button active"
                          : "accordion-button"
                      }
                      onClick={() =>
                        setOpenExplain(openExplain === item.id ? "" : item.id)
                      }
                    >
                      <span>{item.title}</span>
                      <span>{openExplain === item.id ? "−" : "+"}</span>
                    </button>
                    {openExplain === item.id && (
                      <div className="accordion-content">{item.content}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
