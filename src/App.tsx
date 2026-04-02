import { useMemo, useState } from "react";
import "./App.css";

type Tab = "pre" | "apa" | "explain";
type PreMode = "f" | "sce";
type ApaMode = "twoGroups" | "simpleRegression" | "noInteraction" | "interaction";
type ModelSubtype = "mixed" | "twoContinuous" | "twoCategorical";
type PreMethod = "auto" | "manual";
type SimpleEffectsFamily = "AwithinB" | "BwithinA";


type PreControl = {
  method: PreMethod;
  manual: string;
  f: string;
  n: string;
  pa: string;
  pc: string;
};

function makePreControl(): PreControl {
  return {
    method: "auto",
    manual: "",
    f: "",
    n: "",
    pa: "",
    pc: "",
  };
}

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

function computePreFromFValues(f: string, n: string, pa: string, pc: string): number | null {
  if (![f, n, pa, pc].every(hasNumber)) return null;

  const F = parseValue(f);
  const N = parseValue(n);
  const PA = parseValue(pa);
  const PC = parseValue(pc);

  const dfEffect = PA - PC;
  const dfError = N - PA;

  if (dfEffect <= 0 || dfError <= 0) return null;

  return (dfEffect * F) / (dfEffect * F + dfError);
}

function resolvePre(pre: PreControl): number | null {
  if (pre.method === "manual") {
    return hasNumber(pre.manual) ? parseValue(pre.manual) : null;
  }
  return computePreFromFValues(pre.f, pre.n, pre.pa, pre.pc);
}

function preSuffix(pre: PreControl): string {
  const value = resolvePre(pre);
  return value === null ? "" : `, PRE = ${formatPre(value)}`;
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
      <p className="result-text">{text || "Remplis les champs pour voir le résultat."}</p>
      {secondary ? <p className="result-secondary">{secondary}</p> : null}
    </div>
  );
}

function PreInput({
  title,
  value,
  onChange,
}: {
  title: string;
  value: PreControl;
  onChange: (next: PreControl) => void;
}) {
  const autoPreview = computePreFromFValues(value.f, value.n, value.pa, value.pc);
  const currentPreview = resolvePre(value);

  return (
    <div className="note-box">
      <strong>{title}</strong>

      <div className="mode-switch left" style={{ marginTop: 12 }}>
        <button
          className={value.method === "auto" ? "mode-button active" : "mode-button"}
          onClick={() => onChange({ ...value, method: "auto" })}
          type="button"
        >
          Auto via F, N, PA, PC
        </button>
        <button
          className={value.method === "manual" ? "mode-button active" : "mode-button"}
          onClick={() => onChange({ ...value, method: "manual" })}
          type="button"
        >
          PRE manuel
        </button>
      </div>

      {value.method === "auto" ? (
        <>
          <div className="form-grid" style={{ marginTop: 14 }}>
            <TextField
              label="F"
              value={value.f}
              onChange={(next) => onChange({ ...value, f: next })}
              placeholder="ex. 19.493"
            />
            <TextField
              label="N"
              value={value.n}
              onChange={(next) => onChange({ ...value, n: next })}
              placeholder="ex. 30"
            />
            <TextField
              label="PA"
              value={value.pa}
              onChange={(next) => onChange({ ...value, pa: next })}
              placeholder="ex. 3"
              helper="modèle augmenté"
            />
            <TextField
              label="PC"
              value={value.pc}
              onChange={(next) => onChange({ ...value, pc: next })}
              placeholder="ex. 2"
              helper="modèle contraint"
            />
          </div>
          <p className="field-helper" style={{ marginTop: 10 }}>
            Formule : PRE = ((PA − PC) × F) / [((PA − PC) × F) + (N − PA)]
          </p>
          {autoPreview !== null ? (
            <div className="mini-note" style={{ marginTop: 10 }}>
              <strong>PRE calculé :</strong> {formatPre(autoPreview)}
            </div>
          ) : null}
        </>
      ) : (
        <div style={{ marginTop: 14 }}>
          <TextField
            label="PRE"
            value={value.manual}
            onChange={(next) => onChange({ ...value, manual: next })}
            placeholder="ex. .411"
          />
          {currentPreview !== null ? (
            <div className="mini-note" style={{ marginTop: 10 }}>
              <strong>PRE utilisé :</strong> {formatPre(currentPreview)}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function App() {
  const [tab, setTab] = useState<Tab>("pre");
  const [preMode, setPreMode] = useState<PreMode>("f");
  const [apaMode, setApaMode] = useState<ApaMode>("twoGroups");
  const [noInteractionSubtype, setNoInteractionSubtype] = useState<ModelSubtype>("mixed");
  const [interactionSubtype, setInteractionSubtype] = useState<ModelSubtype>("mixed");
  const [openExplain, setOpenExplain] = useState<string>("b");

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
    pre: makePreControl(),
  });

  const [simpleRegression, setSimpleRegression] = useState({
    predictor: "X",
    outcome: "Y",
    b: "",
    t: "",
    df: "",
    p: "",
    intercept: "",
    pre: makePreControl(),
  });

  const [mainMixed, setMainMixed] = useState({
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
    catPre: makePreControl(),
    b: "",
    contT: "",
    contDf: "",
    contP: "",
    contPre: makePreControl(),
  });

  const [mainTwoContinuous, setMainTwoContinuous] = useState({
    outcome: "la performance",
    predictor1: "X1",
    predictor2: "X2",
    b1: "",
    t1: "",
    df1: "",
    p1: "",
    pre1: makePreControl(),
    b2: "",
    t2: "",
    df2: "",
    p2: "",
    pre2: makePreControl(),
  });

  const [twoCategorical, setTwoCategorical] = useState({
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
    preA: makePreControl(),
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
    preB: makePreControl(),
    fInt: "",
    df1Int: "",
    df2Int: "",
    pInt: "",
    preInt: makePreControl(),
  });

  const [interactionMixed, setInteractionMixed] = useState({
    outcome: "la variable dépendante",
    categoricalPredictor: "le contexte",
    continuousPredictor: "X",
    group1: "Modalité 1",
    m1: "",
    sd1: "",
    group2: "Modalité 2",
    m2: "",
    sd2: "",
    catF: "",
    catDf1: "",
    catDf2: "",
    catP: "",
    catPre: makePreControl(),
    b: "",
    contT: "",
    contDf: "",
    contP: "",
    contPre: makePreControl(),
    intF: "",
    intDf1: "",
    intDf2: "",
    intP: "",
    intPre: makePreControl(),
  });

  const [interactionTwoContinuous, setInteractionTwoContinuous] = useState({
    outcome: "la variable dépendante",
    predictor1: "X",
    predictor2: "Z",
    b1: "",
    t1: "",
    df1: "",
    p1: "",
    pre1: makePreControl(),
    b2: "",
    t2: "",
    df2: "",
    p2: "",
    pre2: makePreControl(),
    bInt: "",
    tInt: "",
    dfInt: "",
    pInt: "",
    preInt: makePreControl(),
  });

  const [simpleEffectsEnabled, setSimpleEffectsEnabled] = useState(false);
const [simpleEffectsFamily, setSimpleEffectsFamily] = useState<SimpleEffectsFamily>("AwithinB");

const [simpleEffects, setSimpleEffects] = useState({
  s1m1: "",
  s1sd1: "",
  s1m2: "",
  s1sd2: "",
  s1t: "",
  s1df: "",
  s1p: "",
  s1pre: makePreControl(),
  s2m1: "",
  s2sd1: "",
  s2m2: "",
  s2sd2: "",
  s2t: "",
  s2df: "",
  s2p: "",
  s2pre: makePreControl(),
});

const [mixedSimpleSlopesEnabled, setMixedSimpleSlopesEnabled] = useState(false);

const [mixedSimpleSlopes, setMixedSimpleSlopes] = useState({
  b1: "",
  t1: "",
  df1: "",
  p1: "",
  pre1: makePreControl(),
  b2: "",
  t2: "",
  df2: "",
  p2: "",
  pre2: makePreControl(),
});

const [twoContinuousSimpleSlopesEnabled, setTwoContinuousSimpleSlopesEnabled] = useState(false);

const [twoContinuousSimpleSlopes, setTwoContinuousSimpleSlopes] = useState({
  level1Label: "niveau bas du modérateur",
  level2Label: "niveau haut du modérateur",
  b1: "",
  t1: "",
  df1: "",
  p1: "",
  pre1: makePreControl(),
  b2: "",
  t2: "",
  df2: "",
  p2: "",
  pre2: makePreControl(),
});

  const preOutput = useMemo(() => {
    if (preMode === "f") {
      const value = computePreFromFValues(preFromF.f, preFromF.n, preFromF.pa, preFromF.pc);

      if (value === null) {
        return {
          value: "",
          explanation: "",
        };
      }

      const N = parseValue(preFromF.n);
      const PA = parseValue(preFromF.pa);
      const PC = parseValue(preFromF.pc);
      const dfEffect = PA - PC;
      const dfError = N - PA;

      return {
        value: `PRE = ${formatPre(value)}`,
        explanation: `Formule utilisée : PRE = ((PA - PC) × F) / [((PA - PC) × F) + (N - PA)] ; ddl effet = ${formatValue(
          dfEffect,
          0
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

  const twoGroupsApa = useMemo(() => {
    const numericReady = [twoGroups.m1, twoGroups.sd1, twoGroups.m2, twoGroups.sd2, twoGroups.t, twoGroups.df].every(hasNumber);
    if (!numericReady || !twoGroups.p.trim()) return "";

    const m1 = parseValue(twoGroups.m1);
    const sd1 = parseValue(twoGroups.sd1);
    const m2 = parseValue(twoGroups.m2);
    const sd2 = parseValue(twoGroups.sd2);
    const t = parseValue(twoGroups.t);
    const df = parseValue(twoGroups.df);
    const sig = isSignificantP(twoGroups.p);
    const pText = normalizePText(twoGroups.p);
    const preText = preSuffix(twoGroups.pre);

    if (sig === null) return "";

    const descriptive =
      m1 > m2
        ? `${twoGroups.group1} (M = ${formatValue(m1, 2)}, ET = ${formatValue(sd1, 2)}) présente un score plus élevé que ${twoGroups.group2} (M = ${formatValue(m2, 2)}, ET = ${formatValue(sd2, 2)}).`
        : `${twoGroups.group2} (M = ${formatValue(m2, 2)}, ET = ${formatValue(sd2, 2)}) présente un score plus élevé que ${twoGroups.group1} (M = ${formatValue(m1, 2)}, ET = ${formatValue(sd1, 2)}).`;

    if (sig) {
      return `On observe un effet significatif de ${twoGroups.iv} sur ${twoGroups.dv}, t(${formatValue(df, 0)}) = ${formatValue(
        t,
        2
      )}, ${pText}${preText}. ${descriptive}`;
    }

    return `L’effet de ${twoGroups.iv} sur ${twoGroups.dv} n’est pas significatif, t(${formatValue(
      df,
      0
    )}) = ${formatValue(t, 2)}, ${pText}${preText}. Au niveau descriptif, ${descriptive.toLowerCase()}`;
  }, [twoGroups]);

  const simpleRegressionApa = useMemo(() => {
    const numericReady = [simpleRegression.b, simpleRegression.t, simpleRegression.df].every(hasNumber);
    if (!numericReady || !simpleRegression.p.trim()) return "";

    const b = parseValue(simpleRegression.b);
    const t = parseValue(simpleRegression.t);
    const df = parseValue(simpleRegression.df);
    const sig = isSignificantP(simpleRegression.p);
    const pText = normalizePText(simpleRegression.p);
    const preText = preSuffix(simpleRegression.pre);

    if (sig === null) return "";

    const direction = b > 0 ? "positivement" : b < 0 ? "négativement" : "";

    if (sig) {
      return `${simpleRegression.predictor} prédit ${direction} ${simpleRegression.outcome}, et cette relation est significative, b = ${formatValue(
        b,
        3
      )}, t(${formatValue(df, 0)}) = ${formatValue(t, 3)}, ${pText}${preText}.`;
    }

    return `${simpleRegression.predictor} prédit ${direction} ${simpleRegression.outcome}, mais cette relation est non-significative, b = ${formatValue(
      b,
      3
    )}, t(${formatValue(df, 0)}) = ${formatValue(t, 3)}, ${pText}${preText}.`;
  }, [simpleRegression]);

  const simpleRegressionExplain = useMemo(() => {
    if (!hasNumber(simpleRegression.b)) return "";

    const b = parseValue(simpleRegression.b);
    const direction =
      b > 0
        ? `Quand ${simpleRegression.predictor} augmente d’une unité, la valeur prédite de ${simpleRegression.outcome} augmente de ${formatValue(
            b,
            3
          )} unité(s).`
        : `Quand ${simpleRegression.predictor} augmente d’une unité, la valeur prédite de ${simpleRegression.outcome} diminue de ${formatValue(
            Math.abs(b),
            3
          )} unité(s).`;

    if (hasNumber(simpleRegression.intercept)) {
      const intercept = parseValue(simpleRegression.intercept);
      return `${direction} L’ordonnée à l’origine estimée est ${formatValue(intercept, 3)}.`;
    }

    return direction;
  }, [simpleRegression]);

  const mainMixedApa = useMemo(() => {
    const numericReady = [
      mainMixed.m1,
      mainMixed.sd1,
      mainMixed.m2,
      mainMixed.sd2,
      mainMixed.catT,
      mainMixed.catDf,
      mainMixed.b,
      mainMixed.contT,
      mainMixed.contDf,
    ].every(hasNumber);

    if (!numericReady || !mainMixed.catP.trim() || !mainMixed.contP.trim()) return "";

    const m1 = parseValue(mainMixed.m1);
    const sd1 = parseValue(mainMixed.sd1);
    const m2 = parseValue(mainMixed.m2);
    const sd2 = parseValue(mainMixed.sd2);

    const catT = parseValue(mainMixed.catT);
    const catDf = parseValue(mainMixed.catDf);
    const b = parseValue(mainMixed.b);
    const contT = parseValue(mainMixed.contT);
    const contDf = parseValue(mainMixed.contDf);

    const catSig = isSignificantP(mainMixed.catP);
    const contSig = isSignificantP(mainMixed.contP);
    if (catSig === null || contSig === null) return "";

    const catPText = normalizePText(mainMixed.catP);
    const contPText = normalizePText(mainMixed.contP);
    const catPreText = preSuffix(mainMixed.catPre);
    const contPreText = preSuffix(mainMixed.contPre);

    const group1Higher = m1 > m2;
    const higherGroup = group1Higher ? mainMixed.group1 : mainMixed.group2;
    const lowerGroup = group1Higher ? mainMixed.group2 : mainMixed.group1;
    const higherMean = group1Higher ? m1 : m2;
    const lowerMean = group1Higher ? m2 : m1;
    const higherSd = group1Higher ? sd1 : sd2;
    const lowerSd = group1Higher ? sd2 : sd1;

    const catSentence = catSig
      ? `Indépendamment de ${mainMixed.continuousPredictor}, les ${higherGroup} (M = ${formatValue(
          higherMean,
          3
        )}, ET = ${formatValue(higherSd, 3)}) présentent un score plus élevé sur ${mainMixed.outcome} que les ${lowerGroup} (M = ${formatValue(
          lowerMean,
          3
        )}, ET = ${formatValue(lowerSd, 3)}). Cette différence est significative, t(${formatValue(
          catDf,
          0
        )}) = ${formatValue(catT, 3)}, ${catPText}${catPreText}.`
      : `Indépendamment de ${mainMixed.continuousPredictor}, les ${higherGroup} (M = ${formatValue(
          higherMean,
          3
        )}, ET = ${formatValue(higherSd, 3)}) présentent un score plus élevé sur ${mainMixed.outcome} que les ${lowerGroup} (M = ${formatValue(
          lowerMean,
          3
        )}, ET = ${formatValue(lowerSd, 3)}), mais cette différence est non-significative, t(${formatValue(
          catDf,
          0
        )}) = ${formatValue(catT, 3)}, ${catPText}${catPreText}.`;

    const direction = b > 0 ? "positivement" : b < 0 ? "négativement" : "";
    const contSentence = contSig
      ? `Indépendamment de ${mainMixed.categoricalPredictor}, ${mainMixed.continuousPredictor} prédit ${direction} ${mainMixed.outcome}, et cette relation est significative, b = ${formatValue(
          b,
          3
        )}, t(${formatValue(contDf, 0)}) = ${formatValue(contT, 3)}, ${contPText}${contPreText}.`
      : `Indépendamment de ${mainMixed.categoricalPredictor}, ${mainMixed.continuousPredictor} prédit ${direction} ${mainMixed.outcome}, mais cette relation est non-significative, b = ${formatValue(
          b,
          3
        )}, t(${formatValue(contDf, 0)}) = ${formatValue(contT, 3)}, ${contPText}${contPreText}.`;

    return `${catSentence} ${contSentence}`;
  }, [mainMixed]);

  const mainMixedExplain = useMemo(() => {
    const numericReady = [mainMixed.m1, mainMixed.m2, mainMixed.b].every(hasNumber);
    if (!numericReady || !mainMixed.catP.trim() || !mainMixed.contP.trim()) return "";

    const m1 = parseValue(mainMixed.m1);
    const m2 = parseValue(mainMixed.m2);
    const b = parseValue(mainMixed.b);
    const catSig = isSignificantP(mainMixed.catP);
    const contSig = isSignificantP(mainMixed.contP);

    if (catSig === null || contSig === null) return "";

    const higherGroup = m1 > m2 ? mainMixed.group1 : mainMixed.group2;

    const simpleCat = catSig
      ? `À ${mainMixed.continuousPredictor} égal, les ${higherGroup} ont le score le plus élevé sur ${mainMixed.outcome}.`
      : `À ${mainMixed.continuousPredictor} égal, la différence liée à ${mainMixed.categoricalPredictor} n’est pas significative.`;

    const simpleCont = contSig
      ? b >= 0
        ? `À ${mainMixed.categoricalPredictor} égal, plus ${mainMixed.continuousPredictor} augmente, plus ${mainMixed.outcome} augmente.`
        : `À ${mainMixed.categoricalPredictor} égal, plus ${mainMixed.continuousPredictor} augmente, plus ${mainMixed.outcome} diminue.`
      : b >= 0
      ? `À ${mainMixed.categoricalPredictor} égal, ${mainMixed.continuousPredictor} est positivement associé à ${mainMixed.outcome}, mais pas de manière significative.`
      : `À ${mainMixed.categoricalPredictor} égal, ${mainMixed.continuousPredictor} est négativement associé à ${mainMixed.outcome}, mais pas de manière significative.`;

    return `${simpleCat} ${simpleCont}`;
  }, [mainMixed]);

  const mainTwoContinuousApa = useMemo(() => {
    const numericReady = [
      mainTwoContinuous.b1,
      mainTwoContinuous.t1,
      mainTwoContinuous.df1,
      mainTwoContinuous.b2,
      mainTwoContinuous.t2,
      mainTwoContinuous.df2,
    ].every(hasNumber);

    if (!numericReady || !mainTwoContinuous.p1.trim() || !mainTwoContinuous.p2.trim()) return "";

    const b1 = parseValue(mainTwoContinuous.b1);
    const t1 = parseValue(mainTwoContinuous.t1);
    const df1 = parseValue(mainTwoContinuous.df1);
    const b2 = parseValue(mainTwoContinuous.b2);
    const t2 = parseValue(mainTwoContinuous.t2);
    const df2 = parseValue(mainTwoContinuous.df2);

    const sig1 = isSignificantP(mainTwoContinuous.p1);
    const sig2 = isSignificantP(mainTwoContinuous.p2);
    if (sig1 === null || sig2 === null) return "";

    const pText1 = normalizePText(mainTwoContinuous.p1);
    const pText2 = normalizePText(mainTwoContinuous.p2);
    const preText1 = preSuffix(mainTwoContinuous.pre1);
    const preText2 = preSuffix(mainTwoContinuous.pre2);

    const dir1 = b1 > 0 ? "positivement" : b1 < 0 ? "négativement" : "";
    const dir2 = b2 > 0 ? "positivement" : b2 < 0 ? "négativement" : "";

    const sentence1 = sig1
      ? `Indépendamment de ${mainTwoContinuous.predictor2}, ${mainTwoContinuous.predictor1} prédit ${dir1} ${mainTwoContinuous.outcome}, et cette relation est significative, b = ${formatValue(
          b1,
          3
        )}, t(${formatValue(df1, 0)}) = ${formatValue(t1, 3)}, ${pText1}${preText1}.`
      : `Indépendamment de ${mainTwoContinuous.predictor2}, ${mainTwoContinuous.predictor1} prédit ${dir1} ${mainTwoContinuous.outcome}, mais cette relation est non-significative, b = ${formatValue(
          b1,
          3
        )}, t(${formatValue(df1, 0)}) = ${formatValue(t1, 3)}, ${pText1}${preText1}.`;

    const sentence2 = sig2
      ? `Indépendamment de ${mainTwoContinuous.predictor1}, ${mainTwoContinuous.predictor2} prédit ${dir2} ${mainTwoContinuous.outcome}, et cette relation est significative, b = ${formatValue(
          b2,
          3
        )}, t(${formatValue(df2, 0)}) = ${formatValue(t2, 3)}, ${pText2}${preText2}.`
      : `Indépendamment de ${mainTwoContinuous.predictor1}, ${mainTwoContinuous.predictor2} prédit ${dir2} ${mainTwoContinuous.outcome}, mais cette relation est non-significative, b = ${formatValue(
          b2,
          3
        )}, t(${formatValue(df2, 0)}) = ${formatValue(t2, 3)}, ${pText2}${preText2}.`;

    return `${sentence1} ${sentence2}`;
  }, [mainTwoContinuous]);

  const mainTwoContinuousExplain = useMemo(() => {
    const numericReady = [mainTwoContinuous.b1, mainTwoContinuous.b2].every(hasNumber);
    if (!numericReady || !mainTwoContinuous.p1.trim() || !mainTwoContinuous.p2.trim()) return "";

    const b1 = parseValue(mainTwoContinuous.b1);
    const b2 = parseValue(mainTwoContinuous.b2);
    const sig1 = isSignificantP(mainTwoContinuous.p1);
    const sig2 = isSignificantP(mainTwoContinuous.p2);

    if (sig1 === null || sig2 === null) return "";

    const text1 = sig1
      ? b1 >= 0
        ? `À ${mainTwoContinuous.predictor2} égal, plus ${mainTwoContinuous.predictor1} augmente, plus ${mainTwoContinuous.outcome} augmente.`
        : `À ${mainTwoContinuous.predictor2} égal, plus ${mainTwoContinuous.predictor1} augmente, plus ${mainTwoContinuous.outcome} diminue.`
      : `À ${mainTwoContinuous.predictor2} égal, l’effet de ${mainTwoContinuous.predictor1} n’est pas significatif.`;

    const text2 = sig2
      ? b2 >= 0
        ? `À ${mainTwoContinuous.predictor1} égal, plus ${mainTwoContinuous.predictor2} augmente, plus ${mainTwoContinuous.outcome} augmente.`
        : `À ${mainTwoContinuous.predictor1} égal, plus ${mainTwoContinuous.predictor2} augmente, plus ${mainTwoContinuous.outcome} diminue.`
      : `À ${mainTwoContinuous.predictor1} égal, l’effet de ${mainTwoContinuous.predictor2} n’est pas significatif.`;

    return `${text1} ${text2}`;
  }, [mainTwoContinuous]);

  const mainTwoCategoricalApa = useMemo(() => {
    const numericReady = [
      twoCategorical.meanA1,
      twoCategorical.sdA1,
      twoCategorical.meanA2,
      twoCategorical.sdA2,
      twoCategorical.fA,
      twoCategorical.df1A,
      twoCategorical.df2A,
      twoCategorical.meanB1,
      twoCategorical.sdB1,
      twoCategorical.meanB2,
      twoCategorical.sdB2,
      twoCategorical.fB,
      twoCategorical.df1B,
      twoCategorical.df2B,
    ].every(hasNumber);

    if (!numericReady || !twoCategorical.pA.trim() || !twoCategorical.pB.trim()) return "";

    const meanA1 = parseValue(twoCategorical.meanA1);
    const sdA1 = parseValue(twoCategorical.sdA1);
    const meanA2 = parseValue(twoCategorical.meanA2);
    const sdA2 = parseValue(twoCategorical.sdA2);
    const fA = parseValue(twoCategorical.fA);
    const df1A = parseValue(twoCategorical.df1A);
    const df2A = parseValue(twoCategorical.df2A);

    const meanB1 = parseValue(twoCategorical.meanB1);
    const sdB1 = parseValue(twoCategorical.sdB1);
    const meanB2 = parseValue(twoCategorical.meanB2);
    const sdB2 = parseValue(twoCategorical.sdB2);
    const fB = parseValue(twoCategorical.fB);
    const df1B = parseValue(twoCategorical.df1B);
    const df2B = parseValue(twoCategorical.df2B);

    const sigA = isSignificantP(twoCategorical.pA);
    const sigB = isSignificantP(twoCategorical.pB);
    if (sigA === null || sigB === null) return "";

    const pAText = normalizePText(twoCategorical.pA);
    const pBText = normalizePText(twoCategorical.pB);
    const preAText = preSuffix(twoCategorical.preA);
    const preBText = preSuffix(twoCategorical.preB);

    const higherA = meanA1 > meanA2 ? twoCategorical.levelA1 : twoCategorical.levelA2;
    const lowerA = meanA1 > meanA2 ? twoCategorical.levelA2 : twoCategorical.levelA1;
    const higherMeanA = meanA1 > meanA2 ? meanA1 : meanA2;
    const lowerMeanA = meanA1 > meanA2 ? meanA2 : meanA1;
    const higherSdA = meanA1 > meanA2 ? sdA1 : sdA2;
    const lowerSdA = meanA1 > meanA2 ? sdA2 : sdA1;

    const higherB = meanB1 > meanB2 ? twoCategorical.levelB1 : twoCategorical.levelB2;
    const lowerB = meanB1 > meanB2 ? twoCategorical.levelB2 : twoCategorical.levelB1;
    const higherMeanB = meanB1 > meanB2 ? meanB1 : meanB2;
    const lowerMeanB = meanB1 > meanB2 ? meanB2 : meanB1;
    const higherSdB = meanB1 > meanB2 ? sdB1 : sdB2;
    const lowerSdB = meanB1 > meanB2 ? sdB2 : sdB1;

    const sentenceA = sigA
      ? `L’effet principal de ${twoCategorical.factorA} est significatif, F(${formatValue(df1A, 0)}, ${formatValue(
          df2A,
          0
        )}) = ${formatValue(fA, 3)}, ${pAText}${preAText}. Indépendamment de ${twoCategorical.factorB}, les ${higherA} (M = ${formatValue(
          higherMeanA,
          3
        )}, ET = ${formatValue(higherSdA, 3)}) présentent un score plus élevé sur ${twoCategorical.outcome} que les ${lowerA} (M = ${formatValue(
          lowerMeanA,
          3
        )}, ET = ${formatValue(lowerSdA, 3)}).`
      : `L’effet principal de ${twoCategorical.factorA} n’est pas significatif, F(${formatValue(df1A, 0)}, ${formatValue(
          df2A,
          0
        )}) = ${formatValue(fA, 3)}, ${pAText}${preAText}. Au niveau descriptif, les ${higherA} (M = ${formatValue(
          higherMeanA,
          3
        )}, ET = ${formatValue(higherSdA, 3)}) présentent un score plus élevé que les ${lowerA} (M = ${formatValue(
          lowerMeanA,
          3
        )}, ET = ${formatValue(lowerSdA, 3)}).`;

    const sentenceB = sigB
      ? `L’effet principal de ${twoCategorical.factorB} est significatif, F(${formatValue(df1B, 0)}, ${formatValue(
          df2B,
          0
        )}) = ${formatValue(fB, 3)}, ${pBText}${preBText}. Indépendamment de ${twoCategorical.factorA}, les ${higherB} (M = ${formatValue(
          higherMeanB,
          3
        )}, ET = ${formatValue(higherSdB, 3)}) présentent un score plus élevé sur ${twoCategorical.outcome} que les ${lowerB} (M = ${formatValue(
          lowerMeanB,
          3
        )}, ET = ${formatValue(lowerSdB, 3)}).`
      : `L’effet principal de ${twoCategorical.factorB} n’est pas significatif, F(${formatValue(df1B, 0)}, ${formatValue(
          df2B,
          0
        )}) = ${formatValue(fB, 3)}, ${pBText}${preBText}. Au niveau descriptif, les ${higherB} (M = ${formatValue(
          higherMeanB,
          3
        )}, ET = ${formatValue(higherSdB, 3)}) présentent un score plus élevé que les ${lowerB} (M = ${formatValue(
          lowerMeanB,
          3
        )}, ET = ${formatValue(lowerSdB, 3)}).`;

    return `${sentenceA} ${sentenceB}`;
  }, [twoCategorical]);

  const interactionMixedApa = useMemo(() => {
    const numericReady = [
      interactionMixed.m1,
      interactionMixed.sd1,
      interactionMixed.m2,
      interactionMixed.sd2,
      interactionMixed.catF,
      interactionMixed.catDf1,
      interactionMixed.catDf2,
      interactionMixed.b,
      interactionMixed.contT,
      interactionMixed.contDf,
      interactionMixed.intF,
      interactionMixed.intDf1,
      interactionMixed.intDf2,
    ].every(hasNumber);

    if (!numericReady || !interactionMixed.catP.trim() || !interactionMixed.contP.trim() || !interactionMixed.intP.trim()) {
      return "";
    }

    const m1 = parseValue(interactionMixed.m1);
    const sd1 = parseValue(interactionMixed.sd1);
    const m2 = parseValue(interactionMixed.m2);
    const sd2 = parseValue(interactionMixed.sd2);

    const catF = parseValue(interactionMixed.catF);
    const catDf1 = parseValue(interactionMixed.catDf1);
    const catDf2 = parseValue(interactionMixed.catDf2);

    const b = parseValue(interactionMixed.b);
    const contT = parseValue(interactionMixed.contT);
    const contDf = parseValue(interactionMixed.contDf);

    const intF = parseValue(interactionMixed.intF);
    const intDf1 = parseValue(interactionMixed.intDf1);
    const intDf2 = parseValue(interactionMixed.intDf2);

    const catSig = isSignificantP(interactionMixed.catP);
    const contSig = isSignificantP(interactionMixed.contP);
    const intSig = isSignificantP(interactionMixed.intP);

    if (catSig === null || contSig === null || intSig === null) return "";

    const catPText = normalizePText(interactionMixed.catP);
    const contPText = normalizePText(interactionMixed.contP);
    const intPText = normalizePText(interactionMixed.intP);

    const catPreText = preSuffix(interactionMixed.catPre);
    const contPreText = preSuffix(interactionMixed.contPre);
    const intPreText = preSuffix(interactionMixed.intPre);

    const higherGroup = m1 > m2 ? interactionMixed.group1 : interactionMixed.group2;
    const lowerGroup = m1 > m2 ? interactionMixed.group2 : interactionMixed.group1;
    const higherMean = m1 > m2 ? m1 : m2;
    const lowerMean = m1 > m2 ? m2 : m1;
    const higherSd = m1 > m2 ? sd1 : sd2;
    const lowerSd = m1 > m2 ? sd2 : sd1;

    const catSentence = catSig
  ? `L’effet principal de ${interactionMixed.categoricalPredictor} est significatif, F(${formatValue(catDf1, 0)}, ${formatValue(
      catDf2,
      0
    )}) = ${formatValue(catF, 3)}, ${catPText}${catPreText}. Indépendamment de ${interactionMixed.continuousPredictor}, les ${higherGroup} (M = ${formatValue(
      higherMean,
      3
    )}, ET = ${formatValue(higherSd, 3)}) présentent un score plus élevé sur ${interactionMixed.outcome} que les ${lowerGroup} (M = ${formatValue(
      lowerMean,
      3
    )}, ET = ${formatValue(lowerSd, 3)}).`
  : `L’effet principal de ${interactionMixed.categoricalPredictor} n’est pas significatif, F(${formatValue(catDf1, 0)}, ${formatValue(
      catDf2,
      0
    )}) = ${formatValue(catF, 3)}, ${catPText}${catPreText}. Au niveau descriptif, les ${higherGroup} (M = ${formatValue(
      higherMean,
      3
    )}, ET = ${formatValue(higherSd, 3)}) présentent un score plus élevé sur ${interactionMixed.outcome} que les ${lowerGroup} (M = ${formatValue(
      lowerMean,
      3
    )}, ET = ${formatValue(lowerSd, 3)}).`;

    const direction = b > 0 ? "positivement" : b < 0 ? "négativement" : "";
    const contSentence = contSig
      ? `L’effet principal de ${interactionMixed.continuousPredictor} indique une relation ${direction} avec ${interactionMixed.outcome}, b = ${formatValue(
          b,
          3
        )}, t(${formatValue(contDf, 0)}) = ${formatValue(contT, 3)}, ${contPText}${contPreText}.`
      : `L’effet principal de ${interactionMixed.continuousPredictor} indique une relation ${direction} avec ${interactionMixed.outcome}, mais elle est non-significative, b = ${formatValue(
          b,
          3
        )}, t(${formatValue(contDf, 0)}) = ${formatValue(contT, 3)}, ${contPText}${contPreText}.`;

    const intSentence = intSig
      ? `L’interaction entre ${interactionMixed.categoricalPredictor} et ${interactionMixed.continuousPredictor} est significative, F(${formatValue(
          intDf1,
          0
        )}, ${formatValue(intDf2, 0)}) = ${formatValue(intF, 3)}, ${intPText}${intPreText}. L’examen du graphique ou des effets simples permet ensuite de préciser le motif de l’interaction.`
      : `L’interaction entre ${interactionMixed.categoricalPredictor} et ${interactionMixed.continuousPredictor} n’est pas significative, F(${formatValue(
          intDf1,
          0
        )}, ${formatValue(intDf2, 0)}) = ${formatValue(intF, 3)}, ${intPText}${intPreText}.`;

    return `${catSentence} ${contSentence} ${intSentence}`;
  }, [interactionMixed]);

  const interactionMixedExplain = useMemo(() => {
    return "Ici, l’effet de la variable continue peut changer selon la modalité de la variable catégorielle. Utilise le graphique ou les effets simples si l’interaction est significative.";
  }, []);

  const interactionTwoContinuousApa = useMemo(() => {
    const numericReady = [
      interactionTwoContinuous.b1,
      interactionTwoContinuous.t1,
      interactionTwoContinuous.df1,
      interactionTwoContinuous.b2,
      interactionTwoContinuous.t2,
      interactionTwoContinuous.df2,
      interactionTwoContinuous.bInt,
      interactionTwoContinuous.tInt,
      interactionTwoContinuous.dfInt,
    ].every(hasNumber);

    if (!numericReady || !interactionTwoContinuous.p1.trim() || !interactionTwoContinuous.p2.trim() || !interactionTwoContinuous.pInt.trim()) {
      return "";
    }

    const b1 = parseValue(interactionTwoContinuous.b1);
    const t1 = parseValue(interactionTwoContinuous.t1);
    const df1 = parseValue(interactionTwoContinuous.df1);
    const b2 = parseValue(interactionTwoContinuous.b2);
    const t2 = parseValue(interactionTwoContinuous.t2);
    const df2 = parseValue(interactionTwoContinuous.df2);
    const bInt = parseValue(interactionTwoContinuous.bInt);
    const tInt = parseValue(interactionTwoContinuous.tInt);
    const dfInt = parseValue(interactionTwoContinuous.dfInt);

    const sig1 = isSignificantP(interactionTwoContinuous.p1);
    const sig2 = isSignificantP(interactionTwoContinuous.p2);
    const sigInt = isSignificantP(interactionTwoContinuous.pInt);

    if (sig1 === null || sig2 === null || sigInt === null) return "";

    const pText1 = normalizePText(interactionTwoContinuous.p1);
    const pText2 = normalizePText(interactionTwoContinuous.p2);
    const pTextInt = normalizePText(interactionTwoContinuous.pInt);

    const preText1 = preSuffix(interactionTwoContinuous.pre1);
    const preText2 = preSuffix(interactionTwoContinuous.pre2);
    const preTextInt = preSuffix(interactionTwoContinuous.preInt);

    const dir1 = b1 > 0 ? "positivement" : b1 < 0 ? "négativement" : "";
    const dir2 = b2 > 0 ? "positivement" : b2 < 0 ? "négativement" : "";

    const sentence1 = sig1
      ? `L’effet principal de ${interactionTwoContinuous.predictor1} indique une relation ${dir1} avec ${interactionTwoContinuous.outcome}, b = ${formatValue(
          b1,
          3
        )}, t(${formatValue(df1, 0)}) = ${formatValue(t1, 3)}, ${pText1}${preText1}.`
      : `L’effet principal de ${interactionTwoContinuous.predictor1} indique une relation ${dir1} avec ${interactionTwoContinuous.outcome}, mais elle est non-significative, b = ${formatValue(
          b1,
          3
        )}, t(${formatValue(df1, 0)}) = ${formatValue(t1, 3)}, ${pText1}${preText1}.`;

    const sentence2 = sig2
      ? `L’effet principal de ${interactionTwoContinuous.predictor2} indique une relation ${dir2} avec ${interactionTwoContinuous.outcome}, b = ${formatValue(
          b2,
          3
        )}, t(${formatValue(df2, 0)}) = ${formatValue(t2, 3)}, ${pText2}${preText2}.`
      : `L’effet principal de ${interactionTwoContinuous.predictor2} indique une relation ${dir2} avec ${interactionTwoContinuous.outcome}, mais elle est non-significative, b = ${formatValue(
          b2,
          3
        )}, t(${formatValue(df2, 0)}) = ${formatValue(t2, 3)}, ${pText2}${preText2}.`;

    const intSentence = sigInt
      ? `L’interaction entre ${interactionTwoContinuous.predictor1} et ${interactionTwoContinuous.predictor2} est significative, b = ${formatValue(
          bInt,
          3
        )}, t(${formatValue(dfInt, 0)}) = ${formatValue(tInt, 3)}, ${pTextInt}${preTextInt}.`
      : `L’interaction entre ${interactionTwoContinuous.predictor1} et ${interactionTwoContinuous.predictor2} n’est pas significative, b = ${formatValue(
          bInt,
          3
        )}, t(${formatValue(dfInt, 0)}) = ${formatValue(tInt, 3)}, ${pTextInt}${preTextInt}.`;

    return `${sentence1} ${sentence2} ${intSentence}`;
  }, [interactionTwoContinuous]);

  const interactionTwoContinuousExplain = useMemo(() => {
    return "Si l’interaction est significative, cela signifie que la pente d’un prédicteur change selon le niveau de l’autre.";
  }, []);

  const interactionTwoCategoricalApa = useMemo(() => {
    const numericReady = [
      twoCategorical.meanA1,
      twoCategorical.sdA1,
      twoCategorical.meanA2,
      twoCategorical.sdA2,
      twoCategorical.fA,
      twoCategorical.df1A,
      twoCategorical.df2A,
      twoCategorical.meanB1,
      twoCategorical.sdB1,
      twoCategorical.meanB2,
      twoCategorical.sdB2,
      twoCategorical.fB,
      twoCategorical.df1B,
      twoCategorical.df2B,
      twoCategorical.fInt,
      twoCategorical.df1Int,
      twoCategorical.df2Int,
    ].every(hasNumber);

    if (!numericReady || !twoCategorical.pA.trim() || !twoCategorical.pB.trim() || !twoCategorical.pInt.trim()) {
      return "";
    }

    const meanA1 = parseValue(twoCategorical.meanA1);
    const sdA1 = parseValue(twoCategorical.sdA1);
    const meanA2 = parseValue(twoCategorical.meanA2);
    const sdA2 = parseValue(twoCategorical.sdA2);
    const fA = parseValue(twoCategorical.fA);
    const df1A = parseValue(twoCategorical.df1A);
    const df2A = parseValue(twoCategorical.df2A);

    const meanB1 = parseValue(twoCategorical.meanB1);
    const sdB1 = parseValue(twoCategorical.sdB1);
    const meanB2 = parseValue(twoCategorical.meanB2);
    const sdB2 = parseValue(twoCategorical.sdB2);
    const fB = parseValue(twoCategorical.fB);
    const df1B = parseValue(twoCategorical.df1B);
    const df2B = parseValue(twoCategorical.df2B);

    const fInt = parseValue(twoCategorical.fInt);
    const df1Int = parseValue(twoCategorical.df1Int);
    const df2Int = parseValue(twoCategorical.df2Int);

    const sigA = isSignificantP(twoCategorical.pA);
    const sigB = isSignificantP(twoCategorical.pB);
    const sigInt = isSignificantP(twoCategorical.pInt);

    if (sigA === null || sigB === null || sigInt === null) return "";

    const pAText = normalizePText(twoCategorical.pA);
    const pBText = normalizePText(twoCategorical.pB);
    const pIntText = normalizePText(twoCategorical.pInt);
    const preAText = preSuffix(twoCategorical.preA);
    const preBText = preSuffix(twoCategorical.preB);
    const preIntText = preSuffix(twoCategorical.preInt);

    const higherA = meanA1 > meanA2 ? twoCategorical.levelA1 : twoCategorical.levelA2;
    const lowerA = meanA1 > meanA2 ? twoCategorical.levelA2 : twoCategorical.levelA1;
    const higherMeanA = meanA1 > meanA2 ? meanA1 : meanA2;
    const lowerMeanA = meanA1 > meanA2 ? meanA2 : meanA1;
    const higherSdA = meanA1 > meanA2 ? sdA1 : sdA2;
    const lowerSdA = meanA1 > meanA2 ? sdA2 : sdA1;

    const higherB = meanB1 > meanB2 ? twoCategorical.levelB1 : twoCategorical.levelB2;
    const lowerB = meanB1 > meanB2 ? twoCategorical.levelB2 : twoCategorical.levelB1;
    const higherMeanB = meanB1 > meanB2 ? meanB1 : meanB2;
    const lowerMeanB = meanB1 > meanB2 ? meanB2 : meanB1;
    const higherSdB = meanB1 > meanB2 ? sdB1 : sdB2;
    const lowerSdB = meanB1 > meanB2 ? sdB2 : sdB1;

    const sentenceA = sigA
  ? `L’effet principal de ${twoCategorical.factorA} est significatif, F(${formatValue(df1A, 0)}, ${formatValue(
      df2A,
      0
    )}) = ${formatValue(fA, 3)}, ${pAText}${preAText}. Indépendamment de ${twoCategorical.factorB}, les ${higherA} (M = ${formatValue(
      higherMeanA,
      3
    )}, ET = ${formatValue(higherSdA, 3)}) présentent un score plus élevé sur ${twoCategorical.outcome} que les ${lowerA} (M = ${formatValue(
      lowerMeanA,
      3
    )}, ET = ${formatValue(lowerSdA, 3)}).`
  : `L’effet principal de ${twoCategorical.factorA} n’est pas significatif, F(${formatValue(df1A, 0)}, ${formatValue(
      df2A,
      0
    )}) = ${formatValue(fA, 3)}, ${pAText}${preAText}. Au niveau descriptif, les ${higherA} (M = ${formatValue(
      higherMeanA,
      3
    )}, ET = ${formatValue(higherSdA, 3)}) présentent un score plus élevé sur ${twoCategorical.outcome} que les ${lowerA} (M = ${formatValue(
      lowerMeanA,
      3
    )}, ET = ${formatValue(lowerSdA, 3)}).`;

    const sentenceB = sigB
  ? `L’effet principal de ${twoCategorical.factorB} est significatif, F(${formatValue(df1B, 0)}, ${formatValue(
      df2B,
      0
    )}) = ${formatValue(fB, 3)}, ${pBText}${preBText}. Indépendamment de ${twoCategorical.factorA}, les ${higherB} (M = ${formatValue(
      higherMeanB,
      3
    )}, ET = ${formatValue(higherSdB, 3)}) présentent un score plus élevé sur ${twoCategorical.outcome} que les ${lowerB} (M = ${formatValue(
      lowerMeanB,
      3
    )}, ET = ${formatValue(lowerSdB, 3)}).`
  : `L’effet principal de ${twoCategorical.factorB} n’est pas significatif, F(${formatValue(df1B, 0)}, ${formatValue(
      df2B,
      0
    )}) = ${formatValue(fB, 3)}, ${pBText}${preBText}. Au niveau descriptif, les ${higherB} (M = ${formatValue(
      higherMeanB,
      3
    )}, ET = ${formatValue(higherSdB, 3)}) présentent un score plus élevé sur ${twoCategorical.outcome} que les ${lowerB} (M = ${formatValue(
      lowerMeanB,
      3
    )}, ET = ${formatValue(lowerSdB, 3)}).`;

    const intSentence = sigInt
      ? `L’interaction entre ${twoCategorical.factorA} et ${twoCategorical.factorB} est significative, F(${formatValue(
          df1Int,
          0
        )}, ${formatValue(df2Int, 0)}) = ${formatValue(fInt, 3)}, ${pIntText}${preIntText}. L’examen du graphique ou des effets simples permet ensuite de préciser le motif de l’interaction.`
      : `L’interaction entre ${twoCategorical.factorA} et ${twoCategorical.factorB} n’est pas significative, F(${formatValue(
          df1Int,
          0
        )}, ${formatValue(df2Int, 0)}) = ${formatValue(fInt, 3)}, ${pIntText}${preIntText}.`;

    return `${sentenceA} ${sentenceB} ${intSentence}`;
  }, [twoCategorical]);

  const interactionTwoCategoricalExplain = useMemo(() => {
    return "Quand l’interaction est significative, il faut généralement compléter avec un graphique et/ou des effets simples.";
  }, []);

  const interactionTwoCategoricalIsSignificant = useMemo(() => {
  const sig = isSignificantP(twoCategorical.pInt);
  return sig === true;
}, [twoCategorical.pInt]);

const simpleEffectsApa = useMemo(() => {
  const numericReady = [
    simpleEffects.s1m1,
    simpleEffects.s1sd1,
    simpleEffects.s1m2,
    simpleEffects.s1sd2,
    simpleEffects.s1t,
    simpleEffects.s1df,
    simpleEffects.s2m1,
    simpleEffects.s2sd1,
    simpleEffects.s2m2,
    simpleEffects.s2sd2,
    simpleEffects.s2t,
    simpleEffects.s2df,
  ].every(hasNumber);

  if (!numericReady || !simpleEffects.s1p.trim() || !simpleEffects.s2p.trim()) return "";

  const isAwithinB = simpleEffectsFamily === "AwithinB";

  const testedFactor = isAwithinB ? twoCategorical.factorA : twoCategorical.factorB;
  const contextFactor = isAwithinB ? twoCategorical.factorB : twoCategorical.factorA;

  const testedLevel1 = isAwithinB ? twoCategorical.levelA1 : twoCategorical.levelB1;
  const testedLevel2 = isAwithinB ? twoCategorical.levelA2 : twoCategorical.levelB2;

  const contextLevel1 = isAwithinB ? twoCategorical.levelB1 : twoCategorical.levelA1;
  const contextLevel2 = isAwithinB ? twoCategorical.levelB2 : twoCategorical.levelA2;

  const s1m1 = parseValue(simpleEffects.s1m1);
  const s1sd1 = parseValue(simpleEffects.s1sd1);
  const s1m2 = parseValue(simpleEffects.s1m2);
  const s1sd2 = parseValue(simpleEffects.s1sd2);
  const s1t = parseValue(simpleEffects.s1t);
  const s1df = parseValue(simpleEffects.s1df);

  const s2m1 = parseValue(simpleEffects.s2m1);
  const s2sd1 = parseValue(simpleEffects.s2sd1);
  const s2m2 = parseValue(simpleEffects.s2m2);
  const s2sd2 = parseValue(simpleEffects.s2sd2);
  const s2t = parseValue(simpleEffects.s2t);
  const s2df = parseValue(simpleEffects.s2df);

  const sig1 = isSignificantP(simpleEffects.s1p);
  const sig2 = isSignificantP(simpleEffects.s2p);
  if (sig1 === null || sig2 === null) return "";

  const pText1 = normalizePText(simpleEffects.s1p);
  const pText2 = normalizePText(simpleEffects.s2p);
  const preText1 = preSuffix(simpleEffects.s1pre);
  const preText2 = preSuffix(simpleEffects.s2pre);

  const s1HigherIsFirst = s1m1 > s1m2;
  const s1HigherLabel = s1HigherIsFirst ? testedLevel1 : testedLevel2;
  const s1LowerLabel = s1HigherIsFirst ? testedLevel2 : testedLevel1;
  const s1HigherMean = s1HigherIsFirst ? s1m1 : s1m2;
  const s1LowerMean = s1HigherIsFirst ? s1m2 : s1m1;
  const s1HigherSd = s1HigherIsFirst ? s1sd1 : s1sd2;
  const s1LowerSd = s1HigherIsFirst ? s1sd2 : s1sd1;

  const s2HigherIsFirst = s2m1 > s2m2;
  const s2HigherLabel = s2HigherIsFirst ? testedLevel1 : testedLevel2;
  const s2LowerLabel = s2HigherIsFirst ? testedLevel2 : testedLevel1;
  const s2HigherMean = s2HigherIsFirst ? s2m1 : s2m2;
  const s2LowerMean = s2HigherIsFirst ? s2m2 : s2m1;
  const s2HigherSd = s2HigherIsFirst ? s2sd1 : s2sd2;
  const s2LowerSd = s2HigherIsFirst ? s2sd2 : s2sd1;

  const sentence1 = sig1
    ? `L’effet simple de ${testedFactor} est significatif lorsque ${contextFactor} = ${contextLevel1}, t(${formatValue(
        s1df,
        0
      )}) = ${formatValue(s1t, 2)}, ${pText1}${preText1}. La modalité ${s1HigherLabel} (M = ${formatValue(
        s1HigherMean,
        2
      )}, ET = ${formatValue(s1HigherSd, 2)}) présente une moyenne plus élevée de ${twoCategorical.outcome} que la modalité ${s1LowerLabel} (M = ${formatValue(
        s1LowerMean,
        2
      )}, ET = ${formatValue(s1LowerSd, 2)}).`
    : `L’effet simple de ${testedFactor} n’est pas significatif lorsque ${contextFactor} = ${contextLevel1}, t(${formatValue(
        s1df,
        0
      )}) = ${formatValue(s1t, 2)}, ${pText1}${preText1}. Au niveau descriptif, la modalité ${s1HigherLabel} (M = ${formatValue(
        s1HigherMean,
        2
      )}, ET = ${formatValue(s1HigherSd, 2)}) présente une moyenne plus élevée de ${twoCategorical.outcome} que la modalité ${s1LowerLabel} (M = ${formatValue(
        s1LowerMean,
        2
      )}, ET = ${formatValue(s1LowerSd, 2)}).`;

  const sentence2 = sig2
    ? `L’effet simple de ${testedFactor} est significatif lorsque ${contextFactor} = ${contextLevel2}, t(${formatValue(
        s2df,
        0
      )}) = ${formatValue(s2t, 2)}, ${pText2}${preText2}. La modalité ${s2HigherLabel} (M = ${formatValue(
        s2HigherMean,
        2
      )}, ET = ${formatValue(s2HigherSd, 2)}) présente une moyenne plus élevée de ${twoCategorical.outcome} que la modalité ${s2LowerLabel} (M = ${formatValue(
        s2LowerMean,
        2
      )}, ET = ${formatValue(s2LowerSd, 2)}).`
    : `L’effet simple de ${testedFactor} n’est pas significatif lorsque ${contextFactor} = ${contextLevel2}, t(${formatValue(
        s2df,
        0
      )}) = ${formatValue(s2t, 2)}, ${pText2}${preText2}. Au niveau descriptif, la modalité ${s2HigherLabel} (M = ${formatValue(
        s2HigherMean,
        2
      )}, ET = ${formatValue(s2HigherSd, 2)}) présente une moyenne plus élevée de ${twoCategorical.outcome} que la modalité ${s2LowerLabel} (M = ${formatValue(
        s2LowerMean,
        2
      )}, ET = ${formatValue(s2LowerSd, 2)}).`;

  return `${sentence1} ${sentence2}`;
}, [simpleEffects, simpleEffectsFamily, twoCategorical]);

const interactionMixedIsSignificant = useMemo(() => {
  const sig = isSignificantP(interactionMixed.intP);
  return sig === true;
}, [interactionMixed.intP]);

const interactionMixedSimpleSlopesApa = useMemo(() => {
  const numericReady = [
    mixedSimpleSlopes.b1,
    mixedSimpleSlopes.t1,
    mixedSimpleSlopes.df1,
    mixedSimpleSlopes.b2,
    mixedSimpleSlopes.t2,
    mixedSimpleSlopes.df2,
  ].every(hasNumber);

  if (!numericReady || !mixedSimpleSlopes.p1.trim() || !mixedSimpleSlopes.p2.trim()) return "";

  const b1 = parseValue(mixedSimpleSlopes.b1);
  const t1 = parseValue(mixedSimpleSlopes.t1);
  const df1 = parseValue(mixedSimpleSlopes.df1);

  const b2 = parseValue(mixedSimpleSlopes.b2);
  const t2 = parseValue(mixedSimpleSlopes.t2);
  const df2 = parseValue(mixedSimpleSlopes.df2);

  const sig1 = isSignificantP(mixedSimpleSlopes.p1);
  const sig2 = isSignificantP(mixedSimpleSlopes.p2);
  if (sig1 === null || sig2 === null) return "";

  const pText1 = normalizePText(mixedSimpleSlopes.p1);
  const pText2 = normalizePText(mixedSimpleSlopes.p2);

  const preText1 = preSuffix(mixedSimpleSlopes.pre1);
  const preText2 = preSuffix(mixedSimpleSlopes.pre2);

  const dir1 = b1 > 0 ? "positive" : b1 < 0 ? "négative" : "nulle";
  const dir2 = b2 > 0 ? "positive" : b2 < 0 ? "négative" : "nulle";

  const sentence1 = sig1
    ? `La pente simple de ${interactionMixed.continuousPredictor} est significative pour ${interactionMixed.group1}, b = ${formatValue(
        b1,
        3
      )}, t(${formatValue(df1, 0)}) = ${formatValue(t1, 2)}, ${pText1}${preText1}. La relation est ${dir1}.`
    : `La pente simple de ${interactionMixed.continuousPredictor} n’est pas significative pour ${interactionMixed.group1}, b = ${formatValue(
        b1,
        3
      )}, t(${formatValue(df1, 0)}) = ${formatValue(t1, 2)}, ${pText1}${preText1}. La relation est descriptivement ${dir1}.`;

  const sentence2 = sig2
    ? `La pente simple de ${interactionMixed.continuousPredictor} est significative pour ${interactionMixed.group2}, b = ${formatValue(
        b2,
        3
      )}, t(${formatValue(df2, 0)}) = ${formatValue(t2, 2)}, ${pText2}${preText2}. La relation est ${dir2}.`
    : `La pente simple de ${interactionMixed.continuousPredictor} n’est pas significative pour ${interactionMixed.group2}, b = ${formatValue(
        b2,
        3
      )}, t(${formatValue(df2, 0)}) = ${formatValue(t2, 2)}, ${pText2}${preText2}. La relation est descriptivement ${dir2}.`;

  return `${sentence1} ${sentence2}`;
}, [mixedSimpleSlopes, interactionMixed]);

const interactionTwoContinuousIsSignificant = useMemo(() => {
  const sig = isSignificantP(interactionTwoContinuous.pInt);
  return sig === true;
}, [interactionTwoContinuous.pInt]);

const interactionTwoContinuousSimpleSlopesApa = useMemo(() => {
  const numericReady = [
    twoContinuousSimpleSlopes.b1,
    twoContinuousSimpleSlopes.t1,
    twoContinuousSimpleSlopes.df1,
    twoContinuousSimpleSlopes.b2,
    twoContinuousSimpleSlopes.t2,
    twoContinuousSimpleSlopes.df2,
  ].every(hasNumber);

  if (!numericReady || !twoContinuousSimpleSlopes.p1.trim() || !twoContinuousSimpleSlopes.p2.trim()) return "";

  const b1 = parseValue(twoContinuousSimpleSlopes.b1);
  const t1 = parseValue(twoContinuousSimpleSlopes.t1);
  const df1 = parseValue(twoContinuousSimpleSlopes.df1);

  const b2 = parseValue(twoContinuousSimpleSlopes.b2);
  const t2 = parseValue(twoContinuousSimpleSlopes.t2);
  const df2 = parseValue(twoContinuousSimpleSlopes.df2);

  const sig1 = isSignificantP(twoContinuousSimpleSlopes.p1);
  const sig2 = isSignificantP(twoContinuousSimpleSlopes.p2);
  if (sig1 === null || sig2 === null) return "";

  const pText1 = normalizePText(twoContinuousSimpleSlopes.p1);
  const pText2 = normalizePText(twoContinuousSimpleSlopes.p2);

  const preText1 = preSuffix(twoContinuousSimpleSlopes.pre1);
  const preText2 = preSuffix(twoContinuousSimpleSlopes.pre2);

  const dir1 = b1 > 0 ? "positive" : b1 < 0 ? "négative" : "nulle";
  const dir2 = b2 > 0 ? "positive" : b2 < 0 ? "négative" : "nulle";

  const sentence1 = sig1
    ? `La pente simple de ${interactionTwoContinuous.predictor1} est significative lorsque ${interactionTwoContinuous.predictor2} = ${twoContinuousSimpleSlopes.level1Label}, b = ${formatValue(
        b1,
        3
      )}, t(${formatValue(df1, 0)}) = ${formatValue(t1, 2)}, ${pText1}${preText1}. La relation est ${dir1}.`
    : `La pente simple de ${interactionTwoContinuous.predictor1} n’est pas significative lorsque ${interactionTwoContinuous.predictor2} = ${twoContinuousSimpleSlopes.level1Label}, b = ${formatValue(
        b1,
        3
      )}, t(${formatValue(df1, 0)}) = ${formatValue(t1, 2)}, ${pText1}${preText1}. La relation est descriptivement ${dir1}.`;

  const sentence2 = sig2
    ? `La pente simple de ${interactionTwoContinuous.predictor1} est significative lorsque ${interactionTwoContinuous.predictor2} = ${twoContinuousSimpleSlopes.level2Label}, b = ${formatValue(
        b2,
        3
      )}, t(${formatValue(df2, 0)}) = ${formatValue(t2, 2)}, ${pText2}${preText2}. La relation est ${dir2}.`
    : `La pente simple de ${interactionTwoContinuous.predictor1} n’est pas significative lorsque ${interactionTwoContinuous.predictor2} = ${twoContinuousSimpleSlopes.level2Label}, b = ${formatValue(
        b2,
        3
      )}, t(${formatValue(df2, 0)}) = ${formatValue(t2, 2)}, ${pText2}${preText2}. La relation est descriptivement ${dir2}.`;

  return `${sentence1} ${sentence2}`;
}, [twoContinuousSimpleSlopes, interactionTwoContinuous]);

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
        "Pour 2 groupes : M, ET, t, ddl erreur, p et PRE. Pour une régression simple : b, t, ddl erreur, p et PRE. Pour un effet principal en F : F, ddl1, ddl2, p et PRE.",
    },
    {
      id: "interaction",
      title: "Comment interpréter une interaction ?",
      content:
        "Tu rapportes d’abord les effets principaux, puis l’interaction. Si l’interaction est significative, tu dois expliquer le motif observé à l’aide du graphique et/ou des effets simples. Une interaction signifie que l’effet d’une variable dépend du niveau de l’autre.",
    },
  ];

const currentApaText =
  apaMode === "twoGroups"
    ? twoGroupsApa
    : apaMode === "simpleRegression"
    ? simpleRegressionApa
    : apaMode === "noInteraction"
    ? noInteractionSubtype === "mixed"
      ? mainMixedApa
      : noInteractionSubtype === "twoContinuous"
      ? mainTwoContinuousApa
      : mainTwoCategoricalApa
    : interactionSubtype === "mixed"
    ? mixedSimpleSlopesEnabled && interactionMixedIsSignificant && interactionMixedSimpleSlopesApa
      ? `${interactionMixedApa} ${interactionMixedSimpleSlopesApa}`
      : interactionMixedApa
    : interactionSubtype === "twoContinuous"
    ? twoContinuousSimpleSlopesEnabled && interactionTwoContinuousIsSignificant && interactionTwoContinuousSimpleSlopesApa
      ? `${interactionTwoContinuousApa} ${interactionTwoContinuousSimpleSlopesApa}`
      : interactionTwoContinuousApa
    : simpleEffectsEnabled && interactionTwoCategoricalIsSignificant && simpleEffectsApa
    ? `${interactionTwoCategoricalApa} ${simpleEffectsApa}`
    : interactionTwoCategoricalApa;

  const currentApaSecondary =
    apaMode === "simpleRegression"
      ? simpleRegressionExplain
      : apaMode === "noInteraction"
      ? noInteractionSubtype === "mixed"
        ? mainMixedExplain
        : noInteractionSubtype === "twoContinuous"
        ? mainTwoContinuousExplain
        : "Ici, tu reportes deux effets principaux sans interaction."
      : apaMode === "interaction"
      ? interactionSubtype === "mixed"
        ? interactionMixedExplain
        : interactionSubtype === "twoContinuous"
        ? interactionTwoContinuousExplain
        : interactionTwoCategoricalExplain
      : "Relis la phrase et adapte légèrement le vocabulaire si ton enseignant a une préférence de style.";

  return (
    <div className="app-shell">
      <nav className="top-nav">
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
        {tab === "pre" && (
          <section className="page-grid">
            <div className="panel large">
              <div className="section-head">
                <div>
                  <h2>Calculer PRE</h2>
                  <p className="soft-text">
                    Choisis la formule qui correspond à ce que tu as sous les yeux dans ton exercice.
                  </p>
                </div>
                <div className="mode-switch">
                  <button
                    className={preMode === "f" ? "mode-button active" : "mode-button"}
                    onClick={() => setPreMode("f")}
                  >
                    Depuis F
                  </button>
                  <button
                    className={preMode === "sce" ? "mode-button active" : "mode-button"}
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
                    onChange={(value) => setPreFromF({ ...preFromF, pa: value })}
                    placeholder="ex. 4"
                    helper="modèle augmenté"
                  />
                  <TextField
                    label="PC"
                    value={preFromF.pc}
                    onChange={(value) => setPreFromF({ ...preFromF, pc: value })}
                    placeholder="ex. 3"
                    helper="modèle contraint"
                  />
                </div>
              )}

              {preMode === "sce" && (
                <div className="form-grid two-columns">
                  <TextField
                    label="SCE du modèle contraint (SCEc)"
                    value={preFromSce.scec}
                    onChange={(value) => setPreFromSce({ ...preFromSce, scec: value })}
                    placeholder="ex. 1624,80"
                  />
                  <TextField
                    label="SCE du modèle augmenté (SCEa)"
                    value={preFromSce.scea}
                    onChange={(value) => setPreFromSce({ ...preFromSce, scea: value })}
                    placeholder="ex. 963,48"
                  />
                </div>
              )}

              <div className="note-box">
                <strong>Quand utiliser quoi ?</strong>
                <p>
                  Utilise <strong>Depuis F</strong> quand ton exercice ou ton corrigé raisonne en comparaison de modèles avec{" "}
                  <strong>F, N, PA et PC</strong>. Utilise <strong>Depuis SCE</strong> quand tu as directement les erreurs du modèle contraint et du modèle augmenté.
                </p>
              </div>
            </div>

            <div className="panel sticky">
              <ResultCard title="Résultat" text={preOutput.value} secondary={preOutput.explanation} />
              <button
                className="copy-button"
                onClick={() => copyText(`${preOutput.value}\n${preOutput.explanation}`)}
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
                  className={apaMode === "simpleRegression" ? "feature-card active-card" : "feature-card"}
                  onClick={() => setApaMode("simpleRegression")}
                >
                  <h3>Régression simple</h3>
                  <p>1 variable continue</p>
                </button>

                <button
                  className={apaMode === "noInteraction" ? "feature-card active-card" : "feature-card"}
                  onClick={() => setApaMode("noInteraction")}
                >
                  <h3>Sans interaction</h3>
                  <p>Effets principaux uniquement</p>
                </button>

                <button
                  className={apaMode === "interaction" ? "feature-card active-card" : "feature-card"}
                  onClick={() => setApaMode("interaction")}
                >
                  <h3>Interaction</h3>
                  <p>Modération / produit</p>
                </button>
              </div>

              {apaMode === "twoGroups" && (
                <div className="stack">
                  <div className="form-grid">
                    <TextField label="Nom de la VI" value={twoGroups.iv} onChange={(value) => setTwoGroups({ ...twoGroups, iv: value })} />
                    <TextField label="Nom de la VD" value={twoGroups.dv} onChange={(value) => setTwoGroups({ ...twoGroups, dv: value })} />
                    <TextField label="Nom groupe 1" value={twoGroups.group1} onChange={(value) => setTwoGroups({ ...twoGroups, group1: value })} />
                    <TextField label="Nom groupe 2" value={twoGroups.group2} onChange={(value) => setTwoGroups({ ...twoGroups, group2: value })} />
                    <TextField label="M groupe 1" value={twoGroups.m1} onChange={(value) => setTwoGroups({ ...twoGroups, m1: value })} />
                    <TextField label="ET groupe 1" value={twoGroups.sd1} onChange={(value) => setTwoGroups({ ...twoGroups, sd1: value })} />
                    <TextField label="M groupe 2" value={twoGroups.m2} onChange={(value) => setTwoGroups({ ...twoGroups, m2: value })} />
                    <TextField label="ET groupe 2" value={twoGroups.sd2} onChange={(value) => setTwoGroups({ ...twoGroups, sd2: value })} />
                    <TextField label="t" value={twoGroups.t} onChange={(value) => setTwoGroups({ ...twoGroups, t: value })} />
                    <TextField label="ddl erreur" value={twoGroups.df} onChange={(value) => setTwoGroups({ ...twoGroups, df: value })} />
                    <TextField
                      label="p (texte)"
                      value={twoGroups.p}
                      onChange={(value) => setTwoGroups({ ...twoGroups, p: value })}
                      placeholder="ex. < .001 ou .031"
                    />
                  </div>

                  <PreInput
                    title="PRE pour cet effet"
                    value={twoGroups.pre}
                    onChange={(next) => setTwoGroups({ ...twoGroups, pre: next })}
                  />
                </div>
              )}

              {apaMode === "simpleRegression" && (
                <div className="stack">
                  <div className="form-grid">
                    <TextField
                      label="Prédicteur"
                      value={simpleRegression.predictor}
                      onChange={(value) => setSimpleRegression({ ...simpleRegression, predictor: value })}
                    />
                    <TextField
                      label="Variable dépendante"
                      value={simpleRegression.outcome}
                      onChange={(value) => setSimpleRegression({ ...simpleRegression, outcome: value })}
                    />
                    <TextField
                      label="b"
                      value={simpleRegression.b}
                      onChange={(value) => setSimpleRegression({ ...simpleRegression, b: value })}
                    />
                    <TextField
                      label="t"
                      value={simpleRegression.t}
                      onChange={(value) => setSimpleRegression({ ...simpleRegression, t: value })}
                    />
                    <TextField
                      label="ddl erreur"
                      value={simpleRegression.df}
                      onChange={(value) => setSimpleRegression({ ...simpleRegression, df: value })}
                    />
                    <TextField
                      label="p (texte)"
                      value={simpleRegression.p}
                      onChange={(value) => setSimpleRegression({ ...simpleRegression, p: value })}
                      placeholder="ex. .687 ou < .001"
                    />
                    <TextField
                      label="Intercept (optionnel)"
                      value={simpleRegression.intercept}
                      onChange={(value) => setSimpleRegression({ ...simpleRegression, intercept: value })}
                    />
                  </div>

                  <PreInput
                    title="PRE pour cet effet"
                    value={simpleRegression.pre}
                    onChange={(next) => setSimpleRegression({ ...simpleRegression, pre: next })}
                  />
                </div>
              )}

              {apaMode === "noInteraction" && (
                <div className="stack">
                  <div className="mode-switch left">
                    <button
                      className={noInteractionSubtype === "mixed" ? "mode-button active" : "mode-button"}
                      onClick={() => setNoInteractionSubtype("mixed")}
                    >
                      1 catégorielle + 1 continue
                    </button>
                    <button
                      className={noInteractionSubtype === "twoContinuous" ? "mode-button active" : "mode-button"}
                      onClick={() => setNoInteractionSubtype("twoContinuous")}
                    >
                      2 continues
                    </button>
                    <button
                      className={noInteractionSubtype === "twoCategorical" ? "mode-button active" : "mode-button"}
                      onClick={() => setNoInteractionSubtype("twoCategorical")}
                    >
                      2 catégorielles
                    </button>
                  </div>

                  {noInteractionSubtype === "mixed" && (
                    <>
                      <div className="form-grid">
                        <TextField
                          label="Variable dépendante"
                          value={mainMixed.outcome}
                          onChange={(value) => setMainMixed({ ...mainMixed, outcome: value })}
                        />
                        <TextField
                          label="Prédicteur catégoriel"
                          value={mainMixed.categoricalPredictor}
                          onChange={(value) => setMainMixed({ ...mainMixed, categoricalPredictor: value })}
                        />
                        <TextField
                          label="Prédicteur continu"
                          value={mainMixed.continuousPredictor}
                          onChange={(value) => setMainMixed({ ...mainMixed, continuousPredictor: value })}
                        />
                      </div>

                      <div className="note-box">
                        <strong>Effet du prédicteur catégoriel</strong>
                        <div className="form-grid" style={{ marginTop: 12 }}>
                          <TextField label="Nom groupe 1" value={mainMixed.group1} onChange={(value) => setMainMixed({ ...mainMixed, group1: value })} />
                          <TextField label="Nom groupe 2" value={mainMixed.group2} onChange={(value) => setMainMixed({ ...mainMixed, group2: value })} />
                          <TextField label="M groupe 1" value={mainMixed.m1} onChange={(value) => setMainMixed({ ...mainMixed, m1: value })} />
                          <TextField label="ET groupe 1" value={mainMixed.sd1} onChange={(value) => setMainMixed({ ...mainMixed, sd1: value })} />
                          <TextField label="M groupe 2" value={mainMixed.m2} onChange={(value) => setMainMixed({ ...mainMixed, m2: value })} />
                          <TextField label="ET groupe 2" value={mainMixed.sd2} onChange={(value) => setMainMixed({ ...mainMixed, sd2: value })} />
                          <TextField label="t" value={mainMixed.catT} onChange={(value) => setMainMixed({ ...mainMixed, catT: value })} />
                          <TextField label="ddl erreur" value={mainMixed.catDf} onChange={(value) => setMainMixed({ ...mainMixed, catDf: value })} />
                          <TextField label="p (texte)" value={mainMixed.catP} onChange={(value) => setMainMixed({ ...mainMixed, catP: value })} />
                        </div>

                        <div style={{ marginTop: 14 }}>
                          <PreInput
                            title="PRE du prédicteur catégoriel"
                            value={mainMixed.catPre}
                            onChange={(next) => setMainMixed({ ...mainMixed, catPre: next })}
                          />
                        </div>
                      </div>

                      <div className="note-box">
                        <strong>Effet du prédicteur continu</strong>
                        <div className="form-grid" style={{ marginTop: 12 }}>
                          <TextField label="b" value={mainMixed.b} onChange={(value) => setMainMixed({ ...mainMixed, b: value })} />
                          <TextField label="t" value={mainMixed.contT} onChange={(value) => setMainMixed({ ...mainMixed, contT: value })} />
                          <TextField label="ddl erreur" value={mainMixed.contDf} onChange={(value) => setMainMixed({ ...mainMixed, contDf: value })} />
                          <TextField label="p (texte)" value={mainMixed.contP} onChange={(value) => setMainMixed({ ...mainMixed, contP: value })} />
                        </div>

                        <div style={{ marginTop: 14 }}>
                          <PreInput
                            title="PRE du prédicteur continu"
                            value={mainMixed.contPre}
                            onChange={(next) => setMainMixed({ ...mainMixed, contPre: next })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {noInteractionSubtype === "twoContinuous" && (
                    <>
                      <div className="form-grid">
                        <TextField
                          label="Variable dépendante"
                          value={mainTwoContinuous.outcome}
                          onChange={(value) => setMainTwoContinuous({ ...mainTwoContinuous, outcome: value })}
                        />
                        <TextField
                          label="Prédicteur 1"
                          value={mainTwoContinuous.predictor1}
                          onChange={(value) => setMainTwoContinuous({ ...mainTwoContinuous, predictor1: value })}
                        />
                        <TextField
                          label="Prédicteur 2"
                          value={mainTwoContinuous.predictor2}
                          onChange={(value) => setMainTwoContinuous({ ...mainTwoContinuous, predictor2: value })}
                        />
                      </div>

                      <div className="note-box">
                        <strong>Effet du prédicteur 1</strong>
                        <div className="form-grid" style={{ marginTop: 12 }}>
                          <TextField label="b1" value={mainTwoContinuous.b1} onChange={(value) => setMainTwoContinuous({ ...mainTwoContinuous, b1: value })} />
                          <TextField label="t1" value={mainTwoContinuous.t1} onChange={(value) => setMainTwoContinuous({ ...mainTwoContinuous, t1: value })} />
                          <TextField label="ddl erreur 1" value={mainTwoContinuous.df1} onChange={(value) => setMainTwoContinuous({ ...mainTwoContinuous, df1: value })} />
                          <TextField label="p1 (texte)" value={mainTwoContinuous.p1} onChange={(value) => setMainTwoContinuous({ ...mainTwoContinuous, p1: value })} />
                        </div>

                        <div style={{ marginTop: 14 }}>
                          <PreInput
                            title="PRE du prédicteur 1"
                            value={mainTwoContinuous.pre1}
                            onChange={(next) => setMainTwoContinuous({ ...mainTwoContinuous, pre1: next })}
                          />
                        </div>
                      </div>

                      <div className="note-box">
                        <strong>Effet du prédicteur 2</strong>
                        <div className="form-grid" style={{ marginTop: 12 }}>
                          <TextField label="b2" value={mainTwoContinuous.b2} onChange={(value) => setMainTwoContinuous({ ...mainTwoContinuous, b2: value })} />
                          <TextField label="t2" value={mainTwoContinuous.t2} onChange={(value) => setMainTwoContinuous({ ...mainTwoContinuous, t2: value })} />
                          <TextField label="ddl erreur 2" value={mainTwoContinuous.df2} onChange={(value) => setMainTwoContinuous({ ...mainTwoContinuous, df2: value })} />
                          <TextField label="p2 (texte)" value={mainTwoContinuous.p2} onChange={(value) => setMainTwoContinuous({ ...mainTwoContinuous, p2: value })} />
                        </div>

                        <div style={{ marginTop: 14 }}>
                          <PreInput
                            title="PRE du prédicteur 2"
                            value={mainTwoContinuous.pre2}
                            onChange={(next) => setMainTwoContinuous({ ...mainTwoContinuous, pre2: next })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {noInteractionSubtype === "twoCategorical" && (
                    <>
                      <div className="form-grid">
                        <TextField label="Variable dépendante" value={twoCategorical.outcome} onChange={(value) => setTwoCategorical({ ...twoCategorical, outcome: value })} />
                        <TextField label="Facteur A" value={twoCategorical.factorA} onChange={(value) => setTwoCategorical({ ...twoCategorical, factorA: value })} />
                        <TextField label="Facteur B" value={twoCategorical.factorB} onChange={(value) => setTwoCategorical({ ...twoCategorical, factorB: value })} />
                      </div>

                      <div className="note-box">
                        <strong>Effet principal du facteur A</strong>
                        <div className="form-grid" style={{ marginTop: 12 }}>
                          <TextField label="Niveau A1" value={twoCategorical.levelA1} onChange={(value) => setTwoCategorical({ ...twoCategorical, levelA1: value })} />
                          <TextField label="Niveau A2" value={twoCategorical.levelA2} onChange={(value) => setTwoCategorical({ ...twoCategorical, levelA2: value })} />
                          <TextField label="M A1" value={twoCategorical.meanA1} onChange={(value) => setTwoCategorical({ ...twoCategorical, meanA1: value })} />
                          <TextField label="ET A1" value={twoCategorical.sdA1} onChange={(value) => setTwoCategorical({ ...twoCategorical, sdA1: value })} />
                          <TextField label="M A2" value={twoCategorical.meanA2} onChange={(value) => setTwoCategorical({ ...twoCategorical, meanA2: value })} />
                          <TextField label="ET A2" value={twoCategorical.sdA2} onChange={(value) => setTwoCategorical({ ...twoCategorical, sdA2: value })} />
                          <TextField label="F A" value={twoCategorical.fA} onChange={(value) => setTwoCategorical({ ...twoCategorical, fA: value })} />
                          <TextField label="ddl1 A" value={twoCategorical.df1A} onChange={(value) => setTwoCategorical({ ...twoCategorical, df1A: value })} />
                          <TextField label="ddl2 A" value={twoCategorical.df2A} onChange={(value) => setTwoCategorical({ ...twoCategorical, df2A: value })} />
                          <TextField label="p A (texte)" value={twoCategorical.pA} onChange={(value) => setTwoCategorical({ ...twoCategorical, pA: value })} />
                        </div>

                        <div style={{ marginTop: 14 }}>
                          <PreInput
                            title="PRE du facteur A"
                            value={twoCategorical.preA}
                            onChange={(next) => setTwoCategorical({ ...twoCategorical, preA: next })}
                          />
                        </div>
                      </div>

                      <div className="note-box">
                        <strong>Effet principal du facteur B</strong>
                        <div className="form-grid" style={{ marginTop: 12 }}>
                          <TextField label="Niveau B1" value={twoCategorical.levelB1} onChange={(value) => setTwoCategorical({ ...twoCategorical, levelB1: value })} />
                          <TextField label="Niveau B2" value={twoCategorical.levelB2} onChange={(value) => setTwoCategorical({ ...twoCategorical, levelB2: value })} />
                          <TextField label="M B1" value={twoCategorical.meanB1} onChange={(value) => setTwoCategorical({ ...twoCategorical, meanB1: value })} />
                          <TextField label="ET B1" value={twoCategorical.sdB1} onChange={(value) => setTwoCategorical({ ...twoCategorical, sdB1: value })} />
                          <TextField label="M B2" value={twoCategorical.meanB2} onChange={(value) => setTwoCategorical({ ...twoCategorical, meanB2: value })} />
                          <TextField label="ET B2" value={twoCategorical.sdB2} onChange={(value) => setTwoCategorical({ ...twoCategorical, sdB2: value })} />
                          <TextField label="F B" value={twoCategorical.fB} onChange={(value) => setTwoCategorical({ ...twoCategorical, fB: value })} />
                          <TextField label="ddl1 B" value={twoCategorical.df1B} onChange={(value) => setTwoCategorical({ ...twoCategorical, df1B: value })} />
                          <TextField label="ddl2 B" value={twoCategorical.df2B} onChange={(value) => setTwoCategorical({ ...twoCategorical, df2B: value })} />
                          <TextField label="p B (texte)" value={twoCategorical.pB} onChange={(value) => setTwoCategorical({ ...twoCategorical, pB: value })} />
                        </div>

                        <div style={{ marginTop: 14 }}>
                          <PreInput
                            title="PRE du facteur B"
                            value={twoCategorical.preB}
                            onChange={(next) => setTwoCategorical({ ...twoCategorical, preB: next })}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {apaMode === "interaction" && (
                <div className="stack">
                  <div className="mode-switch left">
                    <button
                      className={interactionSubtype === "mixed" ? "mode-button active" : "mode-button"}
                      onClick={() => setInteractionSubtype("mixed")}
                    >
                      1 catégorielle + 1 continue
                    </button>
                    <button
                      className={interactionSubtype === "twoContinuous" ? "mode-button active" : "mode-button"}
                      onClick={() => setInteractionSubtype("twoContinuous")}
                    >
                      2 continues
                    </button>
                    <button
                      className={interactionSubtype === "twoCategorical" ? "mode-button active" : "mode-button"}
                      onClick={() => setInteractionSubtype("twoCategorical")}
                    >
                      2 catégorielles
                    </button>
                  </div>

                  {interactionSubtype === "mixed" && (
                    <>
                      <div className="form-grid">
                        <TextField label="Variable dépendante" value={interactionMixed.outcome} onChange={(value) => setInteractionMixed({ ...interactionMixed, outcome: value })} />
                        <TextField label="Prédicteur catégoriel" value={interactionMixed.categoricalPredictor} onChange={(value) => setInteractionMixed({ ...interactionMixed, categoricalPredictor: value })} />
                        <TextField label="Prédicteur continu" value={interactionMixed.continuousPredictor} onChange={(value) => setInteractionMixed({ ...interactionMixed, continuousPredictor: value })} />
                      </div>

                      <div className="note-box">
                        <strong>Effet principal du prédicteur catégoriel</strong>
                        <div className="form-grid" style={{ marginTop: 12 }}>
                          <TextField label="Nom groupe 1" value={interactionMixed.group1} onChange={(value) => setInteractionMixed({ ...interactionMixed, group1: value })} />
                          <TextField label="Nom groupe 2" value={interactionMixed.group2} onChange={(value) => setInteractionMixed({ ...interactionMixed, group2: value })} />
                          <TextField label="M groupe 1" value={interactionMixed.m1} onChange={(value) => setInteractionMixed({ ...interactionMixed, m1: value })} />
                          <TextField label="ET groupe 1" value={interactionMixed.sd1} onChange={(value) => setInteractionMixed({ ...interactionMixed, sd1: value })} />
                          <TextField label="M groupe 2" value={interactionMixed.m2} onChange={(value) => setInteractionMixed({ ...interactionMixed, m2: value })} />
                          <TextField label="ET groupe 2" value={interactionMixed.sd2} onChange={(value) => setInteractionMixed({ ...interactionMixed, sd2: value })} />
                          <TextField label="F" value={interactionMixed.catF} onChange={(value) => setInteractionMixed({ ...interactionMixed, catF: value })} />
                          <TextField label="ddl1" value={interactionMixed.catDf1} onChange={(value) => setInteractionMixed({ ...interactionMixed, catDf1: value })} />
                          <TextField label="ddl2" value={interactionMixed.catDf2} onChange={(value) => setInteractionMixed({ ...interactionMixed, catDf2: value })} />
                          <TextField label="p (texte)" value={interactionMixed.catP} onChange={(value) => setInteractionMixed({ ...interactionMixed, catP: value })} />
                        </div>
                        <div style={{ marginTop: 14 }}>
                          <PreInput
                            title="PRE de l’effet principal catégoriel"
                            value={interactionMixed.catPre}
                            onChange={(next) => setInteractionMixed({ ...interactionMixed, catPre: next })}
                          />
                        </div>
                      </div>

                      <div className="note-box">
                        <strong>Effet principal du prédicteur continu</strong>
                        <div className="form-grid" style={{ marginTop: 12 }}>
                          <TextField label="b" value={interactionMixed.b} onChange={(value) => setInteractionMixed({ ...interactionMixed, b: value })} />
                          <TextField label="t" value={interactionMixed.contT} onChange={(value) => setInteractionMixed({ ...interactionMixed, contT: value })} />
                          <TextField label="ddl erreur" value={interactionMixed.contDf} onChange={(value) => setInteractionMixed({ ...interactionMixed, contDf: value })} />
                          <TextField label="p (texte)" value={interactionMixed.contP} onChange={(value) => setInteractionMixed({ ...interactionMixed, contP: value })} />
                        </div>
                        <div style={{ marginTop: 14 }}>
                          <PreInput
                            title="PRE de l’effet principal continu"
                            value={interactionMixed.contPre}
                            onChange={(next) => setInteractionMixed({ ...interactionMixed, contPre: next })}
                          />
                        </div>
                      </div>

                      <div className="note-box">
                        <strong>Interaction</strong>
                        <div className="form-grid" style={{ marginTop: 12 }}>
                          <TextField label="F interaction" value={interactionMixed.intF} onChange={(value) => setInteractionMixed({ ...interactionMixed, intF: value })} />
                          <TextField label="ddl1 interaction" value={interactionMixed.intDf1} onChange={(value) => setInteractionMixed({ ...interactionMixed, intDf1: value })} />
                          <TextField label="ddl2 interaction" value={interactionMixed.intDf2} onChange={(value) => setInteractionMixed({ ...interactionMixed, intDf2: value })} />
                          <TextField label="p interaction (texte)" value={interactionMixed.intP} onChange={(value) => setInteractionMixed({ ...interactionMixed, intP: value })} />
                        </div>
                        <div style={{ marginTop: 14 }}>
                          <PreInput
                            title="PRE de l’interaction"
                            value={interactionMixed.intPre}
                            onChange={(next) => setInteractionMixed({ ...interactionMixed, intPre: next })}
                          />
                        </div>
                        <div className="note-box">
  <strong>Pentes simples (effets simples) (optionnel)</strong>

  <div className="mode-switch left" style={{ marginTop: 12 }}>
    <button
      className={mixedSimpleSlopesEnabled ? "mode-button active" : "mode-button"}
      onClick={() => setMixedSimpleSlopesEnabled(true)}
      type="button"
    >
      Ajouter les pentes simples
    </button>
    <button
      className={!mixedSimpleSlopesEnabled ? "mode-button active" : "mode-button"}
      onClick={() => setMixedSimpleSlopesEnabled(false)}
      type="button"
    >
      Ne pas ajouter
    </button>
  </div>

  {!interactionMixedIsSignificant ? (
    <p className="field-helper" style={{ marginTop: 10 }}>
      Ajoute les pentes simples seulement si l’interaction est significative.
    </p>
  ) : null}

  {mixedSimpleSlopesEnabled && interactionMixedIsSignificant && (
    <>
      <div className="mini-note" style={{ marginTop: 12 }}>
        Tu testes la pente de {interactionMixed.continuousPredictor} séparément pour {interactionMixed.group1} puis pour {interactionMixed.group2}.
      </div>

      <div className="note-box" style={{ marginTop: 14 }}>
        <strong>Pente simple — {interactionMixed.group1}</strong>

        <div className="form-grid" style={{ marginTop: 12 }}>
          <TextField
            label="b"
            value={mixedSimpleSlopes.b1}
            onChange={(value) => setMixedSimpleSlopes({ ...mixedSimpleSlopes, b1: value })}
          />
          <TextField
            label="t"
            value={mixedSimpleSlopes.t1}
            onChange={(value) => setMixedSimpleSlopes({ ...mixedSimpleSlopes, t1: value })}
          />
          <TextField
            label="ddl erreur"
            value={mixedSimpleSlopes.df1}
            onChange={(value) => setMixedSimpleSlopes({ ...mixedSimpleSlopes, df1: value })}
          />
          <TextField
            label="p (texte)"
            value={mixedSimpleSlopes.p1}
            onChange={(value) => setMixedSimpleSlopes({ ...mixedSimpleSlopes, p1: value })}
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <PreInput
            title={`PRE de la pente simple pour ${interactionMixed.group1}`}
            value={mixedSimpleSlopes.pre1}
            onChange={(next) => setMixedSimpleSlopes({ ...mixedSimpleSlopes, pre1: next })}
          />
        </div>
      </div>

      <div className="note-box" style={{ marginTop: 14 }}>
        <strong>Pente simple — {interactionMixed.group2}</strong>

        <div className="form-grid" style={{ marginTop: 12 }}>
          <TextField
            label="b"
            value={mixedSimpleSlopes.b2}
            onChange={(value) => setMixedSimpleSlopes({ ...mixedSimpleSlopes, b2: value })}
          />
          <TextField
            label="t"
            value={mixedSimpleSlopes.t2}
            onChange={(value) => setMixedSimpleSlopes({ ...mixedSimpleSlopes, t2: value })}
          />
          <TextField
            label="ddl erreur"
            value={mixedSimpleSlopes.df2}
            onChange={(value) => setMixedSimpleSlopes({ ...mixedSimpleSlopes, df2: value })}
          />
          <TextField
            label="p (texte)"
            value={mixedSimpleSlopes.p2}
            onChange={(value) => setMixedSimpleSlopes({ ...mixedSimpleSlopes, p2: value })}
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <PreInput
            title={`PRE de la pente simple pour ${interactionMixed.group2}`}
            value={mixedSimpleSlopes.pre2}
            onChange={(next) => setMixedSimpleSlopes({ ...mixedSimpleSlopes, pre2: next })}
          />
        </div>
      </div>
    </>
  )}
</div>
                      </div>
                    </>
                  )}

                  {interactionSubtype === "twoContinuous" && (
                    <>
                      <div className="form-grid">
                        <TextField label="Variable dépendante" value={interactionTwoContinuous.outcome} onChange={(value) => setInteractionTwoContinuous({ ...interactionTwoContinuous, outcome: value })} />
                        <TextField label="Prédicteur 1" value={interactionTwoContinuous.predictor1} onChange={(value) => setInteractionTwoContinuous({ ...interactionTwoContinuous, predictor1: value })} />
                        <TextField label="Prédicteur 2" value={interactionTwoContinuous.predictor2} onChange={(value) => setInteractionTwoContinuous({ ...interactionTwoContinuous, predictor2: value })} />
                      </div>

                      <div className="note-box">
                        <strong>Effet principal du prédicteur 1</strong>
                        <div className="form-grid" style={{ marginTop: 12 }}>
                          <TextField label="b1" value={interactionTwoContinuous.b1} onChange={(value) => setInteractionTwoContinuous({ ...interactionTwoContinuous, b1: value })} />
                          <TextField label="t1" value={interactionTwoContinuous.t1} onChange={(value) => setInteractionTwoContinuous({ ...interactionTwoContinuous, t1: value })} />
                          <TextField label="ddl erreur 1" value={interactionTwoContinuous.df1} onChange={(value) => setInteractionTwoContinuous({ ...interactionTwoContinuous, df1: value })} />
                          <TextField label="p1 (texte)" value={interactionTwoContinuous.p1} onChange={(value) => setInteractionTwoContinuous({ ...interactionTwoContinuous, p1: value })} />
                        </div>
                        <div style={{ marginTop: 14 }}>
                          <PreInput
                            title="PRE du prédicteur 1"
                            value={interactionTwoContinuous.pre1}
                            onChange={(next) => setInteractionTwoContinuous({ ...interactionTwoContinuous, pre1: next })}
                          />
                        </div>
                      </div>

                      <div className="note-box">
                        <strong>Effet principal du prédicteur 2</strong>
                        <div className="form-grid" style={{ marginTop: 12 }}>
                          <TextField label="b2" value={interactionTwoContinuous.b2} onChange={(value) => setInteractionTwoContinuous({ ...interactionTwoContinuous, b2: value })} />
                          <TextField label="t2" value={interactionTwoContinuous.t2} onChange={(value) => setInteractionTwoContinuous({ ...interactionTwoContinuous, t2: value })} />
                          <TextField label="ddl erreur 2" value={interactionTwoContinuous.df2} onChange={(value) => setInteractionTwoContinuous({ ...interactionTwoContinuous, df2: value })} />
                          <TextField label="p2 (texte)" value={interactionTwoContinuous.p2} onChange={(value) => setInteractionTwoContinuous({ ...interactionTwoContinuous, p2: value })} />
                        </div>
                        <div style={{ marginTop: 14 }}>
                          <PreInput
                            title="PRE du prédicteur 2"
                            value={interactionTwoContinuous.pre2}
                            onChange={(next) => setInteractionTwoContinuous({ ...interactionTwoContinuous, pre2: next })}
                          />
                        </div>
                      </div>

                      <div className="note-box">
                        <strong>Interaction</strong>
                        <div className="form-grid" style={{ marginTop: 12 }}>
                          <TextField label="b interaction" value={interactionTwoContinuous.bInt} onChange={(value) => setInteractionTwoContinuous({ ...interactionTwoContinuous, bInt: value })} />
                          <TextField label="t interaction" value={interactionTwoContinuous.tInt} onChange={(value) => setInteractionTwoContinuous({ ...interactionTwoContinuous, tInt: value })} />
                          <TextField label="ddl erreur interaction" value={interactionTwoContinuous.dfInt} onChange={(value) => setInteractionTwoContinuous({ ...interactionTwoContinuous, dfInt: value })} />
                          <TextField label="p interaction (texte)" value={interactionTwoContinuous.pInt} onChange={(value) => setInteractionTwoContinuous({ ...interactionTwoContinuous, pInt: value })} />
                        </div>
                        <div style={{ marginTop: 14 }}>
                          <PreInput
                            title="PRE de l’interaction"
                            value={interactionTwoContinuous.preInt}
                            onChange={(next) => setInteractionTwoContinuous({ ...interactionTwoContinuous, preInt: next })}
                          />
                        </div>

                        <div className="note-box">
  <strong>Pentes simples (Effets simples) (optionnel)</strong>

  <div className="mode-switch left" style={{ marginTop: 12 }}>
    <button
      className={twoContinuousSimpleSlopesEnabled ? "mode-button active" : "mode-button"}
      onClick={() => setTwoContinuousSimpleSlopesEnabled(true)}
      type="button"
    >
      Ajouter les pentes simples
    </button>
    <button
      className={!twoContinuousSimpleSlopesEnabled ? "mode-button active" : "mode-button"}
      onClick={() => setTwoContinuousSimpleSlopesEnabled(false)}
      type="button"
    >
      Ne pas ajouter
    </button>
  </div>

  {!interactionTwoContinuousIsSignificant ? (
    <p className="field-helper" style={{ marginTop: 10 }}>
      Ajoute les pentes simples seulement si l’interaction est significative.
    </p>
  ) : null}

  {twoContinuousSimpleSlopesEnabled && interactionTwoContinuousIsSignificant && (
    <>
      <div className="mini-note" style={{ marginTop: 12 }}>
        Tu testes la pente de {interactionTwoContinuous.predictor1} à deux niveaux de {interactionTwoContinuous.predictor2}. Si tu veux l’inverse, échange les noms des prédicteurs.
      </div>

      <div className="note-box" style={{ marginTop: 14 }}>
        <strong>Pente simple 1</strong>

        <div className="form-grid" style={{ marginTop: 12 }}>
          <TextField
            label={`Niveau de ${interactionTwoContinuous.predictor2}`}
            value={twoContinuousSimpleSlopes.level1Label}
            onChange={(value) => setTwoContinuousSimpleSlopes({ ...twoContinuousSimpleSlopes, level1Label: value })}
          />
          <TextField
            label="b"
            value={twoContinuousSimpleSlopes.b1}
            onChange={(value) => setTwoContinuousSimpleSlopes({ ...twoContinuousSimpleSlopes, b1: value })}
          />
          <TextField
            label="t"
            value={twoContinuousSimpleSlopes.t1}
            onChange={(value) => setTwoContinuousSimpleSlopes({ ...twoContinuousSimpleSlopes, t1: value })}
          />
          <TextField
            label="ddl erreur"
            value={twoContinuousSimpleSlopes.df1}
            onChange={(value) => setTwoContinuousSimpleSlopes({ ...twoContinuousSimpleSlopes, df1: value })}
          />
          <TextField
            label="p (texte)"
            value={twoContinuousSimpleSlopes.p1}
            onChange={(value) => setTwoContinuousSimpleSlopes({ ...twoContinuousSimpleSlopes, p1: value })}
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <PreInput
            title="PRE de la pente simple 1"
            value={twoContinuousSimpleSlopes.pre1}
            onChange={(next) => setTwoContinuousSimpleSlopes({ ...twoContinuousSimpleSlopes, pre1: next })}
          />
        </div>
      </div>

      <div className="note-box" style={{ marginTop: 14 }}>
        <strong>Pente simple 2</strong>

        <div className="form-grid" style={{ marginTop: 12 }}>
          <TextField
            label={`Niveau de ${interactionTwoContinuous.predictor2}`}
            value={twoContinuousSimpleSlopes.level2Label}
            onChange={(value) => setTwoContinuousSimpleSlopes({ ...twoContinuousSimpleSlopes, level2Label: value })}
          />
          <TextField
            label="b"
            value={twoContinuousSimpleSlopes.b2}
            onChange={(value) => setTwoContinuousSimpleSlopes({ ...twoContinuousSimpleSlopes, b2: value })}
          />
          <TextField
            label="t"
            value={twoContinuousSimpleSlopes.t2}
            onChange={(value) => setTwoContinuousSimpleSlopes({ ...twoContinuousSimpleSlopes, t2: value })}
          />
          <TextField
            label="ddl erreur"
            value={twoContinuousSimpleSlopes.df2}
            onChange={(value) => setTwoContinuousSimpleSlopes({ ...twoContinuousSimpleSlopes, df2: value })}
          />
          <TextField
            label="p (texte)"
            value={twoContinuousSimpleSlopes.p2}
            onChange={(value) => setTwoContinuousSimpleSlopes({ ...twoContinuousSimpleSlopes, p2: value })}
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <PreInput
            title="PRE de la pente simple 2"
            value={twoContinuousSimpleSlopes.pre2}
            onChange={(next) => setTwoContinuousSimpleSlopes({ ...twoContinuousSimpleSlopes, pre2: next })}
          />
        </div>
      </div>
    </>
  )}
</div>
                      </div>
                    </>
                  )}

                  {interactionSubtype === "twoCategorical" && (
                    <>
                      <div className="form-grid">
                        <TextField label="Variable dépendante" value={twoCategorical.outcome} onChange={(value) => setTwoCategorical({ ...twoCategorical, outcome: value })} />
                        <TextField label="Facteur A" value={twoCategorical.factorA} onChange={(value) => setTwoCategorical({ ...twoCategorical, factorA: value })} />
                        <TextField label="Facteur B" value={twoCategorical.factorB} onChange={(value) => setTwoCategorical({ ...twoCategorical, factorB: value })} />
                      </div>

                      <div className="note-box">
                        <strong>Effet principal du facteur A</strong>
                        <div className="form-grid" style={{ marginTop: 12 }}>
                          <TextField label="Niveau A1" value={twoCategorical.levelA1} onChange={(value) => setTwoCategorical({ ...twoCategorical, levelA1: value })} />
                          <TextField label="Niveau A2" value={twoCategorical.levelA2} onChange={(value) => setTwoCategorical({ ...twoCategorical, levelA2: value })} />
                          <TextField label="M A1" value={twoCategorical.meanA1} onChange={(value) => setTwoCategorical({ ...twoCategorical, meanA1: value })} />
                          <TextField label="ET A1" value={twoCategorical.sdA1} onChange={(value) => setTwoCategorical({ ...twoCategorical, sdA1: value })} />
                          <TextField label="M A2" value={twoCategorical.meanA2} onChange={(value) => setTwoCategorical({ ...twoCategorical, meanA2: value })} />
                          <TextField label="ET A2" value={twoCategorical.sdA2} onChange={(value) => setTwoCategorical({ ...twoCategorical, sdA2: value })} />
                          <TextField label="F A" value={twoCategorical.fA} onChange={(value) => setTwoCategorical({ ...twoCategorical, fA: value })} />
                          <TextField label="ddl1 A" value={twoCategorical.df1A} onChange={(value) => setTwoCategorical({ ...twoCategorical, df1A: value })} />
                          <TextField label="ddl2 A" value={twoCategorical.df2A} onChange={(value) => setTwoCategorical({ ...twoCategorical, df2A: value })} />
                          <TextField label="p A (texte)" value={twoCategorical.pA} onChange={(value) => setTwoCategorical({ ...twoCategorical, pA: value })} />
                        </div>
                        <div style={{ marginTop: 14 }}>
                          <PreInput
                            title="PRE du facteur A"
                            value={twoCategorical.preA}
                            onChange={(next) => setTwoCategorical({ ...twoCategorical, preA: next })}
                          />
                        </div>
                      </div>

                      <div className="note-box">
                        <strong>Effet principal du facteur B</strong>
                        <div className="form-grid" style={{ marginTop: 12 }}>
                          <TextField label="Niveau B1" value={twoCategorical.levelB1} onChange={(value) => setTwoCategorical({ ...twoCategorical, levelB1: value })} />
                          <TextField label="Niveau B2" value={twoCategorical.levelB2} onChange={(value) => setTwoCategorical({ ...twoCategorical, levelB2: value })} />
                          <TextField label="M B1" value={twoCategorical.meanB1} onChange={(value) => setTwoCategorical({ ...twoCategorical, meanB1: value })} />
                          <TextField label="ET B1" value={twoCategorical.sdB1} onChange={(value) => setTwoCategorical({ ...twoCategorical, sdB1: value })} />
                          <TextField label="M B2" value={twoCategorical.meanB2} onChange={(value) => setTwoCategorical({ ...twoCategorical, meanB2: value })} />
                          <TextField label="ET B2" value={twoCategorical.sdB2} onChange={(value) => setTwoCategorical({ ...twoCategorical, sdB2: value })} />
                          <TextField label="F B" value={twoCategorical.fB} onChange={(value) => setTwoCategorical({ ...twoCategorical, fB: value })} />
                          <TextField label="ddl1 B" value={twoCategorical.df1B} onChange={(value) => setTwoCategorical({ ...twoCategorical, df1B: value })} />
                          <TextField label="ddl2 B" value={twoCategorical.df2B} onChange={(value) => setTwoCategorical({ ...twoCategorical, df2B: value })} />
                          <TextField label="p B (texte)" value={twoCategorical.pB} onChange={(value) => setTwoCategorical({ ...twoCategorical, pB: value })} />
                        </div>
                        <div style={{ marginTop: 14 }}>
                          <PreInput
                            title="PRE du facteur B"
                            value={twoCategorical.preB}
                            onChange={(next) => setTwoCategorical({ ...twoCategorical, preB: next })}
                          />
                        </div>
                      </div>

                      <div className="note-box">
                        <strong>Interaction</strong>
                        
                        <div className="form-grid" style={{ marginTop: 12 }}>
                          <TextField label="F interaction" value={twoCategorical.fInt} onChange={(value) => setTwoCategorical({ ...twoCategorical, fInt: value })} />
                          <TextField label="ddl1 interaction" value={twoCategorical.df1Int} onChange={(value) => setTwoCategorical({ ...twoCategorical, df1Int: value })} />
                          <TextField label="ddl2 interaction" value={twoCategorical.df2Int} onChange={(value) => setTwoCategorical({ ...twoCategorical, df2Int: value })} />
                          <TextField label="p interaction (texte)" value={twoCategorical.pInt} onChange={(value) => setTwoCategorical({ ...twoCategorical, pInt: value })} />
                        </div>
                        <div style={{ marginTop: 14 }}>
                          <PreInput
                            title="PRE de l’interaction"
                            value={twoCategorical.preInt}
                            onChange={(next) => setTwoCategorical({ ...twoCategorical, preInt: next })}
                          />
                        </div>
                        <div className="note-box">
  <strong>Effets simples (optionnel)</strong>

  <div className="mode-switch left" style={{ marginTop: 12 }}>
    <button
      className={simpleEffectsEnabled ? "mode-button active" : "mode-button"}
      onClick={() => setSimpleEffectsEnabled(true)}
      type="button"
    >
      Ajouter les effets simples
    </button>
    <button
      className={!simpleEffectsEnabled ? "mode-button active" : "mode-button"}
      onClick={() => setSimpleEffectsEnabled(false)}
      type="button"
    >
      Ne pas ajouter
    </button>
  </div>

  {!interactionTwoCategoricalIsSignificant ? (
    <p className="field-helper" style={{ marginTop: 10 }}>
      Ajoute les effets simples seulement si l’interaction est significative.
    </p>
  ) : null}

  {simpleEffectsEnabled && interactionTwoCategoricalIsSignificant && (
    <>
      <div className="mode-switch left" style={{ marginTop: 14 }}>
        <button
          className={simpleEffectsFamily === "AwithinB" ? "mode-button active" : "mode-button"}
          onClick={() => setSimpleEffectsFamily("AwithinB")}
          type="button"
        >
          Effet de {twoCategorical.factorA} dans chaque niveau de {twoCategorical.factorB}
        </button>
        <button
          className={simpleEffectsFamily === "BwithinA" ? "mode-button active" : "mode-button"}
          onClick={() => setSimpleEffectsFamily("BwithinA")}
          type="button"
        >
          Effet de {twoCategorical.factorB} dans chaque niveau de {twoCategorical.factorA}
        </button>
      </div>

      <div className="mini-note" style={{ marginTop: 12 }}>
        {simpleEffectsFamily === "AwithinB"
          ? `Tu compares ${twoCategorical.levelA1} vs ${twoCategorical.levelA2} pour ${twoCategorical.levelB1}, puis pour ${twoCategorical.levelB2}.`
          : `Tu compares ${twoCategorical.levelB1} vs ${twoCategorical.levelB2} pour ${twoCategorical.levelA1}, puis pour ${twoCategorical.levelA2}.`}
      </div>

      <div className="note-box" style={{ marginTop: 14 }}>
        <strong>
          Effet simple 1 — {simpleEffectsFamily === "AwithinB"
            ? `${twoCategorical.factorA} dans ${twoCategorical.levelB1}`
            : `${twoCategorical.factorB} dans ${twoCategorical.levelA1}`}
        </strong>

        <div className="form-grid" style={{ marginTop: 12 }}>
          <TextField
            label={`M ${simpleEffectsFamily === "AwithinB" ? twoCategorical.levelA1 : twoCategorical.levelB1}`}
            value={simpleEffects.s1m1}
            onChange={(value) => setSimpleEffects({ ...simpleEffects, s1m1: value })}
          />
          <TextField
            label={`ET ${simpleEffectsFamily === "AwithinB" ? twoCategorical.levelA1 : twoCategorical.levelB1}`}
            value={simpleEffects.s1sd1}
            onChange={(value) => setSimpleEffects({ ...simpleEffects, s1sd1: value })}
          />
          <TextField
            label={`M ${simpleEffectsFamily === "AwithinB" ? twoCategorical.levelA2 : twoCategorical.levelB2}`}
            value={simpleEffects.s1m2}
            onChange={(value) => setSimpleEffects({ ...simpleEffects, s1m2: value })}
          />
          <TextField
            label={`ET ${simpleEffectsFamily === "AwithinB" ? twoCategorical.levelA2 : twoCategorical.levelB2}`}
            value={simpleEffects.s1sd2}
            onChange={(value) => setSimpleEffects({ ...simpleEffects, s1sd2: value })}
          />
          <TextField
            label="t"
            value={simpleEffects.s1t}
            onChange={(value) => setSimpleEffects({ ...simpleEffects, s1t: value })}
          />
          <TextField
            label="ddl erreur"
            value={simpleEffects.s1df}
            onChange={(value) => setSimpleEffects({ ...simpleEffects, s1df: value })}
          />
          <TextField
            label="p (texte)"
            value={simpleEffects.s1p}
            onChange={(value) => setSimpleEffects({ ...simpleEffects, s1p: value })}
            placeholder="ex. .051 ou 1"
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <PreInput
            title="PRE de l’effet simple 1"
            value={simpleEffects.s1pre}
            onChange={(next) => setSimpleEffects({ ...simpleEffects, s1pre: next })}
          />
        </div>
      </div>

      <div className="note-box" style={{ marginTop: 14 }}>
        <strong>
          Effet simple 2 — {simpleEffectsFamily === "AwithinB"
            ? `${twoCategorical.factorA} dans ${twoCategorical.levelB2}`
            : `${twoCategorical.factorB} dans ${twoCategorical.levelA2}`}
        </strong>

        <div className="form-grid" style={{ marginTop: 12 }}>
          <TextField
            label={`M ${simpleEffectsFamily === "AwithinB" ? twoCategorical.levelA1 : twoCategorical.levelB1}`}
            value={simpleEffects.s2m1}
            onChange={(value) => setSimpleEffects({ ...simpleEffects, s2m1: value })}
          />
          <TextField
            label={`ET ${simpleEffectsFamily === "AwithinB" ? twoCategorical.levelA1 : twoCategorical.levelB1}`}
            value={simpleEffects.s2sd1}
            onChange={(value) => setSimpleEffects({ ...simpleEffects, s2sd1: value })}
          />
          <TextField
            label={`M ${simpleEffectsFamily === "AwithinB" ? twoCategorical.levelA2 : twoCategorical.levelB2}`}
            value={simpleEffects.s2m2}
            onChange={(value) => setSimpleEffects({ ...simpleEffects, s2m2: value })}
          />
          <TextField
            label={`ET ${simpleEffectsFamily === "AwithinB" ? twoCategorical.levelA2 : twoCategorical.levelB2}`}
            value={simpleEffects.s2sd2}
            onChange={(value) => setSimpleEffects({ ...simpleEffects, s2sd2: value })}
          />
          <TextField
            label="t"
            value={simpleEffects.s2t}
            onChange={(value) => setSimpleEffects({ ...simpleEffects, s2t: value })}
          />
          <TextField
            label="ddl erreur"
            value={simpleEffects.s2df}
            onChange={(value) => setSimpleEffects({ ...simpleEffects, s2df: value })}
          />
          <TextField
            label="p (texte)"
            value={simpleEffects.s2p}
            onChange={(value) => setSimpleEffects({ ...simpleEffects, s2p: value })}
            placeholder="ex. .959 ou < .001"
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <PreInput
            title="PRE de l’effet simple 2"
            value={simpleEffects.s2pre}
            onChange={(next) => setSimpleEffects({ ...simpleEffects, s2pre: next })}
          />
        </div>
      </div>
    </>
  )}
</div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="panel sticky">
              <ResultCard title="Phrase prête à copier" text={currentApaText} secondary={currentApaSecondary} />
              <button
                className="copy-button"
                onClick={() => copyText(`${currentApaText}\n${currentApaSecondary}`)}
                disabled={!currentApaText}
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
                      className={openExplain === item.id ? "accordion-button active" : "accordion-button"}
                      onClick={() => setOpenExplain(openExplain === item.id ? "" : item.id)}
                    >
                      <span>{item.title}</span>
                      <span>{openExplain === item.id ? "−" : "+"}</span>
                    </button>
                    {openExplain === item.id && <div className="accordion-content">{item.content}</div>}
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