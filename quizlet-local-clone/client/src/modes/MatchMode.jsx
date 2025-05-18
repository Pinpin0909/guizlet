import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

function shuffle(array) {
  return array.slice().sort(() => Math.random() - 0.5)
}

// Une carte est valide si on peut afficher au moins une face (texte ou image) pour chaque colonne
function isValidMatchCard(card) {
  // On accepte : term OU imageFront pour la face "terme"
  // et definition OU reponse OU imageBack pour la face "définition"
  return (
    (!!card.term || !!card.question || !!card.imageFront) &&
    (!!card.definition || !!card.reponse || !!card.imageBack)
  )
}

export default function MatchMode() {
  const { id } = useParams()
  const [cards, setCards] = useState([])
  const [pairs, setPairs] = useState([])
  const [selected, setSelected] = useState(null)
  const [matches, setMatches] = useState([])
  const [timer, setTimer] = useState(0)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    axios.get(`/api/sets/${id}`).then(r => {
      // Migration + filtrage
      const filtered = (r.data.cards || [])
        .map(card => ({
          ...card,
          imageFront: card.imageFront ?? card.image ?? "",
          imageBack: card.imageBack ?? "",
          term: card.term ?? card.question ?? "",
          definition: card.definition ?? card.reponse ?? "",
        }))
        .filter(isValidMatchCard)
      setCards(filtered)
    })
  }, [id])

  useEffect(() => {
    if (!cards.length) return
    setPairs(shuffle([
      ...cards.map(c => ({ ...c, type: 'term' })),
      ...cards.map(c => ({ ...c, type: 'definition' }))
    ]))
  }, [cards])

  useEffect(() => {
    let interval
    if (started && !finished) {
      interval = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [started, finished])

  const handleClick = (item, i) => {
    if (finished) return
    if (!selected) {
      setSelected({ item, i })
    } else {
      // Check match
      if (
        selected.item.type !== item.type &&
        (
          // match par id unique (privilégier si dispo)
          (selected.item.term === item.term && selected.item.definition === item.definition)
          ||
          (selected.item.term === item.definition && selected.item.definition === item.term)
        )
      ) {
        setMatches([...matches, selected.i, i])
        setSelected(null)
        if (matches.length + 2 === pairs.length) {
          setFinished(true)
        }
      } else {
        setSelected(null)
      }
    }
  }

  function handleStart() {
    setStarted(true)
    setTimer(0)
    setMatches([])
    setFinished(false)
    setPairs(shuffle([
      ...cards.map(c => ({ ...c, type: 'term' })),
      ...cards.map(c => ({ ...c, type: 'definition' }))
    ]))
  }

  if (!pairs.length) return <div>Chargement…</div>
  if (!started) {
    return (
      <div style={{
        maxWidth: 520,
        margin: '0 auto',
        textAlign: 'center',
        color: "#fff"
      }}>
        <h3 style={{
          color:"#b3baff",
          marginBottom:24,
          fontWeight:700,
          letterSpacing:1,
          fontSize: "2rem"
        }}>Associer</h3>
        <button onClick={handleStart} style={{
          background: "#353962",
          color: "#b3baff",
          border: "none",
          borderRadius: 12,
          padding: "9px 24px",
          fontWeight: 600,
          fontSize: 16,
          marginRight: 8,
          cursor: "pointer"
        }}>Démarrer</button>
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
  }

  function renderItemContent(item) {
    // Face "term" : imageFront au-dessus du texte si dispo
    if (item.type === 'term') {
      return (
        <div style={{display:"flex", flexDirection:"column", alignItems:"center"}}>
          {item.imageFront &&
            <img
              src={item.imageFront}
              alt=""
              style={{
                maxHeight: 54,
                maxWidth: 110,
                marginBottom: 6,
                borderRadius: 7,
                boxShadow: "0 1px 4px #23254133"
              }}
            />
          }
          <span>{item.term || item.question}</span>
        </div>
      )
    }
    // Face "definition" : imageBack au-dessus du texte si dispo
    return (
      <div style={{display:"flex", flexDirection:"column", alignItems:"center"}}>
        {item.imageBack &&
          <img
            src={item.imageBack}
            alt=""
            style={{
              maxHeight: 54,
              maxWidth: 110,
              marginBottom: 6,
              borderRadius: 7,
              boxShadow: "0 1px 4px #23254133"
            }}
          />
        }
        <span>{item.definition || item.reponse}</span>
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: 700,
      margin: '0 auto',
      textAlign: 'center',
      color: "#fff"
    }}>
      <h3 style={{
        color:"#b3baff",
        marginBottom:20,
        fontWeight:700,
        letterSpacing:1,
        fontSize: "2rem"
      }}>
        Associer
        <span style={{
          fontSize: 16,
          color: "#9fa0c9",
          marginLeft: 14,
          fontWeight: 400
        }}>({matches.length / 2} / {pairs.length / 2})</span>
      </h3>
      <div style={{
        color: "#b3baff",
        fontWeight: 600,
        fontSize: 17,
        marginBottom: 16,
        letterSpacing: 1
      }}>Temps : {timer}s</div>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        background: "#232541",
        borderRadius: 18,
        boxShadow: "0 4px 24px #181b3a66",
        minHeight: 340,
        margin: '2em auto 24px auto',
        padding: "30px 6px 16px 6px"
      }}>
        {pairs.map((item, i) =>
          <div
            key={i}
            onClick={() => !matches.includes(i) && handleClick(item, i)}
            style={{
              background: matches.includes(i)
                ? '#68d391'
                : selected && selected.i === i
                  ? '#faf089'
                  : '#353962',
              color: matches.includes(i)
                ? "#232541"
                : selected && selected.i === i
                  ? "#232541"
                  : "#fff",
              borderRadius: 12,
              boxShadow: '0 2px 8px #181b3a44',
              margin: 12,
              padding: '0.8em 2.2em',
              cursor: matches.includes(i) ? 'default' : 'pointer',
              minWidth: 120,
              minHeight: 34,
              fontSize: 18,
              fontWeight: 600,
              border: matches.includes(i)
                ? "2.2px solid #38a169"
                : selected && selected.i === i
                  ? "2.2px solid #ecc94b"
                  : "2px solid #232541",
              transition: "background 0.13s, color 0.13s, border 0.13s"
            }}
          >
            {renderItemContent(item)}
          </div>
        )}
      </div>
      {finished && (
        <div style={{
          fontSize: 20,
          margin: '1em 0',
          color: '#68d391',
          fontWeight: 600
        }}>
          Bravo ! Temps : <span style={{color: "#b3baff"}}>{timer}s</span>
        </div>
      )}
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 18,
        marginBottom: 18
      }}>
        <button onClick={handleStart} style={{
          background: "#353962",
          color: "#b3baff",
          border: "none",
          borderRadius: 12,
          padding: "9px 24px",
          fontWeight: 600,
          fontSize: 16,
          marginRight: 2,
          cursor: "pointer"
        }}>Recommencer</button>
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
        Associez chaque terme à sa définition (texte ou image) le plus vite possible.
      </div>
    </div>
  )
}