import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import axios from "axios";

function shuffle(array) {
  return array.slice().sort(() => Math.random() - 0.5);
}

export default function FlashcardsMode() {
  const { id } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const side = params.get("side") || "term"; // Récupère l'option de l'URL
  
  const [cards, setCards] = useState([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    axios.get(`/api/sets/${id}`).then(r => {
      const fixedCards = (r.data.cards || []).map(card => ({
        ...card,
        imageFront: card.imageFront ?? card.image ?? "",
        imageBack: card.imageBack ?? "",
      }));
      
      // Mélanger les cartes et les traiter en fonction du side
      const processedCards = shuffle(fixedCards).map(card => {
        if (side === "definition") {
          // Inverser terme et définition
          return {
            ...card,
            frontContent: card.definition || card.reponse || "",
            frontImage: card.imageBack || "",
            backContent: card.term || card.question || "",
            backImage: card.imageFront || ""
          };
        } else if (side === "both") {
          // Choisir au hasard si on affiche terme ou définition en premier
          const isTermFirst = Math.random() < 0.5;
          return {
            ...card,
            frontContent: isTermFirst ? (card.term || card.question || "") : (card.definition || card.reponse || ""),
            frontImage: isTermFirst ? (card.imageFront || "") : (card.imageBack || ""),
            backContent: isTermFirst ? (card.definition || card.reponse || "") : (card.term || card.question || ""),
            backImage: isTermFirst ? (card.imageBack || "") : (card.imageFront || "")
          };
        } else {
          // Mode par défaut: terme en premier
          return {
            ...card,
            frontContent: card.term || card.question || "",
            frontImage: card.imageFront || "",
            backContent: card.definition || card.reponse || "",
            backImage: card.imageBack || ""
          };
        }
      });
      
      setCards(processedCards);
    });
  }, [id, side]);

  // Remet la carte côté question quand on change de carte
  useEffect(() => {
    setFlipped(false);
  }, [current]);

  if (!cards.length) return <div>Chargement…</div>;

  const card = cards[current];

  function renderFront(card) {
    return (
      <div className="flip-card-face flip-card-front">
        {card.frontImage && (
          <img
            src={card.frontImage}
            alt=""
            style={{
              maxHeight: 110,
              maxWidth: 330,
              margin: "0 auto 10px auto",
              borderRadius: 10,
              boxShadow: "0 2px 8px #2224"
            }}
          />
        )}
        <span>{card.frontContent}</span>
      </div>
    );
  }

  function renderBack(card) {
    return (
      <div className="flip-card-face flip-card-back">
        {card.backImage && (
          <img
            src={card.backImage}
            alt=""
            style={{
              maxHeight: 110,
              maxWidth: 330,
              margin: "0 auto 10px auto",
              borderRadius: 10,
              boxShadow: "0 2px 8px #2224"
            }}
          />
        )}
        <span>{card.backContent}</span>
      </div>
    );
  }

  const getCardDescription = () => {
    // Selon le mode, indiquer ce qu'on voit en bas de la carte
    if (side === "definition") {
      return flipped ? "Terme" : "Définition";
    } else if (side === "both") {
      // Pour le mode les deux, on ne peut pas savoir à l'avance
      return flipped ? "Autre côté" : card.frontContent === (card.term || card.question) ? "Question" : "Définition";
    } else {
      return flipped ? "Définition" : "Question";
    }
  };

  return (
    <div style={{maxWidth: 520, margin: "0 auto", textAlign: "center"}}>
      <h3 style={{color:"#b3baff", marginBottom:24, fontWeight:700, letterSpacing:1}}>Cartes</h3>
      <div
        tabIndex={0}
        onClick={() => setFlipped(f => !f)}
        onKeyDown={e => (e.key === " " || e.key === "Enter") && setFlipped(f => !f)}
        aria-label="Cliquer pour retourner la carte"
        className={`flip-card${flipped ? " flipped" : ""}`}
        style={{
          width: "100%",
          maxWidth: 420,
          height: 220,
          margin: "0 auto 24px auto",
          background: "transparent",
          borderRadius: 18,
          cursor: "pointer",
          userSelect: "none",
          position: "relative",
          perspective: "1200px",
        }}
      >
        <div className="flip-card-inner" style={{
          width: "100%",
          height: "100%",
          borderRadius: 18,
          boxShadow: "0 4px 24px #181b3a66",
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 0.56s cubic-bezier(.45,1.7,.45,.8)",
          background: "#232541",
          color: "#fff",
          fontSize: 28,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)"
        }}>
          {renderFront(card)}
          {renderBack(card)}
        </div>
        <span style={{
          position: "absolute",
          bottom: 14,
          right: 24,
          color: "#9fa0c9",
          fontSize: 15,
          zIndex: 2,
        }}>
          {getCardDescription()}
        </span>
        {/* Animation CSS */}
        <style>
          {`
          .flip-card {
            perspective: 1200px;
            outline: none;
          }
          .flip-card-inner {
            width: 100%;
            height: 100%;
            position: relative;
            border-radius: 18px;
            transform-style: preserve-3d;
            transition: transform 0.56s cubic-bezier(.45,1.7,.45,.8);
          }
          .flip-card.flipped .flip-card-inner {
            transform: rotateY(180deg);
          }
          .flip-card-face {
            width: 100%;
            height: 100%;
            position: absolute;
            left: 0; top: 0;
            border-radius: 18px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            backface-visibility: hidden;
            background: #232541;
            color: #fff;
          }
          .flip-card-front {
            z-index: 2;
          }
          .flip-card-back {
            transform: rotateY(180deg);
            z-index: 2;
          }
          `}
        </style>
      </div>
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
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
            lineHeight: "44px",
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
            lineHeight: "44px",
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