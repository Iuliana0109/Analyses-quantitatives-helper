import { useMemo, useState } from "react";
import "./App.css";

type Tab = "home" | "pre" | "apa" | "explain";
type PreMode = "f" | "sce";
type ApaMode = "twoGroups" | "continuous" | "multiple" | "interaction";
type InteractionStat = "F" | "t";

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

function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [preMode, setPreMode] = useState<PreMode>("f");
  const [apaMode, setApaMode] = useState<ApaMode>("twoGroups");
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
    pre: "",
  });

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

  const [interaction, setInteraction] = useState({
    predictor1: "X",
    predictor2: "Z",
    outcome: "Y",
    statType: "F" as InteractionStat,
    stat: "",
    df1: "",
    df2: "",
    df: "",
    p: "",
    pre: "",
  });

  const preOutput = useMemo(() => {
    if (preMode === "f") {
      if (!hasNumber(preFromF.f) || !hasNumber(preFromF.n) || !hasNumber(preFromF.pa) || !hasNumber(preFromF.pc)) {
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
    const needed = [twoGroups.m1, twoGroups.sd1, twoGroups.m2, twoGroups.sd2, twoGroups.t, twoGroups.df, twoGroups.p, twoGroups.pre];
    if (!needed.every(hasNumber)) return "";

    const m1 = parseValue(twoGroups.m1);
    const sd1 = parseValue(twoGroups.sd1);
    const m2 = parseValue(twoGroups.m2);
    const sd2 = parseValue(twoGroups.sd2);
    const t = parseValue(twoGroups.t);
    const df = parseValue(twoGroups.df);
    const p = parseValue(twoGroups.p);
    const pre = parseValue(twoGroups.pre);

    const sig = p < 0.05;
    const descriptive =
      m1 > m2
        ? `${twoGroups.group1} (M = ${formatValue(m1, 2)}, ET = ${formatValue(sd1, 2)}) présente un score plus élevé que ${twoGroups.group2} (M = ${formatValue(m2, 2)}, ET = ${formatValue(sd2, 2)}).`
        : `${twoGroups.group2} (M = ${formatValue(m2, 2)}, ET = ${formatValue(sd2, 2)}) présente un score plus élevé que ${twoGroups.group1} (M = ${formatValue(m1, 2)}, ET = ${formatValue(sd1, 2)}).`;

    if (sig) {
      return `On observe un effet significatif de ${twoGroups.iv} sur ${twoGroups.dv}, t(${formatValue(
        df,
        0
      )}) = ${formatValue(t, 2)}, ${formatP(p)}, PRE = ${formatPre(pre)}. ${descriptive}`;
    }

    return `L’effet de ${twoGroups.iv} sur ${twoGroups.dv} n’est pas significatif, t(${formatValue(
      df,
      0
    )}) = ${formatValue(t, 2)}, ${formatP(p)}, PRE = ${formatPre(pre)}. Au niveau descriptif, ${descriptive.toLowerCase()}`;
  }, [twoGroups]);

  const continuousApa = useMemo(() => {
    const needed = [continuous.b, continuous.t, continuous.df, continuous.p, continuous.pre];
    if (!needed.every(hasNumber)) return "";

    const b = parseValue(continuous.b);
    const t = parseValue(continuous.t);
    const df = parseValue(continuous.df);
    const p = parseValue(continuous.p);
    const pre = parseValue(continuous.pre);

    const sig = p < 0.05;

    if (sig) {
      return `${continuous.predictor} prédit significativement ${continuous.outcome}, b = ${formatValue(
        b,
        3
      )}, t(${formatValue(df, 0)}) = ${formatValue(t, 2)}, ${formatP(p)}, PRE = ${formatPre(pre)}.`;
    }

    return `${continuous.predictor} ne prédit pas significativement ${continuous.outcome}, b = ${formatValue(
      b,
      3
    )}, t(${formatValue(df, 0)}) = ${formatValue(t, 2)}, ${formatP(p)}, PRE = ${formatPre(pre)}.`;
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

const multipleApa = useMemo(() => {
  const needed = [
    multiple.m1,
    multiple.sd1,
    multiple.m2,
    multiple.sd2,
    multiple.catT,
    multiple.catDf,
    multiple.catP,
    multiple.catPre,
    multiple.b,
    multiple.contT,
    multiple.contDf,
    multiple.contP,
    multiple.contPre,
  ];

  if (!needed.every(hasNumber)) return "";

  const m1 = parseValue(multiple.m1);
  const sd1 = parseValue(multiple.sd1);
  const m2 = parseValue(multiple.m2);
  const sd2 = parseValue(multiple.sd2);

  const catT = parseValue(multiple.catT);
  const catDf = parseValue(multiple.catDf);
  const catP = parseValue(multiple.catP);
  const catPre = parseValue(multiple.catPre);

  const b = parseValue(multiple.b);
  const contT = parseValue(multiple.contT);
  const contDf = parseValue(multiple.contDf);
  const contP = parseValue(multiple.contP);
  const contPre = parseValue(multiple.contPre);

  const group1Higher = m1 > m2;

  const higherGroup = group1Higher ? multiple.group1 : multiple.group2;
  const lowerGroup = group1Higher ? multiple.group2 : multiple.group1;
  const higherMean = group1Higher ? m1 : m2;
  const lowerMean = group1Higher ? m2 : m1;
  const higherSd = group1Higher ? sd1 : sd2;
  const lowerSd = group1Higher ? sd2 : sd1;

  const categoricalSentence =
    catP < 0.05
      ? `Indépendamment de ${multiple.continuousPredictor}, les ${higherGroup} (M = ${formatValue(
          higherMean,
          2
        )}, ET = ${formatValue(higherSd, 2)}) présentent un score plus élevé sur ${multiple.outcome} que les ${lowerGroup} (M = ${formatValue(
          lowerMean,
          2
        )}, ET = ${formatValue(lowerSd, 2)}). Cette différence est significative, t(${formatValue(
          catDf,
          0
        )}) = ${formatValue(catT, 2)}, ${formatP(catP)}, PRE = ${formatPre(catPre)}.`
      : `Indépendamment de ${multiple.continuousPredictor}, l’effet de ${multiple.categoricalPredictor} sur ${multiple.outcome} n’est pas significatif, t(${formatValue(
          catDf,
          0
        )}) = ${formatValue(catT, 2)}, ${formatP(catP)}, PRE = ${formatPre(
          catPre
        )}. Au niveau descriptif, les ${higherGroup} (M = ${formatValue(
          higherMean,
          2
        )}, ET = ${formatValue(higherSd, 2)}) présentent un score plus élevé que les ${lowerGroup} (M = ${formatValue(
          lowerMean,
          2
        )}, ET = ${formatValue(lowerSd, 2)}).`;

  const continuousSentence =
    contP < 0.05
      ? `Indépendamment de ${multiple.categoricalPredictor}, ${multiple.continuousPredictor} prédit significativement ${multiple.outcome}, b = ${formatValue(
          b,
          3
        )}, t(${formatValue(contDf, 0)}) = ${formatValue(contT, 2)}, ${formatP(
          contP
        )}, PRE = ${formatPre(contPre)}.`
      : `Indépendamment de ${multiple.categoricalPredictor}, ${multiple.continuousPredictor} ne prédit pas significativement ${multiple.outcome}, b = ${formatValue(
          b,
          3
        )}, t(${formatValue(contDf, 0)}) = ${formatValue(contT, 2)}, ${formatP(
          contP
        )}, PRE = ${formatPre(contPre)}.`;

  return `${categoricalSentence} ${continuousSentence}`;
}, [multiple]);

const multipleExplain = useMemo(() => {
  const needed = [
    multiple.m1,
    multiple.m2,
    multiple.catP,
    multiple.b,
    multiple.contP,
  ];

  if (!needed.every(hasNumber)) return "";

  const m1 = parseValue(multiple.m1);
  const m2 = parseValue(multiple.m2);
  const catP = parseValue(multiple.catP);
  const b = parseValue(multiple.b);
  const contP = parseValue(multiple.contP);

  const higherGroup = m1 > m2 ? multiple.group1 : multiple.group2;

  const simpleCat =
    catP < 0.05
      ? `À ${multiple.continuousPredictor} égal, les ${higherGroup} ont le score le plus élevé sur ${multiple.outcome}.`
      : `À ${multiple.continuousPredictor} égal, la différence liée à ${multiple.categoricalPredictor} n’est pas significative.`;

  const simpleCont =
    contP < 0.05
      ? b >= 0
        ? `À ${multiple.categoricalPredictor} égal, plus ${multiple.continuousPredictor} augmente, plus ${multiple.outcome} augmente.`
        : `À ${multiple.categoricalPredictor} égal, plus ${multiple.continuousPredictor} augmente, plus ${multiple.outcome} diminue.`
      : `À ${multiple.categoricalPredictor} égal, ${multiple.continuousPredictor} ne prédit pas significativement ${multiple.outcome}.`;

  return `${simpleCat} ${simpleCont}`;
}, [multiple]);

  const interactionApa = useMemo(() => {
    if (!hasNumber(interaction.stat) || !hasNumber(interaction.p) || !hasNumber(interaction.pre)) return "";

    const stat = parseValue(interaction.stat);
    const p = parseValue(interaction.p);
    const pre = parseValue(interaction.pre);
    const sig = p < 0.05;

    if (interaction.statType === "F") {
      if (!hasNumber(interaction.df1) || !hasNumber(interaction.df2)) return "";
      const df1 = parseValue(interaction.df1);
      const df2 = parseValue(interaction.df2);

      return `${sig ? "L’interaction" : "L’interaction"} entre ${interaction.predictor1} et ${interaction.predictor2} sur ${
        interaction.outcome
      } ${sig ? "est significative" : "n’est pas significative"}, F(${formatValue(df1, 0)}, ${formatValue(
        df2,
        0
      )}) = ${formatValue(stat, 2)}, ${formatP(p)}, PRE = ${formatPre(pre)}. ${
        sig ? "Reporte ensuite les effets principaux et appuie-toi sur le graphique / les effets simples pour interpréter le motif." : ""
      }`;
    }

    if (!hasNumber(interaction.df)) return "";
    const df = parseValue(interaction.df);

    return `${sig ? "L’interaction" : "L’interaction"} entre ${interaction.predictor1} et ${interaction.predictor2} sur ${
      interaction.outcome
    } ${sig ? "est significative" : "n’est pas significative"}, t(${formatValue(df, 0)}) = ${formatValue(
      stat,
      2
    )}, ${formatP(p)}, PRE = ${formatPre(pre)}. ${
      sig ? "Reporte ensuite les effets principaux et appuie-toi sur le graphique / les effets simples pour interpréter le motif." : ""
    }`;
  }, [interaction]);

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
        <button className={tab === "pre" ? "nav-button active" : "nav-button"} onClick={() => setTab("pre")}>
          PRE
        </button>
        <button className={tab === "apa" ? "nav-button active" : "nav-button"} onClick={() => setTab("apa")}>
          APA
        </button>
        <button className={tab === "explain" ? "nav-button active" : "nav-button"} onClick={() => setTab("explain")}>
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
                  <p>Obtiens une phrase propre en français à partir des valeurs Jamovi.</p>
                </button>

                <button className="feature-card" onClick={() => setTab("explain")}>
                  <h3>Comprendre les résultats</h3>
                  <p>Intercept, pente, codage, centrage, interaction et quoi copier depuis Jamovi.</p>
                </button>
              </div>
            </div>

            <div className="panel">
              <h2>Petit rappel</h2>
              <p className="soft-text">
                Tu peux entrer des nombres avec une virgule ou un point. Le site accepte les deux.
              </p>
              <div className="mini-stack">
                <div className="mini-note">
                  <strong>Exemple :</strong> 0,031 ou 0.031
                </div>
                <div className="mini-note">
                  <strong>Conseil :</strong> commence par PRE ou APA, puis ouvre Explain si tu bloques sur
                  l’interprétation.
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
                    helper="Nombre de paramètres du modèle augmenté"
                  />
                  <TextField
                    label="PC"
                    value={preFromF.pc}
                    onChange={(value) => setPreFromF({ ...preFromF, pc: value })}
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
                  Utilise <strong>Depuis F</strong> quand ton exercice ou ton corrigé raisonne en comparaison de
                  modèles avec <strong>F, N, PA et PC</strong>. Utilise <strong>Depuis SCE</strong> quand tu as
                  directement les erreurs du modèle contraint et du modèle augmenté.
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
  <p>Paragraphe complet avec les 2 prédicteurs</p>
</button>

                <button
                  className={apaMode === "interaction" ? "feature-card active-card" : "feature-card"}
                  onClick={() => setApaMode("interaction")}
                >
                  <h3>Interaction</h3>
                  <p>Effet d’interaction</p>
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
                      label="ddl"
                      value={twoGroups.df}
                      onChange={(value) => setTwoGroups({ ...twoGroups, df: value })}
                    />
                    <TextField
                      label="p"
                      value={twoGroups.p}
                      onChange={(value) => setTwoGroups({ ...twoGroups, p: value })}
                    />
                    <TextField
                      label="PRE"
                      value={twoGroups.pre}
                      onChange={(value) => setTwoGroups({ ...twoGroups, pre: value })}
                    />
                  </div>
                  <div className="note-box">
                    <strong>À copier depuis Jamovi</strong>
                    <p>M, ET, t, ddl, p, PRE.</p>
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
                      label="ddl"
                      value={continuous.df}
                      onChange={(value) => setContinuous({ ...continuous, df: value })}
                    />
                    <TextField
                      label="p"
                      value={continuous.p}
                      onChange={(value) => setContinuous({ ...continuous, p: value })}
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
                    <p>b, t, ddl, p, PRE. L’intercept est utile pour l’interprétation, pas toujours pour la phrase finale.</p>
                  </div>
                </div>
              )}

              {apaMode === "multiple" && (
  <div className="stack">
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
          label="p"
          value={multiple.catP}
          onChange={(value) => setMultiple({ ...multiple, catP: value })}
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
          label="p"
          value={multiple.contP}
          onChange={(value) => setMultiple({ ...multiple, contP: value })}
        />
        <TextField
          label="PRE"
          value={multiple.contPre}
          onChange={(value) => setMultiple({ ...multiple, contPre: value })}
        />
      </div>
    </div>

    <div className="note-box">
      <strong>À copier depuis Jamovi</strong>
      <p>
        Pour le prédicteur catégoriel : M, ET, t, ddl, p, PRE. Pour le prédicteur continu :
        b, t, ddl, p, PRE.
      </p>
    </div>
  </div>
)}

              {apaMode === "interaction" && (
                <div className="stack">
                  <div className="mode-switch left">
                    <button
                      className={interaction.statType === "F" ? "mode-button active" : "mode-button"}
                      onClick={() => setInteraction({ ...interaction, statType: "F" })}
                    >
                      Forme F
                    </button>
                    <button
                      className={interaction.statType === "t" ? "mode-button active" : "mode-button"}
                      onClick={() => setInteraction({ ...interaction, statType: "t" })}
                    >
                      Forme t
                    </button>
                  </div>

                  <div className="form-grid">
                    <TextField
                      label="Prédicteur 1"
                      value={interaction.predictor1}
                      onChange={(value) => setInteraction({ ...interaction, predictor1: value })}
                    />
                    <TextField
                      label="Prédicteur 2"
                      value={interaction.predictor2}
                      onChange={(value) => setInteraction({ ...interaction, predictor2: value })}
                    />
                    <TextField
                      label="Variable dépendante"
                      value={interaction.outcome}
                      onChange={(value) => setInteraction({ ...interaction, outcome: value })}
                    />
                    <TextField
                      label={interaction.statType}
                      value={interaction.stat}
                      onChange={(value) => setInteraction({ ...interaction, stat: value })}
                    />
                    {interaction.statType === "F" ? (
                      <>
                        <TextField
                          label="ddl 1"
                          value={interaction.df1}
                          onChange={(value) => setInteraction({ ...interaction, df1: value })}
                        />
                        <TextField
                          label="ddl 2"
                          value={interaction.df2}
                          onChange={(value) => setInteraction({ ...interaction, df2: value })}
                        />
                      </>
                    ) : (
                      <TextField
                        label="ddl"
                        value={interaction.df}
                        onChange={(value) => setInteraction({ ...interaction, df: value })}
                      />
                    )}
                    <TextField
                      label="p"
                      value={interaction.p}
                      onChange={(value) => setInteraction({ ...interaction, p: value })}
                    />
                    <TextField
                      label="PRE"
                      value={interaction.pre}
                      onChange={(value) => setInteraction({ ...interaction, pre: value })}
                    />
                  </div>

                  <div className="note-box">
                    <strong>Petit rappel</strong>
                    <p>Si l’interaction est significative, rapporte aussi les effets principaux et appuie-toi sur le graphique / les effets simples pour l’interprétation.</p>
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
    ? multipleApa
    : interactionApa
}
secondary={
  apaMode === "continuous"
    ? continuousExplain
    : apaMode === "multiple"
    ? multipleExplain
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
      ? `${multipleApa}\n${multipleExplain}`
      : interactionApa
  )
}
disabled={
  !(
    (apaMode === "twoGroups" && twoGroupsApa) ||
    (apaMode === "continuous" && continuousApa) ||
    (apaMode === "multiple" && multipleApa) ||
    (apaMode === "interaction" && interactionApa)
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