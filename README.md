# Miriã Cotrim Bridal Beauty

Site definitivo em Next.js, TypeScript e Tailwind CSS, preparado para deploy via GitHub + Vercel.

## Páginas

- Home
- About
- Services
- Bridal
- Portfolio
- Book
- Contact

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase para formulários, serviços e regras de agenda
- Google Calendar API para consultar horários ocupados e criar eventos pendentes

## Como rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Depois abra `http://localhost:3000`.

## Variáveis de ambiente

Configure em `.env.local` no desenvolvimento e em **Vercel > Project Settings > Environment Variables** na produção:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
CONTACT_NOTIFICATION_EMAIL=
BOOKING_TIMEZONE=America/New_York
GOOGLE_CALENDAR_ID=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
```

`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REFRESH_TOKEN` são segredos de servidor. Não coloque esses valores no browser nem publique no repositório.

## Supabase

1. Crie ou abra o projeto no Supabase.
2. Abra **SQL Editor**.
3. Execute o arquivo `supabase/schema.sql`.
4. Copie `Project URL`, `anon public key` e `service_role key`.
5. Configure as variáveis no Vercel.

Tabelas principais:

| Tabela | Uso |
| --- | --- |
| `contact_messages` | Mensagens do formulário Contact |
| `bridal_inquiries` | Pedidos da página Bridal |
| `newsletter_subscribers` | Formulário “Join our Beauty List” |
| `services` | Serviços, duração, buffers, ordem e status |
| `availability_rules` | Dias e janelas padrão de disponibilidade |
| `blackout_dates` | Datas bloqueadas manualmente |
| `booking_requests` | Pedidos de agendamento enviados pela página Book |

Formulários e rotas:

| Formulário | Rota | Tabela |
| --- | --- | --- |
| Contact | `POST /api/contact` | `contact_messages` |
| Bridal inquiry | `POST /api/bridal` | `bridal_inquiries` |
| Book | `POST /api/booking` | `booking_requests` |
| Join our Beauty List | `POST /api/newsletter` | `newsletter_subscribers` |

## Serviços e disponibilidade

O arquivo `supabase/schema.sql` cria os serviços iniciais:

| Serviço | Duração | Disponibilidade inicial |
| --- | ---: | --- |
| Bridal Trial | 120 min | Domingo a sábado, 9am-5pm |
| Hair + Makeup | 120 min | Domingo a sábado, 9am-5pm |
| Hair Treatment | 60 min | Domingo a sábado, 9am-5pm |
| Haircut | 30 min | Domingo a sábado, 9am-5pm |
| Special Events | 240 min | Domingo a sábado, 9am-5pm |
| Hair Styling | 60 min | Domingo a sábado, 9am-5pm |
| Makeup | 60 min | Domingo a sábado, 9am-5pm |
| Bridal Consultation | 30 min | Domingo a sábado, 9am-5pm |

Para alterar serviços pelo Supabase, edite a tabela `services`:

- `name`: nome visível no site
- `duration_minutes`: duração usada para calcular slots
- `buffer_before_minutes` e `buffer_after_minutes`: bloqueios antes/depois do atendimento
- `active`: mostra ou esconde o serviço no site
- `sort_order`: ordem na página Book

Para alterar disponibilidade padrão, edite `availability_rules`:

- `day_of_week`: `0` domingo, `1` segunda, até `6` sábado
- `start_time` e `end_time`: janela disponível
- `service_id`: deixe vazio para regra global ou preencha para regra específica de um serviço
- `active`: ativa/desativa a regra

Para bloquear dias específicos, use `blackout_dates`.

## Google Calendar

A página Book não mostra widget do Calendly. Ela usa uma agenda customizada:

1. O site busca serviços ativos no Supabase.
2. O usuário escolhe serviço e data.
3. A API calcula horários com base na duração do serviço e regras do Supabase.
4. A API consulta `freeBusy` no Google Calendar e remove horários ocupados.
5. Ao enviar, a API valida o slot novamente.
6. A API cria um evento `tentative` no Google Calendar com título `Pending: ...`.
7. A API grava o pedido em `booking_requests` no Supabase.

Para ativar Google Calendar, você precisa criar/configurar no Google Cloud:

1. Projeto Google Cloud.
2. OAuth consent screen.
3. OAuth Client ID do tipo Web Application.
4. Refresh token com escopo `https://www.googleapis.com/auth/calendar`.
5. Calendar ID da agenda da cliente.
6. Variáveis `GOOGLE_CALENDAR_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REFRESH_TOKEN` no Vercel.

## Rotas de agenda

- `GET /api/services`: lista serviços ativos.
- `GET /api/availability?service=haircut&start=2026-10-02&end=2026-10-02`: retorna slots disponíveis.
- `POST /api/booking`: cria pedido pendente no Supabase e evento tentativo no Google Calendar.

## Deploy via GitHub + Vercel

```bash
git init
git add .
git commit -m "Build dynamic booking site with Supabase and Google Calendar"
git branch -M main
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```

No Vercel:

1. Clique em **Add New Project**.
2. Importe o repositório do GitHub.
3. Confirme o framework como **Next.js**.
4. Configure as variáveis de ambiente.
5. Faça o deploy.
6. Teste Home, About, Services, Bridal, Portfolio, Book e Contact.
7. Envie testes dos formulários e confirme os registros no Supabase.
8. Teste Book e confirme a criação do evento pendente no Google Calendar.

## Manutenção de conteúdo

Textos, links, navegação e redes sociais ficam em:

- `app/siteContent.ts`

Fotos ficam em:

- `public/images`

Serviços e agenda ficam no Supabase, não no código.

## Observação sobre e-mail

O Supabase grava os dados, mas não envia alerta por e-mail automaticamente. `CONTACT_NOTIFICATION_EMAIL` está reservado para futura ativação de notificação com Resend, SendGrid ou outro provedor.
