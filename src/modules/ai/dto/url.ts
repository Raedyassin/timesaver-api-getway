import { IsString, IsNotEmpty, IsUrl, Matches } from 'class-validator';

export class URLDto {
  @IsString()
  @IsNotEmpty()

  // Option A: Check if it's ANY valid URL (http/https)
  @IsUrl({ protocols: ['http', 'https'], require_tld: true })

  // Option B: Check SPECIFICALLY for YouTube (Recommended)
  // This regex covers youtube.com, m.youtube.com, youtu.be, www.youtube.com
  @Matches(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/, {
    message: 'URL must be a valid YouTube link',
  })
  youtubeUrl: string;
}
