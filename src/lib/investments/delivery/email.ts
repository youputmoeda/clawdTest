import type { InvestmentIdea, InvestmentReport } from "../types";

const profileLabel = {
  conservative: "Conservador",
  moderate: "Moderado",
  aggressive: "Agressivo",
} as const;

function ideaText(idea: InvestmentIdea) {
  return [
    `${idea.rank}. ${idea.ticker} — ${idea.name} (${idea.type})`,
    `   Tese: ${idea.thesis}`,
    `   Porquê agora: ${idea.whyNow.join("; ")}`,
    `   Riscos: ${idea.risks.join("; ")}`,
    `   Horizonte: ${idea.horizon}`,
    `   Confiança: ${idea.confidence}`,
    `   DEGIRO: ${idea.degiroNote}`,
  ].join("\n");
}

export function formatInvestmentEmail(report: InvestmentReport) {
  const subject = `📈 ${report.title} — ${new Date(report.generatedAt).toLocaleDateString("pt-PT")}`;

  const text = [
    report.title,
    report.subtitle,
    `Gerado: ${new Date(report.generatedAt).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })}`,
    `Destino: ${report.config.emailTo}`,
    "",
    "Principais sinais",
    ...report.signals.map((signal) => `- [${signal.impact}] ${signal.title}: ${signal.summary} (${signal.source})`),
    "",
    ...report.profiles.flatMap((profile) => [
      `${profileLabel[profile.profile]} — porquê este perfil`,
      profile.profileWhy,
      "",
      ...profile.ideas.map(ideaText),
      "",
    ]),
    "Notas",
    ...report.notes.map((note) => `- ${note}`),
    "",
    report.disclaimer,
  ].join("\n");

  const html = `
    <main style="font-family:Inter,Arial,sans-serif;line-height:1.5;color:#111;max-width:900px;margin:0 auto;padding:24px">
      <p style="color:#059669;font-weight:700;text-transform:uppercase;letter-spacing:.12em">Investment Research Agent</p>
      <h1>${report.title}</h1>
      <p style="color:#555">${report.subtitle}</p>
      <p><strong>Gerado:</strong> ${new Date(report.generatedAt).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })}</p>
      <p><strong>Destino:</strong> ${report.config.emailTo}</p>
      <section>
        <h2>Principais sinais</h2>
        <ul>
          ${report.signals
            .map(
              (signal) =>
                `<li><strong>[${signal.impact}] ${signal.title}</strong><br/>${signal.summary}<br/><small>${signal.source}</small></li>`,
            )
            .join("")}
        </ul>
      </section>
      ${report.profiles
        .map(
          (profile) => `
            <section style="border-top:1px solid #ddd;margin-top:24px;padding-top:16px">
              <h2>${profileLabel[profile.profile]}</h2>
              <p><strong>Porquê:</strong> ${profile.profileWhy}</p>
              ${profile.ideas
                .map(
                  (idea) => `
                    <article style="border:1px solid #ddd;border-radius:12px;padding:16px;margin:12px 0">
                      <h3>${idea.rank}. ${idea.ticker} — ${idea.name}</h3>
                      <p><strong>Tipo:</strong> ${idea.type}</p>
                      <p><strong>Tese:</strong> ${idea.thesis}</p>
                      <p><strong>Porquê agora:</strong> ${idea.whyNow.join("; ")}</p>
                      <p><strong>Riscos:</strong> ${idea.risks.join("; ")}</p>
                      <p><strong>Horizonte:</strong> ${idea.horizon} · <strong>Confiança:</strong> ${idea.confidence}</p>
                      <p><strong>DEGIRO:</strong> ${idea.degiroNote}</p>
                    </article>
                  `,
                )
                .join("")}
            </section>
          `,
        )
        .join("")}
      <section style="border-top:1px solid #ddd;margin-top:24px;padding-top:16px">
        <h2>Notas</h2>
        <ul>${report.notes.map((note) => `<li>${note}</li>`).join("")}</ul>
      </section>
      <p style="color:#777;font-size:13px">${report.disclaimer}</p>
    </main>
  `;

  return { to: report.config.emailTo, subject, text, html };
}
