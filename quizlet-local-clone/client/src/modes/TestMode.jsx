import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

// OUTILS
function shuffle(array) {
  return array.slice().sort(() => Math.random() - 0.5)
}

function randomBool() {
  return Math.random() > 0.5
}

// Similarité simple (Levenshtein) pour réponse écrite
function isSimilar(a, b) {
  if (!a || !b) return false
  a = a.trim().toLowerCase()
  b = b.trim().toLowerCase()
  if (a === b) return true
  // tolère une faute de frappe (distance <= 2)
  const dp = Array.from({length: a.length+1}, () => Array(b.length+1).fill(0))
  for (let i = 0; i <= a.length; i++) dp[i][0] = i
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[a.length][b.length] <= 2
}

// ECRAN DE CONFIGURATION
function TestConfig({onStart, cardCount}) {
  const [nb, setNb] = useState(10)
  const [types, setTypes] = useState({ mcq: true, tf: true, written: true, match: true })
  const [instant, setInstant] = useState(true)
  const [mix, setMix] = useState(true)
  return (
    <div style={{maxWidth:440,margin:"0 auto",color:"#fff",padding:40}}>
      <h2 style={{color:"#b3baff",marginBottom:16,fontWeight:700}}>Configurer le test</h2>
      <div style={{marginBottom:12}}>Nombre de questions :
        <input type="number" min={1} max={cardCount*3} value={nb}
          onChange={e=>setNb(+e.target.value)}
          style={{marginLeft:10,width:60}} />
      </div>
      <div style={{marginBottom:12}}>Types de questions :
        <label style={{marginLeft:10}}><input type="checkbox" checked={types.mcq} onChange={e=>setTypes(t=>({...t,mcq:e.target.checked}))}/> QCM</label>
        <label style={{marginLeft:10}}><input type="checkbox" checked={types.tf} onChange={e=>setTypes(t=>({...t,tf:e.target.checked}))}/> Vrai/Faux</label>
        <label style={{marginLeft:10}}><input type="checkbox" checked={types.written} onChange={e=>setTypes(t=>({...t,written:e.target.checked}))}/> Écrit</label>
        <label style={{marginLeft:10}}><input type="checkbox" checked={types.match} onChange={e=>setTypes(t=>({...t,match:e.target.checked}))}/> Association</label>
      </div>
      <div style={{marginBottom:12}}>
        <label><input type="checkbox" checked={mix} onChange={e=>setMix(e.target.checked)} /> Mélanger les questions</label>
      </div>
      <div style={{marginBottom:16}}>
        <label><input type="checkbox" checked={instant} onChange={e=>setInstant(e.target.checked)} /> Correction immédiate</label>
      </div>
      <button style={{padding:"8px 22px",background:"#353962",color:"#b3baff",border:"none",borderRadius:10,fontWeight:600,cursor:"pointer"}} onClick={()=>onStart({nb,types,instant,mix})}>Démarrer</button>
    </div>
  )
}

// AFFICHAGE D'UNE QUESTION + FEEDBACK
function QuestionView({q, onAnswer, feedback, instant, onNext, idx, total}) {
  return (
    <div>
      <div style={{marginBottom:14, color:"#b3baff",fontWeight:600,fontSize:16}}>
        Question {idx+1} / {total}
      </div>
      <div style={{
        background:"#232541",
        borderRadius:14,
        minHeight:120,
        padding:20,
        margin:"0 0 14px 0",
        fontSize:19,
        color:"#fff"
      }}>
        {q.type === "mcq" && (
          <>
            <div style={{marginBottom:18}}>{q.question}</div>
            {q.options.map(opt=>
              <button key={opt}
                disabled={!!feedback}
                onClick={()=>onAnswer(opt)}
                style={{
                  display:'block',width:'100%',margin:'8px 0',
                  background:feedback
                    ? (opt===q.answer ? "#68d391" : (feedback.user===opt ? "#fed7d7" :"#353962"))
                    : "#353962",
                  color: feedback ? (opt===q.answer ? "#232541" : (feedback.user===opt ? "#822727" : "#b3baff")) : "#b3baff",
                  border:"none",borderRadius:9,fontWeight:500,fontSize:16,padding:"8px 0",
                  cursor:feedback?"default":"pointer"
                }}>
                {opt}
              </button>
            )}
            {feedback && !feedback.correct &&
              <div style={{color:"#f56565",marginTop:6}}>Bonne réponse : <b>{q.answer}</b></div>
            }
          </>
        )}
        {q.type === "tf" && (
          <>
            <div style={{marginBottom:18}}>{q.question}</div>
            <button
              style={{
                background: feedback ? (q.answer===true?"#68d391":(feedback.user===true?"#fed7d7":"#353962")) : "#353962",
                color:feedback ? (q.answer===true?"#232541":(feedback.user===true?"#822727":"#b3baff")) : "#b3baff",
                border:"none",borderRadius:8,fontWeight:700,fontSize:16,marginRight:10,padding:"8px 25px",cursor:feedback?"default":"pointer"
              }}
              disabled={!!feedback}
              onClick={()=>onAnswer(true)}
            >Vrai</button>
            <button
              style={{
                background: feedback ? (q.answer===false?"#68d391":(feedback.user===false?"#fed7d7":"#353962")) : "#353962",
                color:feedback ? (q.answer===false?"#232541":(feedback.user===false?"#822727":"#b3baff")) : "#b3baff",
                border:"none",borderRadius:8,fontWeight:700,fontSize:16,padding:"8px 25px",cursor:feedback?"default":"pointer"
              }}
              disabled={!!feedback}
              onClick={()=>onAnswer(false)}
            >Faux</button>
            {feedback && !feedback.correct &&
              <div style={{color:"#f56565",marginTop:8}}>Bonne réponse : <b>{q.answer ? "Vrai" : "Faux"}</b></div>
            }
          </>
        )}
        {q.type==="written" && (
          <WrittenTest answer={q.answer} onCorrect={onAnswer} feedback={feedback} />
        )}
        {q.type==="match" && (
          <MatchTest pair={q.pair} onCorrect={onAnswer} feedback={feedback}/>
        )}
      </div>
      {instant && feedback &&
        <button onClick={onNext} style={{marginTop:10,background:"#353962",color:"#b3baff",border:"none",borderRadius:10,padding:"7px 20px",fontWeight:600,cursor:"pointer"}}>
          Suivant
        </button>
      }
    </div>
  )
}

function WrittenTest({ answer, onCorrect, feedback }) {
  const [val, setVal] = useState('')
  return (
    <form onSubmit={e => {
      e.preventDefault()
      if (!feedback) onCorrect(val)
    }} style={{display:"flex",alignItems:"center",gap:10,marginTop:16}}>
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder="Définition"
        style={{
          border: feedback
            ? (feedback.correct ? '2px solid #68d391' : "2px solid #f56565")
            : "1px solid #353962",
          background: "#232541",
          color: "#fff",
          borderRadius: 9,
          padding: "9px 14px",
          fontWeight: 500,
          fontSize: 18,
          outline: "none"
        }}
        disabled={!!feedback}
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
        cursor: feedback?"not-allowed":"pointer"
      }} disabled={!!feedback}>Valider</button>
      {feedback && !feedback.correct &&
        <span style={{color:"#f56565",marginLeft:10}}>Bonne réponse: <b>{answer}</b></span>
      }
    </form>
  )
}

function MatchTest({ pair, onCorrect, feedback }) {
  const [val, setVal] = useState('')
  return (
    <form onSubmit={e => {
      e.preventDefault()
      if (!feedback) onCorrect({term: pair.term, definition: val})
    }} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,marginTop:12}}>
      <div style={{marginBottom:4,color:"#b3baff"}}>{pair.term}</div>
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder="Définition correspondante"
        style={{
          border: feedback
            ? (feedback.correct ? '2px solid #68d391' : "2px solid #f56565")
            : "1px solid #353962",
          background: "#232541",
          color: "#fff",
          borderRadius: 9,
          padding: "9px 14px",
          fontWeight: 500,
          fontSize: 18,
          outline: "none"
        }}
        disabled={!!feedback}
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
        cursor: feedback?"not-allowed":"pointer"
      }} disabled={!!feedback}>Associer</button>
      {feedback && !feedback.correct &&
        <span style={{color:"#f56565",marginLeft:10}}>Bonne réponse: <b>{pair.definition}</b></span>
      }
    </form>
  )
}

// PAGE DE RESULTATS DETAILLEE
function ResultPage({questions, answers, timer, onRetry, id}) {
  const correct = answers.filter(ans=>ans.statut==="correct").length
  return (
    <div style={{maxWidth:540,margin:"0 auto",textAlign:"center",color:"#fff"}}>
      <h3 style={{color:"#b3baff",marginBottom:24,fontWeight:700,letterSpacing:1,fontSize:"2rem"}}>Test terminé !</h3>
      <div style={{color:"#b3baff",fontWeight:600,fontSize:18,marginBottom:10}}>Score: {correct} / {questions.length} ({Math.round(correct*100/questions.length)}%)</div>
      <div style={{color:"#9fa0c9",fontWeight:500,fontSize:17,marginBottom:20}}>Temps: {timer}s</div>
      <h4 style={{color:"#b3baff",marginTop:16}}>Détail des réponses :</h4>
      <div style={{textAlign:'left',margin:"16px auto 16px auto",background:"#232541",padding:18,borderRadius:12}}>
        {questions.map((q,i)=>
          <div key={i} style={{marginBottom:12}}>
            <div style={{fontWeight:600,color:"#b3baff"}}>Q{i+1}. {q.question || q.pair?.term}</div>
            <div style={{fontSize:15}}>
              <span>Votre réponse: </span>
              {answers[i]?.user !== undefined
                ? <b style={{color:answers[i].statut==="correct"?"#68d391":"#f56565"}}>{String(answers[i].user)}</b>
                : <span style={{color:"#888"}}>Non répondu</span>}
              {answers[i]?.statut==="faux" && (
                <span> | Bonne réponse: <b style={{color:"#b3baff"}}>{q.answer || q.pair?.definition}</b></span>
              )}
            </div>
          </div>
        )}
      </div>
      <button onClick={onRetry} style={{
        background:"#353962",color:"#b3baff",border:"none",borderRadius:12,
        padding:"9px 24px",fontWeight:600,fontSize:16,marginRight:16,cursor:"pointer"
      }}>Refaire le test</button>
      <Link to={`/sets/${id}`}>
        <button style={{
          background:"#353962",color:"#b3baff",border:"none",borderRadius:12,
          padding:"9px 24px",fontWeight:600,fontSize:16,cursor:"pointer"
        }}>Retour</button>
      </Link>
      <div style={{marginTop:18,color:"#9fa0c9",fontSize:14}}>
        <b>Astuce : </b>Refaites un mini-test sur vos erreurs pour progresser !
      </div>
    </div>
  )
}

// COMPOSANT PRINCIPAL
export default function TestMode() {
  const { id } = useParams()
  const [cards, setCards] = useState([])
  const [config, setConfig] = useState(null)
  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState(0)
  const [mode, setMode] = useState('config')
  const [timer, setTimer] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    axios.get(`/api/sets/${id}`).then(r => {
      setCards(r.data.cards || [])
    })
  }, [id])

  // Génération des questions selon config
  useEffect(() => {
    if (!config || !cards.length) return
    let q = []
    let typesArr = Object.entries(config.types).filter(([t,v])=>v).map(([t])=>t)
    let base = config.mix ? shuffle(cards) : [...cards]
    // Génère des questions du type demandé, de façon équilibrée
    let i = 0
    while(q.length < config.nb && i < base.length*4) {
      for(const type of typesArr) {
        if(q.length >= config.nb) break
        const card = base[i % base.length]
        if(type==="mcq") {
          q.push({
            type: 'mcq',
            question: card.term || card.question,
            options: shuffle([
              card.definition || card.reponse,
              ...shuffle(base.filter(c=>(c.term||c.question)!==(card.term||card.question))).slice(0,3).map(c=>c.definition||c.reponse)
            ]),
            answer: card.definition || card.reponse
          })
        }
        if(type==="tf") {
          const tf = randomBool()
          q.push({
            type: 'tf',
            question: (card.term||card.question)+' signifie "'+(tf?(card.definition||card.reponse):shuffle(base.filter(c=>(c.term||c.question)!==(card.term||card.question)))[0][ 'definition' in card ? 'definition':'reponse'])+'"',
            answer: tf ? true : false
          })
        }
        if(type==="match") {
          q.push({
            type: 'match',
            pair: { term: card.term || card.question, definition: card.definition || card.reponse }
          })
        }
        if(type==="written") {
          q.push({
            type: 'written',
            question: card.term || card.question,
            answer: card.definition || card.reponse
          })
        }
      }
      i++
    }
    if(config.mix) q = shuffle(q)
    q = q.slice(0, config.nb)
    setQuestions(q)
    setAnswers([])
    setIdx(0)
    setScore(0)
    setMode('test')
    setStarted(true)
    setFeedback(null)
    setTimer(0)
  }, [config, cards])

  // Chrono
  useEffect(() => {
    let interval
    if (started && mode === 'test') {
      interval = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [started, mode])

  // Gestion de la réponse utilisateur
  function handleAnswer(resp) {
    const q = questions[idx]
    let correct = false
    if(q.type==="written")
      correct = isSimilar(resp, q.answer)
    else if(q.type==="mcq")
      correct = resp === q.answer
    else if(q.type==="tf")
      correct = resp === q.answer
    else if(q.type==="match")
      correct = isSimilar(resp.definition, q.pair.definition)
    if(config.instant) {
      setFeedback({ correct, user: resp })
      setAnswers(anss => {
        const arr = [...anss]
        arr[idx]={statut:correct?"correct":"faux",user:resp}
        return arr
      })
      if(correct) setScore(s=>s+1)
    } else {
      setAnswers(anss => {
        const arr = [...anss]
        arr[idx]={statut:correct?"correct":"faux",user:resp}
        return arr
      })
      if(correct) setScore(s=>s+1)
      if(idx+1 < questions.length) setIdx(idx+1)
      else setMode('done')
    }
  }

  // Gestion du passage à la question suivante (en correction immédiate)
  function handleNext() {
    setFeedback(null)
    if(idx+1 < questions.length) setIdx(idx+1)
    else setMode('done')
  }

  function handleRetry() {
    setConfig(null)
    setMode('config')
    setStarted(false)
    setAnswers([])
    setQuestions([])
    setTimer(0)
    setScore(0)
    setIdx(0)
    setFeedback(null)
  }

  // Affichage
  if(mode==="config") {
    return <TestConfig onStart={setConfig} cardCount={cards.length}/>
  }
  if(!questions.length) return <div>Chargement…</div>
  if(mode==="done") {
    return <ResultPage questions={questions} answers={answers} timer={timer} onRetry={handleRetry} id={id} />
  }
  const q = questions[idx]
  return (
    <div style={{maxWidth:540,margin:"0 auto",paddingTop:24}}>
      <div style={{height:8,background:"#232541",borderRadius:6,overflow:"hidden",marginBottom:18}}>
        <div style={{
          width:`${(idx+1)/questions.length*100}%`,
          background:"#b3baff",height:8,transition:"width 0.3s"
        }}/>
      </div>
      <div style={{color:"#b3baff",fontWeight:600,fontSize:17,marginBottom:10,letterSpacing:1}}>
        Temps : {timer}s
      </div>
      <QuestionView
        q={q}
        onAnswer={handleAnswer}
        feedback={feedback}
        instant={config.instant}
        onNext={handleNext}
        idx={idx}
        total={questions.length}
      />
      {!config.instant && (
        <div style={{display:"flex",justifyContent:"center",gap:18,margin:"16px 0"}}>
          <button
            onClick={()=>setIdx(i=>Math.max(0,i-1))}
            disabled={idx===0}
            style={{
              background:"#353962",
              color:idx===0?"#44496d":"#b3baff",
              border:"none",borderRadius:12,width:44,height:44,
              fontSize:28,lineHeight:"44px",cursor:idx===0?"not-allowed":"pointer"
            }}>←</button>
          <div style={{
            minWidth:80,fontWeight:500,color:"#b3baff",fontSize:18,letterSpacing:1,
            display:"flex",alignItems:"center",justifyContent:"center",height:44
          }}>{idx+1} / {questions.length}</div>
          <button
            onClick={()=>setIdx(i=>Math.min(questions.length-1,i+1))}
            disabled={idx===questions.length-1}
            style={{
              background:"#353962",
              color:idx===questions.length-1?"#44496d":"#b3baff",
              border:"none",borderRadius:12,width:44,height:44,
              fontSize:28,lineHeight:"44px",cursor:idx===questions.length-1?"not-allowed":"pointer"
            }}>→</button>
        </div>
      )}
      <Link to={`/sets/${id}`}>
        <button style={{
          background:"#353962",color:"#b3baff",border:"none",borderRadius:12,
          padding:"9px 24px",fontWeight:600,fontSize:16,cursor:"pointer"
        }}>Retour</button>
      </Link>
      <div style={{marginTop:18,color:"#9fa0c9",fontSize:14}}>
        Testez-vous avec différents types de questions et options !
      </div>
    </div>
  )
}