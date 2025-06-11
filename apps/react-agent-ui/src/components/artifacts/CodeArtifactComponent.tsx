// CodeArtifactComponent.tsx
import React, { useState } from "react";
import type { ArtifactComponent } from "@cloudbase/agent-ui-react";

import "./index.scss";

export const CodeArtifactComponent: ArtifactComponent = ({ artifact }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handlePreviewToggle = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  return (
    <div className="cloudbase-artifact code-artifact">
      <div className="artifact-header">
        <h3>{artifact.title}</h3>
        <button onClick={handlePreviewToggle}>{isPreviewMode ? "View Code" : "Preview"}</button>
      </div>

      {isPreviewMode ? (
        <div className="preview-container">
          <iframe
            title={artifact.title}
            srcDoc={artifact.content}
            width="100%"
            height="400px"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      ) : (
        <div className="code-container">
          <pre>
            <code>{artifact.content}</code>
          </pre>
          <button className="copy-button" onClick={() => navigator.clipboard.writeText(artifact.content)}>
            Copy
          </button>
        </div>
      )}
    </div>
  );
};
