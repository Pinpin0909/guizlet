import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function EditSet() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cards, setCards] = useState([{ term: '', definition: '' }])
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  const handleCardChange = (i, field, value) => {
    const updated = [...cards]
    updated[i][field] = value
    setCards(updated)
  }

  const addCard = () => setCards([...cards, { term: '', definition: '' }])

  const removeCard = (i) => {
    if (cards.length > 1) {
      setCards(cards.filter((_, idx) => idx !== i))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await axios.post('/api/sets', {
      title,
      description,
      cards: cards.filter(c => c.term && c.definition)
    })
    setSaving(false)
    navigate('/')
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <h2>Nouvelle liste de mots</h2>
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
          {cards.map((card, i) => (
            <div key={i} style={{
              display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center'
            }}>
              <input
                placeholder="Terme"
                value={card.term}
                onChange={e => handleCardChange(i, 'term', e.target.value)}
                required
              />
              <input
                placeholder="Définition"
                value={card.definition}
                onChange={e => handleCardChange(i, 'definition', e.target.value)}
                required
              />
              <button type="button" onClick={() => removeCard(i)} style={{ background: '#fed7d7', color: '#222' }}>✕</button>
            </div>
          ))}
          <button type="button" onClick={addCard}>+ Ajouter un mot</button>
        </div>
        <div style={{ margin: '1em 0' }}>
          <button type="submit" disabled={saving}>Enregistrer</button>
        </div>
      </form>
      <button onClick={() => navigate('/')}>Annuler</button>
    </div>
  )
}