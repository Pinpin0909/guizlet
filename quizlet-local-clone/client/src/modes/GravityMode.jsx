import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

function shuffle(array) {
  return array.slice().sort(() => Math.random() - 0.5)
}

export default function GravityMode() {
  const { id } = useParams()
  const [cards, setCards] = useState([])
  const [falling, setFalling] = useState([])
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [lost, setLost] = useState(false)
  const [level, setLevel] = useState(1)
  const intervalRef = useRef()

  useEffect(() => {
    axios.get(`/api/sets/${id}`).then(r => setCards(shuffle(r.data.cards || [])))
  }, [id])

  useEffect(() => {
    if (!cards.length || lost) return
    setFalling([])
    setInput('')
    setScore(0)
    setLevel(1)
    intervalRef.current = setInterval(() => {
      setFalling(fs => [
        ...fs,
        {
          ...shuffle(cards)[0],
          y: 0,
          speed: 1 + level * 0.5 + Math.random()
        }
      ])
    }, Math.max(1800 - level * 120, 400))
    return () => clearInterval(intervalRef.current)
    // eslint-disable-next-line
  }, [cards, lost, level])

  useEffect(() => {
    if (!falling.length || lost) return
    const anim = setInterval(() => {
      setFalling(fs => fs.map(f => ({ ...f, y: f.y + f.speed })))
    }, 40)
    return () => clearInterval(anim)
  }, [falling, lost])

  useEffect(() => {
    // Check for loss
    if (falling.some(f => f.y > 250)) {
      setLost(true)
      clearInterval(intervalRef.current)
    }
  }, [falling])

  const handleInput = e => {
    setInput(e.target.value)
    const matchIdx = falling.findIndex(f => (f.term || f.question).toLowerCase() === e.target.value.trim().toLowerCase())
    if (matchIdx !== -1) {
      setScore(score + 1)
      setFalling(falling.filter((_, i) => i !== matchIdx))
      setInput('')
      if ((score + 1) % 5 === 0) setLevel(lvl => lvl + 1)
    }
  }

  function restart() {
    setLost(false)
    setFalling([])
    setScore(0)
    setLevel(1)
    setInput('')
  }

  return (
    <div style={{maxWidth: 520, margin: "0 auto", textAlign: "center"}}>
      <h3 style={{
        color:"#b3baff",
        marginBottom:24,
        fontWeight:700,
        letterSpacing:1,
        fontSize: "2rem"
      }}>Gravité</h3>
      <div style={{
        color: "#b3baff",
        fontWeight: 600,
        fontSize: 17,
        marginBottom: 16,
        letterSpacing: 1
      }}>Niveau : {level} &nbsp; | &nbsp; Score : {score}</div>
      <div style={{
        position: 'relative',
        width: 340,
        height: 300,
        margin: '2em auto',
        background: "#232541",
        borderRadius: 18,
        boxShadow: "0 4px 24px #181b3a66",
        overflow: 'hidden',
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center"
      }}>
        {falling.map((f, i) =>
          <div key={i} style={{
            position: 'absolute',
            left: Math.abs((f.definition || f.reponse || "").length * 7 + i * 13) % 240,
            top: f.y,
            background: '#9f7aea',
            color: '#fff',
            borderRadius: 10,
            padding: '0.6em 1.2em',
            minWidth: 64,
            maxWidth: 210,
            fontSize: 18,
            boxShadow: "0 2px 12px #4736a644",
            textShadow: "1px 1px 2px #232541aa",
            whiteSpace: "nowrap",
            transition: 'top 0.1s'
          }}>
            {f.definition || f.reponse}
          </div>
        )}
        {lost && <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: '#232541ee',
          top: 0, left: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 27,
          color: '#f56565',
          fontWeight: 700,
          letterSpacing: 1,
          zIndex: 3,
          flexDirection: "column"
        }}>
          <div>Perdu !</div>
          <div style={{fontSize: 19, color: "#b3baff", marginTop: 6}}>Score final : {score}</div>
        </div>}
      </div>
      <form onSubmit={e => { e.preventDefault() }}>
        <input
          value={input}
          onChange={handleInput}
          placeholder="Tapez le terme correspondant"
          disabled={lost}
          style={{
            fontSize: 18,
            width: 270,
            border: lost ? '2px solid #e53e3e' : "1px solid #353962",
            background: "#232541",
            color: "#fff",
            borderRadius: 9,
            padding: "9px 14px",
            fontWeight: 500,
            marginBottom: 8,
            outline: "none",
            boxShadow: lost ? "0 0 0 2px #f5656522" : undefined,
            transition: "border 0.2s"
          }}
          autoFocus
        />
      </form>
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 18,
        margin: "18px 0"
      }}>
        <button onClick={restart} style={{
          background: "#353962",
          color: "#b3baff",
          border: "none",
          borderRadius: 12,
          padding: "9px 24px",
          fontWeight: 600,
          fontSize: 16,
          cursor: "pointer",
          marginRight: 2
        }}>Rejouer</button>
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
      <div style={{marginTop:10, color:"#9fa0c9", fontSize:14}}>
        Tapez le mot qui correspond à la définition qui tombe !
      </div>
    </div>
  )
}