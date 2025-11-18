export interface IMailTemplate {
  render(data: Record<string, any>): string;
}
