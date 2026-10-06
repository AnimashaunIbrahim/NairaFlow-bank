/**
 * MSW Browser Worker — sets up the Service Worker for dev-mode mocking.
 */
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
