# infra — Infraestructura como código

## Estado

Los proveedores del MVP (Vercel, Render, Supabase y Upstash; ver [`docs/05-modelos-cloud.md`](../docs/05-modelos-cloud.md)) son servicios PaaS, DBaaS y SaaS administrados, configurados desde sus propios paneles o mediante integraciones con GitHub. Por ello, la infraestructura no está definida como código en esta fase.

## Plan

Se prevé utilizar **Terraform** con el [provider de Render](https://registry.terraform.io/providers/render-oss/render/latest) para declarar al menos un componente, por ejemplo el Web Service de la API y sus variables de entorno no sensibles (Sprint 5, [`docs/07-plan-trabajo.md`](../docs/07-plan-trabajo.md)).

Una vez implementado, el directorio contendrá:

```
infra/
├── main.tf
├── variables.tf
├── outputs.tf
└── terraform.tfvars.example
```

Este README incluirá entonces las instrucciones de `terraform init`, `plan` y `apply`, y se registrará un ADR con la herramienta y el alcance elegidos.
