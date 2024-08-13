import { parseConfig } from "@/lib/brewery-parser/breweryParser";
import { Editor } from "@monaco-editor/react";
import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../ui/resizable";

const DEFAULT_YAML = `# PASTE YOUR CONFIG HERE
# Everything is client-sided, so no one will steal your config :)
`;

const DEFAULT_JSON = `Your config as JSON will appear here
And from JSON we will be able to generate the new YAML config
`;

export default function BreweryParser() {
    const [config, setConfig] = useState<string | null>();

    function onEditorChange(value: string | undefined) {
        const parseResult = parseConfig(value || "");
        if (parseResult.success) {
            setConfig(JSON.stringify(parseResult.config, null, 4));
            return;
        }

        setConfig(
            `Error during parsing

---
${parseResult.error?.message}
---

If you think this is a bug, please report it, with this entire message
stage: ${parseResult.error?.stage}` +
                (parseResult.error?.stack &&
                    `\nstack:
${parseResult.error?.stack
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n")}`),
        );
    }

    return (
        <div className="h-[calc(100vh-var(--navbar-height))]">
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={50}>
                    {/* TODO: figure out how to integrate monaco-yaml with this */}
                    <Editor
                        theme="vs-dark"
                        onChange={onEditorChange}
                        height="100%"
                        width="100%"
                        defaultLanguage="yaml"
                        defaultValue={DEFAULT_YAML}
                    />
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={50}>
                    <Editor
                        theme="vs-dark"
                        height="100%"
                        value={config || ""}
                        width="100%"
                        options={{ readOnly: true }}
                        defaultLanguage="json"
                        defaultValue={DEFAULT_JSON}
                    />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
