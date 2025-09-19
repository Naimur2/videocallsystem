export function cn(...inputs: string[]): string {
  return inputs.filter(Boolean).join(' ');
}

export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function generateParticipantName(): string {
  const adjectives = ["Happy", "Smart", "Kind", "Bright", "Cool"];
  const nouns = ["User", "Participant", "Guest", "Member", "Attendee"];
  
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
