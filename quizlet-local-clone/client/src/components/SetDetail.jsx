import React, { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { FaRegClone, FaPen } from 'react-icons/fa'
import { MdSchool } from 'react-icons/md'
import { BsGrid3X3Gap, BsFillLightningChargeFill } from 'react-icons/bs'
import './SetDetail.css'

export default function SetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [set, setSet] = useState(null)
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [userSets, setUserSets] = useState([])
  const [selectedSet, setSelectedSet] = useState(id)

  useEffect(() => {
    axios.get(`/api/sets/${id}`).then(r => setSet(r.data))
  }, [id])

  // Charge toutes les listes de l'utilisateur pour la dropdown dans la sidebar
  useEffect(() => {
    axios.get(`/api/sets`).then(r => setUserSets(r.data || []))
  }, [])

  // Remet la carte côté mot quand tu changes de carte
  useEffect(() => {
    setFlipped(false)
  }, [current])

  // Met à jour le selectedSet si id change (naviguer via bouton "préc/suiv")
  useEffect(() => {
    setSelectedSet(id)
  }, [id])

  // Si selectedSet change (par sélection), navigue vers la liste correspondante
  useEffect(() => {
    if (selectedSet && selectedSet !== id) {
      navigate(`/sets/${selectedSet}`)
    }
  }, [selectedSet, id, navigate])

  // Fonction pour lire un texte (mot ou définition) à voix haute
  function playAudio(text) {
    if ('speechSynthesis' in window && text) {
      const synth = window.speechSynthesis
      synth.cancel(); // stop previous if needed
      const utter = new window.SpeechSynthesisUtterance(text)
      utter.lang = 'fr-FR'
      synth.speak(utter)
    }
  }

  if (!set) return <div>Chargement…</div>
  const cards = set.cards || []

  return (
    <div style={{maxWidth: 800, margin: "0 auto", marginTop: 18, display: "flex"}}>
      {/* Sidebar avec la liste déroulante */}
      <aside style={{
        background: "#1b1d3a",
        width: 210,
        minHeight: "75vh",
        borderRadius: 14,
        padding: "24px 0 0 0",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        marginRight: 34,
        alignItems: "center"
      }}>
        <div style={{margin: "0 16px 8px 16px", width: "85%"}}>
          <label htmlFor="liste-select" style={{
            color: "#b3baff", fontWeight: 500, fontSize: 15, marginBottom: 4, display: "block", letterSpacing: 1
          }}>
            Mes listes
          </label>
          <select
            id="liste-select"
            value={selectedSet}
            onChange={e => setSelectedSet(e.target.value)}
            style={{
              width: "100%",
              background: "#232541",
              color: "#b3baff",
              border: "none",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 16,
              marginBottom: 5,
              marginTop: 2,
              outline: "none"
            }}
          >
            {userSets.length === 0 && <option value="">Aucune liste</option>}
            {userSets.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>
      </aside>

      <div style={{flex: 1}}>
        {/* Modes */}
        <div style={{display: "flex", gap: 20, flexWrap: "wrap", margin: "0 0 26px 0"}}>
          <Link to={`/sets/${id}/flashcards`} style={{flex: 1, minWidth: 160}}>
            <ModeButton icon={<FaRegClone size={24}/>} label="Cartes" />
          </Link>
          <Link to={`/sets/${id}/learn`} style={{flex: 1, minWidth: 160}}>
            <ModeButton icon={<MdSchool size={24}/>} label="Apprendre" />
          </Link>
          <Link to={`/sets/${id}/test`} style={{flex: 1, minWidth: 160}}>
            <ModeButton icon={<FaRegClone size={24}/>} label="Test" />
          </Link>
          <Link to={`/sets/${id}/write`} style={{flex: 1, minWidth: 160}}>
            <ModeButton icon={<FaPen size={22}/>} label="Écrire" />
          </Link>
          <Link to={`/sets/${id}/Spell`} style={{flex: 1, minWidth: 160}}>
            <ModeButton icon={<BsGrid3X3Gap size={24}/>} label="Dictée" />
          </Link>
          <Link to={`/sets/${id}/Gravity`} style={{flex: 1, minWidth: 160}}>
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
            margin: "0 0 30px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
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
              {/* Face avant : Mot */}
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
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {cards[current] ? cards[current].term : "Aucune carte"}
                </div>
                {/* Actions sur la carte */}
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
              {/* Face arrière : Définition */}
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
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {cards[current] ? cards[current].definition : "Aucune définition"}
                </div>
                {/* Actions sur la carte */}
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
      </div>
    </div>
  )
}

// Bouton Mode avec icône et badge éventuel
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
  )
}