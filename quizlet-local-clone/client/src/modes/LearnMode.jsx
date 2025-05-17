import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

// Utils
function shuffle(arr) {
  return arr.slice().sort(() => Math.random() - 0.5);
}
const SALVE_SIZE = 7; // 5-10 conseillé selon les spécifications

function initCard(card) {
  return {
    ...card,
    niveau_maitrise: 0.0,
    erreurs: 0,
    erreurs_recentes: 0, // Pour suivre les erreurs récentes (dernières salves)
    salves_vues: 0,
    statut: "nouveau", // "en_cours", "maitrisé"
    derniere_bonne: false, // Si la dernière réponse était correcte
    avant_derniere_bonne: false, // Ajout: suivi des 2 dernières réponses pour le critère de maîtrise
  }
}

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

export default function LearnMode() {
  const { id } = useParams();
  const [allCards, setAllCards] = useState([]);
  const [salve, setSalve] = useState([]);
  const [salveNum, setSalveNum] = useState(1);
  const [stepInSalve, setStepInSalve] = useState(0);
  const [salveEnded, setSalveEnded] = useState(false);
  const [phase, setPhase] = useState("learn"); // learn, recap, final, done
  const [q, setQ] = useState(null);
  const [error, setError] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // Initialisation : charger, mélanger, init
  useEffect(() => {
    axios.get(`/api/sets/${id}`).then(r => {
      // Supporte structure {id, question, reponse} ou {term, definition}
      const cards = shuffle((r.data.cards || []).map(card =>
        card.question && card.reponse
          ? initCard(card)
          : initCard({
              id: card.id || card.term,
              question: card.term,
              reponse: card.definition,
            })
      ));
      setAllCards(cards);
      setShowIntro(true);
    });
  }, [id]);

  // Nouvelle salve
  useEffect(() => {
    if (!allCards.length || phase !== "learn") return;
    
    // Récupère ceux à maîtriser (<1.0), priorise erreurs et jamais vus
    let pool = allCards.filter(c => c.niveau_maitrise < 1.0);
    
    // Tri selon les priorités: erreurs récentes, erreurs totales, et jamais vus
    pool.sort((a, b) =>
      (b.erreurs_recentes - a.erreurs_recentes) ||
      (b.erreurs - a.erreurs) ||
      (a.salves_vues - b.salves_vues)
    );
    
    // Respecte la taille de salve demandée (5-10 éléments)
    let targetSize = Math.min(pool.length, SALVE_SIZE);
    
    // Dernière salve : si moins de SALVE_SIZE restants, tous ensemble
    const currentSalve = pool.slice(0, targetSize);
    setSalve(currentSalve);
    setStepInSalve(0);
    setSalveEnded(false);
  }, [allCards, salveNum, phase]);

  // Génère la question de la salve courante
  useEffect(() => {
    if (!salve.length || salveEnded || phase !== "learn") {
      setQ(null);
      return;
    }
    const card = salve[stepInSalve];
    if (!card) {
      setSalveEnded(true);
      setQ(null);
      return;
    }
    
    // Choix format selon niveau_maitrise - conforme aux spécifications
    let qtype = "mcq";
    if (card.niveau_maitrise > 0.3 && card.niveau_maitrise <= 0.6) qtype = "vf";
    if (card.niveau_maitrise > 0.6 && card.niveau_maitrise < 0.9) qtype = "written";
    if (card.niveau_maitrise >= 0.9) qtype = Math.random() < 0.5 ? "written" : "mcq";
    
    // Exposition passive si jamais vu
    if (card.salves_vues === 0) qtype = "expose";
    
    // QCM
    if (qtype === "mcq") {
      const options = shuffle([
        card.reponse,
        ...shuffle(allCards.filter(c => c.id !== card.id)).slice(0, 3).map(c => c.reponse)
      ]);
      setQ({ type: "mcq", question: card.question, answer: card.reponse, options, card });
    } else if (qtype === "vf") {
      const isTrue = Math.random() < 0.5;
      const displayedDef = isTrue
        ? card.reponse
        : shuffle(allCards.filter(c => c.id !== card.id))[0]?.reponse || card.reponse;
      setQ({ type: "vf", question: card.question, answer: isTrue, displayedDef, card });
    } else if (qtype === "written") {
      setQ({ type: "written", question: card.question, answer: card.reponse, card });
    } else if (qtype === "expose") {
      setQ({ type: "expose", question: card.question, answer: card.reponse, card });
    }
    setError(false);
  }, [stepInSalve, salve, salveEnded, phase, allCards]);

  // Gestion réponse
  function onAnswer(resp) {
    if (!q) return;
    const card = q.card;
    let correct = false;
    
    if (q.type === "mcq" || q.type === "written") {
      correct = resp.trim().toLowerCase() === q.answer.trim().toLowerCase();
    } else if (q.type === "vf") {
      correct = resp === q.answer;
    } else if (q.type === "expose") {
      // L'exposition passive est toujours "correcte" car c'est juste une présentation
      correct = true;
    }
    
    // Mise à jour de la carte dans allCards
    setAllCards(prev => prev.map(c => {
      if (c.id !== card.id) return c;
      
      let new_niveau = c.niveau_maitrise;
      let new_erreurs = c.erreurs;
      let new_erreurs_recentes = c.erreurs_recentes;
      
      // Calcul du nouveau niveau de maîtrise
      if (correct) {
        // Augmentation plus importante pour les réponses écrites
        new_niveau = clamp(c.niveau_maitrise + (q.type === "written" ? 0.3 : q.type === "expose" ? 0.1 : 0.2), 0, 1.0);
      } else {
        new_niveau = clamp(c.niveau_maitrise - 0.2, 0, 1.0);
        new_erreurs = c.erreurs + 1;
        new_erreurs_recentes = c.erreurs_recentes + 1;
      }
      
      // Détermination du statut selon tous les critères demandés
      let statut = "en_cours";
      
      // Critères de maîtrise complets:
      // 1. niveau_maitrise ≥ 1.0
      // 2. Dernière réponse correcte dans un format exigeant (écrit)
      // 3. Aucune erreur dans les deux dernières salves
      if (new_niveau >= 1.0 && 
          q.type === "written" && 
          correct && 
          c.derniere_bonne && 
          new_erreurs_recentes === 0) {
        statut = "maitrisé";
      }
      
      return {
        ...c,
        niveau_maitrise: new_niveau,
        erreurs: new_erreurs,
        erreurs_recentes: new_erreurs_recentes,
        salves_vues: c.salves_vues + 1,
        statut,
        avant_derniere_bonne: c.derniere_bonne, // On mémorise l'avant-dernière réponse
        derniere_bonne: correct && q.type !== "expose" // On ignore l'exposition pour ce suivi
      };
    }));
    
    setError(!correct);
    setTimeout(() => {
      setError(false);
      setStepInSalve(s => s + 1);
    }, correct ? 350 : 1100);
  }

  // Quand la salve est finie
  useEffect(() => {
    if (!salve.length) return;
    if (stepInSalve >= salve.length) {
      setSalveEnded(true);
    }
  }, [stepInSalve, salve]);

  // Passe à la salve suivante ou à la phase de révision finale
  function nextSalve() {
    // À la fin de chaque salve, on réinitialise les erreurs récentes
    // pour les cartes qui ont été vues et réussies
    setAllCards(prev => prev.map(c => {
      const cardInSalve = salve.find(s => s.id === c.id);
      if (cardInSalve && c.derniere_bonne) {
        return { ...c, erreurs_recentes: 0 };
      }
      return c;
    }));
    
    // Vérifie si toutes les cartes sont maîtrisées
    const reste = allCards.filter(c => c.niveau_maitrise < 1.0 || c.statut !== "maitrisé");
    
    if (reste.length === 0) {
      setPhase("done");
    } else if (allCards.every(c => c.salves_vues > 0)) {
      // Passe à la phase finale quand tous les éléments ont été vus au moins une fois
      setPhase("final");
    } else {
      setSalveNum(n => n + 1);
    }
  }

  // Phase de révision ciblée finale
  // Identifie les éléments faibles selon les critères demandés
  const elementsFaibles = allCards.filter(
    c => c.niveau_maitrise < 0.9 || c.erreurs > 0 || c.erreurs_recentes > 0
  );

  function finalAnswer(card, resp) {
    const correct = resp.trim().toLowerCase() === card.reponse.trim().toLowerCase();
    
    setAllCards(prev => prev.map(c => {
      if (c.id !== card.id) return c;
      
      let new_niveau = c.niveau_maitrise;
      let new_erreurs = c.erreurs;
      let new_erreurs_recentes = c.erreurs_recentes;
      
      if (correct) {
        new_niveau = clamp(c.niveau_maitrise + 0.3, 0, 1.0);
        new_erreurs_recentes = 0; // Réinitialise en cas de succès
      } else {
        new_niveau = clamp(c.niveau_maitrise - 0.2, 0, 1.0);
        new_erreurs = c.erreurs + 1;
        new_erreurs_recentes = c.erreurs_recentes + 1;
      }
      
      // Mise à jour du statut selon tous les critères
      let statut = "en_cours";
      if (new_niveau >= 1.0 && correct && c.derniere_bonne && new_erreurs_recentes === 0) {
        statut = "maitrisé";
      }
      
      return {
        ...c,
        niveau_maitrise: new_niveau,
        erreurs: new_erreurs,
        erreurs_recentes: new_erreurs_recentes,
        statut,
        avant_derniere_bonne: c.derniere_bonne,
        derniere_bonne: correct
      };
    }));
    
    setTimeout(() => {
      // Vérifie s'il reste des éléments faibles
      const resteFaibles = allCards.filter(
        c => c.id !== card.id && (c.niveau_maitrise < 0.9 || c.erreurs > 0 || c.erreurs_recentes > 0)
      );
      
      if (resteFaibles.length === 0) {
        setPhase("done");
      } else {
        setStepInSalve(s => s + 1);
      }
    }, correct ? 350 : 1100);
  }

  // Intro
  if (showIntro) {
    return (
      <div style={{maxWidth: 480, margin: "0 auto", textAlign: "center"}}>
        <h2>Mode Apprendre</h2>
        <p>La session va se dérouler en plusieurs salves courtes pour t'aider à maîtriser chaque notion.</p>
        <p>À chaque étape, le format et la difficulté s'adapteront à tes progrès et erreurs.</p>
        <button onClick={() => setShowIntro(false)}>Commencer</button>
      </div>
    );
  }

  // Résumé final
  if (phase === "done") {
    const nbMaitrises = allCards.filter(c => c.niveau_maitrise >= 1.0 && c.statut === "maitrisé").length;
    const totalErreurs = allCards.reduce((total, c) => total + c.erreurs, 0);
    
    return (
      <div style={{textAlign: "center", maxWidth: 520, margin: "0 auto"}}>
        <h2>🎓 100% maîtrisé !</h2>
        <div style={{margin: 12, color: "#68d391", fontWeight: 600, fontSize: 18}}>
          Bravo, tu as tout maîtrisé en une session !
        </div>
        
        {/* Résumé chiffré comme demandé dans les spécifications */}
        <div style={{margin: "20px 0", background: "#232541", padding: 15, borderRadius: 10}}>
          <h3>Résumé de la session</h3>
          <p>Taux de maîtrise: 100% ({nbMaitrises}/{allCards.length})</p>
          <p>Erreurs corrigées: {totalErreurs}</p>
          <p>Nombre de salves: {salveNum}</p>
        </div>
        
        <ProgressTable cards={allCards} />
        <Link to={`/sets/${id}`}>
          <button>Retour à la fiche</button>
        </Link>
      </div>
    );
  }

  // Révision finale
  if (phase === "final") {
    if (!elementsFaibles.length) {
      setPhase("done");
      return null;
    }
    
    // Tri des éléments faibles par niveau de maîtrise et erreurs
    const elementsFaiblesTries = [...elementsFaibles].sort((a, b) => 
      (a.niveau_maitrise - b.niveau_maitrise) || (b.erreurs - a.erreurs)
    );
    
    return (
      <div style={{maxWidth: 500, margin: "0 auto", textAlign: "center"}}>
        <h2>Révision ciblée</h2>
        <p>Encore quelques notions à blinder :</p>
        <div>
          {elementsFaiblesTries.map((c, i) => (
            <div key={c.id} style={{
              background: "#232541",
              borderRadius: 14,
              margin: "15px 0",
              padding: "20px 10px",
              boxShadow: "0 2px 12px #181b3a55"
            }}>
              <div style={{fontWeight: 600, fontSize: 18, marginBottom: 8}}>{c.question}</div>
              <FinalWrittenAnswer answer={c.reponse} onCorrect={resp => finalAnswer(c, resp)} />
              <div style={{fontSize: 13, marginTop: 4, color: "#888"}}>
                Maîtrise&nbsp;: {Math.round(c.niveau_maitrise * 100)}% – Erreurs&nbsp;: {c.erreurs}
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop: 26}}>
          <button onClick={() => setPhase("done")}>Terminer la session</button>
        </div>
      </div>
    );
  }

  // Récap salve
  if (salveEnded && phase === "learn") {
    // pastilles progression
    const nbMaitrises = allCards.filter(c => c.statut === "maitrisé").length;
    const nbEnCours = allCards.filter(c => c.statut === "en_cours").length;
    const nbNouveaux = allCards.filter(c => c.statut === "nouveau").length;
    
    return (
      <div style={{textAlign: "center", marginTop: 60}}>
        <h3>Fin de la salve {salveNum}</h3>
        <div style={{margin: 16, fontSize: 17}}>
          <b>{nbMaitrises}</b> maîtrisé{nbMaitrises>1?"s":""} / {allCards.length}
        </div>
        <div style={{display: "flex", justifyContent: "center", gap: 20, margin: "15px 0"}}>
          <div>
            <span style={{color: "#68d391", fontWeight: 600}}>{nbMaitrises}</span> maîtrisés
          </div>
          <div>
            <span style={{color: "#f6e05e", fontWeight: 600}}>{nbEnCours}</span> en cours
          </div>
          <div>
            <span style={{color: "#a0aec0", fontWeight: 600}}>{nbNouveaux}</span> nouveaux
          </div>
        </div>
        <ProgressTable cards={allCards} />
        <button onClick={nextSalve} style={{marginTop: 38}}>Salve suivante</button>
      </div>
    );
  }

  // Affichage question de la salve
  if (!q) return <div>Chargement…</div>;

  return (
    <div style={{maxWidth: 480, margin: "0 auto", textAlign: "center"}}>
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 16, fontSize: 17
      }}>
        <span>Salve {salveNum}</span>
        <span>{stepInSalve+1} / {salve.length}</span>
      </div>
      <ProgressTable cards={allCards} mini />
      <div style={{
        background: "#232541",
        borderRadius: 16,
        padding: 32,
        boxShadow: "0 4px 24px #181b3a66",
        marginBottom: 20,
        minHeight: 170,
        position: "relative",
        animation: error ? "shake 0.35s" : undefined,
        color: "#fff"
      }}>
        <div style={{ fontSize: 22, marginBottom: 18 }}>{q.question}</div>
        {/* Exposition passive */}
        {q.type === "expose" && (
          <>
            <div style={{
              fontSize: 22,
              color: "#b3baff",
              margin: "18px 0",
              fontWeight: 500
            }}>
              {q.answer}
              <div style={{fontSize: 15, marginTop: 12, color: "#9fa0c9"}}>(Clique sur "Suivant" pour continuer)</div>
            </div>
            <button style={{marginTop:16}} onClick={() => onAnswer("")}>
              Suivant
            </button>
          </>
        )}
        {/* QCM */}
        {q.type === "mcq" && (
          <div>
            {q.options.map(opt =>
              <button
                key={opt}
                style={{
                  display: 'block',
                  width: '100%',
                  margin: '8px 0',
                  background: error && opt === q.answer ? '#68d391'
                    : error && opt !== q.answer ? '#feb2b2' : '#232541',
                  border: error && opt === q.answer ? '2px solid #38a169'
                    : error && opt !== q.answer ? '2px solid #c53030'
                    : '1px solid #44496d',
                  color: "#fff",
                  fontWeight: 500,
                  fontSize: 16,
                  borderRadius: 7,
                  padding: "8px 0",
                  transition: "background 0.15s, border 0.15s",
                  cursor: "pointer",
                }}
                onClick={() => onAnswer(opt)}
                disabled={error}
              >
                {opt}
              </button>
            )}
          </div>
        )}
        {/* Vrai/Faux */}
        {q.type === "vf" && (
          <div>
            <div style={{
              fontSize: 17,
              background: "#353962",
              borderRadius: 6,
              padding: "9px 0",
              marginBottom: 13,
              color: "#b3baff"
            }}>
              {q.displayedDef}
            </div>
            <button
              style={{
                marginRight: 12,
                background: "#bee3f8",
                border: "1px solid #3182ce",
                color: "#2c5282",
                fontWeight: 600,
                borderRadius: 7,
                padding: "8px 25px",
                fontSize: 16,
                cursor: "pointer",
              }}
              onClick={() => onAnswer(true)}
              disabled={error}
            >
              Vrai
            </button>
            <button
              style={{
                background: "#fed7d7",
                border: "1px solid #c53030",
                color: "#822727",
                fontWeight: 600,
                borderRadius: 7,
                padding: "8px 25px",
                fontSize: 16,
                cursor: "pointer",
              }}
              onClick={() => onAnswer(false)}
              disabled={error}
            >
              Faux
            </button>
          </div>
        )}
        {/* Écrit */}
        {q.type === "written" && (
          <FinalWrittenAnswer answer={q.answer} onCorrect={resp => onAnswer(resp)} error={error} setError={setError} />
        )}
      </div>
      <style>
        {`
        @keyframes shake {
          0% { transform: translateX(0);}
          15% { transform: translateX(-8px);}
          30% { transform: translateX(8px);}
          45% { transform: translateX(-6px);}
          60% { transform: translateX(6px);}
          75% { transform: translateX(-3px);}
          90% { transform: translateX(3px);}
          100% { transform: translateX(0);}
        }
        `}
      </style>
      <div style={{marginTop: 14}}>
        <Link to={`/sets/${id}`}><button>Retour</button></Link>
      </div>
    </div>
  );
}

// Table de progression avec pastilles
function ProgressTable({cards, mini}) {
  const nb = cards.length;
  const mastered = cards.filter(c => c.statut === "maitrisé").length;
  const couleur = (c) =>
    c.statut === "maitrisé" ? "#68d391"
      : c.niveau_maitrise >= 0.6 ? "#f6e05e"
      : c.niveau_maitrise > 0 ? "#63b3ed"
      : "#a0aec0";
      
  if (mini) {
    return (
      <div style={{display:"flex", justifyContent:"center", gap:5, marginBottom:10}}>
        {cards.map((c,i) =>
          <span key={c.id}
            title={`${c.question} (${Math.round(c.niveau_maitrise*100)}%, ${c.erreurs} erreurs)`}
            style={{
              display: "inline-block",
              width: 16, height: 16,
              borderRadius: 8,
              background: couleur(c),
              border: "1px solid #44496d"
            }} />
        )}
      </div>
    );
  }
  
  return (
    <div style={{display:"flex", flexWrap:"wrap", gap:7, justifyContent:"center", margin: "18px 0"}}>
      {cards.map((c,i) =>
        <span key={c.id}
          title={`${c.question} (${Math.round(c.niveau_maitrise*100)}%, ${c.erreurs} erreurs)`}
          style={{
            display: "inline-block",
            minWidth: 24,
            borderRadius: 7,
            padding: "3px 6px",
            fontSize: 13,
            background: couleur(c),
            color: "#222",
            textAlign: "center",
            fontWeight: 600
          }}>{i+1}</span>
      )}
    </div>
  );
}

// Réponse écrite pour la révision finale
function FinalWrittenAnswer({answer, onCorrect, error, setError}) {
  const [val, setVal] = useState("");
  return (
    <form onSubmit={e => {
      e.preventDefault();
      if (val.trim().toLowerCase() === answer.trim().toLowerCase()) {
        setVal("");
        setError && setError(false);
        onCorrect(val);
      } else {
        setError && setError(true);
      }
    }}>
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        style={{
          border: error ? "2px solid #f56565" : "1px solid #a0aec0",
          borderRadius: 7,
          padding: "7px 18px",
          fontSize: 16,
          marginRight: 10
        }}
        placeholder="Réponse"
        autoFocus
      />
      <button type="submit">Valider</button>
    </form>
  );
}