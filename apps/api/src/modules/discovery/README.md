# Módulo `discovery`

**Responsabilidad:** calcular el feed de perfiles descubribles según las preferencias mutuas, excluyendo perfiles ya vistos, bloqueados o con match existente. Implementa el patrón cache-aside sobre Redis (TTL de 5 min, invalidación al dar like o pass).

**Implementación:** Sprint 2 ([`docs/07-plan-trabajo.md`](../../../../../docs/07-plan-trabajo.md)).

**Referencias:** [`docs/04-api.md`](../../../../../docs/04-api.md#6-descubrimiento-discovery--cu-07) · [DIA-10](../../../../../docs/diagramas/DIA-10-secuencia-descubrimiento.md) · [ADR-0006](../../../../../docs/adr/0006-redis-en-upstash.md)
