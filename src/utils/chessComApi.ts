// Chess.com API service for fetching player data

export interface ChessComPlayer {
  username: string;
  avatar?: string;
  country?: string;
  followers?: number;
  isStreamer?: boolean;
  status?: string;
  title?: string; // GM, IM, FM, etc.
  joined?: number;
  lastOnline?: number;
  bestRating?: number;
  bestRatingDate?: number;
}

// Famous chess YouTubers and Grandmasters
const FAMOUS_PLAYERS = [
  // Grandmasters
  'MagnusCarlsen',
  'Hikaru',
  'GothamChess',
  'DanielNaroditsky',
  ' levy_rozman',
  'Anna_Chess',
  'alexandrabotez',
  'AndreaBotez',
  'Giri',
  'AnishGiri',
  'FabianoCaruana',
  'Wesley_So',
  'DingLiren',
  'AlirezaFirouzja',
  'IanNepomniachtchi',
  'ViditGupta',
  'Erigaisi',
  'Praggnanandhaa',
  'NihalSarin',
  'RaunakSadhwani',
  // Streamers
  'xQcOW',
  ' Ludwig',
  'sykkuno',
  'boxbox',
  'Fuslie',
  'QTCinderella',
  'Pokimane',
  'DisguisedToast',
  'Scarra',
  'LilyPichu',
  'MichaelReeves',
  'Yvonnie',
  'BrodieSmith',
  // Chess personalities
  'agadmator',
  'EricRosen',
  'BenFinegold',
  'Kingscrusher',
  'ChessNetwork',
  'JohnBartholomew',
  'Chessbrah',
  'Hansen',
  'AmanHambleton',
  'Keevin',
];

// Cache for player data
const playerCache = new Map<string, ChessComPlayer>();

export async function getPlayerProfile(username: string): Promise<ChessComPlayer | null> {
  if (playerCache.has(username)) {
    return playerCache.get(username)!;
  }

  try {
    const response = await fetch(`https://api.chess.com/pub/player/${username.toLowerCase()}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    
    // Fetch stats
    const statsResponse = await fetch(`https://api.chess.com/pub/player/${username.toLowerCase()}/stats`);
    let bestRating = 0;
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      const ratings = [
        stats.chess_rapid?.best?.rating,
        stats.chess_blitz?.best?.rating,
        stats.chess_bullet?.best?.rating,
        stats.chess_daily?.best?.rating,
      ].filter(Boolean);
      bestRating = ratings.length > 0 ? Math.max(...ratings) : 0;
    }

    const player: ChessComPlayer = {
      username: data.username,
      avatar: data.avatar,
      country: data.country,
      followers: data.followers,
      isStreamer: data.is_streamer,
      status: data.status,
      title: data.title,
      joined: data.joined,
      lastOnline: data.last_online,
      bestRating,
    };

    playerCache.set(username, player);
    return player;
  } catch (error) {
    console.error(`Failed to fetch player ${username}:`, error);
    return null;
  }
}

export async function getRandomFamousPlayers(count: number = 3): Promise<ChessComPlayer[]> {
  const shuffled = [...FAMOUS_PLAYERS].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);
  
  const players: ChessComPlayer[] = [];
  for (const username of selected) {
    const player = await getPlayerProfile(username);
    if (player) {
      players.push(player);
    }
  }
  
  return players;
}

export function getTitleDisplay(title?: string): string {
  const titles: { [key: string]: string } = {
    'GM': 'Grandmaster',
    'WGM': 'Woman Grandmaster',
    'IM': 'International Master',
    'WIM': 'Woman International Master',
    'FM': 'FIDE Master',
    'WFM': 'Woman FIDE Master',
    'NM': 'National Master',
    'CM': 'Candidate Master',
    'WCM': 'Woman Candidate Master',
  };
  return title ? titles[title] || title : '';
}
