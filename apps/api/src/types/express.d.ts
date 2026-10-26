declare global {
  namespace Express {
    interface Request {
      /** Id del usuario autenticado; lo establece `requireAuth` (módulo auth). */
      userId?: string;
    }
  }
}

export {};
