import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  accounts,
  actionItems,
  clients,
  consultingSessions,
  db,
  diagnostics,
  goals,
  indicators,
  memberships,
  organizations,
  sessionsAuth,
  users,
  verifications,
} from "./index";

const DEMO_TRANSCRIPT = `Daniel: Vamos organizar o diagnostico da Donna Elegante.
Cliente: Nosso maior problema e o fluxo de caixa. Vendemos bem, mas o financeiro fica confuso.
Daniel: Como esta o controle de custos e margem?
Cliente: Margem ate e boa, mas nao temos metas claras e o processo de cobranca atrasa.
Daniel: E o comercial?
Cliente: Dependemos muito de indicacao. Quero aumentar vendas recorrentes e profissionalizar o atendimento.
Daniel: Processo interno?
Cliente: Muita coisa no WhatsApp e planilha. Precisamos de rotina semanal e responsaveis.
Cliente: Prioridade e organizar o financeiro e depois planejar metas para 2026.`;

async function ensureUser(email: string, password: string) {
  const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET ?? "orbe-prod-secret-change-me-please-32",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: users,
        session: sessionsAuth,
        account: accounts,
        verification: verifications,
      },
    }),
    emailAndPassword: { enabled: true },
  });

  let [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    try {
      await auth.api.signUpEmail({
        body: { email, password, name: "Daniel Herculis" },
      });
    } catch {
      const userId = randomUUID();
      await db.insert(users).values({
        id: userId,
        name: "Daniel Herculis",
        email,
        emailVerified: true,
      });
      await db.insert(accounts).values({
        id: randomUUID(),
        accountId: userId,
        providerId: "credential",
        issuer: "local:credential",
        userId,
        password: await hashPassword(password),
      });
    }
    [user] = await db.select().from(users).where(eq(users.email, email));
  }

  if (!user) throw new Error("User not created");
  return user;
}

async function seed() {
  const email = "daniel@danielherculis.com.br";
  const password = "orbe-demo-2026";
  const year = new Date().getFullYear();

  let [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, "daniel-herculis"));

  if (!org) {
    [org] = await db
      .insert(organizations)
      .values({ name: "Daniel Herculis Consultoria", slug: "daniel-herculis" })
      .returning();
  }

  const user = await ensureUser(email, password);

  const [membership] = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, user.id));

  if (!membership) {
    await db.insert(memberships).values({
      organizationId: org.id,
      userId: user.id,
      role: "owner",
    });
  }

  const existingClients = await db
    .select()
    .from(clients)
    .where(eq(clients.organizationId, org.id));

  if (existingClients.length === 0) {
    const [donna] = await db
      .insert(clients)
      .values({
        organizationId: org.id,
        name: "Donna Elegante Confeccoes Ltda",
        tradeName: "Donna Elegante",
        sector: "Moda / Varejo",
        email: "contato@donnaelegante.demo",
        phone: "(11) 98888-0001",
        city: "Sao Paulo",
        stage: "ciclo",
        notes: "Cliente piloto do ciclo ORBE — dados demo para validacao.",
      })
      .returning();

    await db.insert(clients).values([
      {
        organizationId: org.id,
        name: "Atelier Horizonte",
        tradeName: "Horizonte",
        sector: "Servicos",
        city: "Campinas",
        stage: "lead",
        notes: "Lead frio — ainda sem sessao.",
      },
      {
        organizationId: org.id,
        name: "Casa Aurora Alimentos",
        tradeName: "Casa Aurora",
        sector: "Alimentos",
        city: "Curitiba",
        stage: "proposta",
        notes: "Aguardando envio de proposta comercial.",
      },
    ]);

    const [session] = await db
      .insert(consultingSessions)
      .values({
        organizationId: org.id,
        clientId: donna.id,
        title: "Sessao diagnostico — Donna Elegante",
        consentGiven: true,
        consentAt: new Date(),
        transcriptRaw: DEMO_TRANSCRIPT,
        transcriptSegments: [{ speaker: "ORBE", text: DEMO_TRANSCRIPT }],
        status: "pronto",
        createdById: user.id,
      })
      .returning();

    await db.insert(diagnostics).values({
      organizationId: org.id,
      clientId: donna.id,
      sessionId: session.id,
      payload: {
        resumo:
          "Empresa com vendas razoaveis, mas financeiro desorganizado e processos informais.",
        financeiro: ["Fluxo de caixa confuso", "Cobranca atrasada"],
        comercial: ["Dependencia de indicacao", "Falta recorrencia"],
        operacional: ["Rotina no WhatsApp/planilha", "Sem responsaveis claros"],
      },
      maturity: 45,
      gaps: [
        "Controle de fluxo de caixa",
        "Metas anuais claras",
        "Processo comercial recorrente",
      ],
      priorities: [
        "Organizar rotina financeira semanal",
        "Definir metas 2026 nas 4 perspectivas",
        "Profissionalizar cobranca",
      ],
      risks: ["Dependencia excessiva do dono", "Caixa apertado em meses fracos"],
      openQuestions: [
        "Qual o prazo medio de recebimento hoje?",
        "Quem cuidaria do financeiro no dia a dia?",
      ],
      validated: false,
    });

    const [goal] = await db
      .insert(goals)
      .values({
        organizationId: org.id,
        clientId: donna.id,
        title: `Crescer com caixa saudavel — ${year}`,
        notes: "Meta piloto do ciclo R (Resultar).",
        year,
      })
      .returning();

    await db.insert(indicators).values([
      {
        organizationId: org.id,
        clientId: donna.id,
        goalId: goal.id,
        perspective: "financeira",
        name: "Margem liquida (%)",
        direction: "aumentar",
        unit: "percentual",
        year,
        planned: { "01": 8, "02": 8, "03": 9, "04": 9, "05": 10, "06": 10 },
        actual: { "01": 6, "02": 7 },
      },
      {
        organizationId: org.id,
        clientId: donna.id,
        goalId: goal.id,
        perspective: "clientes",
        name: "Vendas recorrentes (R$ mil)",
        direction: "aumentar",
        unit: "numero",
        year,
        planned: { "01": 40, "02": 45, "03": 50 },
        actual: { "01": 32, "02": 38 },
      },
    ]);

    await db.insert(actionItems).values([
      {
        organizationId: org.id,
        clientId: donna.id,
        goalId: goal.id,
        perspective: "financeira",
        title: "Implantar rotina semanal de fluxo de caixa",
        how: "Planilha padrao + reuniao de 30 min toda segunda.",
        ownerName: "Financeiro Donna",
        status: "em_andamento",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        organizationId: org.id,
        clientId: donna.id,
        goalId: goal.id,
        perspective: "processos",
        title: "Mapear processo de cobranca",
        how: "Descrever etapas, prazos e responsavel.",
        ownerName: "Daniel / Cliente",
        status: "nao_iniciado",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        organizationId: org.id,
        clientId: donna.id,
        goalId: goal.id,
        perspective: "clientes",
        title: "Definir oferta de recorrencia",
        how: "Pacote mensal para clientes indicados.",
        ownerName: "Comercial Donna",
        status: "aguardando",
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log("Demo data: Donna Elegante + 2 leads + sessao + diagnostico + metas/acoes");
  } else {
    console.log("Demo data: clientes ja existem, pulando criacao");
  }

  console.log("Seed OK");
  console.log(`  Org: ${org.name}`);
  console.log(`  Login: ${email}`);
  console.log(`  Senha: ${password}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
