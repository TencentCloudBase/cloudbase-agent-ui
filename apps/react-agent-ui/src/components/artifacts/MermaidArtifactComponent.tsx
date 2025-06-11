import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";
import "./index.scss";
import type { ArtifactComponent } from "@cloudbase/agent-ui-react";

export const MermaidArtifactComponent: ArtifactComponent = ({ artifact }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  console.log("artifact", artifact);

  useEffect(() => {
    if (containerRef.current) {
      console.log("执行***");
      mermaid.initialize({ startOnLoad: false });
      mermaid
        .render(`mermaid-${Date.now()}-${crypto.randomUUID()}`, artifact.content)
        .then(({ svg }) => {
          console.log("mermaid svg", svg);
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
            mermaid.run();
          }
        })
        .catch((error: Error) => {
          console.error("Mermaid rendering error:", error);
          if (containerRef.current) {
            containerRef.current.innerHTML = `<div class="error">Error rendering diagram: ${error.message}</div>`;
          }
        });
    }
  }, [artifact.content]);

  return (
    <div className="cloudbase-artifact mermaid-artifact">
      <div className="artifact-header">
        <h3>{artifact.title}</h3>
      </div>
      <div className="diagram-container" ref={containerRef}></div>
      <div className="code-container">
        <pre>
          <code>{artifact.content}</code>
        </pre>
        <button className="copy-button" onClick={() => navigator.clipboard.writeText(artifact.content || "")}>
          Copy
        </button>
      </div>
    </div>
  );
};
