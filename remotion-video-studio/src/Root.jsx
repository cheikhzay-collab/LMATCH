import { Composition } from "remotion";
import { TikTokVideo } from "./TikTokVideo";

const defaultMockTimeline = [
  {
    segment: "Question Reveal",
    timeRange: { start: 0, end: 5 },
    assets: {
      text: "Dans $\\mathbb{R}$, résoudre l'équation suivante : $$e^{2x} - 3e^x + 2 = 0$$"
    }
  },
  {
    segment: "Options & Countdown",
    timeRange: { start: 6, end: 15 },
    assets: {
      options: [
        { id: "A", text: "A) $S = \\{0, \\ln(2)\\}$" },
        { id: "B", text: "B) $S = \\{\\ln(2), \\ln(3)\\}$" },
        { id: "C", text: "C) $S = \\{1, 2\\}$" },
        { id: "D", text: "D) $S = \\emptyset$" }
      ]
    }
  },
  {
    segment: "Correct Answer Ping",
    timeRange: { start: 16, end: 22 },
    assets: {
      correctOption: "A"
    }
  },
  {
    segment: "Step-by-Step Solution & Astuce",
    timeRange: { start: 23, end: 30 },
    assets: {
      solution: "Poser $X = e^x > 0$. L'équation devient $X^2 - 3X + 2 = 0$, de racines $X_1 = 1$ et $X_2 = 2$. Donc $e^x = 1 \\implies x = 0$ et $e^x = 2 \\implies x = \\ln(2)$.",
      astuce: "Remplacer directement par $x=0$ dans l'équation : $e^0 - 3e^0 + 2 = 1 - 3 + 2 = 0$, donc 0 est racine. Seule l'option A contient 0."
    }
  }
];

export const Root = () => {
  return (
    <Composition
      id="TikTokVideo"
      component={TikTokVideo}
      durationInFrames={900} // 30 seconds * 30 fps
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        metadata: {
          examName: "Concours ENSA 2025",
          subject: "Mathématiques"
        },
        timeline: defaultMockTimeline
      }}
    />
  );
};
