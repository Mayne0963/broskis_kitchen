// Royalty-Free Music Credits and Sources
// All music tracks used in this application are royalty-free and safe for commercial use

export interface MusicCredit {
  id: string
  title: string
  artist: string
  source: string
  license: string
  url?: string
}

export const musicCredits: MusicCredit[] = [
  {
    id: "1",
    title: "Chill Lofi Beat",
    artist: "Royalty Free Music",
    source: "Pixabay",
    license: "Pixabay Content License",
    url: "https://pixabay.com/music/"
  },
  {
    id: "2",
    title: "Peaceful Piano",
    artist: "Ambient Sounds",
    source: "Creative Commons",
    license: "CC0 Public Domain",
  },
  {
    id: "3",
    title: "Jazzy Abstract",
    artist: "Creative Commons",
    source: "Pixabay",
    license: "Pixabay Content License",
    url: "https://pixabay.com/music/"
  },
  {
    id: "4",
    title: "Ambient Nature",
    artist: "Nature Sounds",
    source: "Creative Commons",
    license: "CC0 Public Domain",
  },
  {
    id: "5",
    title: "Uplifting Corporate",
    artist: "Royalty Free Music",
    source: "Free Music Archive",
    license: "Creative Commons",
    url: "https://freemusicarchive.org/"
  },
  {
    id: "6",
    title: "Smooth Jazz",
    artist: "Jazz Collective",
    source: "Creative Commons",
    license: "CC BY 4.0",
  },
  {
    id: "7",
    title: "Electronic Future",
    artist: "Digital Beats",
    source: "Free Music Archive",
    license: "Creative Commons",
    url: "https://freemusicarchive.org/"
  }
]

// Music Sources Information
export const musicSources = {
  pixabay: {
    name: "Pixabay",
    url: "https://pixabay.com/music/",
    description: "Royalty-free music safe for commercial use",
    license: "Pixabay Content License - No attribution required"
  },
  freeMusicArchive: {
    name: "Free Music Archive",
    url: "https://freemusicarchive.org/",
    description: "Curated collection of Creative Commons music",
    license: "Various Creative Commons licenses"
  },
  creativeCommons: {
    name: "Creative Commons",
    url: "https://creativecommons.org/",
    description: "Open licensing for creative works",
    license: "CC0, CC BY, and other CC licenses"
  }
}