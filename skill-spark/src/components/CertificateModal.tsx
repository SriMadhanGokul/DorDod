import { useRef } from "react";
import { FaTimes, FaDownload, FaTrophy } from "react-icons/fa";

interface Props {
  name: string;
  skill: string;
  date: string;
  type: "course" | "goal";
  onClose: () => void;
}

export default function CertificateModal({
  name,
  skill,
  date,
  type,
  onClose,
}: Props) {
  const certRef = useRef<HTMLDivElement>(null);

  const download = () => {
    if (!certRef.current) return;
    import("html2canvas")
      .then(({ default: html2canvas }) => {
        html2canvas(certRef.current!, {
          scale: 2,
          backgroundColor: "#fff",
        }).then((canvas) => {
          const link = document.createElement("a");
          link.download = `DoRDoD-Certificate-${skill.replace(/\s+/g, "-")}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        });
      })
      .catch(() =>
        alert("Download not available. Try screenshotting instead."),
      );
  };

  return (
    <div className="fixed inset-0 bg-foreground/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl p-6 w-full max-w-2xl animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <FaTrophy className="text-secondary" /> Your Certificate
          </h2>
          <button onClick={onClose}>
            <FaTimes className="text-foreground-muted" />
          </button>
        </div>

        {/* Certificate Design */}
        <div
          ref={certRef}
          className="bg-white rounded-xl p-8 text-center border-4 border-double"
          style={{ borderColor: "#1A237E", fontFamily: "Georgia, serif" }}
        >
          {/* Border decoration */}
          <div className="border-2 border-yellow-500 rounded-lg p-6">
            <p className="text-xs tracking-[0.3em] text-gray-500 uppercase mb-2">
              DoR-DoD Learning Platform
            </p>
            <p className="text-xs tracking-[0.2em] text-gray-400 uppercase mb-6">
              Certificate of {type === "course" ? "Completion" : "Achievement"}
            </p>

            <p className="text-sm text-gray-500 mb-2">
              This is to certify that
            </p>
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: "#1A237E", fontFamily: "Georgia,serif" }}
            >
              {name}
            </h1>
            <div className="w-32 h-0.5 bg-yellow-500 mx-auto mb-4" />

            <p className="text-sm text-gray-500 mb-2">
              has successfully{" "}
              {type === "course" ? "completed the course" : "achieved the goal"}
            </p>
            <h2 className="text-xl font-bold mb-6" style={{ color: "#C62828" }}>
              {skill}
            </h2>

            {/* Trophy */}
            <div className="text-5xl mb-4">🏆</div>

            <p className="text-xs text-gray-400 mb-4">
              Awarded on{" "}
              {new Date(date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>

            <div className="flex justify-around mt-6 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="w-16 h-0.5 bg-gray-400 mb-1" />
                <p className="text-xs text-gray-500">DoR-DoD Platform</p>
              </div>
              <div className="text-center">
                <p className="text-2xl">⭐</p>
                <p className="text-xs text-gray-500">Verified</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-0.5 bg-gray-400 mb-1" />
                <p className="text-xs text-gray-500">Date</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={download}
          className="w-full mt-4 btn-primary flex items-center justify-center gap-2"
        >
          <FaDownload /> Download Certificate
        </button>
        <p className="text-xs text-center text-foreground-muted mt-2">
          If download doesn't work, right-click the certificate and save as
          image
        </p>
      </div>
    </div>
  );
}
