import API_CONFIG from '../config/api';

export async function sendChatMessage(message: string, sessionId: string) {
  try {
    const params = new URLSearchParams({
      message,
      timestamp: new Date().toISOString(),
      sessionId
    });
    
    const response = await fetch(`${API_CONFIG.CHAT_ENDPOINT}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Chat API Error:', error);
    throw error;
  }
}