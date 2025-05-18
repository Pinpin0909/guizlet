import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

export default function EditSet() {
  const { id } = useParams()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  // Nouveau modèle: imageFront & imageBack
  const [cards, setCards] = useState([{ term: '', definition: '', imageFront: '', imageBack: '' }])
  const [saving, setSaving] = useState(false)
  const [fileError, setFileError] = useState("")
  const [separator, setSeparator] = useState(';')
  const navigate = useNavigate()

  useEffect(() => {
    if (id) {
      axios.get(`/api/sets/${id}`).then(r => {
        setTitle(r.data.title || "")
        setDescription(r.data.description || "")
        setCards(
          r.data.cards && r.data.cards.length
            ? r.data.cards.map(card => ({
                ...card,
                imageFront: card.imageFront ?? card.image ?? "",
                imageBack: card.imageBack ?? "",
                // compatibilité avec ancien modèle (image unique)
              }))
            : [{ term: '', definition: '', imageFront: '', imageBack: '' }]
        )
      })
    }
  }, [id])

  const handleCardChange = (i, field, value) => {
    const updated = [...cards]
    updated[i][field] = value
    setCards(updated)
  }

  const addCard = () =>
    setCards([...cards, { term: '', definition: '', imageFront: '', imageBack: '' }])

  const removeCard = (i) => {
    if (cards.length > 1) {
      setCards(cards.filter((_, idx) => idx !== i))
    }
  }

  const getActualSeparator = () =>
    separator === '\\t' ? '\t' : separator

  // L'import TXT ne gère que texte, à adapter si tu veux gérer les images en batch
  const handleTxtFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileError("")
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const sep = getActualSeparator()
        const lines = evt.target.result.split('\n').filter(l => l.trim())
        const imported = lines.map(line => {
          const [term, definition] = line.split(sep)
          if (!term && !definition) throw new Error("Ligne invalide: " + line)
          return { term: term?.trim() || "", definition: definition?.trim() || "", imageFront: "", imageBack: "" }
        })
        setCards(imported)
      } catch (err) {
        setFileError("Erreur de parsing: " + err.message)
      }
    }
    reader.readAsText(file)
  }

  // Validation : il faut au moins texte ou image sur chaque face
  const isCardValid = card =>
    (card.term || card.imageFront) && (card.definition || card.imageBack)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const filteredCards = cards.filter(isCardValid)
    if (id) {
      await axios.put(`/api/sets/${id}`, {
        title,
        description,
        cards: filteredCards
      })
    } else {
      await axios.post('/api/sets', {
        title,
        description,
        cards: filteredCards
      })
    }
    setSaving(false)
    navigate('/')
  }

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <h2>{id ? "Modifier la liste" : "Nouvelle liste de mots"}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Titre<br />
            <input value={title} onChange={e => setTitle(e.target.value)} required />
          </label>
        </div>
        <div>
          <label>Description<br />
            <input value={description} onChange={e => setDescription(e.target.value)} />
          </label>
        </div>
        <div>
          <h4>Mots</h4>
          <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <label>
              Importer depuis un fichier TXT&nbsp;:
              <input type="file" accept=".txt" onChange={handleTxtFile} style={{ marginLeft: 6 }} />
            </label>
            <label>
              Séparateur&nbsp;:
              <input
                type="text"
                value={separator}
                onChange={e => setSeparator(e.target.value)}
                style={{ width: 50, marginLeft: 4 }}
                maxLength={4}
                placeholder="; , \t"
                title="Saisissez le séparateur à utiliser (exemple : ; , ou \\t pour une tabulation)"
              />
            </label>
            <span style={{ color: 'red', marginLeft: 10 }}>{fileError}</span>
          </div>
          <div style={{ fontSize: 13, color: "#888" }}>
            Format attendu : <b>terme[séparateur]définition</b> par ligne.<br />
            Exemple séparateur tabulation : tapez <b>\t</b><br />
            <b>Le texte ou l'image (ou les deux) sont requis pour chaque face.</b>
          </div>
          {cards.map((card, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 15
            }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 0 }}>
                <div style={{ flex: '1 0 42%' }}>
                  <input
                    placeholder="URL image face avant"
                    value={card.imageFront || ""}
                    onChange={e => handleCardChange(i, 'imageFront', e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    onFocus={e => e.target.select()}
                  />
                </div>
                <div style={{ flex: '1 0 42%' }}>
                  <input
                    placeholder="URL image face arrière"
                    value={card.imageBack || ""}
                    onChange={e => handleCardChange(i, 'imageBack', e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    onFocus={e => e.target.select()}
                  />
                </div>
                <div style={{ width: 30 }}></div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <input
                  placeholder="Terme (face avant)"
                  value={card.term}
                  onChange={e => handleCardChange(i, 'term', e.target.value)}
                  required={!card.imageFront}
                  style={{ flex: '1 0 42%', boxSizing: 'border-box' }}
                />
                <input
                  placeholder="Définition (face arrière)"
                  value={card.definition}
                  onChange={e => handleCardChange(i, 'definition', e.target.value)}
                  required={!card.imageBack}
                  style={{ flex: '1 0 42%', boxSizing: 'border-box' }}
                />
                <button type="button" onClick={() => removeCard(i)} style={{ background: '#fed7d7', color: '#222' }}>✕</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addCard}>+ Ajouter un mot</button>
        </div>
        <div style={{ margin: '1em 0' }}>
          <button type="submit" disabled={saving}>Enregistrer</button>
        </div>
      </form>
      <button type="button" onClick={() => navigate('/')}>Annuler</button>
    </div>
  )
}