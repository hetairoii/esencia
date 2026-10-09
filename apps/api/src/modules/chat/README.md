# Módulo `chat`

**Responsabilidad:** mensajería en tiempo real mediante Socket.IO (namespace `/chat`) entre usuarios con match, con historial persistido y paginado y marcado de leído/no leído. Utiliza el adaptador de Redis para sincronizar eventos entre réplicas del backend.

**Implementación:** Sprint 3 ([`docs/07-plan-trabajo.md`](../../../../../docs/07-plan-trabajo.md)).

**Referencias:** [`docs/04-api.md`](../../../../../docs/04-api.md#8-chat-chat--cu-10) · [DIA-12](../../../../../docs/diagramas/DIA-12-secuencia-mensaje.md) · [ADR-0005](../../../../../docs/adr/0005-socket-io-tiempo-real.md)
