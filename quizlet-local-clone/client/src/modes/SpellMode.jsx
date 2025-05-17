import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

export default function SpellMode() {
  const { id } = useParams()
  const [cards, setCards] = useState([])
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [error, setError] = useState(false)
  const synth = useRef(window.speechSynthesis)

  useEffect(() => {
    axios.get(`/api/sets/${id}`).then(r => setCards(r.data.cards || []))
  }, [id])

  useEffect(() => {
    if (cards.length && cards[idx]) {
      playAudio(cards[idx].term || cards[idx].question)
    }
    // eslint-disable-next-line
  }, [cards, idx])

  function playAudio(text) {
    if ('speechSynthesis' in window && !!text) {
      const utter = new window.SpeechSynthesisUtterance(text)
      utter.lang = 'fr-FR'
      synth.current.speak(utter)
    }
  }

  if (!cards.length) return <div>Chargement…</div>
  if (finished)
    return (
      <div style={{
        maxWidth: 520,
        margin: "0 auto",
        textAlign: 'center',
        color: "#fff"
      }}>
        <h3 style={{
          color: "#b3baff",
          marginBottom: 24,
          fontWeight: 700,
          letterSpacing: 1,
          fontSize: "2rem"
        }}>Score : {score} / {cards.length}</h3>
        <Link to={`/sets/${id}`}>
          <button style={{
            background: "#353962",
            color: "#b3baff",
            border: "none",
            borderRadius: 12,
            padding: "9px 24px",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer"
          }}>Retour</button>
        </Link>
      </div>
    )

  const card = cards[idx]

  const handleSubmit = e => {
    e.preventDefault()
    const answer = (card.term || card.question || "").trim().toLowerCase()
    if (input.trim().toLowerCase() === answer) {
      setScore(score + 1)
      setError(false)
    } else {
      setError(true)
    }
    setInput('')
    setTimeout(() => {
      if (idx + 1 < cards.length) {
        setIdx(idx + 1)
        setError(false)
      } else {
        setFinished(true)
      }
    }, 700)
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
      <h3 style={{
        color: "#b3baff",
        marginBottom: 24,
        fontWeight: 700,
        letterSpacing: 1,
        fontSize: "2rem"
      }}>
        Dictée
        <span style={{
          fontSize: 16,
          color: "#9fa0c9",
          marginLeft: 14,
          fontWeight: 400
        }}>({idx + 1} / {cards.length})</span>
      </h3>
      <div style={{
        background: "#232541",
        borderRadius: 18,
        boxShadow: "0 4px 24px #181b3a66",
        padding: 32,
        minHeight: 140,
        margin: "0 auto 22px auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        fontWeight: 500,
        color: "#fff",
        position: "relative",
        transition: "background 0.2s"
      }}>
        <div style={{ fontSize: 20, marginBottom: 20 }}>
          <button
            onClick={() => playAudio(card.term || card.question)}
            style={{
              background: "#353962",
              color: "#b3baff",
              border: "none",
              borderRadius: 8,
              padding: "8px 20px",
              fontWeight: 600,
              fontSize: 18,
              cursor: "pointer",
              boxShadow: "0 2px 8px #181b3a33"
            }}
          >🔊 Écouter</button>
        </div>
        <form onSubmit={handleSubmit} style={{display: "flex", alignItems: "center", gap: 10}}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{
              border: error ? '2px solid #f56565' : "1px solid #353962",
              background: "#232541",
              color: "#fff",
              borderRadius: 9,
              padding: "9px 14px",
              fontWeight: 500,
              fontSize: 18,
              outline: "none",
              boxShadow: error ? "0 0 0 2px #f5656522" : undefined,
              transition: "border 0.2s"
            }}
            placeholder="Recopiez ce que vous entendez"
            autoFocus
          />
          <button type="submit" style={{
            background: "#353962",
            color: "#b3baff",
            border: "none",
            borderRadius: 8,
            padding: "7px 18px",
            fontWeight: 500,
            fontSize: 16,
            cursor: "pointer"
          }}>Valider</button>
        </form>
        {error && <div style={{ color: '#f56565', marginTop: 8 }}>Mauvaise réponse !</div>}
      </div>
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 18,
        marginBottom: 18
      }}>
        <button
          onClick={() => setIdx(i => Math.max(0, i - 1))}
          disabled={idx === 0}
          style={{
            background: "#353962",
            color: idx === 0 ? "#44496d" : "#b3baff",
            border: "none",
            borderRadius: 12,
            width: 44,
            height: 44,
            fontSize: 28,
            lineHeight: "44px",
            textAlign: "center",
            padding: 0,
            cursor: idx === 0 ? "not-allowed" : "pointer",
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
          {idx + 1} / {cards.length}
        </div>
        <button
          onClick={() => setIdx(i => Math.min(cards.length - 1, i + 1))}
          disabled={idx === cards.length - 1}
          style={{
            background: "#353962",
            color: idx === cards.length - 1 ? "#44496d" : "#b3baff",
            border: "none",
            borderRadius: 12,
            width: 44,
            height: 44,
            fontSize: 28,
            lineHeight: "44px",
            textAlign: "center",
            padding: 0,
            cursor: idx === cards.length - 1 ? "not-allowed" : "pointer",
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
          cursor: "pointer"
        }}>Retour</button>
      </Link>
      <div style={{marginTop:18, color:"#9fa0c9", fontSize:14}}>
        Cliquez sur <b>Écouter</b> puis recopiez le mot entendu.
      </div>
    </div>
  )
}