/**
 * Bundled so the quote widget needs no network request and works offline --
 * consistent with santi.tab not phoning anywhere. Users can replace this list
 * entirely with their own under Widgets -> Quotes.
 */
export type Quote = { text: string; author: string }

export const QUOTES: Quote[] = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Fall seven times, stand up eight.", author: "Japanese proverb" },
  { text: "The best time to plant a tree was twenty years ago. The second best time is now.", author: "Chinese proverb" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "What we think, we become.", author: "Buddha" },
  { text: "An unexamined life is not worth living.", author: "Socrates" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "No man ever steps in the same river twice.", author: "Heraclitus" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
  { text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu" },
  { text: "Perfection is achieved when there is nothing left to take away.", author: "Antoine de Saint-Exupéry" },
  { text: "The important thing is not to stop questioning.", author: "Albert Einstein" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie" },
  { text: "I have not failed. I've just found ten thousand ways that won't work.", author: "Thomas Edison" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "The obstacle is the way.", author: "Marcus Aurelius" },
  { text: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison" },
  { text: "If you want to go fast, go alone. If you want to go far, go together.", author: "African proverb" },
  { text: "A ship in harbour is safe, but that is not what ships are built for.", author: "John A. Shedd" },
  { text: "The mind is everything. What you think, you become.", author: "Buddha" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  { text: "Either write something worth reading or do something worth writing.", author: "Benjamin Franklin" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "That which does not kill us makes us stronger.", author: "Friedrich Nietzsche" },
  { text: "Courage is grace under pressure.", author: "Ernest Hemingway" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Continuous improvement is better than delayed perfection.", author: "Mark Twain" },
  { text: "Not all those who wander are lost.", author: "J. R. R. Tolkien" },
  { text: "Little by little, one travels far.", author: "J. R. R. Tolkien" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },
  { text: "Whatever you are, be a good one.", author: "Abraham Lincoln" },
  { text: "The best way out is always through.", author: "Robert Frost" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
  { text: "Premature optimization is the root of all evil.", author: "Donald Knuth" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
]

/**
 * Parses a user-supplied line into a quote. Everything after the last " - "
 * or " — " is treated as the author.
 */
export const parseQuote = (line: string): Quote | null => {
  const trimmed = line.trim()
  if (!trimmed) return null

  const match = trimmed.match(/^(.*?)\s+[-—–]\s+([^-—–]+)$/)
  if (!match) return { text: trimmed, author: "" }

  return { text: match[1].trim(), author: match[2].trim() }
}

/** Stable per-day index so every tab opened today shows the same quote. */
export const dailyIndex = (now: Date, length: number) => {
  if (length <= 0) return 0

  const days = Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000
  )

  return days % length
}
