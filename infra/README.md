# infra — Infraestructura como Código (bonus)

El enunciado del proyecto otorga una bonificación adicional por usar IaC (Terraform, OpenTofu o CloudFormation), pero lo marca explícitamente como **opcional** (sección 4 de `docs/referencia/proyectoNube.md`).

## Estado en esta fase

Ninguno de los proveedores elegidos para el MVP (Vercel, Render, Supabase, Upstash — ver `docs/05-modelos-cloud.md`) requiere aprovisionamiento manual de infraestructura de bajo nivel: son todos PaaS/DBaaS/SaaS administrados, configurados a través de sus propios paneles o integraciones con GitHub. Por eso, en el 1.er corte de revisión **no hay IaC** — es una decisión consciente de alcance, no un olvido, documentada aquí para que quede explícita esta decisión.

## Plan para el bonus (Sprint 5, `docs/07-plan-trabajo.md`)

Si el equipo decide perseguir el bonus, la vía más natural es usar **Terraform** con el [provider de Render](https://registry.terraform.io/providers/render-oss/render/latest) (u otro de los proveedores usados) para declarar como código al menos un componente — por ejemplo, el Web Service de la API y sus variables de entorno no sensibles — en lugar de configurarlo manualmente desde el panel.

Cuando se implemente, este directorio contendrá:

```
infra/
├── main.tf
├── variables.tf
├── outputs.tf
└── terraform.tfvars.example
```

Y este `README.md` se actualizará con las instrucciones de `terraform init/plan/apply`, referenciado desde [`docs/07-plan-trabajo.md`](../docs/07-plan-trabajo.md) y desde un nuevo ADR que justifique la elección de herramienta y alcance del IaC.
