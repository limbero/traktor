export interface StreamingService {
  clear_name: string;
  icon: string;
  technical_name: string;
};

export interface StreamingLocation {
  clear_name: string;
  icon: string;
  technical_name: string;
  url: string;
};

class TraktorStreaming {
  static async get(url: string) {

    return fetch(url, { signal: AbortSignal.timeout(5000) }).then((response) => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json();
    }).catch(() => {
      return [];
    });
  }

  static async getAllServices(): Promise<StreamingService[]> {
    return TraktorStreaming.get("https://home.limbe.ro/trast/traktor-streamers")
      .then((services: StreamingService[]) => services.sort((a, b) => a.clear_name.toLowerCase().localeCompare(b.clear_name.toLowerCase())));
  }

  static async getLocationsForShow(title: string): Promise<StreamingLocation[]> {
    return TraktorStreaming.get(`https://home.limbe.ro/trast/traktor-streaming?title=${encodeURIComponent(title)}`)
      .catch((_: Error) => []);
  }
}

export default TraktorStreaming;
