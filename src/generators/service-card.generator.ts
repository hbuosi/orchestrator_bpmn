import type { ServiceCard } from '../schemas/service-card.schema.js';
import { serviceCardTemplate } from '../templates/service-card.html.js';

export function generateServiceCardHtml(card: ServiceCard): string {
  return serviceCardTemplate(card);
}
