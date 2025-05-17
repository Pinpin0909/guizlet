import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

function shuffle(array) {
  return array.slice().sort(() => Math.random() - 0.5);
}

export default function FlashcardsMode() {
  const { id } = useParams();
  const [cards, setCards] = useState([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    axios.get(`/api/sets/${id}`).then(r => {
      setCards(shuffle(r.data.cards || []));
    });
  }, [id]);

  // Remet la carte côté question quand on change de carte
  useEffect(() => {
    setFlipped(false);
  }, [current]);

  if (!cards.length) return <div>Chargement…</div>;

  const card = cards[current];

  return (
    <div style={{maxWidth: 520, margin: "0 auto", textAlign: "center"}}>
      <h3 style={{color:"#b3baff", marginBottom:24, fontWeight:700, letterSpacing:1}}>Cartes</h3>
      <div
        tabIndex={0}
        onClick={() => setFlipped(f => !f)}
        onKeyDown={e => (e.key === " " || e.key === "Enter") && setFlipped(f => !f)}
        aria-label="Cliquer pour retourner la carte"
        style={{
          width: "100%",
          maxWidth: 420,
          height: 220,
          margin: "0 auto 24px auto",
          background: "#232541",
          color: "#fff",
          borderRadius: 18,
          boxShadow: "0 4px 24px #181b3a66",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          fontWeight: 500,
          cursor: "pointer",
          userSelect: "none",
          position: "relative",
          transition: "background 0.2s"
        }}
      >
        <span>
          {flipped
            ? (card.definition || card.reponse)
            : (card.term || card.question)}
        </span>
        <span style={{
          position: "absolute",
          bottom: 14,
          right: 24,
          color: "#9fa0c9",
          fontSize: 15,
        }}>
          {flipped ? "Définition" : "Question"}
        </span>
      </div>
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center", // Centrage vertical des boutons/flèches
        gap: 18,
        marginBottom: 18
      }}>
        <button
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
          style={{
            background: "#353962",
            color: current === 0 ? "#44496d" : "#b3baff",
            border: "none",
            borderRadius: 12,
            width: 80,
            height: 44,
            fontSize: 28,
            lineHeight: "44px", // Centrage vertical du symbole
            textAlign: "center",
            padding: 0,
            cursor: current === 0 ? "not-allowed" : "pointer",
            transition: "background 0.15s"
          }}
        >←</button>
        <div style={{
          minWidth: 80,
          fontWeight: 500,
          color: "#b3baff",
          fontSize: 18,
          letterSpacing: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 44
        }}>
          {current + 1} / {cards.length}
        </div>
        <button
          onClick={() => setCurrent(c => Math.min(cards.length - 1, c + 1))}
          disabled={current === cards.length - 1}
          style={{
            background: "#353962",
            color: current === cards.length - 1 ? "#44496d" : "#b3baff",
            border: "none",
            borderRadius: 12,
            width: 80,
            height: 44,
            fontSize: 28,
            lineHeight: "44px", // Centrage vertical du symbole
            textAlign: "center",
            padding: 0,
            cursor: current === cards.length - 1 ? "not-allowed" : "pointer",
            transition: "background 0.15s"
          }}
        >→</button>
      </div>
      <Link to={`/sets/${id}`}>
        <button style={{
          background: "#353962",
          color: "#b3baff",
          border: "none",
          borderRadius: 12,
          padding: "9px 24px",
          fontWeight: 600,
          fontSize: 16,
          marginTop: 8,
          cursor: "pointer"
        }}>Retour</button>
      </Link>
      <div style={{marginTop:18, color:"#9fa0c9", fontSize:14}}>
        Cliquez sur la carte pour voir la réponse.
      </div>
    </div>
  );
}