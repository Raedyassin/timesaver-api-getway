import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs'; // Helper to convert Observable to Promise

@Injectable()
export class AiService {
  constructor(private readonly httpService: HttpService) {}

  /**
   * Calls the Python FastAPI endpoint to get a summary.
   */
  async getSummary(): Promise<any> {
    // We don't need to add headers here! They are auto-added by the Module.
    try {
      const response = await firstValueFrom(
        this.httpService.post('/summary', {}),
      );

      return response.data; // Return the JSON data from Python
    } catch (error) {
      // Handle errors (e.g., Python server down or 403 Forbidden)
      console.error('Error calling AI Service:', error.message);
      throw new Error('Failed to process video with AI');
    }
  }

  /**
   * Calls the Python FastAPI endpoint for Q/A
   */
  async askQuestion(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post('/ask-question', {}),
      );
      return response.data;
    } catch {
      throw new Error('Failed to ask question');
    }
  }
}
