import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaRegClone, FaPen } from 'react-icons/fa';
import { MdSchool } from 'react-icons/md';
import { BsGrid3X3Gap, BsFillLightningChargeFill } from 'react-icons/bs';
import './SetDetail.css';
import TrainingSideSwitch from './TrainingSideSwitch'; // Importer le composant

export default function SetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Pour détecter les changements de route
  const [set, setSet] = useState(null);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [userSets, setUserSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(id);
  
  // Récupérer la valeur du localStorage au démarrage et la mettre à jour si nécessaire
  const [trainingSide, setTrainingSide] = useState(() => {
    const savedValue = localStorage.getItem('trainingSideValue');
    return savedValue || "term"; // Utiliser la valeur sauvegardée ou la valeur par défaut
  });

  // Ajout : maîtrise par carte (localStorage)
  const [maitrise, setMaitrise] = useState({});
  useEffect(() => {
    const data = localStorage.getItem(`maitrise_${id}`);
    if (data) {
      try {
        const arr = JSON.parse(data);
        const obj = {};
        arr.forEach(c => { if (c.id) obj[c.id] = c.niveau_maitrise; });
        setMaitrise(obj);
      } catch {}
    }
  }, [id]);

  useEffect(() => {
    axios.get(`/api/sets/${id}`).then(r => setSet(r.data));
  }, [id]);

  useEffect(() => {
    axios.get(`/api/sets`).then(r => setUserSets(r.data || []));
  }, []);

  useEffect(() => {
    setFlipped(false);
  }, [current]);

  useEffect(() => {
    setSelectedSet(id);
  }, [id]);

  useEffect(() => {
    if (selectedSet && selectedSet !== id) {
      navigate(`/sets/${selectedSet}`);
    }
  }, [selectedSet, id, navigate]);

  // Effet pour mettre à jour les URL des liens lors du changement de trainingSide
  useEffect(() => {
    // Sauvegarder la valeur dans localStorage à chaque changement
    localStorage.setItem('trainingSideValue', trainingSide);
  }, [trainingSide]);

  // Gestionnaire pour le changement de valeur du switch
  const handleTrainingSideChange = (value) => {
    setTrainingSide(value);
    localStorage.setItem('trainingSideValue', value);
  };

  function playAudio(text) {
    if ('speechSynthesis' in window && text) {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.lang = 'fr-FR';
      synth.speak(utter);
    }
  }

  if (!set) return <div>Chargement…</div>;
  const cards = set.cards?.map(card => ({
    ...card,
    imageFront: card.imageFront ?? card.image ?? "",
    imageBack: card.imageBack ?? "",
    id: card.id || card.term || card.question
  })) || [];

  return (
    <div style={{maxWidth: 800, margin: "0 auto", marginTop: 18, display: "flex"}}>
      <div style={{flex: 1}}>
        {/* Modes */}
        <div style={{display: "flex", gap: 20, flexWrap: "wrap", margin: "0 0 26px 0"}}>
          <Link to={`/sets/${id}/flashcards?side=${trainingSide}`} style={{flex: 1, minWidth: 160}}>
            <ModeButton icon={<FaRegClone size={24}/>} label="Cartes" />
          </Link>
          <Link to={`/sets/${id}/learn`} style={{flex: 1, minWidth: 160}}>
            <ModeButton icon={<MdSchool size={24}/>} label="Apprendre" />
          </Link>
          <Link to={`/sets/${id}/test`} style={{flex: 1, minWidth: 160}}>
            <ModeButton icon={<FaRegClone size={24}/>} label="Test" />
          </Link>
          <Link to={`/sets/${id}/write?side=${trainingSide}`} style={{flex: 1, minWidth: 160}}>
            <ModeButton icon={<FaPen size={22}/>} label="Écrire" />
          </Link>
          <Link to={`/sets/${id}/Spell?side=${trainingSide}`} style={{flex: 1, minWidth: 160}}>
            <ModeButton icon={<BsGrid3X3Gap size={24}/>} label="Dictée" />
          </Link>
          <Link to={`/sets/${id}/Gravity?side=${trainingSide}`} style={{flex: 1, minWidth: 160}}>
            <ModeButton icon={<BsFillLightningChargeFill size={24}/>} label="Gravité" />
          </Link>
          <Link to={`/sets/${id}/match`} style={{flex: 1, minWidth: 160}}>
            <ModeButton icon={<FaRegClone size={24}/>} label="Associer" />
          </Link>
        </div>

        {/* Carte centrale : flip animation */}
        <div 
          className="q-flashcard-container"
          style={{
            margin: "0 0 10px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative" // Pour le positionnement absolu du switch
          }}
        >
          <div 
            className={`q-flashcard-flip${flipped ? " flipped" : ""}`}
            tabIndex={0}
            onClick={() => setFlipped(f => !f)}
            onKeyDown={e => (e.key === " " || e.key === "Enter") && setFlipped(f => !f)}
            style={{
              width: 600,
              maxWidth: "95vw",
              height: 250,
              cursor: "pointer",
              perspective: 1200,
              outline: "none"
            }}
            aria-label="Cliquer pour retourner la carte"
          >
            <div className="q-flashcard-flip-inner">
              {/* Face avant : Mot ou image */}
              <div className="q-flashcard-flip-front">
                <div style={{
                  flex: 1,
                  width: "100%",
                  textAlign: "center",
                  fontSize: 32,
                  color: "#fff",
                  letterSpacing: 1,
                  fontWeight: 400,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {cards[current]?.imageFront && (
                    <img
                      src={cards[current].imageFront}
                      alt=""
                      style={{
                        maxHeight: 120,
                        maxWidth: "95%",
                        display: "block",
                        margin: "12px auto 10px",
                        borderRadius: 10,
                        boxShadow: "0 2px 8px #2224"
                      }}
                    />
                  )}
                  {cards[current]?.term}
                </div>
                <div style={{
                  position: "absolute", top: 14, right: 24, display: "flex", gap: 15
                }}>
                  <span
                    title="Lire"
                    style={{color: "var(--q-text-light)", cursor: "pointer"}}
                    onClick={e => {
                      e.stopPropagation();
                      playAudio(cards[current]?.term || "");
                    }}
                    tabIndex={0}
                    aria-label="Lire le mot"
                    role="button"
                  >🔊</span>
                </div>
              </div>
              {/* Face arrière : Définition ou image */}
              <div className="q-flashcard-flip-back">
                <div style={{
                  flex: 1,
                  width: "100%",
                  textAlign: "center",
                  fontSize: 32,
                  color: "#fff",
                  letterSpacing: 1,
                  fontWeight: 400,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {cards[current]?.imageBack && (
                    <img
                      src={cards[current].imageBack}
                      alt=""
                      style={{
                        maxHeight: 120,
                        maxWidth: "95%",
                        display: "block",
                        margin: "12px auto 10px",
                        borderRadius: 10,
                        boxShadow: "0 2px 8px #2224"
                      }}
                    />
                  )}
                  {cards[current]?.definition}
                </div>
                <div style={{
                  position: "absolute", top: 14, right: 24, display: "flex", gap: 15
                }}>
                  <span
                    title="Lire"
                    style={{color: "var(--q-text-light)", cursor: "pointer"}}
                    onClick={e => {
                      e.stopPropagation();
                      playAudio(cards[current]?.definition || "");
                    }}
                    tabIndex={0}
                    aria-label="Lire la définition"
                    role="button"
                  >🔊</span>
                  <span title="Favori" style={{color: "var(--q-text-light)", cursor: "pointer"}}>☆</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Switch déplacé en bas à droite de la carte */}
          <div style={{
            position: "absolute", 
            bottom: "0", 
            right: "110px", 
            width: "160px", // Taille réduite pour un look plus discret
            transform: "translateY(10px)" // Positionne le switch légèrement en dessous de la carte
          }}>
            <TrainingSideSwitch value={trainingSide} onChange={handleTrainingSideChange} />
          </div>
          
          <div style={{color: "#9fa0c9", fontSize: 13, marginTop: 8}}>Cliquer sur la carte pour afficher la définition</div>
        </div>

        {/* Navigation */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          marginTop: 32
        }}>
          <button
            onClick={() => setCurrent(Math.max(0, current-1))}
            style={{
              background: "var(--q-bg-card)",
              border: "none",
              borderRadius: 12,
              width: 46, height: 46,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: current === 0 ? "#44496d" : "var(--q-primary)",
              fontSize: 28,
              cursor: current === 0 ? "not-allowed" : "pointer",
              transition: "background 0.15s"
            }}
            disabled={current === 0}
            aria-label="Carte précédente"
          >
            ←
          </button>
          <span style={{
            minWidth: 70,
            textAlign: "center",
            color: "var(--q-text)",
            fontWeight: 500,
            fontSize: 19,
            letterSpacing: 1
          }}>
            {cards.length ? (current+1) : 0} / {cards.length}
          </span>
          <button
            onClick={() => setCurrent(Math.min(cards.length-1, current+1))}
            style={{
              background: "var(--q-bg-card)",
              border: "none",
              borderRadius: 12,
              width: 46, height: 46,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: current === cards.length-1 ? "#44496d" : "var(--q-primary)",
              fontSize: 28,
              cursor: current === cards.length-1 ? "not-allowed" : "pointer",
              transition: "background 0.15s"
            }}
            disabled={current === cards.length-1}
            aria-label="Carte suivante"
          >
            →
          </button>
        </div>

        {/* Le reste du composant reste inchangé */}
        {/* Créateur */}
        <div style={{marginTop: 36, display: "flex", alignItems: "center", gap: 14}}>
          <img src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${set.author || "User"}`} alt="User" style={{width: 48, height: 48, borderRadius: "50%", background: "#222"}} />
          <div>
            <div style={{color: "var(--q-text-light)", fontWeight: 400, fontSize: 15}}>Créée par</div>
            <div style={{display: "flex", alignItems: "center", gap: 8}}>
              <span style={{fontWeight: 500, color: "var(--q-text)", fontSize: 16}}>
                {set.author || "Utilisateur"}
              </span>
              <span style={{
                background: "#3c3fa4",
                color: "#fff",
                borderRadius: 8,
                fontSize: 13,
                padding: "2px 8px",
                marginLeft: 2
              }}>Enseignant</span>
            </div>
            <div style={{color: "var(--q-text-light)", fontSize: 13}}>Créée il y a 1 an</div>
          </div>
        </div>
        {/* BOUTON MODIFIER */}
        <div style={{marginTop: 30}}>
          <Link to={`/sets/${id}/edit`}>
            <button style={{
              background: "#3c3fa4",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              padding: "7px 25px"
            }}>
              Modifier la liste
            </button>
          </Link>
        </div>

        {/* TABLEAU TERME / DEFINITION / MAITRISE */}
        {cards.length > 0 && (
          <div style={{
            margin: "40px auto 32px auto",
            maxWidth: 600,
            background: "#232541",
            borderRadius: 14,
            boxShadow: "0 2px 12px #181b3a22",
            padding: "18px 26px"
          }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              color: "#fff",
              fontSize: 18,
              letterSpacing: "0.5px"
            }}>
              <thead>
                <tr>
                  <th style={{
                    borderBottom: "2px solid #353962",
                    padding: "8px 6px",
                    color: "#b3baff",
                    fontWeight: 700,
                    textAlign: "left"
                  }}>Terme</th>
                  <th style={{
                    borderBottom: "2px solid #353962",
                    padding: "8px 6px",
                    color: "#b3baff",
                    fontWeight: 700,
                    textAlign: "left"
                  }}>Définition</th>
                  <th style={{
                    borderBottom: "2px solid #353962",
                    padding: "8px 6px",
                    color: "#b3baff",
                    fontWeight: 700,
                    textAlign: "left"
                  }}>Maîtrise</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c, i) => (
                  <tr key={i} style={{borderBottom: "1px solid #353962"}}>
                    <td style={{padding: "8px 6px", verticalAlign: "top"}}>
                      {c.term || c.question}
                    </td>
                    <td style={{padding: "8px 6px", verticalAlign: "top"}}>
                      {c.definition || c.reponse}
                    </td>
                    <td style={{padding: "8px 6px", verticalAlign: "top"}}>
                      {typeof maitrise[c.id] === "number"
                        ? `${Math.round(maitrise[c.id]*100)}%`
                        : <span style={{opacity:0.6}}>–</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ModeButton({icon, label, badge}) {
  return (
    <div style={{
      background: "var(--q-bg-card)",
      color: "var(--q-text-light)",
      border: "none",
      borderRadius: 12,
      padding: "0.7em 0",
      fontWeight: 600,
      fontSize: 18,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      boxShadow: "0 2px 6px #2a2e4a14",
      position: "relative"
    }}>
      <span style={{fontSize: 22, display: "flex", alignItems: "center"}}>{icon}</span>
      {label}
      {badge && (
        <span style={{
          background: "#39e5c6",
          color: "#222",
          fontSize: 12,
          borderRadius: 7,
          padding: "2px 7px",
          fontWeight: 700,
          marginLeft: 7
        }}>{badge}</span>
      )}
    </div>
  );
}